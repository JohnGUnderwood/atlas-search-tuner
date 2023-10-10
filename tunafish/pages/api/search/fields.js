import { MongoClient } from "mongodb";

// This api accepts a search index name (defaults to 'default') and retrieves its index definition.
// It then returns all the field names grouped by their defined type.
// If 'type' parameters are passed in then it will only return those field types.
// e.g.
// GET: /api/search/fields?index=movies&type=string&type=autocomplete
// Response: {"string":["cast","fullplot","genres","plot","title"],"autocomplete":["genres","title"]} 

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

function checkCollections(conn,db,coll){
  return new Promise((resolve,reject)=>{
    conn.db(db).listCollections().toArray()
      .then(collections => {
        if(collections.length > 0){
          collections.forEach(collection => {
            if(coll == collection.name){
              resolve(true)
            }
          })
          resolve(false)
        }else{
          reject(`No collections found in database: ${db}`)
        }
      })
      .catch(error =>
        reject(error)
      )
  });
}

function getIndexDef(uri,coll,db,index){
  const client = new MongoClient(uri);
  return new Promise((resolve, reject) => {
    client.connect()
      .then(conn => {
        checkCollections(conn,db,coll)
          .then(check => {
            console.log(check)
            if(check){
              conn.db(db).collection(coll).listSearchIndexes(index).toArray()
                .then(response => {
                  resolve(response)
                })
                .catch(error => {
                  console.log(`List indexes failed ${error}`)
                  reject(error);
                })
            }else{
              console.log(`Collection ${coll} not found in ${db}`)
              reject(`Collection ${coll} not found in ${db}`)
            }
          })
          .catch(error => {
            console.log(`checkCollections failed: ${error}`)
            reject(error)
          })
      })
      .catch(error=>{
        console.log(`Connection failed ${error}`)
        reject(error);
      })
      .finally(
        client.close()
      )
  });
}

export default function handler(req, res) {

  const indexName = ( ('index' in req.query)? req.query.index : "default");
  const fieldTypes = ( (Array.isArray(req.query.type))? req.query.type : [req.query.type] );

  if(!req.query.uri || !req.query.coll || !req.query.db){
    res.status(400).send("Missing Connection Details!");
  }else{
    return getIndexDef(req.query.uri,req.query.coll,req.query.db,indexName)
      .then((response) => {
        const types = parseIndex(response);
        if(fieldTypes[0] == undefined){
          res.status(200).send(types);
        }else{
          var result = {};
          fieldTypes.forEach((type)=>{
            result[type]=types[type];
          });
          res.status(200).send({fields:result,definition:response});
        }
      })
      .catch((error) => {
        console.log(`getIndexDef failed ${error}`)
        res.status(400).send(`${error}`);
      });
  }
}