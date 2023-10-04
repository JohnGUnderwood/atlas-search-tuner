import { useState } from 'react';
import axios from 'axios';
import SelectFieldWeights from './field-weights';
import SearchResultFields from './fields';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { H3, Subtitle, Description, InlineCode } from '@leafygreen-ui/typography';
import SaveQuery from './save-query';
import Button from '@leafygreen-ui/button';

function QueryTuner({fields,connection}){
    const [searching, setSearching] = useState(false);
    const [queryTerms, setQueryTerms] = useState(null);
    const [weights, setWeights] = useState({});
    const [searchResponse, setSearchResponse] = useState({});
    const [searchPage, setSearchPage] = useState(1);
    const pageSize = 6;

    const handleQueryChange = (event) => {
        const query = event.target.value;
        setQueryTerms(query);
        searchRequest(query, weights, connection, searchPage, pageSize)
          .then(resp => setSearchResponse(resp.data))
          .catch(console.error);
      };
    
      const handleSearchClick = () => {
        setSearching(true);
        searchRequest(queryTerms, weights, connection, searchPage, pageSize)
          .then(resp => {setSearchResponse(resp.data);setSearching(false);})
          .catch(console.error);
      }

    return (
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
                    <SaveQuery query={searchResponse.query.searchStage} queryTerms={queryTerms}></SaveQuery>
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
                <Spinner description="Getting Search Results..."></Spinner>
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
    )
}

function searchRequest(query, weights, conn, page, rpp) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          axios.post(`api/search/query?terms=${query}&conn=${encodeURIComponent(conn.uri)}&db=${conn.database}&coll=${conn.collection}&index=${conn.searchIndex}&page=${page}&rpp=${rpp}`,
            { weights : weights},
            { headers : 'Content-Type: application/json'}
          )
        );
      }, 1000);
    });
  }

export default QueryTuner;