import Header from '../components/head';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import AppBanner from '../components/banner';
import MongoDBConnection from '../components/connection';
import QueryTuner from '../components/query-tuner';
import SearchTutorial from '../components/app-tutorial/tutorial';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import Banner from '@leafygreen-ui/banner';
import { H3, Body } from '@leafygreen-ui/typography';

function Home() {
  const [connection, setConnection] = useState({}); // uri, database, collection
  const [schema, setSchema] = useState(null);
  const [indexes, setIndexes] = useState(null);

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
      {loading? <Spinner description="Connecting..."></Spinner> :
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
              <SearchTutorial connection={connection} schema={schema} setSchema={setSchema}/>
              {/* :<Banner variant="danger">Missing search index definition</Banner>} */}
            </Tab>
            <Tab name="Query Tuner">
              <QueryTuner connection={connection} indexes={indexes} setIndexes={setIndexes}/>
              {/* :<Banner variant="danger">Missing search fields</Banner>} */}
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