import { SearchInput } from "@leafygreen-ui/search-input"
import Button from '@leafygreen-ui/button';
import Icon from "@leafygreen-ui/icon";

function SearchBar({openModal,autocompleteFields}){
    const modalContent = {
        title:"Search as you type",
        content:`You may want to present results or suggestions instantly as the user types.
        To implement this you can enable partial matching using the 'autocomplete' field type.
        `,
        links:[
            {label:"Autocomplete search operator",url:"https://www.mongodb.com/docs/atlas/atlas-search/autocomplete/"},
            {label:"Indexing fields for autocomplete",url:"https://www.mongodb.com/docs/atlas/atlas-search/field-types/autocomplete-type/#std-label-bson-data-types-autocomplete"}
        ],
        fields:autocompleteFields,
        type:"autocomplete"
    }
    return (
        <span style={{display:"grid",gridTemplateColumns:"70% 110px", alignItems:"center", marginLeft:"15%"}}><SearchInput style={{marginRight:"5px"}} size="small" onChange="" aria-label="some label"></SearchInput><Button size="xsmall" leftGlyph={<Icon glyph='Wrench'/>} variant="default" onClick={() => openModal(modalContent)} >CONFIGURE</Button></span>
    )
}
export default SearchBar;
