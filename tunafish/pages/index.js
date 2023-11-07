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
import Code from '@leafygreen-ui/code';
import { Subtitle, Description } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import SearchResultFields from '../components/fields';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import Banner from '@leafygreen-ui/banner';

const Home = () => {
  const { pushToast, popToast } = useToast();
  // const [connection, setConnection] = useState({connected:false}); // uri, database, collection, connected
  const [indexes, setIndexes] = useState(null);
  const [suggestedFields, setSuggestedFields] = useState(null);
  const [indexName, setIndexName] = useState(null);
  const [mappings, setMappings] = useState(null);
  const [builder, setBuilder] = useState(false);
  const [indexStatus, setIndexStatus] = useState({waiting:false,ready:false,error:null});
  const [facets, setFacets] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedFields, setSelectedFields] = useState({facet:[],text:[],autocomplete:[]});
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState({facets:null,results:null});
  const [createIndexErr, setCreateIndexErr] = useState(null)

  const [connection, setConnection] = useState({connected:false,uri:null,database:null,collection:null});
  const [userSelectionState, setUserSelection] = useState({fields:null,weights:null,indexName:null});
  const [collectionState, setCollection] = useState({indexes:null,schema:null});
  const [indexState, setIndex] = useState({status:null,name:null,fields:null,definition:null,error:null});
  const [indexBuilderState, setIndexBuilder] = useState({
    name:null,
    status:null, //'active'=User is making selections|'building'=Atlas is building the index|'ready'=Index is ready|'error'=An error occured
    definition:null,
    suggestedFields:null,
    selectFields:null,
    error:null
  });
  const [searchResponseState, setSearchResponse] = useState({status:null,results:null,facets:null,error:null});

  
  const resetAppState = () =>{
    setUserSelection({fields:null,weights:null,indexName:null});
    setCollection({indexes:null,schema:null});
    setIndex({status:null,name:null,fields:null,definition:null,error:null});
    setIndexBuilder({name:null,status:null,definition:null,suggestedFields:null,selectFields:null,error:null});
    setSearchResponse({status:null,results:null,facets:null,error:null});
  }

  useEffect(() => {
    if(connection.connected){
      resetAppState();
      const fetchingIndexes = pushToast({variant:"progress",title:"Fetching indexes",description:`Fetching search indexes for ${connection.database}.${connection.collection}`}); 
      fetchIndexes(connection).then(resp=>{
          setCollection({...collectionState,indexes:resp.data})
          popToast(fetchingIndexes);
          pushToast({variant:"success",title:"Search indexes",description:`Got ${resp.data.length} search indexes from ${connection.database}.${connection.collection}`}); 
      })
      .catch(error=>{
          popToast(fetchingIndexes)
          pushToast({timeout:0,variant:"warning",title:"Search failure",description:`Failed to get indexes from ${connection.database}.${connection.collection}. ${error}`})
      });
    }
    
  },[connection.connected]);

  useEffect(()=>{
    if(!indexName){
      resetAppState();
    }else if(indexName){
      fetchIndex(connection,indexName).then(resp => {
          if(resp.data){
              setMappings(resp.data.latestDefinition.mappings);
              const alreadyIndexedFields = parseSearchIndex(resp.data.latestDefinition.mappings);
              setSelectedFields(alreadyIndexedFields);
              setIndexStatus({...indexStatus,ready:true})
          }else{
              setMappings({fields:{}})
              const fetchingSchema = pushToast({variant:"progress",title:"Getting schema",description:`Analyzing data from ${connection.database}.${connection.collection}`}); 
              getSchema(connection).then(resp => {
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
      });
    }
  },[indexName]);

  useEffect(()=>{
      if(indexStatus.ready){
          searchMeta(selectedFields);
          searchText(selectedFields);
      }
  },[indexStatus.ready]);

  const handleConnectionChange = (name,value) => {
    if(name=="namespace"){
      const database = value.split(".")[0];
      const collection = value.split(".")[1];
      handleConnectionChange('database',database);
      handleConnectionChange('collection',collection);
    }else{
      setConnection(connection => ({...connection,[name]:value}));
    }
  }

  const searchMeta = (fields) => {
    setLoading({...loading,facets:true});
    searchRequest(fields,'facet',indexName,connection)
        .then(resp => {
          setLoading({...loading,facets:false});
          setFacets(resp.data.facet);
        })
        .catch(err => {
          setLoading({...loading,facets:false});
          console.log(err);
        });
  }

const searchText = (fields) => {
  setLoading({...loading,results:true});
  searchRequest(fields,'text',indexName,connection)
      .then(resp => {
        setLoading({...loading,results:false});
        setResults(resp.data);
        console.log("results.text",resp.data);
      })
      .catch(err => {
        setLoading({...loading,results:false});
        console.log(err);
      });
}

const saveIndex = () => {
  setIndexStatus({waiting:false,ready:false,error:null});
  postIndexMappings(mappings,indexName,connection)
      .then(resp=> {
          getIndexStatus(indexName);
      })
      .catch(err=> {
          setCreateIndexErr(err);
      })
}

const getIndexStatus = (name) => {
  setIndexStatus({...indexStatus,waiting:true})
  pollIndexStatus(connection,name).then(resp => {
      setIndexStatus({...indexStatus,ready:true,waiting:false})
  }).catch(err => {setIndexStatus({...indexStatus,waiting:false,error:err})})
}

  return (
    <>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange}/>
      </AppBanner>
      <hr/>
      {connection.connected?
        <IndexSelector indexes={collectionState.indexes}
          userSelection={userSelectionState}
          setUserSelection={setUserSelection}
          indexBuilder={indexBuilderState}
          setIndexBuilder={setIndexBuilder}
          />
        :<></>
      }
      {createIndexErr?<Banner variant="danger">{createIndexErr}</Banner>:<></>}
      {indexStatus.waiting?<Banner variant="info"><Spinner description={`Building search index ${indexName}`}/></Banner>:<></>}
      {indexStatus.error?<Banner variant="danger">{indexStatus.error}</Banner>:<></>}
      {(builder && mappings)?
        <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
          <Tab name="Index Builder">
            <IndexBuilder saveIndex={saveIndex} suggestedFields={suggestedFields} mappings={mappings} setMappings={setMappings}
              selectedFields={selectedFields} setSelectedFields={setSelectedFields}/>
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
                  {loading.facets?
                    <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description='Getting facets...'></Spinner></div>
                      :<Card>
                        {facets?
                          Object.keys(facets).map(facet => (
                              <div key={`${facet}_div`} style={{paddingLeft:"10px"}}>
                                  <Subtitle key={facet}>{facet}</Subtitle>
                                      {facets[facet].buckets.map(bucket => (
                                          <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{paddingRight:"5px"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
                                      ))}<br/>
                              </div>
                          ))
                          :<></>
                        }
                      </Card>
                    }
                    {loading.results?
                      <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description='Getting results...'></Spinner></div>
                      :<Card>
                        {selectedFields.autocomplete?<><Subtitle>Autocomplete Fields</Subtitle>
                        <Description>{JSON.stringify(selectedFields.autocomplete.map(field => field.path))}</Description></>:<></>}
                        {selectedFields.text?<><Subtitle>Search Fields</Subtitle>
                        <Description>{JSON.stringify(selectedFields.text.map(field => field.path))}</Description></>:<></>}
                        <Subtitle>Example result</Subtitle>
                        {results?.map(result =>(
                          <Card key={result._id} style={{marginBottom:"20px"}}>
                              <SearchResultFields key={`${result._id}_fields`} doc={result}></SearchResultFields>
                          </Card>
                        ))}
                      </Card>
                    }
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
            {selectedFields?
              <Tab name="Query Tuner">
                <QueryTuner connection={connection} indexName={indexName} fields={selectedFields}/>
              </Tab>
            :<></>}
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