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
      throw new Error(`No collections found in database: ${db}`,{cause:"EmptyDatabase"})
    }
  }

  async function createSearchIndex(client,coll,db,index){
    const searchIndexes = await client.db(db).collection(coll).listSearchIndexes(index).toArray()
    if(searchIndexes.length > 0){
      if(searchIndexes[0]['latestDefinition']){
        return true
      }else{
        throw new Error(`No latestDefinition found for '${index}' in '${db}.${coll}'`,{cause:"MissingDefinition"})
      }
    }else{
      return false
    }
  }

  async function getIndexDef(client,coll,db,index){
    const check = await checkCollections(client,db,coll);
    if(check){
      const searchIndexes = await client.db(db).collection(coll).listSearchIndexes(index).toArray()
      if(searchIndexes.length > 0){
        return searchIndexes[0]['latestDefinition']
      }else{
        console.log(`Search index '${index}' not found in ${db}.${coll}`)
        throw new Error(`Search index '${index}' not found in '${db}.${coll}'`,{cause:"SearchIndexNotFound"})
      }
    }else{
      console.log(`Collection '${coll}' not found in '${db}'`)
      throw new Error(`Collection '${coll}' not found in '${db}'`,{cause:"CollectionNotFound"})
    }
  }

async function getSchema(connection,sample){
  try{
      const client = new MongoClient(connection.uri);
      try {
          const documentStream = await client.db(connection.database).collection(connection.collection)
              .aggregate(
                [
                  {$sample:{size:sample}}
                ]
              ).toArray()
          const schema = await parseSchema(documentStream)
          return schema;
      }catch(error){
          console.log(`Fetching documents failed ${error}`)
          throw error;
      }finally{
        client.close()
      }
  }catch(error){
      console.log(`Connection failed ${error}`)
      throw error;
  }
}

export default async function handler(req,res){
    
    const { type } = req.query
    
    if(!req.method === "POST"){
        console.log(`Method ${req.method} not allowed`)
        res.status(405).send(`Method ${req.method} not allowed`);
    }else if(!req.body.connection){
        console.log(`Request body missing connection parameter`)
        res.status(400).send(`Request body missing connection parameter`);
    }else{
        const conn = req.body.connection
        try{
          const client = new MongoClient(conn.uri)
          try{
            await client.connect()
            if(type == "connection"){
              try{
                  const searchIndexDef = await getIndexDef(client,conn.collection,conn.database,conn.searchIndex)
                  const schema = await getSchema(req.body.connection,1000)
                  res.status(200).json({searchIndex:searchIndexDef,schema:schema}).end()
              }catch(error){
                  res.status(400).send(`${error}`)
              }
            }else if(type == "create"){
              if(req.body.name && req.body.mappings && req.body.connection){
                try{
                  const indexDef = {
                    name:req.body.name,
                    definition:{
                      mappings:req.body.mappings
                    }
                  }
                  const response = await client.db(conn.database).collection(conn.collection).createSearchIndex(indexDef)
                  res.status(200).json(response).end()
                }catch(error){
                  res.status(400).send(`${error}`)
                }
              }else{
                  console.log(`${req.body} missing required parameters (name,mappings,connection)`)
                  res.status(400).send(`${req.body} missing required parameters (name,mappings,connection)`)
              }
            }
          }catch(error){
            console.log(error)
            res.status(400).send(`${error}`)
          }finally{
            client.close()
          }
        }catch(error){
          res.status(400).send(`${error}`)
        }
    }

}