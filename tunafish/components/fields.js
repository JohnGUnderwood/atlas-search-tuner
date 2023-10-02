import {  Body, Label } from '@leafygreen-ui/typography';

function SearchResultFields({doc,parent}){

    const children = Object.keys(doc);

    const score = children.indexOf('score');
    if (score > -1) { // only splice array when item is found
        children.splice(score, 1); // 2nd parameter means remove one item only
    }

    return (
        children.map(child=>(
            <>
            {typeof doc[child] === 'object'?
                Array.isArray(doc[child]) ?
                    <Label>
                        {child}
                        {doc[child].reduce((display, item, index)=>{
                        if(index < 4){
                            display.push(<Body>{item}</Body>)
                        }else if(index == 5){
                            display.push(<Body>{item} ... ({doc[child].length-5} more)</Body>)
                        } 
                        return display
                        },[])}
                    </Label>
                    :
                    <SearchResultFields doc={doc[child]} parent={parent? parent+"."+child : child}></SearchResultFields>
                :
                <Label>{parent? parent+"."+child : child}<Body>{doc[child]}</Body></Label>
            }
            </>
        ))
    )

}

export default SearchResultFields;