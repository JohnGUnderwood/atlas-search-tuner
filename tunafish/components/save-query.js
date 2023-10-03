import { useState, useEffect } from 'react';
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox';
import Modal from '@leafygreen-ui/modal';
import Button from '@leafygreen-ui/button';
import TextInput from '@leafygreen-ui/text-input';
import { Label, Body} from '@leafygreen-ui/typography'

function SaveQuery({query,queryTerms}){
    const [name, setName] = useState(null);
    const [open, setOpen] = useState(false);
    const [type, setType] = useState(null);

    return (
        <>
        <Button onClick={() => setOpen(curr => !curr)}>Save Query Trigger</Button>
        <Modal open={open} setOpen={setOpen}>
            <Label>Query<Body>{queryTerms}</Body></Label>
            <Combobox label="Choose Type of Query Trigger" size="small" multiselect={false} onChange={setType}>
                <ComboboxOption value="exact" displayName="Exact Match"/>
                <ComboboxOption value="search" displayName="Keyword Match"/>
            </Combobox>
            <TextInput label="Trigger Name" value={name} onChange={(e)=>setName(e.target.value)}></TextInput>
            <p>{JSON.stringify(query)}</p>
            <Button>Submit</Button>
        </Modal>
        </>
    )
}

export default SaveQuery;