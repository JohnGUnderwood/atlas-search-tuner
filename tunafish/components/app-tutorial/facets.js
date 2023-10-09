import { H3 } from "@leafygreen-ui/typography";
import { palette } from '@leafygreen-ui/palette';
import Tooltip from '@leafygreen-ui/tooltip';

function Facets({openModal}){
    const modalContent = {
        title:"Filtering and Faceting",
        content:`Allow your users to filter their results by category and other attributes.
        Facets have a count for each attribute which is the number of results for that attribute value.
        `,
        links:[{label:"Search facets example",url:"https://www.mongodb.com/docs/atlas/atlas-search/facet/#example"}]
    }

    return (
        <>
        <div onClick={() => openModal(modalContent)} style={{cursor: "pointer"}}>
            <H3>Facets</H3>

            {[...Array(3)].map((e, i) =>
            <div key={i}>

                <Tooltip
                    align="top"
                    justify="start"
                    trigger={<div style={{width:"45%",borderRadius:"5px",backgroundColor:palette.black}}>&nbsp;</div> }
                    triggerEvent="hover"
                    darkMode={true}
                >
                Filter category (e.g. 'country')
                </Tooltip>
            <ul>
            {[...Array(3)].map((e, i) => 
                <>
                    <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "50% 5%",
                    gap: "10px",
                    paddingTop:"10px"}}>
                        <Tooltip
                            align="top"
                            justify="start"
                            trigger={<div style={{borderRadius:"5px", backgroundColor:palette.gray.base}}>&nbsp;</div>}
                            triggerEvent="hover"
                            darkMode={true}
                        >Filter value (e.g. 'USA')</Tooltip>
                        <Tooltip
                            align="top"
                            justify="start"
                            trigger={<div style={{borderRadius:"5px", backgroundColor:palette.blue.light1}}>&nbsp;</div>}
                            triggerEvent="hover"
                            darkMode={true}
                        >Value count (e.g. '253')</Tooltip>
                    </div>
                    <br/>
                </>
            )}
            </ul>
            </div>
            )}
        </div>
      </>
    )
}

export default Facets;