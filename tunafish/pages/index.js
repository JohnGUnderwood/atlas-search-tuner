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
import { Toast, ToastProvider } from '@leafygreen-ui/toast';
import { Combobox, ComboboxOption, ComboboxGroup } from '@leafygreen-ui/combobox';
import Icon from '@leafygreen-ui/icon';
import TextInput from '@leafygreen-ui/text-input';
import Button from '@leafygreen-ui/button';

function Home() {
  const [toastOpen, setToastOpen] = useState({success:false,warning:false,import:false,progress:false,note:false});
  const [connection, setConnection] = useState(null); // uri, database, collection
  const [schema, setSchema] = useState(null);
  const [indexes, setIndexes] = useState(null);
  const [searchIndex, setSearchIndex] = useState(null);
  const [createNew, setCreateNew] = useState(false);
  const [indexDefinition, setIndexDefinition] = useState(null);
  const [indexStatus, setIndexStatus] = useState({name:null,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
  const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});

  const [selectedTab, setSelectedTab] = useState(0);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(()=>{
    // if(connected){
    //   fetchIndexes(connection).then(resp => {
    //     setIndexes(resp.data);
    //   }).catch(error => {
    //     setToast(
    //       'warning',
    //       true,
    //       {
    //         title:"Search Indexes Error",
    //         body:`Failed to fetch search indexes. ${error}`
    //       }
    //     );
    //   });
    // }
  },[searchIndex]);

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

  const setToast = (variant,open,content) => {
    const newToast = toastOpen;
    newToast[variant] = open;
    setToastOpen(newToast);
    setToastContent(content)
  }

  const handleSubmit = () => {
    // setData(null);
    // setToast(
    //   'progress',
    //   true,
    //   {
    //     title:"Connecting",
    //     body:`Establishing connection to ${connection.database}.${connection.collection}`
    //   }
    // );
    connect(connection)
      .then(resp => {
        // setLoading(false);
        // setToast(
        //   'success',
        //   true,
        //   {
        //     title:"Connected!",
        //     body:"Successfully established connection."
        //   }
        // );
        fetchIndexes(connection).then(resp => {
          setIndexes(resp.data);
        }).catch(error => {
          // setToast(
          //   'warning',
          //   true,
          //   {
          //     title:"Search Indexes Error",
          //     body:`Failed to fetch search indexes. ${error}`
          //   }
          // );
        });
      })
      .catch(error => {
        // setToast(
        //   'warning',
        //   true,
        //   {
        //     title:"Error connecting",
        //     body:`Failed to establish connection ${connection.database}.${connection.collection}. ${error}`
        //   }
        // );
        // setLoading(false);
      });
  }

  return (
    <>
      <Header/>
      <AppBanner heading="Atlas Search Builder">
          <MongoDBConnection connection={connection} handleConnectionChange={handleConnectionChange} handleSubmit={handleSubmit}></MongoDBConnection>
      </AppBanner>
      <hr/>
      <div>
      {indexes?
        <div style={{
                width:"45%",
                marginLeft:"25%",
                marginTop:"10px",
                display: "grid",
                gridTemplateColumns: "50% 50%",
                gap: "40px"
            }}
        >
        
            <Combobox
                label="Search index to use"
                description='Pick an existing search index or create a new one by picking UI features you want in your search application'
                placeholder="Select index"
                onChange={setSearchIndex}
            >
              <ComboboxOption glyph={<Icon glyph='PlusWithCircle'/>} value="" displayName="Create new index" onClick={()=>setCreateNew(true)}/>
              <ComboboxGroup label="EXISTING INDEXES">
                {indexes.map(index => (
                  <ComboboxOption key={index} value={index}></ComboboxOption>
                ))}
              </ComboboxGroup>
                
            </Combobox>
            {createNew?
              <div style={{
                display: "grid",
                gridTemplateColumns: "50% 5%",
                gap: "10px"
              }}>
              <TextInput label="Index name" description='Unique name for a search index' value={searchIndex} onChange={(e)=>setSearchIndex(e.target.value)}></TextInput>
              <div style={{position:"relative"}}><Button style={{position:"absolute", bottom:"0"}} variant="primary" >Configure</Button></div>
              </div>
            :<></>}
        </div>
        :<></>
      }
      {indexDefinition?
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
        :<></>
      }
      </div>
      {/* <ToastProvider>
      <Toast
        variant="progress"
        title={toastContent.title}
        body={toastContent.body}
        open={toastOpen.progress}
        close={() => setToast('progress',false,{title:"",body:""})}
      />
      <Toast
        variant="warning"
        title={toastContent.title}
        body={toastContent.body}
        open={toastOpen.warning}
        close={() => setToast('warning',false,{title:"",body:""})}
      />
      </ToastProvider> */}
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

function fetchIndexes(conn) {
  return new Promise((resolve,reject) => {
      axios.post(`api/post/atlas-search/index/list?`,{connection:conn})
      .then(response => resolve(response))
      .catch((error) => reject(error.response.data))
  });
}

export default Home;