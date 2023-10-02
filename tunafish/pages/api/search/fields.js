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

export default function handler(req, res) {
  // res.status(200).json({ message: 'Hello from Next.js!' })

  if(!req.query.conn || !req.query.coll || !req.query.db){
    res.status(400).json({error:"Missing Connection Details!"})
  }

  const indexName = ( ('index' in req.query)? req.query.index : "default");
  const fieldTypes = ( (Array.isArray(req.query.type))? req.query.type : [req.query.type] );

  // connect to your Atlas deployment
  const uri =  req.query.conn;

  const client = new MongoClient(uri);

  async function run() {
    try {
      const database = client.db(req.query.db);
      const collection = database.collection(req.query.coll);

      const indexDef = await collection.listSearchIndexes(indexName).toArray();
      const types = parseIndex(indexDef);
      
      if(fieldTypes[0] == undefined){
        res.status(200).json(types)
      }else{
        var result = {};
        fieldTypes.forEach((type)=>{
          result[type]=types[type];
        });
        res.status(200).json(result);
      }
    } finally {
      await client.close();
    }
  }
  run().catch(console.dir);
}