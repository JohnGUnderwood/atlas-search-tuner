import { Combobox, ComboboxOption, ComboboxGroup } from '@leafygreen-ui/combobox';
import Button from '@leafygreen-ui/button';
import TextInput from '@leafygreen-ui/text-input';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Icon from '@leafygreen-ui/icon';
import { H3 } from '@leafygreen-ui/typography';

export default function IndexSelector({setConfigure,indexes,indexName,setIndexName}){
    const [createNew, setCreateNew] = useState(false);
    const [name, setName] = useState(indexName);

    const handleNameInput = (input) => {
        setName(input);
    };
    
    return (
        <>
        {(indexes && !indexName)?
            <div style={{
                width:"45%",
                marginLeft:"25%",
                marginTop:"10px",
                display: "grid",
                gridTemplateColumns: "50% 50% 90px",
                gap: "40px",
                alignItems: "end"
                }}
            >
            <Combobox
            label="Search index to use"
            description='Pick an existing search index or create a new one by picking UI features you want in your search application'
            placeholder="Select index"
            onChange={setIndexName}
            >
            <ComboboxOption glyph={<Icon glyph='PlusWithCircle'/>} value='' displayName="Create new index" onClick={()=>setCreateNew(true)}/>
            <ComboboxGroup label="EXISTING INDEXES">
                {indexes.map(index => (
                <ComboboxOption key={index} value={index} onClick={()=>{setCreateNew(false);setConfigure(true)}}></ComboboxOption>
                ))}
            </ComboboxGroup>
                
            </Combobox>
                {createNew?
                <><TextInput label="Index name" description='Unique name for a search index' placeholder='newSearchIndex' value={name} onChange={(e)=>{handleNameInput(e.target.value)}}></TextInput>
                <Button variant="primary" onClick={()=>{setConfigure(true);setIndexName(name);setName(null);setCreateNew(false);}}>Configure</Button></>
                :<div></div>}
            </div>
        :<>{indexName?
                <div style={{
                    width:"50%",
                    marginTop:"10px",
                    display: "flex",
                    gap: "40px",
                    alignItems: "center"
                }}
                >
                <H3>{`Search index: ${indexName}`}</H3>
                <Button leftGlyph={<Icon glyph='MultiDirectionArrow'/>} variant="default" onClick={()=>{setConfigure(false),setIndexName(null)}}>Switch index</Button>
                </div>
                :<></>
            }</>
        }
        </>
    )

}