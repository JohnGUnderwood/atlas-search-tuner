import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";
import { PasswordInput } from "@leafygreen-ui/password-input";

function MongoDBConnection({connection,handleConnectionChange, handleSubmit}) {

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "40% 25% 90px",
            gap: "10px",
            alignItems: "end"
        }}>
            <PasswordInput style={{boxSizing:"border-box"}} label="Connection String" id="connection-string" placeholder='mongodb+srv://<user>:<password>@<cluster uri>' onChange={(e)=>handleConnectionChange('uri',e.target.value)}/>
            <TextInput id="namespace" label="Namespace" placeholder="<database>.<collection>" onChange={(e)=>handleConnectionChange('namespace',e.target.value)}></TextInput>
            {/* <TextInput label="Collection" value={connection.collection} onChange={(e)=>handleConnectionChange('collection',e.target.value)}></TextInput> */}
            <Button onClick={handleSubmit}>Connect</Button>
        </div>
    )
}

export default MongoDBConnection;