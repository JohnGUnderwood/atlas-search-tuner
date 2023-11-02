import { useState, useEffect } from 'react';
import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";
import Modal from '@leafygreen-ui/modal';
import { Subtitle, Body, Link, Description } from '@leafygreen-ui/typography';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import Code from '@leafygreen-ui/code';
import Button from '@leafygreen-ui/button';
import { buildSearchIndex } from '../../functions/index-definition'
import Card from '@leafygreen-ui/card';


function IndexBuilder({saveIndex, suggestedFields, mappings, setMappings, selectedFields, setSelectedFields}){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const openModal = (content) => {
        setModalContent(content);
        setOpen(!open);
    }
    
    const handleFieldToggle = (type,paths) => {
        const selection = suggestedFields[type].filter((field)=>paths.includes(field.path));
        setSelectedFields({...selectedFields,[type]:selection});
        setMappings(buildSearchIndex(selectedFields))
    }

    useEffect(()=>{
        if(selectedFields){
            console.log("use effect fields",selectedFields);
            setMappings(buildSearchIndex(selectedFields));
        }
    },[selectedFields]);

    return (
        
        <>
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
                    <Combobox label={"Choose suggested "+modalContent.type+" fields"} size="small" multiselect={true} initialValue={selectedFields[modalContent.type].map((field)=>field.path)} onChange={(e)=>handleFieldToggle(modalContent.type,e)}>
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

export default IndexBuilder;