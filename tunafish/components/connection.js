import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";

function MongoDBConnection({connection,handleConnectionChange,handleSubmit}) {

    return (
        <>
        <TextInput placeholder='mongodb+srv://<user>:<password>@<cluster uri>'  label="Connection String" value={connection.uri} type="password" onChange={(e)=>handleConnectionChange('uri',e.target.value)}></TextInput>
        <table>
        <tbody>
            <tr>
            <td><TextInput label="Database" value={connection.database} onChange={(e)=>handleConnectionChange('database',e.target.value)}></TextInput></td>
            <td><TextInput label="Collection" value={connection.collection} onChange={(e)=>handleConnectionChange('collection',e.target.value)}></TextInput></td>
            <td><TextInput label="Search Index" value={connection.searchIndex} onChange={(e)=>handleConnectionChange('searchIndex',e.target.value)}></TextInput></td>
            </tr>
        </tbody>
        </table>
        <Button style={{float:"right"}} onClick={handleSubmit}>Submit</Button>
        </>
    )
}

export default MongoDBConnection;