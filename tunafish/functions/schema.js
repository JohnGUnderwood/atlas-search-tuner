function avgLenArrayVals(array){
    var sum = 0
    array.forEach(val => {
        sum += String(val).length
    })

    return sum/array.length
}

function addArrayValToObj(obj,key,value){
    if(key in obj){
        obj[key].push(value)
    }else{
        obj = {...obj,[key]:[value]}
    }
    return obj
}

function mergeObjectsArrays(obj1,obj2){
    var newObj = {}
    Object.keys(obj1).forEach(key =>{
        if(key in obj2){
            newObj[key] = obj1[key].concat(obj2[key])
            delete obj2[key]
        }else{
            newObj[key] = obj1[key]
        }
    })

    return {...obj2,...newObj}
}

function getAllFields(fields,input){

    if('path' in input){
        const path = input.path.join('.');
        fields = addArrayValToObj(fields,path,input)
    }
    
    if('fields' in  input){
        input.fields.forEach(field => {
            fields = getAllFields(fields,field)
        })
    }else if('types' in input){
        input.types.forEach(type => {
            fields = getAllFields(fields,type)
        })
    }
    
    return fields;
}

function evaluateFacetField(fieldTypes,count){
    // What proportion of the sample must have the field
    const ratioThreshold = 0.6;
    // Threshold for uniqueness, facets should have a low number of unique values
    const uniqueThreshold = 0.05;
    // Check if the average character length of the field values make it viable as a facet
    const maxAvgCharLength = 25;
    
    var isFacet = false;
    var types = [];

    fieldTypes.forEach(type => {
        if ('values' in type){
            if(type.count > ratioThreshold*count && type.unique < uniqueThreshold*type.count && avgLenArrayVals(type.values) <= maxAvgCharLength){
                isFacet = true 
                types.push(type.name)          
            }
        }
        
    })
    return {facet:isFacet,types:types}
}

function evaluateEmbeddingField(fieldTypes){    
    //If all the sampled values for an array field are the same length then this is likely an embedding field
    //Also check that the length is longer than 100
    var isEmbedding = false;
    fieldTypes.forEach(type => {
        if (type.bsonType == 'Array' && type.averageLength > 100 && type.totalCount == type.averageLength*type.count){
            isEmbedding = true;
        }
    })
    return isEmbedding
}

export function getFacetCandidates(schema){
    const fieldTypes = getAllFields({},schema);
    const facets = []

    Object.keys(fieldTypes).forEach(path => {
        if(!evaluateEmbeddingField(fieldTypes[path])){
            const evaluate = evaluateFacetField(fieldTypes[path],schema.count);
            if(evaluate.facet){
                // facets[path] = evaluate.types
                facets.push({path:path,types:evaluate.types})
            }
        }
    })

    return facets;
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

export function parseIndex(indexDef){
    const fieldMappings = indexDef['mappings']['fields']
    var typeMap = {}
    listFieldsFromIndex(typeMap,fieldMappings,null)
    return typeMap;
}
