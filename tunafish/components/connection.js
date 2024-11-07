import axios from 'axios';
import { useToast } from '@leafygreen-ui/toast';
import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";
import { PasswordInput } from "@leafygreen-ui/password-input";

function MongoDBConnection({connection,handleConnectionChange}) {
    const { pushToast, clearStack } = useToast();

    const cluster = connection?.cluster? connection.cluster:undefined;
    const user = connection?.user? connection.user:undefined;
    const password = connection?.password? connection.password:undefined;
    const namespace = (connection?.database && connection?.collection)? `${connection.database}.${connection.collection}`:undefined;
    
    const handleSubmit = () => {
        clearStack();
        pushToast({variant:"progress",title:"Connecting...",description:`Establishing connection to ${connection.cluster}`}); 
        handleConnectionChange('connected',false);
        connect(connection)
            .then(resp => {
                clearStack();
                pushToast({variant:"success",title:"Connected!",description:`Successfully connected to ${connection.cluster}`}); 
                handleConnectionChange('connected',true);
            })
            .catch(error => {
                clearStack();
                pushToast({timeout:0,variant:"warning",title:"Failed",description:`Connection to ${connection.cluster} failed. ${error}`})
            })
    }

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "20% 15% 15% 20% 90px",
            gap: "10px",
            alignItems: "end"
        }}>
            <TextInput id="connection-cluster"
                style={{boxSizing:"border-box"}}
                label="Cluster"
                placeholder='<cluster_name>.<cluster_domain>.mongodb.net'
                value={cluster}
                onChange={(e)=>handleConnectionChange('cluster',e.target.value)}/>
            <PasswordInput id="connection-user"
                style={{boxSizing:"border-box"}}
                label="User"
                placeholder='<username>'
                value={user}
                onChange={(e)=>handleConnectionChange('user',e.target.value)}/>
            <PasswordInput id="connection-password"
                style={{boxSizing:"border-box"}}
                label="User"
                placeholder='<password>'
                value={password}
                onChange={(e)=>handleConnectionChange('password',e.target.value)}/>
            <TextInput id="namespace"
                label="Namespace"
                placeholder="<database>.<collection>"
                value={namespace}
                onChange={(e)=>handleConnectionChange('namespace',e.target.value)}/>
            <Button onClick={handleSubmit}>Connect</Button>
        </div>
    )
}

function connect(conn) {
    return new Promise((resolve,reject) => {
        axios.post(`api/post/atlas-search/index/connect?`,{connection:conn})
        .then(response => resolve(response))
        .catch((error) => reject(error.response.data))
    });
}

export default MongoDBConnection;