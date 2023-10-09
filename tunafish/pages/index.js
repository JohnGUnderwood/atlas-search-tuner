import Header from '../components/head';
import axios from 'axios';
import { useState } from 'react';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import AppBanner from '../components/banner';
import MongoDBConnection from '../components/connection';
import QueryTuner from '../components/query-tuner';
import IndexBuilder from '../components/index-builder';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import Banner from '@leafygreen-ui/banner';

function Home() {
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState({'searchIndex':'default'}); // uri, database, collection, searchIndex
  const [selectedTab, setSelectedTab] = useState(null);
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(null);

  const handleConnectionChange = (name,value) => {
    const detailName = name;
    const detailValue = value;
    setConnection(connection => ({
      ...connection,
      [detailName]:detailValue
    }));
  }

  const handleSubmit = () => {
    setIndex(null);
    setError(null);
    setLoading(true);
    fetchFieldData(connection)
      .then(resp => {
        setIndex(resp.data);
        setLoading(false);
      })
      .catch(error => {console.log(`fetchFieldData error ${error}`);setError(error);setLoading(false)});
  }

  return (
    <>
      <Header/>
      <AppBanner heading="Atlas Search Query Tuner">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange} handleSubmit={handleSubmit}></MongoDBConnection>
      </AppBanner>
      <hr/>
      {loading? <Spinner description="Getting Data..."></Spinner> :
        <>
        {index?
          <Tabs setSelected={setSelectedTab} selected={selectedTab}>
            <Tab name="Query Tuner"><QueryTuner fields={index.fields} connection={connection}/></Tab>
            {/* <Tab name="Index Builder"><div style={{position: "absolute", top: "50%",left: "50%"}}>Work In Progress...</div></Tab> */}
            <Tab name="Index Builder"><IndexBuilder connection={connection}/></Tab>
          </Tabs>
          : <>{error? <Banner variant="danger">{JSON.stringify(error)}</Banner> : <Banner >Submit Connection Details</Banner>}</>
        }
        </>
      }
      
    </>
  )
}

function fetchFieldData(conn) {
  return new Promise((resolve,reject) => {
    axios.get(`api/search/fields?index=${conn.searchIndex}&type=string&type=autocomplete&conn=${encodeURIComponent(conn.uri)}&db=${conn.database}&coll=${conn.collection}`)
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data)
    )
  });
}

export default Home;