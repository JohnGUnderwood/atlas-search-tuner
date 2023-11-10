import { Subtitle, Description } from "@leafygreen-ui/typography";
import Card from "@leafygreen-ui/card";
import { palette } from '@leafygreen-ui/palette';
import Tooltip from '@leafygreen-ui/tooltip';
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";

function Facets({openModal,facetFields}){
    const modalContent = {
        title:"Filtering and Faceting",
        content:`Allow your users to filter their results by category and other attributes.
        Facets have a count for each attribute which is the number of results for that attribute value.
        `,
        links:[{label:"Search facets example",url:"https://www.mongodb.com/docs/atlas/atlas-search/facet/#example"}],
        fields:facetFields,
        type:"facet"
    }

    return (
        <Card>
            <span style={{display:"grid",gridTemplateColumns:"40% 110px", alignItems:"end", marginBottom:"10px"}}><Subtitle>Facets</Subtitle><Button size="xsmall" leftGlyph={<Icon glyph='Wrench'/>} variant="default" onClick={() => openModal(modalContent)} >CONFIGURE</Button></span>
            
                
            {facetFields?
                <>
                <div key="0">
                    <div key="facet0" style={{width:"45%",borderRadius:"5px",backgroundColor:palette.black}}>&nbsp;</div>
                    <div key="bucket0" style={{
                        display: "grid",
                        gridTemplateColumns: "50% 5%",
                        gap: "10px",
                        paddingTop:"10px",
                        marginBottom:"15px"}}>
                        <div key="val0" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>
                        <div key="count0" style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>
                    </div>
                    <div key="bucket1" style={{
                        display: "grid",
                        gridTemplateColumns: "50% 5%",
                        gap: "10px",
                        paddingTop:"10px",
                        marginBottom:"15px"}}>
                        <div key="val1" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>
                        <div key="count1" style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>
                    </div>
                    <div key="bucket2" style={{
                        display: "grid",
                        gridTemplateColumns: "50% 5%",
                        gap: "10px",
                        paddingTop:"10px",
                        marginBottom:"15px"}}>
                        <div key="val2" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>
                        <div key="count2" style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>
                    </div>
                </div>
                <div key="1">
                    <div key="facet1" style={{width:"45%",borderRadius:"5px",backgroundColor:palette.black}}>&nbsp;</div>
                    <div key="bucket3" style={{
                        display: "grid",
                        gridTemplateColumns: "50% 5%",
                        gap: "10px",
                        paddingTop:"10px",
                        marginBottom:"15px"}}>
                        <div key="val3" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>
                        <div key="count3" style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>
                    </div>
                    <div key="bucket4" style={{
                        display: "grid",
                        gridTemplateColumns: "50% 5%",
                        gap: "10px",
                        paddingTop:"10px",
                        marginBottom:"15px"}}>
                        <div key="val4" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>
                        <div key="count4" style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>
                    </div>
                    <div key="bucket5" style={{
                        display: "grid",
                        gridTemplateColumns: "50% 5%",
                        gap: "10px",
                        paddingTop:"10px",
                        marginBottom:"15px"}}>
                        <div key="val5" style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>
                        <div key="count5" style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>
                    </div>
                </div>
                </>
                :<></>
            }
        </Card>
    )
}

export default Facets;