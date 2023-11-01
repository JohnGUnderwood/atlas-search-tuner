import Header from '../components/head';
import { useEffect, useState } from 'react';
import AppBanner from '../components/banner';
import MongoDBConnection from '../components/connection';
import QueryTuner from '../components/query-tuner';
import IndexBuilder from '../components/app-tutorial/index-builder';
import IndexSelector from '../components/index-selector';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import { ToastProvider, useToast } from '@leafygreen-ui/toast';
import axios from 'axios';
import { getCandidates } from '../functions/schema';
import { parseSearchIndex } from '../functions/index-definition';
import { reduceSuggestedFields } from '../functions/index-definition';
import Code from '@leafygreen-ui/code';
import { H3, Subtitle, Description } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import SearchResultFields from '../components/fields';

const Home = () => {
  const { pushToast, popToast, clearStack } = useToast();
  const [connection, setConnection] = useState({connected:false}); // uri, database, collection, connected
  const [indexes, setIndexes] = useState(null);
  const [suggestedFields, setSuggestedFields] = useState(null);
  const [indexName, setIndexName] = useState(null);
  const [mappings, setMappings] = useState(null);

  // const [index, setIndex] = useState({name:null,definition:null});
  const [configure, setConfigure] = useState(false);
  
  //Index Builder variables
  const [indexStatus, setIndexStatus] = useState({waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});

  const [selectedTab, setSelectedTab] = useState(0);
  
  useEffect(() => {
    if(connection.connected){
      setIndexName(null);
      const fetchingIndexes = pushToast({variant:"progress",title:"Fetching indexes",description:`Fetching search indexes for ${connection.database}.${connection.collection}`}); 
      fetchIndexes(connection).then(resp=>{
          setIndexes(resp.data);
          popToast(fetchingIndexes);
          pushToast({variant:"success",title:"Search indexes",description:`Got ${resp.data.length} search indexes from ${connection.database}.${connection.collection}`}); 
      })
      .catch(error=>{
          popToast(fetchingIndexes)
          pushToast({timeout:0,variant:"warning",title:"Search failure",description:`Failed to get indexes from ${connection.database}.${connection.collection}. ${error}`})
      });
      const fetchingSchema = pushToast({variant:"progress",title:"Getting schema",description:`Analyzing data from ${connection.database}.${connection.collection}`}); 
      getSchema(connection).then(resp => {
        // setSchema();
        popToast(fetchingSchema);
        pushToast({variant:"success",title:"Schema",description:`Finished analyzing ${connection.database}.${connection.collection} schema`}); 
        const candidates = getCandidates(resp.data);
        setSuggestedFields({
            'facet':candidates.facet,
            'text':candidates.text,
            'autocomplete':candidates.autocomplete
        });

      }).catch(error=>{
        popToast(fetchingSchema);
        pushToast({timeout:0,variant:"warning",title:"Schema failed",description:`Failed to get schema for ${connection.database}.${connection.collection}. ${error}`})
      });
    }
    
  },[connection.connected]);

  useEffect(()=>{
    if(indexName && suggestedFields){
      fetchIndex(connection,indexName).then(resp => {
          console.log(`search index ${indexName}`,resp.data);
          if(resp.data){
              setMappings(resp.data.latestDefinition.mappings);
              const alreadyIndexedFields = parseSearchIndex(resp.data.latestDefinition.mappings);
              setFields(alreadyIndexedFields);
              setIndexStatus({waiting:false,ready:true,error:null,results:{facets:null,text:null}})
              //Index exists so take user to Query Tuner
              // setSelectedTab(1);
          }else{
              //Index does not exist so take user to Index Builder
              // setSelectedTab(0);
              setMappings({fields:{}})
          }
      });
  }
  },[indexName]);

  useEffect(()=>{
      if(indexStatus.ready){
          searchMeta(fields);
          searchText(fields);
      }
  },[indexStatus.ready]);

  const handleConnectionChange = (name,value) => {
    if(name=="namespace"){
      const database = value.split(".")[0];
      const collection = value.split(".")[1];
      handleConnectionChange('database',database);
      handleConnectionChange('collection',collection);
    }else{
      setConnection(connection => ({
        ...connection,
        [name]:value
      }));
    }
  }

  const searchMeta = (fields) => {
    searchRequest(fields,'facet',indexName,connection)
        .then(resp => {
            const newStatus = indexStatus
            newStatus.results.facets = resp.data.facet
            console.log("new indexstatus",newStatus);
            setIndexStatus(newStatus);
            setOpen(false);
        })
        .catch(err => console.log(err));
}

const searchText = (fields) => {
    searchRequest(fields,'text',indexName,connection)
        .then(resp => {
            const newStatus = indexStatus
            newStatus.results.text = resp.data
            console.log("new indexstatus",newStatus);
            setIndexStatus(newStatus);
            setOpen(false);
        })
        .catch(err => console.log(err));
}

const saveIndex = () => {
  setIndexStatus({waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  postIndexMappings(mappings,indexName,connection)
      .then(resp=> {
          setCreateError(false);
          setCreateIndexResponse(resp.data);
          getIndexStatus(indexName);
      })
      .catch(err=> {
          setCreateError(true);
          setCreateIndexResponse(err);
      })
}

const getIndexStatus = (name) => {
  setIndexStatus({name:name,waiting:true,ready:false,error:null,results:{facets:null,text:null}})
  pollIndexStatus(connection,name).then(resp => {
      setIndexStatus({name:name,waiting:false,ready:true,error:null,results:{facets:null,text:null}})
  }).catch(err => {setIndexStatus({name:name,waiting:false,ready:true,error:err,results:{facets:null,text:null}})})
}

  return (
    <>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange}/>
      </AppBanner>
      <hr/>
      <IndexSelector indexes={indexes} setConfigure={setConfigure} indexName={indexName} setIndexName={setIndexName}/>
      {(configure && indexName)?
        <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
          <Tab name="Index Builder">
            <IndexBuilder saveIndex={saveIndex} suggestedFields={suggestedFields} mappings={mappings} setMappings={setMappings}
              indexStatus={indexStatus} fields={fields} setFields={setFields}/>
          </Tab>
          <Tab name="Query Tuner">
            <QueryTuner connection={connection} indexName={indexName}/>
          </Tab>
        </Tabs>
        :<>{indexName && indexStatus.ready?
          <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
            <Tab name="Index Definition">
            <div style={{
                display: "grid",
                gridTemplateColumns: "20% 40% 40%",
                gap: "10px",
                paddingTop:"10px"
                }}>
                  <Card>
                    {indexStatus.results.facets?Object.keys(indexStatus.results.facets).map(facet => (
                        <div style={{paddingLeft:"10px"}}>
                            <Subtitle key={facet}>{facet}</Subtitle>
                                {indexStatus.results.facets[facet].buckets.map(bucket => (
                                    <Description key={bucket._id} style={{paddingLeft:"15px"}}><span style={{paddingRight:"5px"}}>{bucket._id}</span><span>({bucket.count})</span></Description>
                                ))}<br/>
                        </div>
                    ))
                    :<></>}
                  </Card>
                  <Card>
                  {indexStatus.results.text?.map(result =>(
                      <Card key={result._id} style={{marginBottom:"20px"}}>
                          <SearchResultFields key={`${result._id}_fields`} doc={result}></SearchResultFields>
                      </Card>
                  ))}
                  </Card>
                  {mappings?
                    <Card>
                        <div style={{height:"100%"}}>
                            <Code language={'javascript'} style={{height:"80%"}}>
                                {JSON.stringify({mappings:mappings},null,2)}
                            </Code>
                        </div>
                    </Card>
                    :<></>
                }
            </div>
              </Tab>
            <Tab name="Query Tuner">
              <QueryTuner connection={connection} indexName={indexName}/>
            </Tab>
          </Tabs>
          :<></>
        }</>
      }
    </>
  )
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function pollIndexStatus(connection,name){
  var done = false;
  var response;
  while(!done){
      try{
          response = await axios.post('api/post/atlas-search/index/status',{connection:connection,name:name});
          const status = response.data.status;
          console.log(status)
          if(status == "READY" || status == "STALE"){
              done = true;
          }else if(status == "FAILED"){
              throw new Error(`Search index '${connection.database}.${connection.collection}:${name}' failed to build`,{cause:"indexNameStatusFailed"})
          }
      }catch(error){
          throw error
      }
      await wait(5000)
  }
}

function postIndexMappings(mappings,indexName,connection){
  return new Promise((resolve,reject)=>{
      axios.post(
          'api/post/atlas-search/index/create',
          {
              name:indexName,
              mappings:mappings,
              connection:connection
          }
      ).then(response => resolve(response))
      .catch((error) => {
        reject(error.response.data);
      })
  })
}


function fetchIndexes(conn) {
  return new Promise((resolve,reject) => {
      axios.post(`api/post/atlas-search/index/list`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

function fetchIndex(conn,searchIndex) {
  return new Promise((resolve,reject) => {
      axios.post(`api/post/atlas-search/index/status`,{connection:conn,name:searchIndex})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

function getSchema(conn) {
  return new Promise((resolve,reject) => {
    axios.post(`api/post/atlas-search/index/schema?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

function searchRequest(fields,type,indexName,conn) {
  return new Promise((resolve) => {
      axios.post(`api/post/atlas-search/query`,
          { fields : fields, connection: conn, type:type, index:indexName},
          { headers : 'Content-Type: application/json'}
      ).then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}

export default function App(){
  return (
    <ToastProvider>
      <Home/>
    </ToastProvider>
  )
}