import Header from '../components/head';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import AppBanner from '../components/banner';
import MongoDBConnection from '../components/connection';
import QueryTuner from '../components/query-tuner';
import IndexBuilder from '../components/app-tutorial/index-builder';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import Banner from '@leafygreen-ui/banner';
import { H3, Body } from '@leafygreen-ui/typography';

function Home() {
  const [connection, setConnection] = useState({}); // uri, database, collection
  const [schema, setSchema] = useState(null);
  const [indexes, setIndexes] = useState(null);
  const [indexStatus, setIndexStatus] = useState({name:null,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});

  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(null);

  const handleConnectionChange = (name,value) => {
    const detailName = name;
    const detailValue = value;
    setConnection(connection => ({
      ...connection,
      [detailName]:detailValue
    }));
  }

  const handleSubmit = () => {
    // setData(null);
    setConnected(false);
    setError(null);
    setLoading(true);
    connect(connection)
      .then(resp => {
        setLoading(false);
        setError(false);
        setConnected(true);
      })
      .catch(error => {setError(error);setLoading(false)});
  }

  return (
    <>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange} handleSubmit={handleSubmit}></MongoDBConnection>
      </AppBanner>
      <hr/>
      {loading? <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description="Connecting..."></Spinner></div> :
        <>
        {connected?
          <>
          <div style={{textAlign: 'center'}}>
            <Banner >Well done, you are connected!</Banner>
            <div style={{paddingTop:"15px", width:"70%", margin:"auto"}}>
              <Body as="div">
                <p>Use the 'Index Builder' tab to access a guided tutorial that will help you build your search index definition.</p>
                <p>Use the 'Query Tuner' tab to connect to a search index and tune your queries</p>
              </Body>
            </div>
          </div>
          <Tabs setSelected={setSelectedTab} selected={selectedTab}>
            <Tab name="Index Builder">
              <IndexBuilder connection={connection}
                schema={schema} setSchema={setSchema}
                indexStatus={indexStatus} setIndexStatus={setIndexStatus}
                fields={fields} setFields={setFields}/>
            </Tab>
            <Tab name="Query Tuner">
              <QueryTuner connection={connection} indexes={indexes} setIndexes={setIndexes}/>
            </Tab>
          </Tabs>
          </>
          : <>{error? <Banner variant="danger">{JSON.stringify(error)}</Banner>
          :
          <div style={{textAlign: 'center'}}>
            <Banner >Submit Connection Details</Banner>
            <div style={{paddingTop:"15px", width:"70%", margin:"auto"}}>
              <H3>How to use this app</H3>
              <Body as="div">
                <p>First, connect to your Atlas cluster!</p>
              </Body>
            </div>
          </div>
          }</>
        }
        </>
      }
      
    </>
  )
}

function connect(conn) {
  return new Promise((resolve,reject) => {
    axios.post(`api/post/atlas-search/index/connect?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

export default Home;