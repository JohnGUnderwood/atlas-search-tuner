import { useEffect, useState } from 'react';
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

function QueryTuner({connection, indexName, fields}){
    // const [fields, setFields] = useState(null);
    // const [searchIndex, setSearchIndex] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [queryTerms, setQueryTerms] = useState(null);
    const [weights, setWeights] = useState({});
    const [filter, setFilter] = useState(null);
    const [searchResponse, setSearchResponse] = useState({});
    const [searchPage, setSearchPage] = useState(1);
    const pageSize = 6;

    useEffect(()=>{
        if(indexName){
            setSearchResponse({});
            setWeights({});
            setQueryTerms(null);
            // setFields(null);
        }
    },[indexName]);

    const handleQueryChange = (event) => {
        setSearching(true);
        const query = event.target.value;
        setQueryTerms(query);
        searchRequest(query, weights, null, indexName, connection, searchPage, pageSize)
            .then(resp => {setSearchResponse(resp.data);setSearching(false)})
            .catch(console.error);
    };
    
    const filterSearch = (filter) => {
        console.log(filter);
        setSearching(true);
        searchRequest(queryTerms, weights, filter, indexName, connection, searchPage, pageSize)
            .then(resp => {setSearchResponse(resp.data);setSearching(false);})
            .catch(console.error);
    }

    const handleSearchClick = () => {
        setSearching(true);
        searchRequest(queryTerms, weights, null, indexName, connection, searchPage, pageSize)
            .then(resp => {setSearchResponse(resp.data);setSearching(false);})
            .catch(console.error);
    };


    return (
        <>
            {fields?
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "20% 40% 40%",
                    gap: "10px",
                    marginTop:"10px"}}>
                    <div>
                        <SelectFieldWeights fields={fields} weights={weights} setWeights={setWeights}></SelectFieldWeights>
                        <br/>
                        <Button onClick={handleSearchClick}>Search</Button>
                        <br/>
                        {searchResponse?.facets?
                            <Card>
                                {Object.keys(searchResponse.facets).map(facet => (
                                    <div key={`${facet}_div`} style={{paddingLeft:"10px"}}>
                                        <Subtitle key={facet}>{facet}</Subtitle>
                                        {searchResponse.facets[facet].buckets.map(bucket => (
                                            <Description key={bucket._id} style={{paddingLeft:"15px"}}><span style={{cursor:"pointer",paddingRight:"5px", color:"blue"}} onClick={() => {filterSearch({value:bucket._id,name:facet})}} key={`${bucket._id}_label`}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
                                        ))}<br/>
                                    </div>
                                ))}
                            </Card>
                            :<></>
                        }
                    </div>
                    <div>
                        <div style={{paddingLeft:"15px"}}>
                            <SearchInput
                            onChange={handleQueryChange}
                            aria-label="some label"
                            style={{marginBottom:"20px"}}
                            ></SearchInput>
                            {searching?
                            <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description="Getting Search Results..."></Spinner></div>
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
                    {searchResponse?.query?
                    <div>
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
                            <Code language={'javascript'}>
                                {JSON.stringify(searchResponse.query.searchMetaStage,null,2)}
                            </Code>
                        </p>
                        {/* <p>
                            <SaveQuery query={searchResponse.query.searchStage} queryTerms={queryTerms}></SaveQuery>
                        </p> */}
                    </div>
                    : <></>
                    }
                </div>
            :<></>
            }
        </>
    )
}

function searchRequest(query, weights, filter, indexName, conn, page, rpp) {
    return new Promise((resolve) => {
        if(query.length > 0){
            axios.post(`api/post/atlas-search/query?terms=${query}&page=${page}&rpp=${rpp}`,
                { weights : weights, connection: conn, index:indexName, filter:filter},
                { headers : 'Content-Type: application/json'},
            ).then(response => resolve(response))
            .catch((error) => {
                console.log(error)
                resolve(error.response.data);
            })
        }else{
            resolve({});
        }
    });
}

export default QueryTuner;