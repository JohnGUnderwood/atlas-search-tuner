import Head from 'next/head';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { H1, H2, H3, Subtitle, Description, Body, InlineCode, Label } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import { SearchInput, SearchResult, SearchResultGroup } from '@leafygreen-ui/search-input';
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
 
  const handleSliderChange = (field, newValue) => {
    setWeights(weights => ({
      ...weights,
      [field]: newValue
    }));
  };

  const handleFieldToggle = (value) => {
    const fields = value;
    const newWeights = {};
    console.log(fields);
    if (fields.length >0){
      fields.forEach((field) => {
        newWeights[field] = 0;
      });
      setWeights(newWeights);
    }else{
      setWeights(newWeights);
    }
  };

  const handleQueryChange = (event) => {
    const query = event.target.value;
    setQueryTerms(query);
    searchRequest(query, weights)
      .then(setSearchResponse)
      .catch(console.error);
  };

  const handlSearchClick = () => {
    searchRequest(queryTerms, weights)
      .then(setSearchResponse)
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
                  <ComboboxOption key={fieldType+'_'+field} value={field}/>
                ))}
              </ComboboxGroup>
            ))}
          </Combobox>
        </div>
        <div style={{paddingTop:"2%"}}>
          {Object.keys(weights).map(field => (
            <p>
              <Label key={field}>
                {field}
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={weights[field] || 0} 
                  onChange={(e) => handleSliderChange(field, e.target.value)}
                />
                <input
                  style={{width:"2lvh"}}
                  type="text"
                  value={weights[field] || 0} 
                  onChange={(e) => handleSliderChange(field, e.target.value)}
                />
              </Label>
            </p>
          ))}
        </div>
        <button onClick={handlSearchClick}>Search</button>
      </div>
      <div style={{width:"70%", float:"right"}}>
        <div>
          <SearchInput
            onChange={handleQueryChange}
            aria-label="some label"
          ></SearchInput>
          {searchResponse.data?.map(result=>(
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
        </div>
      </div>
    </>
  )
}
 

function searchRequest(query, weights) {


  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        axios.post(
          `https://eu-west-2.aws.data.mongodb-api.com/app/querytuner-kysxq/endpoint/search?terms=${query}`,
          {'weights':weights}
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
      // resolve(['title', 'plot', 'genres']);
    }, 1000);
  });
}

export default Home;

