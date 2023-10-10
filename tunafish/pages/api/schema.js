import { MongoClient } from "mongodb";
import parseSchema from 'mongodb-schema';


function getSchema(connection,sample){

    return new Promise((resolve, reject) => {
        try{
            const client = new MongoClient(connection.uri);
            try {
                return client.db(connection.database).collection(connection.collection)
                    .aggregate(
                        [
                            {$sample:{size:sample}}
                        ]
                    )
                    .toArray()
                    .then(documentStream => {
                        parseSchema(documentStream)
                        .then(schema => {
                            client.close();
                            resolve(schema);
                        })
                        .catch(error => {
                            client.close();
                            console.log(`parseSchema failed ${error}`)
                            throw error;
                        })
                    })
                    .catch(error => {throw error})
            }catch(error){
                console.log(`Fetching documents failed ${error}`)
                throw error;
            }
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    });
}

export default function handler(req, res) {
    if(!req.body.connection){
        res.status(400).send("Missing Connection Details!");
    }else{
        return getSchema(req.body.connection,1000)
            .then((response) => {
                res.status(200).send(response);
            })
            .catch((error) => {
                res.status(400).send(error);
            });
    }
}