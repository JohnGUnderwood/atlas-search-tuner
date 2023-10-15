import { useState } from 'react';
import axios from 'axios';
import SelectFieldWeights from './field-weights';
import SearchResultFields from './fields';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import Card from '@leafygreen-ui/card';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { H3, Subtitle, Description, InlineCode } from '@leafygreen-ui/typography';
import SaveQuery from './save-query';
import Button from '@leafygreen-ui/button';
import Banner from '@leafygreen-ui/banner';
import Code from '@leafygreen-ui/code';

function QueryTuner({fields,connection}){
    const [searching, setSearching] = useState(false);
    const [queryTerms, setQueryTerms] = useState(null);
    const [weights, setWeights] = useState({});
    const [searchResponse, setSearchResponse] = useState({});
    const [searchPage, setSearchPage] = useState(1);
    const pageSize = 6;

    const handleQueryChange = (event) => {
        setSearching(true);
        const query = event.target.value;
        setQueryTerms(query);
        searchRequest(query, weights, connection, searchPage, pageSize)
          .then(resp => {setSearchResponse(resp.data);setSearching(false)})
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
            {searchResponse?.query?
                <div>
                <br/>
                <H3>Query used</H3>
                {!searchResponse.query.msg ? <></> : searchResponse.query.msg.length ? 
                    searchResponse.query.msg.map(m => (<Banner>{m}</Banner>))
                    : <></>
                }
                <p>
                    <Code language={'javascript'}>
                        {JSON.stringify(searchResponse.query.searchStage,null,2)}
                    </Code>
                </p>
                <p>
                    <SaveQuery query={searchResponse.query.searchStage} queryTerms={queryTerms}></SaveQuery>
                </p>
                </div>
                : <></>
            }
            </div>
            <div style={{width:"70%", float:"right", paddingTop:"15px"}}>
                <div style={{paddingLeft:"15px"}}>
                    <SearchInput
                    onChange={handleQueryChange}
                    aria-label="some label"
                    style={{marginBottom:"20px"}}
                    ></SearchInput>
                    {searching?
                    <Spinner description="Getting Search Results..."></Spinner>
                    :
                    <>
                        {searchResponse?.results?.map(result=>(
                        <Card key={result._id} style={{clear:"both",marginBottom:"20px"}} clickable="false">
                            <InlineCode><em>score:</em> {result.score}</InlineCode>
                            <br/>
                            <SearchResultFields doc={result}></SearchResultFields>
                        </Card>
                        ))}
                        {!searchResponse?.results ? <></> : searchResponse.results.length ? <></> : 
                        <SearchResult clickable="false">
                            <Subtitle>No Results</Subtitle>
                            <Description weight="regular">Could not find any results for "<em>{queryTerms}</em>"</Description>
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
        axios.post(`api/post/atlas-search/query?terms=${query}&page=${page}&rpp=${rpp}`,
            { weights : weights, connection: conn},
            { headers : 'Content-Type: application/json'}
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

export default QueryTuner;