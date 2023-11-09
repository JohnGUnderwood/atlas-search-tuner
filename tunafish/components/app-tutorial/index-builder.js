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


function IndexBuilder({deployIndex, indexBuilder, userSelection, setUserSelection}){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const suggestedFields = indexBuilder.suggestedFields;
    const mappings = indexBuilder.mappings;

    const openModal = (content) => {
        setModalContent(content);
        setOpen(!open);
    }
    
    const handleFieldToggle = (type,paths) => {
        const selection = suggestedFields[type].filter((field)=>paths.includes(field.path));
        console.log(selection);
        setUserSelection({
            ...userSelection,
            fields:{
                ...userSelection.fields,
                [type]:selection
            }
        });
        // setSelectedFields({...selectedFields,[type]:selection});
        // setMappings(buildSearchIndex(selectedFields))
    }

    // useEffect(()=>{
    //     if(indexBuilder.selectedFields){
    //         console.log("use effect fields",selectedFields);
    //         setMappings(buildSearchIndex(selectedFields));
    //     }
    // },[selectedFields]);

    return (
        
        <>
        {suggestedFields?
            <div style={{
                display: "grid",
                gridTemplateColumns: "60% 40%",
                gap: "10px",
                paddingTop:"10px"
                }}>
                <div>
                    <Card style={{minHeight:"1px"}}><SearchBar openModal={openModal} autocompleteFields={suggestedFields.autocomplete}/></Card>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "40% 60%",
                        gap: "10px",
                        marginTop:"10px"
                        }}>
                        <Facets openModal={openModal} facetFields={suggestedFields.facet}></Facets>
                        <Results openModal={openModal} textFields={suggestedFields.text}></Results>
                    </div>
                </div>
                {mappings?
                    <Card style={{marginRight:"10px"}}>
                        <div style={{height:"100%"}}>
                            <Code language={'javascript'}>
                                {JSON.stringify({mappings:mappings},null,2)}
                            </Code>
                            <br/>
                            <Button onClick={deployIndex}>Deploy</Button>
                        </div>
                    </Card>
                    :<></>
                }
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
                    <Combobox label={"Choose suggested "+modalContent.type+" fields"} size="small" multiselect={true} initialValue={userSelection.fields[modalContent.type].map((field)=>field.path)} onChange={(e)=>handleFieldToggle(modalContent.type,e)}>
                        {modalContent.fields?.map((field) => (
                            <ComboboxOption key={field.path} value={field.path} displayName={field.path}/>
                        ))}
                    </Combobox>
                    <Button style={{marginTop:"10px"}} variant="primary" onClick={()=>setOpen(false)}>Done</Button>
                </Modal>:<></>
            }
            </div>
            :<></>
        }
        </>
        
    )
}

export default IndexBuilder;