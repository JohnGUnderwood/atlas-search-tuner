import SearchBar from "./search-bar";
import Facets from "./facets";
import Results from "./results";

function SearchTutorial(){
    return (
        <div>
            <SearchBar/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "30% 70%",
                gap: "10px",
                paddingTop:"10px"
            }}>
                <Facets></Facets>
                <Results></Results>
            </div>
            
        </div>
    )
}

export default SearchTutorial;