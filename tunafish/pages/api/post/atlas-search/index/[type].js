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

  async function connect(connection){
    const uri = connection.uri;
    const db = connection.database;
    const coll = connection.collection
    try{
      const thisClient = new MongoClient(uri);
      try{
        await thisClient.connect();
        try{
          const check = await checkCollections(thisClient,db,coll);
          if(check){
            return thisClient;
          }else{
            console.log(`Collection '${coll}' not found in '${db}'`)
            throw new Error(`Collection '${coll}' not found in '${db}'`,{cause:"CollectionNotFound"})
          }
        }catch(error){
          throw error;
        }
      }catch(error){
        throw error;
      }
    }catch(error){
        console.log(`Connection failed ${error}`)
        throw error;
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

async function getSchema(client,connection,sample){
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
  }
}

let client;
export default async function handler(req,res){
    
    const { type } = req.query
    
    if(!req.method === "POST"){
        console.log(`Method ${req.method} not allowed`)
        res.status(405).send(`Method ${req.method} not allowed`);
    }else if(!req.body.connection){
        console.log(`Request body missing connection parameter`)
        res.status(400).send(`Request body missing connection parameter`);
    }else{
        const conn = req.body.connection;
        if(!client){
          try{
            client = await connect(conn);
          }catch(error){
            res.status(400).send(`${error}`);
          }
        }
        if(type=="connect"){
          try{
            client = await connect(conn);
            res.status(200).send("Successfully connected!");
          }catch(error){
            res.status(400).send(`${error}`);
          }
        }else if(type == "schema"){
          try{
              const schema = await getSchema(client,req.body.connection,1000)
              res.status(200).json(schema).end();
          }catch(error){
              res.status(400).send(`${error}`);
          }
        }else if(type == "definition"){
          if(req.body.index){
            const searchIndex = req.body.index;
            try{
              const searchIndexDef = await getIndexDef(client,conn.collection,conn.database,searchIndex)
              res.status(200).json(searchIndexDef).end();
            }catch(error){
              res.status(400).send(`${error}`);
            }
          }else{
            console.log(`${req.body} missing required parameters (index)`)
            res.status(400).send(`${req.body} missing required parameters (index)`)
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
        }else if(type == "status"){
          if(req.body.connection && req.body.index){
            try{
              const response = await client.db(conn.database).collection(conn.collection).listSearchIndexes(req.body.index).next()
              res.status(200).json(response).end();
            }catch(error){
              res.status(400).send(`${error}`);
            }
          }else{
              console.log(`${req.body} missing required parameters (name,connection)`)
              res.status(400).send(`${req.body} missing required parameters (name,connection)`)
          }
        
        }else if(type=="list"){
          try{
            const response = await client.db(conn.database).collection(conn.collection).listSearchIndexes().toArray();
            res.status(200).json(response.map(r=>r.name)).end();
          }catch(error){
            res.status(400).send(`${error}`)
          }
        }else{
          res.status(400).send(`Unrecognised endpoint ${type}`);
        }
    }

}