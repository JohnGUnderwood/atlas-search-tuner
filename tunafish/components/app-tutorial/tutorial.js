import { useState, useEffect } from 'react';
import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";
import Modal from '@leafygreen-ui/modal';
import { H3, Subtitle, Body, Link, Description } from '@leafygreen-ui/typography';
import { getCandidates } from '../../functions/schema';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import Code from '@leafygreen-ui/code';
import TextInput from '@leafygreen-ui/text-input';
import Button from '@leafygreen-ui/button';
import axios from 'axios';
import Banner from '@leafygreen-ui/banner';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import Card from '@leafygreen-ui/card';
import { buildSearchIndex } from '../../functions/index-definition'
import SearchResultFields from '../fields';

function SearchTutorial({connection, schema, setSchema}){
    //Fetching data
    // const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchIndex, setSearchIndex] = useState("");
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [suggestedFields, setSuggestedFields] = useState({facet:null,text:null,autocomplete:null});
    const [fields, setFields] = useState({facet:[],text:[],autocomplete:[]});
    const [mappings, setMappings] = useState(null);
    const [createError, setCreateError] = useState(false);
    const [createIndexResponse, setCreateIndexResponse] = useState(null);
    const [indexStatus, setIndexStatus] = useState({waiting:false,ready:false,error:null});
    const [facetResults, setFacetResults] = useState(null)
    const [textResults, setTextResults] = useState(null)

    useEffect(()=>{
        if(schema){
            const candidates = getCandidates(schema);
            setSuggestedFields({
                'facet':candidates.facet,
                'text':candidates.text,
                'autocomplete':candidates.autocomplete
            });
        }else{
            setLoading(true);
            setError(null);
            getSchema(connection).then(resp => {
                setSchema(resp.data);
                setLoading(false);
                setError(null);
            }).catch(error=>{setError(error);setLoading(false)});
        }
        if(indexStatus.ready){
            searchMeta(fields);
            searchText(fields);
        }
    },[schema,fields,indexStatus.ready])

    const handleBuild = () => {
        setLoading(true);
        setError(null);
        getSchema(connection).then(resp => {
            setSchema(resp.data);
            setLoading(false);
            setError(null);
        }).catch(error=>{setError(error);setLoading(false)});
    }

    const openModal = (content) => {
        console.log(fields);
        setModalContent(content);
        setOpen(!open);
    }
    
    const handleFieldToggle = (type,paths) => {
        const selectedFields = suggestedFields[type].filter((field)=>paths.includes(field.path))
        const newFields = fields;
        newFields[type]=selectedFields;
        setFields(newFields);
        setMappings(buildSearchIndex(newFields))
    }

    const saveIndex = () => {
        setIndexStatus({waiting:false,ready:false,error:null});
        postIndexMappings(mappings,searchIndex,connection)
            .then(resp=> {
                setCreateError(false);
                setCreateIndexResponse(resp.data);
                getIndexStatus();
            })
            .catch(err=> {
                setCreateError(true);
                setCreateIndexResponse(err);
            })
    }

    const searchMeta = (fields) => {
        searchRequest(fields,'facet',searchIndex,connection)
            .then(resp => {setFacetResults(resp.data);setOpen(false);})
            .catch(err => console.log(err));
    }

    const searchText = (fields) => {
        searchRequest(fields,'text',searchIndex,connection)
            .then(resp => {setTextResults(resp.data);setOpen(false);})
            .catch(err => console.log(err));
    }

    const getIndexStatus = () => {
        setIndexStatus({waiting:true,ready:false,error:null})
        postIndexStatus(connection,searchIndex).then(resp => {
            setIndexStatus({waiting:false,ready:true,error:null})
        }).catch(err => {setIndexStatus({waiting:false,ready:true,error:err})})
    }

    return (
        <>
        {loading? <Spinner description="Analyzing schema..."></Spinner> :
            <>
            {schema? <>
            <SearchBar openModal={openModal} autocompleteFields={suggestedFields.autocomplete}/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "25% 65%",
                gap: "10px",
                paddingTop:"10px"
            }}>
                {facetResults?.facet?
                    <div>
                        <H3>Facets</H3>
                        {Object.keys(facetResults.facet).map(facet => (
                            <div style={{paddingLeft:"10px"}}>
                            <Subtitle key={facet}>{facet}</Subtitle>
                            {facetResults.facet[facet].buckets.map(bucket => (
                                <Description key={bucket._id} style={{paddingLeft:"15px"}}><span style={{paddingRight:"5px"}}>{bucket._id}</span><span>({bucket.count})</span></Description>
                            ))}<br/></div>
                        ))}
                    </div>
                    :<></>
                }
                {!facetResults && suggestedFields.facet?<Facets openModal={openModal} facetFields={suggestedFields.facet}></Facets>:<></>}
                {textResults?
                    <div>
                        <H3>Search Results</H3>
                        {textResults.map(result =>(
                            <Card key={result._id} style={{marginBottom:"20px"}}>
                                <SearchResultFields doc={result}></SearchResultFields>
                                {/* {Object.keys(result).filter(k=>k!='_id').map(field=>(
                                    <><Subtitle key={`${result._id}.${field}`}>{field}</Subtitle>
                                    <Description>{result[field]}</Description></>
                                ))} */}
                            </Card>
                        ))}
                    </div>
                    :<></>
                }
                {!textResults && suggestedFields.text?<Results openModal={openModal} textFields={suggestedFields.text}></Results>:<></>}
            </div>
            {modalContent?
            <Modal open={open} setOpen={setOpen}>
                <Subtitle>{modalContent.title}</Subtitle>
                <Body>
                    {modalContent.content}
                </Body>
                <Body>
                    {modalContent.links?.map((link) => <Link key={link.url} href={link.url}>{link.label}</Link>)}
                </Body>
                <hr/>
                <Combobox label={"Choose suggested "+modalContent.type+" fields"} size="small" multiselect={true} initialValue={fields[modalContent.type].map((field)=>field.path)} onChange={(e)=>handleFieldToggle(modalContent.type,e)}>
                    {modalContent.fields?.map((field) => (
                        <ComboboxOption key={field.path} value={field.path} displayName={field.path}/>
                    ))}
                </Combobox>
                {mappings?
                    <div style={{paddingLeft:"3px",paddingRight:"3px",paddingTop:"3px"}}>
                        <Code language={'javascript'}>
                            {JSON.stringify({mappings:mappings},null,2)}
                        </Code>
                        {!indexStatus.waiting?
                        <><TextInput label="Save Index Name" value={searchIndex} onChange={(e)=>setSearchIndex(e.target.value)}></TextInput>
                        <br/>
                        <Button onClick={saveIndex}>Save</Button>
                        </>:<></>
                        }
                    </div>
                    :<></>
                }
                {createIndexResponse?
                    <div style={{paddingTop:"3px"}}>
                    {createError?<Banner variant="danger">{createIndexResponse}</Banner>
                    :<Banner>Successfully created search index {createIndexResponse}</Banner>}
                    </div>
                    :<></>
                }
                {indexStatus.waiting?
                    <Spinner description="Waiting for index to build..."></Spinner>:<></>
                }
                {indexStatus.ready?
                    <div style={{paddingTop:"3px"}}>
                        {indexStatus.error?
                            <Banner variant="danger">{indexStatus.error}</Banner>
                            :<Banner>Index is ready. Go to 'Query Tuner' tab to build queries.</Banner>
                        }
                    </div>
                    :<></>
                }
            </Modal>:<></>
            }
            
            
            </>:<>{error? <Banner variant="danger">{JSON.stringify(error)}</Banner>:<></>}</>
            }
            </>
        }
        </>
    )
}

function getSchema(conn) {
    return new Promise((resolve,reject) => {
      axios.post(`api/post/atlas-search/index/schema?`,{connection:conn})
        .then(response => resolve(response))
        .catch((error) => reject(error.response.data))
    });
  }

function postIndexMappings(mappings,searchIndex,connection){
    return new Promise((resolve,reject)=>{
        axios.post(
            'api/post/atlas-search/index/create',
            {
                name:searchIndex,
                mappings:mappings,
                connection:connection
            }
        ).then(response => resolve(response))
        .catch((error) => {
          reject(error.response.data);
        })
    })
}

function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function postIndexStatus(connection,searchIndex){
    var done = false;
    var response;
    while(!done){
        try{
            response = await axios.post('api/post/atlas-search/index/status',{connection:connection,index:searchIndex});
            const status = response.data.status;
            console.log(status)
            if(status == "READY" || status == "STALE"){
                done = true;
            }else if(status == "FAILED"){
                throw new Error(`Search index '${connection.database}.${connection.collection}:${searchIndex}' failed to build`,{cause:"SearchIndexStatusFailed"})
            }
        }catch(error){
            throw error
        }
        await wait(5000)
    }
}

function searchRequest(fields,type,searchIndex,conn) {
    return new Promise((resolve) => {
        axios.post(`api/post/atlas-search/query`,
            { fields : fields, connection: conn, type:type, index:searchIndex},
            { headers : 'Content-Type: application/json'}
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

export default SearchTutorial;