import { useState, useEffect } from 'react';
import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";
import Modal from '@leafygreen-ui/modal';
import { Subtitle, Body, Link } from '@leafygreen-ui/typography';
import { getFacetCandidates } from '../../functions/schema';

function SearchTutorial({schema}){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState({title:"",content:""});
    const [facets, setFacets] = useState(null);

    const openModal = (content) => {
        setModalContent(content);
        setOpen(!open);
    }

    useEffect(()=>{
        setFacets(getFacetCandidates(schema));
    },[schema])
    

    return (
        <>
            <SearchBar/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "25% 65%",
                gap: "10px",
                paddingTop:"10px"
            }}>
                {facets?<Facets openModal={openModal} facets={facets}></Facets>:<></>}
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
                <Body>
                    <Subtitle>Suggested fields to use as {modalContent.label}</Subtitle>
                    {modalContent.fields?.map((field) => <p key={field.path}>{field.path}</p>)}
                </Body>
            </Modal>
            
        </>
    )
}

export default SearchTutorial;