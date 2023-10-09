import { useState, useEffect } from 'react';
import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";
import Modal from '@leafygreen-ui/modal';
import { Subtitle, Body, Link } from '@leafygreen-ui/typography';

function SearchTutorial(){
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState({title:"",content:""});

    const openModal = (content) => {
        setModalContent(content);
        setOpen(!open);
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
                <Facets openModal={openModal}></Facets>
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
            </Modal>
            
        </>
    )
}

export default SearchTutorial;