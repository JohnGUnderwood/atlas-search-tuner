import { Subtitle } from "@leafygreen-ui/typography";
import Card from "@leafygreen-ui/card";
import { palette } from '@leafygreen-ui/palette';
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";

function Results({openModal,textFields}){
    const modalContent = {
        title:"Set query path",
        content:`Your users will want to search within specific attributes/fields.
        When you configure your search index and queries you will specify how document fields should be treated.
        `,
        links:[
            {label:"Define field mappings",url:"https://www.mongodb.com/docs/atlas/atlas-search/define-field-mappings/"},
            {label:"Search query path",url:"https://www.mongodb.com/docs/atlas/atlas-search/text/#syntax"},
        ],
        fields:textFields,
        type:"text"
    }

    return (
        <Card style={{marginRight:"10px"}}>
            <span style={{display:"grid",gridTemplateColumns:"40% 110px", alignItems:"end", marginBottom:"10px"}}><Subtitle>Search Results</Subtitle><Button size="xsmall" leftGlyph={<Icon glyph='Wrench'/>} variant="default" onClick={() => openModal(modalContent)} >CONFIGURE</Button></span>
            {textFields?
                <>
                <Card key="result0" style={{marginBottom:"20px"}}>
                    <Subtitle key="title0" style={{width:"65%",borderRadius:"5px",backgroundColor:palette.black,marginBottom:"15px"}}>&nbsp;</Subtitle>
                    <div key="desc0" weight="regular" as="div">
                        <p key="desc00" style={{borderRadius:"5px", backgroundColor:palette.gray.base, width:"80%"}}>&nbsp;</p>
                        <p key="desc01" style={{borderRadius:"5px", backgroundColor:palette.gray.base, width:"80%"}}>&nbsp;</p>
                    </div>
                    <p key="field0" style={{
                    display: "grid",
                    gridTemplateColumns: "15% 30%",
                    gap: "10px",
                    paddingTop:"10px"}}>
                        <span key="val0" style={{borderRadius:"5px", backgroundColor:palette.black}}>&nbsp;</span>
                        <span key="val1" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</span>
                    </p>
                    <p key="field1" style={{
                    display: "grid",
                    gridTemplateColumns: "15% 30%",
                    gap: "10px",
                    paddingTop:"10px"}}>
                        <span key="val2" style={{borderRadius:"5px", backgroundColor:palette.black}}>&nbsp;</span>
                        <span key="val3" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</span>
                    </p>
                </Card>
                <Card key="result1" style={{marginBottom:"20px"}}>
                    <Subtitle key="title1" style={{width:"65%",borderRadius:"5px",backgroundColor:palette.black,marginBottom:"15px"}}>&nbsp;</Subtitle>
                    <div key="desc1" weight="regular" as="div">
                        <p key="desc10" style={{borderRadius:"5px", backgroundColor:palette.gray.base, width:"80%"}}>&nbsp;</p>
                        <p key="desc11" style={{borderRadius:"5px", backgroundColor:palette.gray.base, width:"80%"}}>&nbsp;</p>
                    </div>
                    <p key="field2" style={{
                    display: "grid",
                    gridTemplateColumns: "15% 30%",
                    gap: "10px",
                    paddingTop:"10px"}}>
                        <span key="val4" style={{borderRadius:"5px", backgroundColor:palette.black}}>&nbsp;</span>
                        <span key="val5" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</span>
                    </p>
                    <p key="field3" style={{
                    display: "grid",
                    gridTemplateColumns: "15% 30%",
                    gap: "10px",
                    paddingTop:"10px"}}>
                        <span key="val6" style={{borderRadius:"5px", backgroundColor:palette.black}}>&nbsp;</span>
                        <span key="val7" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</span>
                    </p>
                </Card>
                </>
                :<></>
            }
            
        </Card>
    )
}

export default Results;