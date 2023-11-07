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
import Callout from '@leafygreen-ui/callout';
import { buildSearchIndex } from '../functions/index-definition'

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
  const [userSelectionState, setUserSelection] = useState({
    fields:{facet:[],text:[],autocomplete:[]},
    weights:{facet:[],text:[],autocomplete:[]},
    indexName:null
  });
  const [collectionState, setCollection] = useState({indexes:null,schema:null});
  const [indexState, setIndex] = useState({
    name:null,
    fields:null,
    mappings:null,
    status:null//'building'=Atlas is building the index|'ready'=Index is ready|'error'=An error occured
  });
  const [indexBuilderState, setIndexBuilder] = useState({
    name:null,
    mappings:null,
    suggestedFields:null,
    error:null
  });
  const [searchResponseState, setSearchResponse] = useState({status:null,results:null,facets:null,error:null});

  
  const resetAppState = () =>{
    setUserSelection({fields:{facet:[],text:[],autocomplete:[]},weights:{facet:null,text:null,autocomplete:null},indexName:null});
    setCollection({indexes:null,schema:null});
    setIndex({status:null,name:null,fields:null,mappings:null,error:null});
    setIndexBuilder({name:null,status:null,mappings:null,suggestedFields:null,selectFields:null,error:null});
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
    if(!userSelectionState.indexName){
      setUserSelection({fields:{facet:[],text:[],autocomplete:[]},weights:{facet:null,text:null,autocomplete:null},indexName:null});
      setIndex({status:null,name:null,fields:null,mappings:null,error:null});
      setIndexBuilder({name:null,status:null,mappings:null,suggestedFields:null,selectedFields:null,error:null});
      setSearchResponse({status:null,results:null,facets:null,error:null});
    }else if(userSelectionState.indexName){
      const indexName = userSelectionState.indexName;
      fetchIndex(connection,indexName).then(resp => {
          if(resp.data){
              // Index already exists so we set indexState variables.
              setIndex({
                name:indexName,
                mappings:resp.data.latestDefinition.mappings,
                fields:parseSearchIndex(resp.data.latestDefinition.mappings),
                status:"ready"
              })
              // const alreadyIndexedFields = parseSearchIndex(resp.data.latestDefinition.mappings);
              // setSelectedFields(alreadyIndexedFields);
              // setIndexStatus({...indexStatus,ready:true})
          }else{
              //Index does not already exist so we use the builder.
              // setMappings({fields:{}})
              const fetchingSchema = pushToast({variant:"progress",title:"Getting schema",description:`Analyzing data from ${connection.database}.${connection.collection}`}); 
              getSchema(connection).then(resp => {
                popToast(fetchingSchema);
                pushToast({variant:"success",title:"Schema",description:`Finished analyzing ${connection.database}.${connection.collection} schema`}); 
                const candidates = getCandidates(resp.data);
                setIndexBuilder({
                  name:indexName,
                  mappings:{fields:{}},
                  suggestedFields:{
                    'facet':candidates.facet,
                    'text':candidates.text,
                    'autocomplete':candidates.autocomplete
                  }
                });
                // setSuggestedFields({
                //     'facet':candidates.facet,
                //     'text':candidates.text,
                //     'autocomplete':candidates.autocomplete
                // });
              }).catch(error=>{
                popToast(fetchingSchema);
                pushToast({timeout:0,variant:"warning",title:"Schema failed",description:`Failed to get schema for ${connection.database}.${connection.collection}. ${error}`})
              });
          }
      });
    }
  },[userSelectionState.indexName]);

  useEffect(()=>{
    if(Object.keys(userSelectionState.fields).length>0){
      setIndexBuilder({
        ...indexBuilderState,
        selectedFields:userSelectionState.fields,
        mappings:buildSearchIndex(userSelectionState.fields)
      });
    }
  },[userSelectionState.fields])

  useEffect(()=>{
      if(indexState.status == 'ready'){
          setSearchResponse({...searchResponseState,status:'loading'});
          searchRequest(indexState.fields,indexState.name,connection)
          .then(resp => {
            setSearchResponse({
              status:'ready',
              results:resp.data.results,
              facets:resp.data.facets
            })
            // console.log("results.text",resp.data);
          })
          .catch(err => {
            setSearchResponse({status:'error',error:err});
            // setLoading({...loading,results:false});
            // console.log(err);
          });
      }
  },[indexState.status]);

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
    searchRequest(fields,'facet',indexState.name,connection)
        .then(resp => {
          // setLoading({...loading,facets:false});
          setSearchResponse({...searchResponseState,status:'ready'});
          setSearchResponse({...searchResponseState,facets:resp.data.facet});
          // setFacets(resp.data.facet);
        })
        .catch(err => {
          // setLoading({...loading,facets:false});
          setSearchResponse({...searchResponseState,status:'error'});
          setSearchResponse({...searchResponseState,error:err});
        });
  }

const searchText = (fields) => {
  searchRequest(fields,'text',indexState.name,connection)
      .then(resp => {
        setSearchResponse({...searchResponseState,status:'ready'});
        setSearchResponse({...searchResponseState,results:resp.data});
        // console.log("results.text",resp.data);
      })
      .catch(err => {
        setSearchResponse({...searchResponseState,status:'error'});
        setSearchResponse({...searchResponseState,error:err});
        // setLoading({...loading,results:false});
        // console.log(err);
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
          />
        :<></>
      }
      {indexState.status == 'error'?<Banner variant="danger">{indexState.error}</Banner>:<></>}
      {indexState.status == 'building'?<Banner variant="info"><Spinner description={`Building search index ${indexState.name}`}/></Banner>:<></>}
      {indexBuilderState.name? //Has the builder name been set?
        <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
          <Tab name="Index Builder">
            <IndexBuilder saveIndex={saveIndex} indexBuilder={indexBuilderState} userSelection={userSelectionState} setUserSelection={setUserSelection}  
            />
          </Tab>
          <Tab name="Query Tuner">
            <Callout variant="important" title="Build index">You need to build or select an already deployed index in order to configure queries against it.</Callout>
          </Tab>
        </Tabs>
        :<>{indexState.status == 'ready'?
          <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
            <Tab name="Index Definition">
            <div style={{
                display: "grid",
                gridTemplateColumns: "20% 40% 40%",
                gap: "10px",
                paddingTop:"10px"
                }}>
                  {searchResponseState.status == 'loading'?<div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description='Getting sample data ...'></Spinner></div>:<></>}
                  {searchResponseState.status == 'error'?<Banner variant='danger'>{searchResponseState.error}</Banner>:<></>}
                  {searchResponseState.status == 'ready'?
                    <>
                    {searchResponseState.facets?
                      <Card>
                      {Object.keys(searchResponseState.facets).map(facet => (
                          <div key={`${facet}_div`} style={{paddingLeft:"10px"}}>
                              <Subtitle key={facet}>{facet}</Subtitle>
                                  {searchResponseState.facets[facet].buckets.map(bucket => (
                                      <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{paddingRight:"5px"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
                                  ))}<br/>
                          </div>
                      ))}
                      </Card>
                      :<></>
                    }
                    {searchResponseState.results?
                      <Card>
                        {indexState.fields.autocomplete?<><Subtitle>Autocomplete Fields</Subtitle>
                        <Description>{JSON.stringify(indexState.fields.autocomplete.map(field => field.path))}</Description></>:<></>}
                        {indexState.fields.text?<><Subtitle>Search Fields</Subtitle>
                        <Description>{JSON.stringify(indexState.fields.text.map(field => field.path))}</Description></>:<></>}
                        <Subtitle>Example result</Subtitle>
                        {searchResponseState.results?.map(result =>(
                          <Card key={result._id} style={{marginBottom:"20px"}}>
                              <SearchResultFields key={`${result._id}_fields`} doc={result}></SearchResultFields>
                          </Card>
                        ))}
                      </Card>
                      :<></>
                    }
                    {indexState.mappings?
                      <Card>
                          <div style={{height:"100%"}}>
                              <Code language={'javascript'} style={{height:"80%"}}>
                                  {JSON.stringify(indexState.mappings,null,2)}
                              </Code>
                          </div>
                      </Card>
                      :<></>
                    }
                    </>
                    :<></>
                  }
              </div>
            </Tab>
            <Tab name="Query Tuner">
              <QueryTuner connection={connection} indexName={indexState.name} fields={indexState.fields}/>
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

function searchRequest(fields,indexName,conn) {
  return new Promise((resolve) => {
      axios.post(`api/post/atlas-search/query`,
          { fields : fields, connection: conn, index:indexName},
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