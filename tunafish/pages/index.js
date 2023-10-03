import Head from 'next/head';
import axios from 'axios';
import { useState } from 'react';
import { H1, H2, H3, Subtitle, Description, Body, InlineCode, Label } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Combobox, ComboboxGroup, ComboboxOption } from '@leafygreen-ui/combobox';
import Button from '@leafygreen-ui/button';
import Banner from '@leafygreen-ui/banner';
import TextInput from '@leafygreen-ui/text-input';
import SearchResultFields from '../components/fields';
import SaveQuery from '../components/save-query';
import SelectFieldWeights from '../components/field-weights';

function Home() {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // use state to store fields
  const [connection, setConnection] = useState("");
  const [database, setDatabase] = useState("");
  const [collection, setCollection] = useState("");
  const [searchIndex, setIndex] = useState("default");

  const [fields, setFields] = useState(null);
  const [queryTerms, setQueryTerms] = useState(null);

  // use state to store field weights
  const [weights, setWeights] = useState({});

  // const [query, setQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState({});
 
  const handleQueryChange = (event) => {
    const query = event.target.value;
    setQueryTerms(query);
    searchRequest(query, weights, connection, database, collection, searchIndex)
      .then(resp => setSearchResponse(resp.data))
      .catch(console.error);
  };

  const handleSearchClick = () => {
    setSearching(true);
    searchRequest(queryTerms, weights, connection, database, collection, searchIndex)
      .then(resp => {setSearchResponse(resp.data);setSearching(false);})
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
          <SelectFieldWeights fields={fields} weights={weights} setWeights={setWeights}></SelectFieldWeights>
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
              <p>
                <InlineCode>
                  {JSON.stringify(searchResponse.query.searchStage)}
                </InlineCode>
              </p>
              <p>
                <SaveQuery query={searchResponse.query.searchStage}></SaveQuery>
              </p>
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
            {searching?
              <Banner>Getting search results...</Banner>
              :
              <>
                {searchResponse.results?.map(result=>(
                  <SearchResult key={result._id} style={{clear:"both"}} clickable="false">
                    <InlineCode><em>score:</em> {result.score}</InlineCode>
                    <br/>
                    <SearchResultFields doc={result}></SearchResultFields>
                  </SearchResult>
                ))}
                {!searchResponse.results ? <></> : searchResponse.results.length ? <></> : 
                  <SearchResult clickable="false">
                    <Subtitle>No Results</Subtitle>
                    <Description weight="regular">Could not find any results for your search</Description>
                  </SearchResult>
                }
              </>
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