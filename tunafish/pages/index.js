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
import { Combobox, ComboboxOption, ComboboxGroup } from '@leafygreen-ui/combobox';
import Icon from '@leafygreen-ui/icon';
import TextInput from '@leafygreen-ui/text-input';
import Button from '@leafygreen-ui/button';
import { ToastProvider } from '@leafygreen-ui/toast';


function Home() {
  const [connection, setConnection] = useState(null); // uri, database, collection
  const [connected, setConnected] = useState(false);
  const [indexes, setIndexes] = useState(null);
  const [indexName, setIndexName] = useState(null);
  const [createNew, setCreateNew] = useState(false);
  const [configure, setConfigure] = useState(false);
  
  //Index Builder variables
  const [schema, setSchema] = useState(null);
  const [indexStatus, setIndexStatus] = useState({name:null,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});

  const [selectedTab, setSelectedTab] = useState(0);

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

  const handleSubmit = () => {
    connect(connection)
      .then(resp => {
        setSuccessToast(true);
        fetchIndexes(connection).then(resp => {
          setIndexes(resp.data);
        }).catch(error => {
          setError(error);
          setErrorToast(true);
        });
      })
      .catch(error => {
        setErrorToast(true);
        setError(error);
      });
  }

  return (
    <ToastProvider>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange} connected={connected} setConnected={setConnected}
          // handleSubmit={handleSubmit}
          />
      </AppBanner>
      <hr/>
      {(indexes && !configure)?
        <div style={{
            width:"45%",
            marginLeft:"25%",
            marginTop:"10px",
            display: "grid",
            gridTemplateColumns: "50% 50% 90px",
            gap: "40px",
            alignItems: "end"
          }}
        >
          <Combobox
            label="Search index to use"
            description='Pick an existing search index or create a new one by picking UI features you want in your search application'
            placeholder="Select index"
            onChange={setIndexName}
          >
            <ComboboxOption glyph={<Icon glyph='PlusWithCircle'/>} value='' displayName="Create new index" onClick={()=>setCreateNew(true)}/>
            <ComboboxGroup label="EXISTING INDEXES">
              {indexes.map(index => (
                <ComboboxOption key={index} value={index} onClick={()=>{setCreateNew(false);setConfigure(true)}}></ComboboxOption>
              ))}
            </ComboboxGroup>
              
          </Combobox>
          {createNew?
            <><TextInput label="Index name" description='Unique name for a search index' placeholder='newSearchIndex' value={indexName} onChange={(e)=>{setIndexName(e.target.value)}}></TextInput>
            <Button variant="primary" onClick={()=>setConfigure(true)}>Configure</Button></>
          :<div></div>}
        </div>
        :<></>
      }
      {(configure && indexName)?
        <>
        <div style={{
            width:"50%",
            marginTop:"10px",
            display: "flex",
            gap: "40px",
            alignItems: "center"
          }}
        >
          <H3>{`Search index: ${indexName}`}</H3>
          <Button leftGlyph={<Icon glyph='MultiDirectionArrow'/>} variant="default" onClick={()=>setConfigure(false)}>Switch index</Button>
        </div>
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
        </>
        :<></>
      }
    </ToastProvider>
  )
}

function connect(conn) {
  return new Promise((resolve,reject) => {
    axios.post(`api/post/atlas-search/index/connect?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

function fetchIndexes(conn) {
  return new Promise((resolve,reject) => {
      axios.post(`api/post/atlas-search/index/list?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

export default Home;