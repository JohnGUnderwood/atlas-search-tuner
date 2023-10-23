import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";
import { PasswordInput } from "@leafygreen-ui/password-input";

function MongoDBConnection({connected, connection,handleConnectionChange,handleSubmit}) {

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "25% repeat(2, 15%) 5%",
            gap: "10px"
        }}>
            <PasswordInput style={{boxSizing:"border-box"}} label="Connection String" id="connection-string" placeholder='mongodb+srv://<user>:<password>@<cluster uri>' value={connection.uri} onChange={(e)=>handleConnectionChange('uri',e.target.value)}/>
            <TextInput label="Database" value={connection.database} onChange={(e)=>handleConnectionChange('database',e.target.value)}></TextInput>
            <TextInput label="Collection" value={connection.collection} onChange={(e)=>handleConnectionChange('collection',e.target.value)}></TextInput>
            <div style={{position:"relative"}}><Button style={{position:"absolute", bottom:"0"}} onClick={handleSubmit}>Connect</Button></div>
        </div>
    )
}

export default MongoDBConnection;