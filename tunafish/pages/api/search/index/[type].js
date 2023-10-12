import { MongoClient } from "mongodb";

function parseIndex(indexdef){
  try{
    const fieldMappings = indexdef[0]['latestDefinition']['mappings']['fields']
    var typeMap = {}
    listFieldsFromIndex(typeMap,fieldMappings,null)
    return typeMap;
  }catch(error){
    throw `Error parsing index def ${JSON.stringify(indexdef)}: ${error}`
  }
  
}
// Function which reads in a search index definition and populates a map of field types to field paths.
// E.g. {"string":['title','body','category'],"stringFacet":["category"]}
// Handles nested fields.
function listFieldsFromIndex(typeMap,fieldMappings,parent){
  const fields = Object.keys(fieldMappings);
  fields.forEach((field)=>{
    var path = (parent == null)? field : `${parent}.${field}`;
    if(Array.isArray(fieldMappings[field])){
        fieldMappings[field].forEach((fieldType)=>{
            if(typeMap.hasOwnProperty(fieldType['type'])){
              typeMap[fieldType['type']].push(path)
            }else{
              typeMap[fieldType['type']]=[path]
            }
        });
    }else{
      if(typeMap.hasOwnProperty(fieldMappings[field]['type'])){
        typeMap[fieldMappings[field]['type']].push(path)
      }else{
        typeMap[fieldMappings[field]['type']]=[path]
      }
    }
    if(fieldMappings[field].hasOwnProperty('fields')){
      listFieldsFromIndex(typeMap,fieldMappings[field]['fields'],field)
    }
  });    
}

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
    return await client.db(db).collection(coll).listSearchIndexes(index).toArray()
  }else{
    console.log(`Collection ${coll} not found in ${db}`)
    throw `Collection ${coll} not found in ${db}`
  }
}

// /api/search/index/[fields|mappings]
// This api accepts a search index name (defaults to 'default') and retrieves its index definition.

export default async function handler(req, res) {
   
    const { type } = req.query

    // The 'fields' endpoint returns all the field names grouped by their defined type.
    // If 'type' parameters are passed in then it will only return those field types.
    // e.g.
    // GET: /api/search/index/fields?index=movies&type=string&type=autocomplete
    // Response: {"string":["cast","fullplot","genres","plot","title"],"autocomplete":["genres","title"]} 
    if(type == 'fields'){
        const indexName = ( ('index' in req.query)? req.query.index : "default");
        const fieldTypes = ( (Array.isArray(req.query.type))? req.query.type : [req.query.type] );

        if(!req.query.uri || !req.query.coll || !req.query.db){
            res.status(400).send("Missing Connection Details!");
        }else{
            try{
            const client = new MongoClient(req.query.uri)
            const indexDef = await getIndexDef(client,req.query.coll,req.query.db,indexName)
            client.close();
            const types = parseIndex(indexDef);
            if(fieldTypes[0] == undefined){
                res.status(200).send(types);
            }else{
                var result = {};
                fieldTypes.forEach((type)=>{
                result[type]=types[type];
                });
                res.status(200).send({fields:result,definition:indexDef});
            }
            }
            catch(error){
                res.status(400).send(`${error}`)
            }
        }
    // The 'mappings' endpoint returns the index definition mapping only
    }else if(type == 'mappings'){
        if(req.method === 'POST'){
            if(req.body.name && req.body.mappings && req.body.connection){
                try{
                    const conn = req.body.connection
                    const client = new MongoClient(conn.uri)
                    const indexDef = getIndexDef(client,conn.collection,conn.database,conn.searchIndex)
                    res.status(200).send(indexDef)
                }
                catch(error){
                    res.status(500).send(`${error}`)
                }
            }else{
                console.log(`${req.body} missing required parameters (name,mappings,connection)`)
                res.status(400).send(`${req.body} missing required parameters (name,mappings,connection)`)
            }
    
        }else if(req.method === 'GET'){
            res.status(200).send('Success')
        }else{
            console.log(`Method ${req.method} not allowed`)
            res.status(405).send(`Method ${req.method} not allowed`);
        }
    }else{
        console.log(`Unrecognised path ${type}`)
        res.status(405).send(`Unrecognised path ${type}`);
    }

  
}