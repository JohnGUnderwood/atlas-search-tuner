import { SearchInput } from "@leafygreen-ui/search-input"

function SearchBar({openModal,autocompleteFields}){
    const modalContent = {
        title:"Search as you type",
        content:`You may want to present results or suggestions instantly as the user types.
        To implement this you can enable partial matching using the 'autocomplete' field type.
        `,
        links:[
            {label:"Autocomplete search operatior",url:"https://www.mongodb.com/docs/atlas/atlas-search/autocomplete/"},
            {label:"Indexing fields for autocomplete",url:"https://www.mongodb.com/docs/atlas/atlas-search/field-types/autocomplete-type/#std-label-bson-data-types-autocomplete"}
        ],
        fields:autocompleteFields,
        type:"autocomplete"
    }
    return (
        <div onClick={() => openModal(modalContent)} style={{cursor: "pointer", paddingTop:"10px", display:"flex", justifyContent:"center"}}>
            <div style={{width:"70%"}}><SearchInput onChange="" aria-label="some label"></SearchInput></div>
        </div>
    )
}
export default SearchBar;
