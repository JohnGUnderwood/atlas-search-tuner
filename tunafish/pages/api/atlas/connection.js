import { MongoClient } from "mongodb";
import parseSchema from 'mongodb-schema';

async function checkCollections(client,db,coll){
    const collections = await client.db(db).listCollections().toArray()
    var check = false;
    if(collections.length > 0){
      collections.forEach(collection => {
        if(coll == collection.name){
          check = true;
        }
      })
      return check;
    }else{
      throw `No collections found in database: ${db}`
    }
  }

  async function getIndexDef(client,coll,db,index){
    const check = await checkCollections(client,db,coll);
    if(check){
      const searchIndexes = await client.db(db).collection(coll).listSearchIndexes(index).toArray()
      if(searchIndexes.length > 0){
        return searchIndexes[0]['latestDefinition']
      }else{
        console.log(`Search Index '${index}' not found in ${db}.${coll}`)
        throw `Search Index '${index}' not found in '${db}.${coll}'`
      }
    }else{
      console.log(`Collection '${coll}' not found in '${db}'`)
      throw `Collection '${coll}' not found in '${db}'`
    }
  }

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

export default async function handler(req,res){
    
    if(!req.method === "POST"){
        console.log(`Method ${req.method} not allowed`)
        res.status(405).send(`Method ${req.method} not allowed`);
    }else if(!req.body.connection){
        console.log(`Request body missing connection parameter`)
        res.status(400).send(`Request body missing connection parameter`);
    }else{
        try{
            const conn = req.body.connection
            const client = new MongoClient(conn.uri)
            const searchIndexDef = await getIndexDef(client,conn.collection,conn.database,conn.searchIndex)
            const schema = await getSchema(req.body.connection,1000)
            
            res.status(200).json({searchIndex:searchIndexDef,schema:schema}).end()
        }catch(error){
            res.status(400).send(`${error}`)
        }
    }

}