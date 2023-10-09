import { useState, useEffect } from 'react';
import axios from 'axios';
import SearchResultFields from './fields';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { H3, Subtitle, Description, InlineCode } from '@leafygreen-ui/typography';
import Banner from '@leafygreen-ui/banner';

function IndexBuilder({connection}){

  const [schema, setSchema] = useState(null);

  useEffect(() => {
    getSchema(connection)
      .then(resp => {console.log(resp.data);setSchema(resp.data)})
      .catch(error => console.log(error));
  },[schema]);

  return (
      <>
        {schema? <div>Got Schema</div> : <div>Sad face :-(</div>}
      </>
  )
}

function getSchema(connection){
  return new Promise((resolve,reject) => {
    axios.post('api/schema',{connection:connection})
      .then(response => resolve(response))
      .catch((error) => {
        console.log(error.response.data);
        reject(error.response.data);
      })
  });
}

export default IndexBuilder;