import { MongoClient } from "mongodb";

// This api accepts a search index name (defaults to 'default') and retrieves its index definition.
// It then returns all the field names grouped by their defined type.
// If 'type' parameters are passed in then it will only return those field types.
// e.g.
// GET: /api/search/fields?index=movies&type=string&type=autocomplete
// Response: {"string":["cast","fullplot","genres","plot","title"],"autocomplete":["genres","title"]} 

function parseIndex(indexdef){
  const fieldMappings = indexdef[0]['latestDefinition']['mappings']['fields']
  var typeMap = {}
  listFieldsFromIndex(typeMap,fieldMappings,null)
  return typeMap;
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

async function getIndexDef(conn,coll,db,index){

  var collection = "";
  try{
    const client = new MongoClient(conn);
    collection = client.db(db).collection(coll)
    try{
      const indexDef = await collection.listSearchIndexes(index).toArray();
      client.close();
      return indexDef;
    }catch{
      return 'failed to list search indexes';
    }
  }catch{
    return 'Failed to establish connection';
  }
  
}

export default async function handler(req, res) {

  const indexName = ( ('index' in req.query)? req.query.index : "default");
  const fieldTypes = ( (Array.isArray(req.query.type))? req.query.type : [req.query.type] );

  return new Promise((resolve, reject) => {
    if(!req.query.conn || !req.query.coll || !req.query.db){
      res.status(400).json({error:"Missing Connection Details!"}).end();
      return resolve();
    }

    getIndexDef(req.query.conn,req.query.coll,req.query.db,indexName)
      .then(response => {
        const types = parseIndex(response);
        if(fieldTypes[0] == undefined){
          res.status(200).json(types).end();
          return resolve();
        }else{
          var result = {};
          fieldTypes.forEach((type)=>{
            result[type]=types[type];
          });
          res.status(200).json(result).end();
          return resolve();
        }
      })
      .catch(error => {
        res.status(405).json(error);
        return resolve();
      });
  });
}