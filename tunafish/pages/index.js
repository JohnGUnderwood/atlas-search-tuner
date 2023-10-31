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
  const [indexStatus, setIndexStatus] = useState({name:null,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});

  const [selectedTab, setSelectedTab] = useState(0);
  
  useEffect(() => {
    if(connection.connected){
      setIndexName(null);
      fetchIndexes(connection).then(resp=>{
          setIndexes(resp.data);
          pushToast({variant:"success",title:"Search indexes",description:`Got ${resp.data.length} search indexes from ${connection.database}.${connection.collection}`}); 
      })
      .catch(error=>{
          pushToast({timeout:0,variant:"warning",title:"Search failure",description:`Failed to get indexes from ${connection.database}.${connection.collection}. ${error}`})
      });
      getSchema(connection).then(resp => {
        // setSchema();
        pushToast({variant:"success",title:"Schema",description:`Finished analyzing ${connection.database}.${connection.collection} schema`}); 
        const candidates = getCandidates(resp.data);
        setSuggestedFields({
            'facet':candidates.facet,
            'text':candidates.text,
            'autocomplete':candidates.autocomplete
        });

      }).catch(error=>{
        pushToast({timeout:0,variant:"warning",title:"Schema failed",description:`Failed to get schema for ${connection.database}.${connection.collection}. ${error}`})
      });
    }
    
  },[connection.connected]);

  useEffect(()=>{
    if(indexName){
      fetchIndex(connection,indexName).then(resp => {
        console.log(`search index ${indexName}`,resp.data);
        if(resp.data){
            setMappings(resp.data.mappings);
        }else{
            setMappings({fields:{}})
        }
      });
    }
  },[indexName]);

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
            <IndexBuilder suggestedFields={suggestedFields} mappings={mappings} setMappings={setMappings} indexName={indexName}
              indexStatus={indexStatus} setIndexStatus={setIndexStatus}
              fields={fields} setFields={setFields}/>
          </Tab>
          <Tab name="Query Tuner">
            <QueryTuner connection={connection} indexName={indexName}/>
          </Tab>
        </Tabs>
        :<></>
      }
    </>
  )
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

export default function App(){
  return (
    <ToastProvider>
      <Home/>
    </ToastProvider>
  )
}