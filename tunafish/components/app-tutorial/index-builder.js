import { useState, useEffect } from 'react';
import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";
import Modal from '@leafygreen-ui/modal';
import { Subtitle, Body, Link, Description } from '@leafygreen-ui/typography';
import { getCandidates } from '../../functions/schema';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import Code from '@leafygreen-ui/code';
import TextInput from '@leafygreen-ui/text-input';
import Button from '@leafygreen-ui/button';
import axios from 'axios';
import Banner from '@leafygreen-ui/banner';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import { buildSearchIndex } from '../../functions/index-definition'
import Card from '@leafygreen-ui/card';

function IndexBuilder({suggestedFields, mappings, setMappings, indexStatus, setIndexStatus, fields, setFields}){
    //Fetching data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    // const [suggestedFields, setSuggestedFields] = useState({facet:null,text:null,autocomplete:null});
    // const [mappings, setMappings] = useState(null);
    const [createError, setCreateError] = useState(false);
    const [createIndexResponse, setCreateIndexResponse] = useState(null);

    useEffect(()=>{
        if(indexStatus.ready){
            searchMeta(fields);
            searchText(fields);
        }
        // if(indexName){
        //     fetchIndex(connection,indexName).then(resp => {
        //         console.log(`search index ${indexName}`,resp.data);
        //         if(resp.data){
        //             setMappings(resp.data.mappings);
        //         }else{
        //             setMappings({fields:{}})
        //         }
                
        //     });
        // }
    },[indexStatus.ready])

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
        setMappings(buildSearchIndex(mappings,newFields))
    }

    const saveIndex = () => {
        setIndexStatus({name:indexName,waiting:false,ready:false,error:null,results:{facets:null,text:null}});
        postIndexMappings(mappings,indexName,connection)
            .then(resp=> {
                setCreateError(false);
                setCreateIndexResponse(resp.data);
                getIndexStatus(indexName);
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
        pollIndexStatus(connection,name).then(resp => {
            setIndexStatus({name:name,waiting:false,ready:true,error:null,results:{facets:null,text:null}})
        }).catch(err => {setIndexStatus({name:name,waiting:false,ready:true,error:err,results:{facets:null,text:null}})})
    }

    return (
        
        <>
        {error? <Banner variant="danger">{JSON.stringify(error)}</Banner>
            :<>{indexStatus.waiting?
                <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description={`Waiting for index '${indexStatus.name}' to build...`}></Spinner></div>
                :<></>
            }</>
        }
        {suggestedFields?
            <>
            <SearchBar openModal={openModal} autocompleteFields={suggestedFields.autocomplete}/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "20% 40% 40%",
                gap: "10px",
                paddingTop:"10px"
                }}>
                <Facets openModal={openModal} facets={indexStatus.results.facets} facetFields={suggestedFields.facet}></Facets>
                <Results openModal={openModal} results={indexStatus.results.text} textFields={suggestedFields.text}></Results>      
                {mappings?
                    <Card>
                        <div style={{height:"100%"}}>
                            <Code language={'javascript'} style={{height:"80%"}}>
                                {JSON.stringify({mappings:mappings},null,2)}
                            </Code>
                            <><TextInput label="Deploy Index" placeholder="Create a unique name for your search index" value={indexName} onChange={(e)=>setindexName(e.target.value)}></TextInput>
                            <br/>
                            <Button onClick={saveIndex}>Deploy</Button>
                            </>:<></>
                        </div>
                    </Card>
                    :<></>
                }
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
                    <Button style={{marginTop:"10px"}} variant="primary" onClick={()=>setOpen(false)}>Done</Button>
                </Modal>:<></>
            }
            </>
            :<></>
        }
        </>
        
    )
}

function postIndexMappings(mappings,indexName,connection){
    return new Promise((resolve,reject)=>{
        axios.post(
            'api/post/atlas-search/index/create',
            {
                name:indexName,
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

async function pollIndexStatus(connection,name){
    var done = false;
    var response;
    while(!done){
        try{
            response = await axios.post('api/post/atlas-search/index/status',{connection:connection,name:name});
            const status = response.data.status;
            console.log(status)
            if(status == "READY" || status == "STALE"){
                done = true;
            }else if(status == "FAILED"){
                throw new Error(`Search index '${connection.database}.${connection.collection}:${name}' failed to build`,{cause:"indexNameStatusFailed"})
            }
        }catch(error){
            throw error
        }
        await wait(5000)
    }
}

function fetchIndex(conn,searchIndex) {
    return new Promise((resolve,reject) => {
        axios.post(`api/post/atlas-search/index/status`,{connection:conn,name:searchIndex})
        .then(response => resolve(response))
        .catch((error) => reject(error.response.data))
    });
}

function searchRequest(fields,type,indexName,conn) {
    return new Promise((resolve) => {
        axios.post(`api/post/atlas-search/query`,
            { fields : fields, connection: conn, type:type, index:indexName},
            { headers : 'Content-Type: application/json'}
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

export default IndexBuilder;