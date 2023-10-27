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

function IndexBuilder({connection, indexName, schema, setSchema, indexStatus, setIndexStatus, fields, setFields}){
    //Fetching data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [suggestedFields, setSuggestedFields] = useState({facet:null,text:null,autocomplete:null});
    const [mappings, setMappings] = useState(null);
    const [createError, setCreateError] = useState(false);
    const [createIndexResponse, setCreateIndexResponse] = useState(null);

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
        setIndexStatus({name:searchIndex,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
        postIndexMappings(mappings,searchIndex,connection)
            .then(resp=> {
                setCreateError(false);
                setCreateIndexResponse(resp.data);
                getIndexStatus(searchIndex);
            })
            .catch(err=> {
                setCreateError(true);
                setCreateIndexResponse(err);
            })
    }

    const searchMeta = (fields) => {
        searchRequest(fields,'facet',indexStatus.name,connection)
            .then(resp => {
                const newStatus = indexStatus
                newStatus.results.facets = resp.data.facet
                console.log(newStatus);
                setIndexStatus(newStatus);
                setOpen(false);
            })
            .catch(err => console.log(err));
    }

    const searchText = (fields) => {
        searchRequest(fields,'text',indexStatus.name,connection)
            .then(resp => {
                const newStatus = indexStatus
                newStatus.results.text = resp.data
                console.log(newStatus);
                setIndexStatus(newStatus);
                setOpen(false);
            })
            .catch(err => console.log(err));
    }

    const getIndexStatus = (name) => {
        setIndexStatus({name:name,waiting:true,ready:false,error:null,results:{facets:null,text:null}})
        postIndexStatus(connection,name).then(resp => {
            setIndexStatus({name:name,waiting:false,ready:true,error:null,results:{facets:null,text:null}})
        }).catch(err => {setIndexStatus({name:name,waiting:false,ready:true,error:err,results:{facets:null,text:null}})})
    }

    return (
        <>
        {loading? <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description="Analyzing schema..."></Spinner></div> :
            <>
            {(schema && !indexStatus.waiting)? <>
            <SearchBar openModal={openModal} autocompleteFields={suggestedFields.autocomplete}/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "25% 65%",
                gap: "10px",
                paddingTop:"10px"
            }}>
                {indexStatus.results.facets?
                    <div>
                        <H3>Facets</H3>
                        {Object.keys(indexStatus.results.facets).map(facet => (
                            <div style={{paddingLeft:"10px"}}>
                            <Subtitle key={facet}>{facet}</Subtitle>
                            {indexStatus.results.facets[facet].buckets.map(bucket => (
                                <Description key={bucket._id} style={{paddingLeft:"15px"}}><span style={{paddingRight:"5px"}}>{bucket._id}</span><span>({bucket.count})</span></Description>
                            ))}<br/></div>
                        ))}
                    </div>
                    :<></>
                }
                {(!indexStatus.results.facets && suggestedFields.facet)?<Facets openModal={openModal} facetFields={suggestedFields.facet}></Facets>:<></>}
                {indexStatus.results.text?
                    <div>
                        <H3>Search Results</H3>
                        {indexStatus.results.text.map(result =>(
                            <Card key={result._id} style={{marginBottom:"20px"}}>
                                <SearchResultFields key={`${result._id}_fields`} doc={result}></SearchResultFields>
                            </Card>
                        ))}
                    </div>
                    :<></>
                }
                {(!indexStatus.results.text && suggestedFields.text)?<Results openModal={openModal} textFields={suggestedFields.text}></Results>:<></>}
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
                        <><TextInput label="Deploy Index" placeholder="Create a unique name for your search index" value={searchIndex} onChange={(e)=>setSearchIndex(e.target.value)}></TextInput>
                        <br/>
                        <Button onClick={saveIndex}>Deploy</Button>
                        </>:<></>
                        }
                    </div>
                    :<></>
                }
                {createIndexResponse?
                    <div style={{paddingTop:"3px"}}>
                    {createError?<Banner variant="danger">{createIndexResponse}</Banner>
                    :<Banner>Saved search index {createIndexResponse}</Banner>}
                    </div>
                    :<></>
                }
            </Modal>:<></>
            }
            </>:<>{error? <Banner variant="danger">{JSON.stringify(error)}</Banner>
                :<>{indexStatus.waiting?
                    <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description={`Waiting for index '${indexStatus.name}' to build...`}></Spinner></div>
                    :<></>
                }</>
            }</>
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

async function postIndexStatus(connection,name){
    var done = false;
    var response;
    while(!done){
        try{
            response = await axios.post('api/post/atlas-search/index/status',{connection:connection,index:name});
            const status = response.data.status;
            console.log(status)
            if(status == "READY" || status == "STALE"){
                done = true;
            }else if(status == "FAILED"){
                throw new Error(`Search index '${connection.database}.${connection.collection}:${name}' failed to build`,{cause:"SearchIndexStatusFailed"})
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

export default IndexBuilder;