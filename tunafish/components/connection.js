import axios from 'axios';
import { useEffect, useState } from 'react';
import { Toast, ToastProvider } from '@leafygreen-ui/toast';
import TextInput from "@leafygreen-ui/text-input";
import Button from "@leafygreen-ui/button";
import { PasswordInput } from "@leafygreen-ui/password-input";

function MongoDBConnection({connection,handleConnectionChange,connected,setConnected}) {
    const [error, setError] = useState(null);
    const [errorToast, setErrorToast] = useState(false);
    const [progressToast, setProgressToast] = useState(false);
    const [successToast, setSuccessToast] = useState(false);

    const uri = connection?.uri? connection.uri:undefined;
    const namespace = (connection?.database && connection?.collection)? `${connection.database}.${connection.collection}`:undefined;

    useEffect(()=>{
        console.log("Something changed")
        setErrorToast(false);
        setProgressToast(false);
        setSuccessToast(false);
    },[connection]);
    
    
    const handleSubmit = () => {
        connect(connection)
            .then(resp => {
                setSuccessToast(true);
                setConnected(true);
                // fetchIndexes(connection).then(resp => {
                //     setIndexes(resp.data);
                // }).catch(error => {
                //     setError(error);
                //     setErrorToast(true);
                // });
            })
            .catch(error => {
                setErrorToast(true);
                setError(error);
            })
    }

    return (

    <ToastProvider>
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
            <Button onClick={()=>{setProgressToast(true);handleSubmit()}}>Connect</Button>
        </div>
        <>
        {connection?
            <>
            {!error?
                <Toast
                    variant="success"
                    title="Connected!"
                    description={`Established connection to ${connection.database}.${connection.collection}`}
                    open={successToast}
                    onClose={() => setSuccessToast(false)}
                />:<></>
            }
            <Toast
                variant="warning"
                title="Encountered error"
                description={`${error}`}
                open={errorToast}
                onClose={() => setErrorToast(false)}
            />
            <Toast
                variant="progress"
                title="Connecting"
                description={`Trying to connect to ${connection.database}.${connection.collection}`}
                open={progressToast}
                onClose={() => setProgressToast(false)}
            />
            </>
            :<></>
        }
        </>
        </ToastProvider>
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