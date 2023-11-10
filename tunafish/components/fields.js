import {  Body, Label } from '@leafygreen-ui/typography';

function SearchResultFields({doc,parent}){

    const children = Object.keys(doc);

    const score = children.indexOf('score');
    if (score > -1) { // only splice array when item is found
        children.splice(score, 1); // 2nd parameter means remove one item only
    }

    return (
        children.map((child,index)=>(
            <>
            {typeof doc[child] === 'object'?
                Array.isArray(doc[child]) ?
                    <Label key={`${parent}${index}`}>
                        {child}
                        {doc[child].reduce((display, item, index)=>{
                            if(typeof item === 'object'){
                                if(index < 4){
                                    display.push(<Body key={`${parent}${child}${index}`}>{JSON.stringify(item)}</Body>)
                                }else if(index == 5){
                                    display.push(<Body key={`${parent}${child}${index}`}>{JSON.stringify(item)} ... ({doc[child].length-5} more)</Body>)
                                } 
                                return display
                            }else{
                                if(index < 4){
                                    display.push(<Body key={item}>{item}</Body>)
                                }else if(index == 5){
                                    display.push(<Body key={item}>{item} ... ({doc[child].length-5} more)</Body>)
                                } 
                                return display
                            }
                        },[])}
                    </Label>
                :
                <SearchResultFields key={`${parent}${child}${index}`} doc={doc[child]} parent={parent? parent+"."+child : child}></SearchResultFields>
            :
            <Label key={`${parent}${index}-label`}>{parent? parent+"."+child : child}<Body key={`${parent}${index}-body`}>{doc[child]}</Body></Label>
            }
            </>
        ))
    )

}

export default SearchResultFields;