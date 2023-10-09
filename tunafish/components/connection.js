import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";

function MongoDBConnection({connection,handleConnectionChange,handleSubmit}) {

    return (
        <div style={{
            display: "grid",
            // gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gridTemplateColumns: "25% repeat(3, 15%) 5%",
            gap: "10px"
        }}>
            <TextInput placeholder='mongodb+srv://<user>:<password>@<cluster uri>'  label="Connection String" value={connection.uri} type="password" onChange={(e)=>handleConnectionChange('uri',e.target.value)}></TextInput>
            <TextInput label="Database" value={connection.database} onChange={(e)=>handleConnectionChange('database',e.target.value)}></TextInput>
            <TextInput label="Collection" value={connection.collection} onChange={(e)=>handleConnectionChange('collection',e.target.value)}></TextInput>
            <TextInput label="Search Index" value={connection.searchIndex} onChange={(e)=>handleConnectionChange('searchIndex',e.target.value)}></TextInput>
            {/* <table>
                <tbody>
                    <tr>
                        <td><TextInput label="Database" value={connection.database} onChange={(e)=>handleConnectionChange('database',e.target.value)}></TextInput></td>
                        <td><TextInput label="Collection" value={connection.collection} onChange={(e)=>handleConnectionChange('collection',e.target.value)}></TextInput></td>
                        <td><TextInput label="Search Index" value={connection.searchIndex} onChange={(e)=>handleConnectionChange('searchIndex',e.target.value)}></TextInput></td>
                    </tr>
                </tbody>
            </table> */}
            <Button onClick={handleSubmit}>Submit</Button>
        </div>
    )
}

export default MongoDBConnection;