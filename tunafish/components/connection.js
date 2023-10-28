import axios from 'axios';
import { useEffect, useState } from 'react';
import { useToast } from '@leafygreen-ui/toast';
import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";
import { PasswordInput } from "@leafygreen-ui/password-input";

function MongoDBConnection({connection,handleConnectionChange,connected,setConnected}) {
    const { pushToast, popToast, clearStack } = useToast();
    // const [error, setError] = useState(null);
    // const [toasts, setToasts] = useState({warning:'',progress:'',success:''})
    // // const [errorToast, setErrorToast] = useState('');
    // // const [progressToast, setProgressToast] = useState('');
    // // const [successToast, setSuccessToast] = useState('false');

    const uri = connection?.uri? connection.uri:undefined;
    const namespace = (connection?.database && connection?.collection)? `${connection.database}.${connection.collection}`:undefined;

    useEffect(()=>{
        clearStack();
    },[connection]);
    
    
    const handleSubmit = () => {
        pushToast({variant:"progress",title:"Connecting",description:`Trying to connect to ${connection.database}.${connection.collection}`});
        connect(connection)
            .then(resp => {
                clearStack();
                pushToast({variant:"success",title:"Connected!",description:`Successfully connected to ${connection.database}.${connection.collection}`}); 
                setConnected(true);
            })
            .catch(error => {
                clearStack();
                pushToast({timeout:0,variant:"warning",title:"Failed",description:`Connection to ${connection.database}.${connection.collection} failed. ${error}`})
            })
    }

    return (

   
        <div style={{
            display: "grid",
            gridTemplateColumns: "40% 25% 90px",
            gap: "10px",
            alignItems: "end"
        }}>
            <PasswordInput id="connection-string"
                style={{boxSizing:"border-box"}}
                label="Connection String"
                placeholder='mongodb+srv://<user>:<password>@<cluster uri>'
                value={uri}
                onChange={(e)=>handleConnectionChange('uri',e.target.value)}/>
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