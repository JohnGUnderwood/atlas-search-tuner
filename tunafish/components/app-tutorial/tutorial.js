import { useState, useEffect } from 'react';
import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";
import Modal from '@leafygreen-ui/modal';
import { Subtitle, Body, Link, InlineCode } from '@leafygreen-ui/typography';
import { getFacetCandidates } from '../../functions/schema';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import Code from '@leafygreen-ui/code';
import TextInput from '@leafygreen-ui/text-input';
import Button from '@leafygreen-ui/button';
import axios from 'axios';
import Banner from '@leafygreen-ui/banner';
import { Spinner } from '@leafygreen-ui/loading-indicator';

function SearchTutorial({schema,connection,handleConnectionChange}){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState({title:"",content:""});
    const [suggestedFields, setSuggestedFields] = useState({});
    const [fields, setFields] = useState(null);
    const [mappings, setMappings] = useState(null);
    const [createError, setCreateError] = useState(false);
    const [createIndexResponse, setCreateIndexResponse] = useState(null);
    const [indexStatus, setIndexStatus] = useState({waiting:false,ready:false,error:null});
    const [results, setResults] = useState(null)

    const openModal = (content) => {
        setModalContent(content);
        setOpen(!open);
    }

    useEffect(()=>{
        const facetCandidates = getFacetCandidates(schema)
        const newSuggestFields = {
            ...suggestedFields,
            'facet':facetCandidates
        }
        setSuggestedFields(newSuggestFields);
        if(fields){
            setMappings(buildSearchIndex(fields))
        };

        if(indexStatus.ready){
            search(fields);
        }

    },[schema,fields,indexStatus.ready])
    
    const handleFieldToggle = (type,paths) => {
        const fields = suggestedFields[type].filter((field)=>paths.includes(field.path))
        setFields({[type]:fields});
    }

    const saveIndex = () => {
        setIndexStatus({waiting:false,ready:false,error:null});
        postIndexMappings(mappings,connection)
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

    const search = (fields) => {
        searchRequest(fields,connection)
            .then(resp => setResults(resp))
            .catch(err => console.log(err));
    }

    const getIndexStatus = () => {
        setIndexStatus({waiting:true,ready:false,error:null})
        postIndexStatus(connection).then(resp => {
            setIndexStatus({waiting:false,ready:true,error:null})
        }).catch(err => {setIndexStatus({waiting:false,ready:true,error:err})})
    }

    return (
        <>
            <SearchBar/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "25% 65%",
                gap: "10px",
                paddingTop:"10px"
            }}>
                {suggestedFields.facet?<Facets openModal={openModal} facets={suggestedFields.facet}></Facets>:<></>}
                <Results openModal={openModal}></Results>
            </div>
            <Modal open={open} setOpen={setOpen}>
                <Subtitle>{modalContent.title}</Subtitle>
                <Body>
                    {modalContent.content}
                </Body>
                <Body>
                    {modalContent.links?.map((link) => <Link key={link.url} href={link.url}>{link.label}</Link>)}
                </Body>
                <hr/>
                <Combobox label={"Choose suggested "+modalContent.type+" fields"} size="small" multiselect={true} onChange={(e)=>handleFieldToggle(modalContent.type,e)}>
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
                        <><TextInput label="Save Index Name" value={connection.searchIndex} onChange={(e)=>handleConnectionChange('searchIndex',e.target.value)}></TextInput>
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
                            :<Banner>Index is ready. Re-submit connection to load new index.</Banner>
                        }
                    </div>
                    :<></>
                }
            </Modal>
            
        </>
    )
}

function buildSearchIndex(fields){
    // ######### Helpful Comment ########
    //fields should be an object with keys containing array of fields with their types:
    // {
    //     facet/search/autocomplete: 
    //      [
    //         {
    //             path: <full path to field>
    //             types: [String/Number/Date/etc..]
    //         }
    //      ]
    // }
    // ######### Helpful Comment ########

    var mappings = {fields:{}}
    mappings.dynamic = true;

    fields.facet.forEach((field) => {
        if(field.types.includes('String')){
            const mapping = [
                {type:'stringFacet'},
                {type:'string',analyzer:"lucene.keyword",indexOptions:"docs",norms:"omit"}
            ]
            mappings.fields[field.path] = mapping
        }else if(field.types.includes('Number')){
            const mapping = [
                {type:'numberFacet'},
                {type:'number'}
            ]
            mappings.fields[field.path] = mapping
        }
    })

    return mappings;
}

function postIndexMappings(mappings,connection){
    return new Promise((resolve,reject)=>{
        axios.post(
            'api/post/atlas-search/index/create',
            {
                name:connection.searchIndex,
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

async function postIndexStatus(connection){
    var done = false;
    var response;
    while(!done){
        try{
            response = await axios.post('api/post/atlas-search/index/status',{connection:connection});
            const status = response.data.status;
            console.log(status)
            if(status == "READY" || status == "STALE"){
                done = true;
            }else if(status == "FAILED"){
                throw new Error(`Search index '${connection.database}.${connection.collection}:${connection.searchIndex}' failed to build`,{cause:"SearchIndexStatusFailed"})
            }
        }catch(error){
            throw error
        }
        await wait(5000)
    }
}

function searchRequest(fields, conn) {
    return new Promise((resolve) => {
        axios.post(`api/post/atlas-search/query`,
            { fields : fields, connection: conn},
            { headers : 'Content-Type: application/json'}
        ).then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

export default SearchTutorial;