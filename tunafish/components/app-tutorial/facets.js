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
                [...Array(2)].map((e, i) => (
                    <div key={i}>

                        <Tooltip key={`tt.${i}`}
                            align="top"
                            justify="start"
                            trigger={<div style={{width:"45%",borderRadius:"5px",backgroundColor:palette.black}}>&nbsp;</div> }
                            triggerEvent="hover"
                            darkMode={true}
                        >
                        Filter category (e.g. 'country')
                        </Tooltip>
                    
                    {[...Array(3)].map((e, j) => 
                        <>
                            <div key={`${i}.${j}`} style={{
                            display: "grid",
                            gridTemplateColumns: "50% 5%",
                            gap: "10px",
                            paddingTop:"10px",
                            marginBottom:"15px"}}>
                                <Tooltip key={`tt.${i}.${j}`}
                                    align="top"
                                    justify="start"
                                    trigger={<div style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>}
                                    triggerEvent="hover"
                                    darkMode={true}
                                >Filter value (e.g. 'USA')</Tooltip>
                                <Tooltip key={`tt.c.${i}.${j}`}
                                    align="top"
                                    justify="start"
                                    trigger={<div style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>}
                                    triggerEvent="hover"
                                    darkMode={true}
                                >Value count (e.g. '253')</Tooltip>
                            </div>
                        </>
                    )}
                    </div>
                ))
                :<></>}
        </Card>
    )
}

export default Facets;