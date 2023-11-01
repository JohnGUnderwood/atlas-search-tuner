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
import SearchResultFields from '../fields';


function IndexBuilder({saveIndex, suggestedFields, mappings, setMappings, indexStatus, fields, setFields}){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [createError, setCreateError] = useState(false);
    const [createIndexResponse, setCreateIndexResponse] = useState(null);

    const openModal = (content) => {
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

    useEffect(()=>{
        if(fields){
            console.log("use effect fields",fields);
            setMappings(buildSearchIndex(mappings,fields));
        }
    },[fields]);

    return (
        
        <>
        {/* {error? <Banner variant="danger">{JSON.stringify(error)}</Banner>
            :<>{indexStatus.waiting?
                <div style={{display:"flex", marginLeft:"50%"}}><Spinner displayOption="large-vertical" description={`Waiting for index '${indexName}' to build...`}></Spinner></div>
                :<></>
            }</>
        } */}
        {suggestedFields?
            <>
            <SearchBar openModal={openModal} autocompleteFields={suggestedFields.autocomplete}/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "20% 40% 40%",
                gap: "10px",
                paddingTop:"10px"
                }}>
                <Facets openModal={openModal} facetFields={suggestedFields.facet}></Facets>
                <Results openModal={openModal} textFields={suggestedFields.text}></Results>      
                {mappings?
                    <Card>
                        <div style={{height:"100%"}}>
                            <Code language={'javascript'} style={{height:"80%"}}>
                                {JSON.stringify({mappings:mappings},null,2)}
                            </Code>
                            <br/>
                            <Button onClick={saveIndex}>Deploy</Button>
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
                    <Button style={{marginTop:"10px"}} variant="primary" onClick={()=>{setOpen(false),setMappings(buildSearchIndex(mappings,fields));}}>Done</Button>
                </Modal>:<></>
            }
            </>
            :<></>
        }
        </>
        
    )
}

export default IndexBuilder;