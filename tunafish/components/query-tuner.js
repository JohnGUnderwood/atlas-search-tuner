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
import { Chip } from '@leafygreen-ui/chip';


function QueryTuner({connection, userSelection, setUserSelection, index}){
    const fields = index.fields;
    const indexName = userSelection.indexName;
    const [query, setQuery] = useState({terms:null,filters:[]})
    const [filters, setFilters] = useState([]);
    const [searchResponseState, setSearchResponse] = useState({
        status:null,
        results:null,
        facets:null,
        query:null,
        error:null
    });
    const [searchPage, setSearchPage] = useState(1);
    const pageSize = 6;

    useEffect(()=>{
        console.log(query,userSelection.weights,userSelection.facets);
        if(query.terms){
            setSearchResponse({
                ...searchResponseState,
                status:'loading'
            });
            searchRequest(query, userSelection, indexName, connection, searchPage, pageSize)
                .then(resp => {setSearchResponse({...searchResponseState,status:"ready",results:resp.data.results,facets:resp.data.facets,query:resp.data.query})})
                .catch(error => {setSearchResponse({...searchResponseState,status:"error",error:error})});
        }
    },[query]);

    const setWeights = (weights) =>{
        setUserSelection({
            ...userSelection,
            weights:weights
        })
    }

    const setFacets = (facets) =>{
        setUserSelection({
            ...userSelection,
            facets:facets
        })
    }

    const handleQueryChange = (event) => {
        setQuery({terms:event.target.value,filters:[]});
    };
    
    const removeFilter = (index) => {
        setQuery({
            ...query,
            filters:query.filters.toSpliced(index,1)
        })
    }

    const handleSearchClick = () => {
        setQuery({
            ...query,
            filters:[]
        });
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
                        <SelectFieldWeights fields={fields} weights={userSelection.weights} setWeights={setWeights} facets={userSelection.facets} setFacets={setFacets}></SelectFieldWeights>
                        <br/>
                        <Button style={{marginBottom:"10px"}} onClick={handleSearchClick}>Search</Button>
                        {(searchResponseState.status == 'ready' && searchResponseState.facets)?
                            <Card>
                                {Object.keys(searchResponseState.facets).map(facet => (
                                    <div key={`${facet}_div`} style={{paddingLeft:"10px"}}>
                                        <Subtitle key={facet}>{facet}</Subtitle>
                                        {searchResponseState.facets[facet].buckets.map(bucket => (
                                            <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}} onClick={() => {setQuery({...query,filters:[...query.filters,{value:bucket._id,name:facet}]})}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
                                        ))}<br/>
                                    </div>
                                ))}
                            </Card>
                            :<></>
                        }
                    </div>
                    <div>
                        <div style={{paddingLeft:"15px"}}>
                            <SearchInput onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput>
                            {query.filters.length > 0?
                                query.filters.map((filter,index) => (
                                    <Chip label={filter.value}
                                        onDismiss={() => {removeFilter(index)}}
                                        key={filter.value}
                                        baseFontSize={16}
                                    />
                                ))
                                :<></>
                            }
                            {searchResponseState.status == 'loading'?<div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description="Getting Search Results..."></Spinner></div>:<></>}
                            {searchResponseState.status == 'error'?<Banner variant="danger">{JSON.stringify(searchResponseState.error)}</Banner>:<></>}
                            {searchResponseState.status == 'ready'?
                                <>
                                {(searchResponseState.results && searchResponseState.results.length > 0)?
                                    <>{searchResponseState.results.map(result=>(
                                        <Card key={result._id} style={{clear:"both",marginBottom:"20px"}} clickable="false">
                                            <InlineCode key={`${result._id}-score`} ><em key={`${result._id}-score-em`} >score:</em> {result.score}</InlineCode>
                                            <br/>
                                            <SearchResultFields key={`${result._id}-fields`} doc={result}></SearchResultFields>
                                        </Card>
                                        ))
                                    }</>
                                    :
                                    <SearchResult clickable="false">
                                        <Subtitle>No Results</Subtitle>
                                        <Description weight="regular">Could not find any results for "<em>{query.terms}</em>"</Description>
                                    </SearchResult>
                                }
                                </>
                            :<></>
                            }
                        </div>
                    </div>
                    {searchResponseState.query?
                        <div style={{marginRight:"20px"}}>
                            <H3>Query used</H3>
                            {!searchResponseState.query.msg ? <></> : searchResponseState.query.msg.length ? 
                                searchResponseState.query.msg.map(m => (<Banner>{m}</Banner>))
                                : <></>
                            }
                            {searchResponseState.query.searchStage?
                                <p>
                                    <Code language={'javascript'}>
                                        {JSON.stringify(searchResponseState.query.searchStage,null,2)}
                                    </Code>
                                </p>
                                :<></>
                            }
                            <H3>Facet Query used</H3>
                            {searchResponseState.query.searchMetaStage?
                                <p>
                                    <Code language={'javascript'}>
                                        {JSON.stringify(searchResponseState.query.searchMetaStage,null,2)}
                                    </Code>
                                </p>
                                :<></>
                            }
                        </div>
                        :<></>
                    }
                </div>
            :<></>
            }
        </>
    )
}

function searchRequest(query, userSelection,indexName, conn, page, rpp) {
    return new Promise((resolve) => {
        axios.post(`api/post/atlas-search/query?terms=${query.terms}&page=${page}&rpp=${rpp}`,
            { weights : userSelection.weights, facets: userSelection.facets, connection: conn, index:indexName, filters:query.filters},
            { headers : 'Content-Type: application/json'},
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

export default QueryTuner;