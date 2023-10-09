import { SearchInput } from "@leafygreen-ui/search-input"

function SearchBar(){
    return (
        <div style={{paddingTop:"10px", display:"flex", justifyContent:"center"}}>
            <SearchInput onChange="" aria-label="some label"></SearchInput>
        </div>
    )
}
export default SearchBar;
