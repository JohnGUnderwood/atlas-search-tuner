import Head from 'next/head';
import { useState, useEffect } from 'react';
import { H1, Body } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import { Button } from '@leafygreen-ui/button'
import { SearchInput, SearchResult, SearchResultGroup } from '@leafygreen-ui/search-input';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';

function Home() {
  // use state to store fields
  const [fields, setFields] = useState(null);
  const [selectedField, setSelectedField] = useState("");

  // use state to store field weights
  const [weights, setWeights] = useState({});

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // Fetch field data on component mount
  useEffect(() => {
    fetchFieldData()
      .then(data => setFields(data))
      .catch(console.error);
  }, []);
 
  const handleSliderChange = (field, newValue) => {
    setWeights(weights => ({
      ...weights,
      [field]: newValue
    }));
  };

  const handleFieldToggle = (value) => {
    // const field = event.target.value;
    const fields = value;
    const newWeights = {};
    console.log(fields);
    if (fields.length >0){
      fields.forEach((field) => {
        newWeights[field] = 50;
      });
      setWeights(newWeights);
    }else{
      setWeights(newWeights);
    }
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSearch = () => {
    // make search request to your engine
    dummySearchRequest(query, weights)
      .then(setSearchResults)
      .catch(console.error);
  };

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
        <Combobox label="Choose Fields" multiselect={true} onChange={handleFieldToggle}>
          {fields.map(field => (
            <ComboboxOption key={field} value={field}/>
          ))}
        </Combobox>
        <div>
          {Object.keys(weights).map(field => (
            <label key={field}>
              {field}
              <input 
                type="range"
                min="1"
                max="100"
                value={weights[field] || 50} 
                onChange={(e) => handleSliderChange(field, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
      <div style={{width:"70%", float:"right"}}>
        <div>
          <label>
            Query:
            <input type="text" value={query} onChange={handleQueryChange} />
          </label>
          <button onClick={handleSearch}>Search</button>
        </div>
        <div>
          Results: 
          <pre>
            {JSON.stringify(searchResults, null, 2)}
          </pre>
        </div>
      </div>
    </>
  )
}
 
// Dummy function that mimicks async API call 
// Replace this with the actual function when the API is set up.
function dummySearchRequest(query, weights) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Search results for "${query}" with weights ${JSON.stringify(weights)}.`);
    }, 1000);
  });
}

// Dummy function to mimic fetching field data
function fetchFieldData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['field1', 'field2', 'field3']);
    }, 1000);
  });
}

export default Home;

