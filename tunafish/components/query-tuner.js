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
import { parseIndex } from '../functions/schema';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';

function QueryTuner({connection, indexes, setIndexes}){
    const [fields, setFields] = useState(null);
    const [searchIndex, setSearchIndex] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [queryTerms, setQueryTerms] = useState(null);
    const [weights, setWeights] = useState({});
    const [searchResponse, setSearchResponse] = useState({});
    const [searchPage, setSearchPage] = useState(1);
    const pageSize = 6;

    useEffect(()=>{
        setLoading(true);
        fetchIndexes(connection).then(resp => {
            setIndexes(resp.data);
            setLoading(false);
            setError(null);
        }).catch(error => {setLoading(false);setError(error)});
        
        if(searchIndex){
            setSearchResponse({});
            setWeights({});
            setQueryTerms(null);
            setFields(null);
            fetchIndex(connection,searchIndex).then(resp =>{
                const types = parseIndex(resp.data);
                var newFields = {};
                ['string','autocomplete'].forEach((type)=>{
                    if(types[type]){
                    newFields[type]=types[type];
                    }
                });
                if(Object.keys(newFields).length > 0 ){
                setFields(newFields);
                }
                console.log(newFields);
            });
        }
    },[searchIndex,indexes]);

    const handleQueryChange = (event) => {
        setSearching(true);
        const query = event.target.value;
        setQueryTerms(query);
        searchRequest(query, weights, searchIndex, connection, searchPage, pageSize)
            .then(resp => {setSearchResponse(resp.data);setSearching(false)})
            .catch(console.error);
    };
    
    const handleSearchClick = () => {
        setSearching(true);
        searchRequest(queryTerms, weights, searchIndex, connection, searchPage, pageSize)
            .then(resp => {setSearchResponse(resp.data);setSearching(false);})
            .catch(console.error);
    };


    return (
        <>{indexes?
            <div>
                <div style={{
                        marginTop:"10px",
                        display: "grid",
                        gridTemplateColumns: "55% 5%",
                        gap: "40px"
                    }}
                >
                    <Combobox
                        label="Choose a search index to query"
                        placeholder="Select index"
                        onChange={setSearchIndex}
                    >
                        {indexes.map(index => (
                            <ComboboxOption key={index} value={index}></ComboboxOption>
                        ))}
                    </Combobox>
                </div>
                {fields?
                    <div style={{marginTop:"10px"}}>
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
                            {/* <p>
                                <SaveQuery query={searchResponse.query.searchStage} queryTerms={queryTerms}></SaveQuery>
                            </p> */}
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
                    </div>
                :<></>
                }
            </div>:<>{error?<Banner variant="danger">{JSON.stringify(error)}</Banner>:<>{loading?<div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description="Fetching indexes..."></Spinner></div>:<></>}</>}</>
        }
        </>
    )
}

function searchRequest(query, weights, searchIndex, conn, page, rpp) {
    return new Promise((resolve) => {
        axios.post(`api/post/atlas-search/query?terms=${query}&page=${page}&rpp=${rpp}`,
            { weights : weights, connection: conn, index:searchIndex},
            { headers : 'Content-Type: application/json'}
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

function fetchIndex(conn,searchIndex) {
    return new Promise((resolve,reject) => {
        axios.post(`api/post/atlas-search/index/status`,{connection:conn,name:searchIndex})
        .then(response => resolve(response))
        .catch((error) => reject(error.response.data))
    });
}

function fetchIndexes(conn) {
    return new Promise((resolve,reject) => {
        axios.post(`api/post/atlas-search/index/list?`,{connection:conn})
        .then(response => resolve(response))
        .catch((error) => reject(error.response.data))
    });
}

export default QueryTuner;