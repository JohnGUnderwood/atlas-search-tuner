import Header from '../components/head';
import axios from 'axios';
import { useState } from 'react';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import AppBanner from '../components/banner';
import MongoDBConnection from '../components/connection';
import QueryTuner from '../components/query-tuner';
import SearchTutorial from '../components/app-tutorial/tutorial';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import Banner from '@leafygreen-ui/banner';

function Home() {
  const [connection, setConnection] = useState({'searchIndex':'default'}); // uri, database, collection, searchIndex
  const [selectedTab, setSelectedTab] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null)


  const handleConnectionChange = (name,value) => {
    const detailName = name;
    const detailValue = value;
    setConnection(connection => ({
      ...connection,
      [detailName]:detailValue
    }));
  }

  const handleSubmit = () => {
    setData(null);
    setError(null);
    setLoading(true);
    fetchData(connection)
      .then(resp => {
        setData(resp.data)
        setLoading(false)
        setError(false);
      })
      .catch(error => {setError(error);setLoading(false)});
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
        {data?
          <Tabs setSelected={setSelectedTab} selected={selectedTab}>
            {/* <Tab name="Index Builder"><div style={{position: "absolute", top: "50%",left: "50%"}}>Work In Progress...</div></Tab> */}
            <Tab name="Index Builder">{data.schema?<SearchTutorial schema={data.schema} connection={connection}/>:<Banner variant="danger">Missing search index definition</Banner> }</Tab>
            <Tab name="Query Tuner">{data.searchIndex?<QueryTuner searchIndex={data.searchIndex} connection={connection}/>:<Banner variant="danger">Missing collection schema</Banner> }</Tab>
          </Tabs>
          : <>{error? <Banner variant="danger">{JSON.stringify(error)}</Banner> : <Banner >Submit Connection Details</Banner>}</>
        }
        </>
      }
      
    </>
  )
}

function fetchData(conn) {
  return new Promise((resolve,reject) => {
    axios.post(`api/atlas/connection?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data)
    )
  });
}

// function getSchema(connection){
//   return new Promise((resolve,reject) => {
//     axios.post('api/atlas/schema',{connection:connection})
//       .then(response => resolve(response))
//       .catch((error) => {
//         console.log(error.response.data);
//         reject(error.response.data);
//       })
//   });
//   // return new Promise((resolve,reject)=>{
//   //   var schema = require('../testing/schema')
//   //   console.log("fetching local schema",schema)
//   //   resolve(schema)
//   // });
// }

export default Home;