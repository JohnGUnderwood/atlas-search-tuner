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

function SearchTutorial({schema,connection}){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState({title:"",content:""});
    const [suggestedFields, setSuggestedFields] = useState({});
    const [fields, setFields] = useState(null);
    const [mappings, setMappings] = useState(null);
    const [indexName, setIndexName] = useState(null);
 
    const openModal = (content) => {
        setModalContent(content);
        setOpen(!open);
    }

    useEffect(()=>{
        const facets = getFacetCandidates(schema)
        const newSuggestFields = {
            ...suggestedFields,
            'facet':facets
        }
        setSuggestedFields(newSuggestFields);
        if(fields){setMappings(buildSearchIndex(fields))};
    },[schema,fields])
    
    const handleFieldToggle = (type,paths) => {
        const fields = suggestedFields[type].filter((field)=>paths.includes(field.path))
        setFields({[type]:fields});
    }

    const saveIndex = () => {
        postIndexMappings(indexName,mappings,connection)
            .then(resp=>console.log(resp))
            .catch(err=>console.log(err))
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
                    {modalContent.links?.map((link) => <Link href={link.url}>{link.label}</Link>)}
                </Body>
                <hr/>
                <Combobox label={"Choose suggested "+modalContent.type+" fields"} size="small" multiselect={true} onChange={(e)=>handleFieldToggle(modalContent.type,e)}>
                    {modalContent.fields?.map((field) => (
                        <ComboboxOption key={field.path} value={field.path} displayName={field.path}/>
                    ))}
                </Combobox>
                {mappings?
                    <p style={{paddingLeft:"3px",paddingRight:"3px"}}>
                        <Code language={'javascript'}>
                            {JSON.stringify({mappings:mappings},null,2)}
                        </Code>
                        <TextInput label="Save Index Name" value={indexName} onChange={(e)=>setIndexName(e.target.value)}></TextInput>
                        <br/>
                        <Button onClick={saveIndex}>Save</Button>
                    </p>
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

function postIndexMappings(name,mappings,connection){
    return new Promise((resolve,reject)=>{
        axios.post(
            'api/search/index/mappings',
            {
                name:name,
                mappings:mappings,
                connection:connection
            }
        ).then(response => resolve(response))
        .catch((error) => {
          reject(error.response.data);
        })
    })
}

export default SearchTutorial;