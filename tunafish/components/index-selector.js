import { Combobox, ComboboxOption, ComboboxGroup } from '@leafygreen-ui/combobox';
import Button from '@leafygreen-ui/button';
import TextInput from '@leafygreen-ui/text-input';
import { useEffect, useState } from 'react';
import Icon from '@leafygreen-ui/icon';
import { H3 } from '@leafygreen-ui/typography';

function IndexSelector({indexes,userSelection,setUserSelection}){
    const [createNew, setCreateNew] = useState(false);
    const [name, setName] = useState(userSelection.indexName);

    const handleNameInput = (input) => {
        setName(input);
    };

    const handleIndexChange = (name) => {
        setUserSelection({...userSelection,indexName:name});
    }

    useEffect(()=>{},[userSelection.indexName]);

    return (
        <>
        {!userSelection.indexName?
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
                {indexes?<Combobox
                    label="Search index to use"
                    description='Pick an existing search index or create a new one by picking UI features you want in your search application'
                    placeholder="Select index"
                    onChange={handleIndexChange}
                >
                    <ComboboxOption glyph={<Icon glyph='PlusWithCircle'/>} value='' displayName="Create new index" onClick={()=>setCreateNew(true)}/>
                        <ComboboxGroup label="EXISTING INDEXES">
                        {indexes.map(index => (
                            <ComboboxOption key={index} value={index} onClick={()=>{setCreateNew(false)}}></ComboboxOption>
                        ))}
                        </ComboboxGroup>
                </Combobox>:
                <Combobox
                    label="Search index to use"
                    description='Pick an existing search index or create a new one by picking UI features you want in your search application'
                    placeholder="Select index"
                    onChange={handleIndexChange}
                >
                    <ComboboxOption glyph={<Icon glyph='PlusWithCircle'/>} value='' displayName="Create new index" onClick={()=>setCreateNew(true)}/>
                </Combobox>}
                {createNew?
                <><TextInput label="Index name" description='Unique name for a search index' placeholder='newSearchIndex' value={name} onChange={(e)=>{handleNameInput(e.target.value)}}></TextInput>
                <Button variant="primary" onClick={()=>{setUserSelection({...userSelection,indexName:name});setName(null);setCreateNew(false);}}>Configure</Button></>
                :<div></div>}
            </div>
        :<>{userSelection.indexName?
                <div style={{
                    width:"50%",
                    marginTop:"10px",
                    display: "flex",
                    gap: "40px",
                    alignItems: "center"
                }}
                >
                <H3>{`Search index: ${userSelection.indexName}`}</H3>
                <Button leftGlyph={<Icon glyph='MultiDirectionArrow'/>} variant="default" onClick={()=>{setUserSelection({...userSelection,indexName:null});}}>Change index</Button>
                </div>
                :<></>
            }</>
        }
        </>
        
    )

}

export default IndexSelector