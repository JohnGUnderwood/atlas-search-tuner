import Head from 'next/head';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { H1, H2, H3, Subtitle, Description, Body, InlineCode, Label } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Combobox, ComboboxGroup, ComboboxOption } from '@leafygreen-ui/combobox';
import Button from '@leafygreen-ui/button';
import Banner from '@leafygreen-ui/banner';
import TextInput from '@leafygreen-ui/text-input';
import SearchResultFields from '../components/fields';

function Home() {
  const [loading, setLoading] = useState(false);
  // use state to store fields
  const [connection, setConnection] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  const [collection, setCollection] = useState("");
  const [searchIndex, setIndex] = useState("default");

  const [fields, setFields] = useState(null);
  const [queryTerms, setQueryTerms] = useState(null);

  // use state to store field weights
  const [weights, setWeights] = useState({});

  // const [query, setQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState({});

  // Fetch field data on component mount
  useEffect(() => {
    // fetchFieldData()
    //   .then(resp => setFields(resp.data))
    //   .catch(console.error);
  }, []);
 
  const handleSliderChange = (weight, newValue) => {
    const [type,field] = weight;
    var typeWeights = weights[type];
    typeWeights[field] = newValue
    setWeights(weights => ({
      ...weights,
      [type]: typeWeights
    }));
  };

  const handleFieldToggle = (value) => {
    const fields = value;
    var newWeights = {};
    if (fields.length >0){
      fields.forEach((field) => {
        const ftype = field.split('_')[0];
        // Fieldname might have '_' in it
        const fname = field.split('_').slice(1).join('_');
        if(weights[ftype]){
          if(weights[ftype][fname]){
            if(ftype in newWeights){
              newWeights[ftype][fname] = weights[ftype][fname];
            }else{
              newWeights[ftype] = {};
              newWeights[ftype][fname] = weights[ftype][fname];
            }
          }else{
            if(ftype in newWeights){
              newWeights[ftype][fname] = 0;
            }else{
              newWeights[ftype] = {};
              newWeights[ftype][fname] = 0;
            }
          }
        }else{
          if(ftype in newWeights){
            newWeights[ftype][fname] = 0;
          }else{
            newWeights[ftype] = {};
            newWeights[ftype][fname] = 0;
          }
        }

      });
      setWeights(newWeights);
    }else{
      setWeights(newWeights);
    }
  };

  const handleQueryChange = (event) => {
    const query = event.target.value;
    setQueryTerms(query);
    searchRequest(query, weights, connection, database, collection, searchIndex)
      .then(resp => setSearchResponse(resp.data))
      .catch(console.error);
  };

  const handleSearchClick = () => {
    searchRequest(queryTerms, weights, connection, database, collection, searchIndex)
      .then(resp => setSearchResponse(resp.data))
      .catch(console.error);
  }

  const handleSubmit = () => {
    setLoading(true);
    fetchFieldData(connection,database,collection,searchIndex)
      .then(resp => {setFields(resp.data);setLoading(false);})
      .catch(console.error);
  }

  return (
    <>
      <Head>
        <title>Leafy Tuna</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: "10px"
        }}>
        <div style={{marginRight:"auto"}}>
          <H1><MongoDBLogoMark/>Atlas Search Query Tuner</H1>
        </div>
        <div style={{marginLeft:"auto", paddingRight:"50px", width:"75%"}}>
          <TextInput  label="Connection String" value={connection} type="url" onChange={(e)=>setConnection(e.target.value)}></TextInput>
          <table>
            <tbody>
              <tr>
                {/* <td><TextInput label="User" value={user} onChange={(e)=>setUser(e.target.value)}></TextInput></td> */}
                {/* <td><TextInput label="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}></TextInput></td> */}
                <td><TextInput label="Database" value={database} onChange={(e)=>setDatabase(e.target.value)}></TextInput></td>
                <td><TextInput label="Collection" value={collection} onChange={(e)=>setCollection(e.target.value)}></TextInput></td>
                <td><TextInput label="Search Index" value={searchIndex} onChange={(e)=>setIndex(e.target.value)}></TextInput></td>
              </tr>
            </tbody>
          </table>
          <Button style={{float:"right"}} onClick={handleSubmit}>Submit</Button>
        </div>
      </div>
      <hr/>
      {loading? <Banner>Getting Data...</Banner> : 
      <>
      {fields?
        <div>
        <div style={{width:"30%",float:"left"}}>
          <div style={{width:"80%"}}>
            <Combobox label="Choose Fields to Weight" size="small" multiselect={true} onChange={handleFieldToggle}>
              {Object.keys(fields).map(fieldType => (
                <ComboboxGroup key={fieldType} label={fieldType}>
                  {fields[fieldType].map(field => (
                    <ComboboxOption key={fieldType+'_'+field} value={fieldType+'_'+field} displayName={field}/>
                  ))}
                </ComboboxGroup>
              ))}
            </Combobox>
          </div>
          <div style={{paddingTop:"2%"}}>
            {Object.keys(weights).map(type => (
              <div key={type}>
                <Subtitle>{type} fields</Subtitle>
                {Object.keys(weights[type]).map(field => (
                  <div key={type+'_'+field}>
                    <Label>
                      {field}
                      <input
                        key={type+'_'+field+'_slider'}
                        style={{verticalAlign:"bottom"}}
                        type="range"
                        min="-10"
                        max="10"
                        value={weights[type][field] || 0} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                      />
                      <input
                        key={type+'_'+field+'_box'}
                        style={{width:"2lvh"}}
                        type="text"
                        value={weights[type][field] || 0} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                      />
                    </Label>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <br/>
          <Button onClick={handleSearchClick}>Search</Button>
          {searchResponse.query?
            <div>
              <br/>
              <H3>Query used</H3>
              {!searchResponse.query.msg ? <></> : searchResponse.query.msg.length ? 
                searchResponse.query.msg.map(m => (<Banner>{m}</Banner>))
                : <></>
              }
              <br/>
              <InlineCode>
                {JSON.stringify(searchResponse.query.searchStage)}
              </InlineCode>
            </div>
            : <></>
          }
        </div>
        <div style={{width:"70%", float:"right", paddingTop:"15px"}}>
          <div>
            <SearchInput
              onChange={handleQueryChange}
              aria-label="some label"
            ></SearchInput>
            {searchResponse.results?.map(result=>(
              <SearchResult key={result._id} style={{clear:"both"}} clickable="false">
                <InlineCode><em>score:</em> {result.score}</InlineCode>
                <br/>
                <SearchResultFields doc={result}></SearchResultFields>
              </SearchResult>
            ))}
            {
              !searchResponse.results ? <></> : searchResponse.results.length ? <></> : 
              <SearchResult clickable="false">
                <Subtitle>No Results</Subtitle>
                <Description weight="regular">Could not find any results for your search</Description>
              </SearchResult>
            }
          </div>
        </div>
      </div>
      : <Banner>Submit Connection Details</Banner>
      }</>}
      
    </>
  )
}
 

function searchRequest(query, weights, conn, db, coll, index) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        axios.post(`api/search/query?terms=${query}&conn=${encodeURIComponent(conn)}&db=${db}&coll=${coll}&index=${index}`,
          { weights : weights},
          { headers : 'Content-Type: application/json'}
        )
      );
    }, 1000);
  });
}

// Dummy function to mimic fetching field data
function fetchFieldData(conn,db,coll,index) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        axios.get(`api/search/fields?index=${index}&type=string&type=autocomplete&conn=${encodeURIComponent(conn)}&db=${db}&coll=${coll}`)
      );
    }, 1000);
  });
}

export default Home;