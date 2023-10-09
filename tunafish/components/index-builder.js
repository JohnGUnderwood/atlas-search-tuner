import { useState, useEffect } from 'react';
import axios from 'axios';
import SearchResultFields from './fields';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { H3, Subtitle, Description, InlineCode } from '@leafygreen-ui/typography';
import Banner from '@leafygreen-ui/banner';
import SearchTutorial from './app-tutorial/tutorial';

function IndexBuilder({connection,schema,setSchema}){
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(!schema){
      setLoading(true);
      getSchema(connection)
      .then(resp => {console.log(resp.data);setSchema(resp.data);setLoading(false)})
      .catch(error => {console.log(error);setError(error);setLoading(false)});
    }
  },[schema]);

  return (
      <>
        {/* {loading? 
          <Spinner description="Getting Schema... Can take up to a minute."></Spinner>
          :
          <>
            {schema? */}
              <SearchTutorial/>
              {/* :
              <>{error? <Banner variant="danger">{JSON.stringify(error)}</Banner>:<></>}</>
            }
          </>
        } */}
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