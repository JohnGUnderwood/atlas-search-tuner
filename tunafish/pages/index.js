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
  const [selectedTab, setSelectedTab] = useState(0);
  const [connection, setConnection] = useState({connected:false,uri:null,database:null,collection:null});
  const [userSelectionState, setUserSelection] = useState({
    fields:{facet:[],text:[],autocomplete:[]},
    weights:{},
    facets:{},
    indexName:null,
    banners:{query:true,index:true} // Whether banner messages are shown
  });
  const [indexes, setIndexes] = useState(null) // indexes = Array( {name: , status, } )
  const [indexState, setIndex] = useState({
    name:null,
    fields:null,
    mappings:null,
    suggestedFields:null, //Used when building new index
    status:null, //'NEW'=User is building the index|'PENDING'=Atlas is building the index|'READY' or 'STALE'=Index is ready|'FAILED'=An error occured
    error: null 
  });
  const [searchResponseState, setSearchResponse] = useState({status:null,results:null,facets:null,error:null});
  const [finishedIndex, setFinishedIndex] = useState(null); //State hook for when an index finishes building
  
  const resetAppState = () =>{
    setUserSelection({fields:{facet:[],text:[],autocomplete:[]},weights:{},facets:{},indexName:null,banners:{query:true,index:true}});
    setIndexes(null);
    setIndex({name:null,status:null,mappings:null,suggestedFields:null,error:null});
    setSearchResponse({status:null,results:null,facets:null,error:null});
    setSelectedTab(0);
  }

  useEffect(() => {
    if(connection.connected){
      resetAppState();
      const fetchingIndexes = pushToast({variant:"progress",title:"Fetching indexes",description:`Fetching search indexes for ${connection.database}.${connection.collection}`}); 
      fetchIndexes(connection).then(resp=>{
          setIndexes(resp.data)
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
      setUserSelection({fields:{facet:[],text:[],autocomplete:[]},weights:{},facets:{},indexName:null,banners:{query:true,index:true}});
      setIndex({status:null,name:null,fields:null,mappings:null,suggestedFields:null,error:null});
      setSearchResponse({status:null,results:null,facets:null,error:null});
      
      if(connection.connected){
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
      }

    }else if(userSelectionState.indexName){
      const indexName = userSelectionState.indexName;
      fetchIndex(connection,indexName).then(resp => {
          if(resp.data){
              // Index already exists so we set indexState variables.
              if(resp.data.status=="FAILED"){
                setIndex({
                  name:indexName,
                  mappings:resp.data.latestDefinition.mappings,
                  fields:parseSearchIndex(resp.data.latestDefinition.mappings),
                  status:resp.data.status,
                  error:"Index failed to build."
                })
              }else{
                setIndex({
                  name:indexName,
                  mappings:resp.data.latestDefinition.mappings,
                  fields:parseSearchIndex(resp.data.latestDefinition.mappings),
                  status:resp.data.status,
                  error:null
                })
              }
          }else{
              //Index does not already exist so we set status to 'NEW'
              const fetchingSchema = pushToast({variant:"progress",title:"Getting schema",description:`Analyzing data from ${connection.database}.${connection.collection}`}); 
              getSchema(connection).then(resp => {
                popToast(fetchingSchema);
                pushToast({variant:"success",title:"Schema",description:`Finished analyzing ${connection.database}.${connection.collection} schema`}); 
                console.log("schema: ",resp.data);
                const candidates = getCandidates(resp.data);
                setIndex({
                  name:indexName,
                  mappings:{fields:{}},
                  fields:null,
                  suggestedFields:{
                    'facet':candidates.facet,
                    'text':candidates.text,
                    'autocomplete':candidates.autocomplete
                  },
                  status:'NEW'
                });
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
      setIndex({
        ...indexState,
        fields:userSelectionState.fields,
        mappings:buildSearchIndex(userSelectionState.fields)
      });
    }
  },[userSelectionState.fields])

  useEffect(()=>{
      if(indexState.status == 'READY' || indexState.status == 'STALE'){
        setSearchResponse({...searchResponseState,status:'loading'});
        searchRequest(indexState.fields,indexState.name,connection)
          .then(resp => {
            setSearchResponse({
              status:'ready',
              results:resp.data.results,
              facets:resp.data.facets
            })
          })
          .catch(err => {
            setSearchResponse({status:'error',error:err});
          });
      }
  },[indexState.status]);

  useEffect(() =>{
    if(finishedIndex && finishedIndex.name == indexState.name){
      setIndex({...indexState,status:finishedIndex.status,mappings:finishedIndex.mappings});
    }
  },[finishedIndex])

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

  const deployIndex = () => {
    setIndex({
      ...indexState,
      status:'PENDING'
    });
    postIndexMappings(indexState.mappings,userSelectionState.indexName,connection)
        .then(resp=> {
            getIndexStatus(userSelectionState.indexName);
        })
        .catch(err=> {
            setIndex({
              ...indexState,
              status:'FAILED',
              error:err
            })
        })
  }

  const getIndexStatus = (name) => {
    pollIndexStatus(connection,name).then(resp => {
      setFinishedIndex({name:resp.name,status:resp.status,mappings:resp.latestDefinition.mappings});
    }).catch(err => {
      console.log("Index Build Error",err);
    })
  }

  return (
    <>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange}/>
      </AppBanner>
      <hr/>
      {connection.connected?
        <IndexSelector indexes={indexes}
          userSelection={userSelectionState}
          setUserSelection={setUserSelection}
          />
        :<></>
      }
      {indexState.status == 'FAILED'?<Banner variant="danger">{JSON.stringify(indexState.error)}</Banner>:<></>}
      {indexState.status == 'PENDING'?
        <Callout style={{marginTop:"10px"}} className="callout" variant="important" title="Building Index">
          {indexState.name} is building on Atlas...
        </Callout>
        :<></>
      }
      {indexState.status == 'NEW'? 
        <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
          <Tab name="Index Builder">
            <IndexBuilder deployIndex={deployIndex} indexBuilder={indexState} userSelection={userSelectionState} setUserSelection={setUserSelection}  
            />
          </Tab>
          <Tab name="Query Tuner">
            <Callout style={{marginTop:"10px"}} className="callout" variant="important" title="Build index">You need to build or select an already deployed index in order to configure queries against it.</Callout>
          </Tab>
        </Tabs>
        :<>{(indexState.status == 'READY' || indexState.status == 'STALE')? //If no name set on indexBuilderState then display existing index
          <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
            <Tab name="Index Definition">
            {userSelectionState.banners.index?<Banner style={{marginTop:"10px"}} dismissible={true} onClose={()=>{setUserSelection({...userSelectionState,banners:{...userSelectionState.banners,index:false}})}} variant='info'>You cannot modify this index, but you can switch to the <a style={{cursor:"pointer"}} onClick={() =>setSelectedTab(1)}>Query Tuner</a> to build queries against it.</Banner>:<></>}
            {searchResponseState.status == 'loading'?<div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description='Getting sample data ...'></Spinner></div>:<></>}
            {searchResponseState.status == 'error'?<Banner variant='danger'>{JSON.stringify(searchResponseState.error)}</Banner>:<></>}
            {searchResponseState.status == 'ready'?  
              <div style={{
                display: "grid",
                gridTemplateColumns: "20% 40% 40%",
                gap: "10px",
                paddingTop:"10px"
                }}>
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
                      <Card style={{marginRight:"20px"}}>
                          <div style={{height:"100%"}}>
                              <Code language={'javascript'}>
                                  {JSON.stringify(indexState.mappings,null,2)}
                              </Code>
                          </div>
                      </Card>
                      :<></>
                    }
              </div>
              :<></>
            }
            </Tab>
            <Tab name="Query Tuner">
              {userSelectionState.banners.query?<Banner style={{marginTop:"10px"}} dismissible={true} onClose={()=>{setUserSelection({...userSelectionState,banners:{...userSelectionState.banners,query:false}})}} variant='info'>Not seeing the results you expect? <a style={{cursor:"pointer"}} onClick={() =>setSelectedTab(0)}>Check your index definition!</a></Banner>:<></>}
              <QueryTuner connection={connection} userSelection={userSelectionState} setUserSelection={setUserSelection} index={indexState}/>
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
          console.log(name,status);
          if(status != "PENDING"){
              done = true;
          }
      }catch(error){
          throw error
      }
      await wait(5000)
  }
  return response.data;
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
    axios.post(`api/post/atlas-search/index/schema`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

function searchRequest(fields,indexName,conn) {
  return new Promise((resolve,reject) => {
      axios.post(`api/post/atlas-search/query`,
          { fields : fields, connection: conn, index:indexName},
          { headers : 'Content-Type: application/json'}
      ).then(response => resolve(response))
      .catch((error) => {
          reject(error.response.data);
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