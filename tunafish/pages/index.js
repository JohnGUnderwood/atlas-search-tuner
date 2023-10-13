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
import { parseIndex } from '../functions/schema';

function Home() {
  const [connection, setConnection] = useState({'searchIndex':'default'}); // uri, database, collection, searchIndex
  const [selectedTab, setSelectedTab] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [fields, setFields] = useState(null);

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
        setData(resp.data);
        setLoading(false);
        setError(false);
        const types = parseIndex(resp.data.searchIndex);
        var newFields = {};
        ['string','autocomplete'].forEach((type)=>{
            if(types[type]){
              newFields[type]=types[type];
            }
        });
        if(Object.keys(newFields).length > 0 ){
          setFields(newFields);
        }
        console.log(newFields);
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
            <Tab name="Index Builder">
              {data.schema?
              <SearchTutorial schema={data.schema} connection={connection} handleConnectionChange={handleConnectionChange}/>
              :<Banner variant="danger">Missing search index definition</Banner>}
            </Tab>
            <Tab name="Query Tuner">
              {fields?
              <QueryTuner fields={fields} connection={connection}/>
              :<Banner variant="danger">Missing search fields</Banner>}
            </Tab>
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
    axios.post(`api/post/atlas-search/index/connection?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
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