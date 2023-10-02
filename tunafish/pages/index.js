import Head from 'next/head';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { H1, H2, H3, Subtitle, Description, Body, InlineCode, Label } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Combobox, ComboboxGroup, ComboboxOption } from '@leafygreen-ui/combobox';

function Home() {
  // use state to store fields
  const [fields, setFields] = useState(null);
  // const [selectedField, setSelectedField] = useState("");
  const [queryTerms, setQueryTerms] = useState(null);

  // use state to store field weights
  const [weights, setWeights] = useState({});

  // const [query, setQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState({});

  // Fetch field data on component mount
  useEffect(() => {
    fetchFieldData()
      .then(resp => setFields(resp.data))
      .catch(console.error);
  }, []);
 
  const handleSliderChange = (weight, newValue) => {
    const [type,field] = weight;
    // var newWeights = weights;
    // newWeights[type][field] = newValue;
    // setWeights(newWeights);
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
        const [ftype,fname]=field.split('_');
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
      console.log(newWeights);
      setWeights(newWeights);
    }else{
      setWeights(newWeights);
    }
  };

  const handleQueryChange = (event) => {
    const query = event.target.value;
    setQueryTerms(query);
    searchRequest(query, weights)
      .then(resp => setSearchResponse(resp.data))
      .catch(console.error);
  };

  const handlSearchClick = () => {
    searchRequest(queryTerms, weights)
      .then(resp => setSearchResponse(resp.data))
      .catch(console.error);
  }

  // Render loading state if fields is null
  if (fields === null) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>Leafy Tuna</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <H1><MongoDBLogoMark/>Atlas Search Query Tuner</H1>
      <hr/>
      <div style={{width:"30%",float:"left"}}>
        <div style={{width:"80%"}}>
          <Combobox label="Choose Fields to Weight" multiselect={true} onChange={handleFieldToggle} size="small">
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
        <button onClick={handlSearchClick}>Search</button>
        {searchResponse.query?
          <div>
            <br/>
            <H3>Query used</H3>
            <InlineCode>
              {JSON.stringify(searchResponse.query.searchStage)}
            </InlineCode>
          </div>
          : <></>
        }
      </div>
      <div style={{width:"70%", float:"right"}}>
        <div>
          <SearchInput
            onChange={handleQueryChange}
            aria-label="some label"
          ></SearchInput>
          {searchResponse.results?.map(result=>(
            <SearchResult key={result._id} style={{clear:"both"}} clickable="false">
              <Subtitle>{result.title}</Subtitle>
              <InlineCode>Score: <em>{result.score}</em></InlineCode>
              <Description weight="regular">{result.plot}</Description>
              <div>
                <div style={{width:"33%", float:"left"}}>
                  <Label>
                    Cast
                    {result.cast?.map(member=>(
                      <Body>{member}</Body>
                    ))}
                  </Label>
                </div>
                <div style={{width:"33%", float:"left"}}>
                  <Label>
                    Genres
                    {result.genres?.map(genre=>(
                      <Body>{genre}</Body>
                    ))}
                  </Label>
                </div>
                <div style={{width:"33%", float:"left"}}>
                  <Label>
                    Year
                    <Body>{result.year}</Body>
                  </Label>
                </div>

              </div>
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
    </>
  )
}
 

function searchRequest(query, weights) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        axios.post(`api/search/query?terms=${query}`,
          { weights : weights},
          { headers : 'Content-Type: application/json'}
        )
      );
    }, 1000);
  });
}

// Dummy function to mimic fetching field data
function fetchFieldData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(axios.get('api/search/fields?index=default&type=string&type=autocomplete'));
    }, 1000);
  });
}

export default Home;

