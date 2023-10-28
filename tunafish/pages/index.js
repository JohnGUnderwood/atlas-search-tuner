import Header from '../components/head';
import { useEffect, useState } from 'react';
import AppBanner from '../components/banner';
import MongoDBConnection from '../components/connection';
import QueryTuner from '../components/query-tuner';
import IndexBuilder from '../components/app-tutorial/index-builder';
import IndexSelector from '../components/index-selector';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import { ToastProvider } from '@leafygreen-ui/toast';

function Home() {
  const [connection, setConnection] = useState(null); // uri, database, collection
  const [indexes, setIndexes] = useState(null);
  const [indexName, setIndexName] = useState(null);
  const [configure, setConfigure] = useState(false);
  
  //Index Builder variables
  const [schema, setSchema] = useState(null);
  const [indexStatus, setIndexStatus] = useState({name:null,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});

  const [selectedTab, setSelectedTab] = useState(0);
  
  useEffect(() => {
    setIndexName(null);
  },[indexes]);

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
    <ToastProvider>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange} setIndexes={setIndexes}/>
      </AppBanner>
      <hr/>
      <IndexSelector setConfigure={setConfigure} indexes={indexes} indexName={indexName} setIndexName={setIndexName}/>
      {(configure && indexName)?
        <Tabs setSelected={setSelectedTab} selected={selectedTab}>
          <Tab name="Index Builder">
            <IndexBuilder connection={connection} indexName={indexName}
              schema={schema} setSchema={setSchema}
              indexStatus={indexStatus} setIndexStatus={setIndexStatus}
              fields={fields} setFields={setFields}/>
          </Tab>
          <Tab name="Query Tuner">
            <QueryTuner connection={connection} indexName={indexName}/>
          </Tab>
        </Tabs>
        :<></>
      }
    </ToastProvider>
  )
}

export default Home;