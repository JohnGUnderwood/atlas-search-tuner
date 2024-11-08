import { useEffect, useState } from 'react';
import axios from 'axios';
import SelectFieldWeights from './field-weights';
import SearchResultFields from './fields';
import { SearchInput, SearchResult } from '@leafygreen-ui/search-input';
import Card from '@leafygreen-ui/card';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { H3, Subtitle, Description, InlineCode } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import Banner from '@leafygreen-ui/banner';
import Code from '@leafygreen-ui/code';
import Icon from '@leafygreen-ui/icon';
import { Chip } from '@leafygreen-ui/chip';


function QueryRanker({connection, userSelection}){
    const indexName = userSelection.indexName;
    const [query, setQuery] = useState({terms:null,filters:[]})
    const [searchResponseState, setSearchResponse] = useState({
        status:null,
        results:null,
        facets:null,
        query:null,
        error:null
    });
    const [pagination, setPagination] = useState({page:1,size:1,paginate:null,token:null});
    const [labels, setLabels] = useState([]);

    const nextPage  = () => {
        setPagination({...pagination,page:pagination.page+1,paginate:"next",token:searchResponseState.results[searchResponseState.results.length-1].searchSequenceToken});
    };

    const previousPage  = () => {
        setPagination({...pagination,page:pagination.page-1,paginate:"previous",token:searchResponseState.results[0].searchSequenceToken});
    };

    useEffect(()=>{
        console.log(query,userSelection.weights,userSelection.facets);
        if(query.terms){
            setSearchResponse({
                ...searchResponseState,
                status:'loading'
            });
            searchRequest(query, userSelection, indexName, connection, pagination)
                .then(resp => {setSearchResponse({...searchResponseState,status:"ready",results:resp.data.results,facets:resp.data.facets,query:resp.data.query})})
                .catch(error => {setSearchResponse({...searchResponseState,status:"error",error:error})});
        }
    },[query]);

    useEffect(()=>{
        console.log("pagination");
        if(query.terms){
            setSearchResponse({
                ...searchResponseState,
                status:'loading'
            });
            searchRequest(query, userSelection, indexName, connection, pagination)
                .then(resp => {setSearchResponse({...searchResponseState,status:"ready",results:resp.data.results,facets:resp.data.facets,query:resp.data.query})})
                .catch(error => {setSearchResponse({...searchResponseState,status:"error",error:error})});
        }
    },[pagination.paginate])

    const handleQueryChange = (event) => {
        setQuery({terms:event.target.value,filters:[]});
        setPagination({page:1,size:1,paginate:null,token:null});
    };

    return (
        <>
            <div style={{
                    display: "grid",
                    gridTemplateColumns: "50% 50%",
                    gap: "10px",
                    marginTop:"10px"}}>
                <div style={{marginLeft:"50px",marginRight:"25px"}}>
                    <H3>Labels</H3>
                    <p>
                        <Code language={'javascript'}>
                            {JSON.stringify(labels,null,2)}
                        </Code>
                    </p>
                </div>
                <div style={{marginRight:"50px"}}>
                    <SearchInput onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput>
                    
                    {searchResponseState.status == 'loading'?<div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description="Getting Search Results..."></Spinner></div>:<></>}
                    {searchResponseState.status == 'error'?<Banner variant="danger">{JSON.stringify(searchResponseState.error)}</Banner>:<></>}
                    {searchResponseState.status == 'ready'? (
                        searchResponseState.results && searchResponseState.results.length > 0 ? (
                            <div style={{display:"grid",gridTemplateColumns:"20px 1fr 20px"}}>
                                <div style={{display: "flex", alignItems: "center"}}>{pagination.page > 1?<Icon glyph={"ChevronLeft"} fill="None" onClick={previousPage} />:<></>}</div>
                                {searchResponseState.results.map(result=>(
                                    <Card key={result._id} style={{maxHeight:"50vh",overflowY: "auto",clear:"both",marginBottom:"20px"}} clickable="false">
                                        <InlineCode key={`${result._id}-score`} ><em key={`${result._id}-score-em`} >score:</em> {result.score}</InlineCode>
                                        <br/>
                                        <SearchResultFields key={`${result._id}-fields`} doc={result}></SearchResultFields>
                                    </Card>
                                ))}
                                <div style={{height:"100%",display: "flex", alignItems: "center"}}><Icon glyph={"ChevronRight"} fill="None" onClick={nextPage}/></div>
                            </div>
                            ) : (
                            <SearchResult clickable="false">
                                <Subtitle>No Results</Subtitle>
                                <Description weight="regular">Could not find any results for "<em>{query.terms}</em>"</Description>
                            </SearchResult>
                            )
                    ) : null} 
                </div>
            </div>
        </>
    )
}

function searchRequest(query, userSelection,indexName, conn,pagination) {
    const params = new URLSearchParams({
        terms: query.terms,
        page: pagination.page,
        rpp: pagination.size
      });
    if(pagination.paginate && pagination.token){
        params.append('paginate',pagination.paginate);
        params.append('token',pagination.token);
    }
    return new Promise((resolve) => {
        axios.post(`api/post/atlas-search/query?${params.toString()}`,
            { weights : userSelection.weights, facets: userSelection.facets, connection: conn, index:indexName, filters:query.filters},
            { headers : 'Content-Type: application/json'},
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

export default QueryRanker;