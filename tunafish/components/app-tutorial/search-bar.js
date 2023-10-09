import { SearchInput } from "@leafygreen-ui/search-input"

function SearchBar(){
    return (
        <div style={{paddingTop:"10px", display:"flex", justifyContent:"center"}}>
            <div style={{width:"70%"}}><SearchInput onChange="" aria-label="some label"></SearchInput></div>
        </div>
    )
}
export default SearchBar;
