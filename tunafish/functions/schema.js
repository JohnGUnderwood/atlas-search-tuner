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

function evaluateField(fieldTypes,count){
    // What proportion of the sample must have the field to satisfy type
    const ratioThreshold = {facet:0.6,text:0.6,autocomplete:0.6};
    // Threshold for uniqueness, facets should have a low number of unique values, text can be high
    const uniqueThreshold = {facet:0.05,text:1,autocomplete:1};
    // Check if the average character length of the field values make it viable as a facet or autocomplete
    const maxAvgCharLength = {facet:25,autocomplete:50};
    
    var isFacet = false;
    var isText = false;
    var isAutocomplete = false;
    var types = [];

    fieldTypes.forEach(type => {
        if ('values' in type){
            if(type.count > ratioThreshold.facet*count && type.unique < uniqueThreshold.facet*type.count && avgLenArrayVals(type.values) <= maxAvgCharLength.facet){
                isFacet = true 
                types.push(type.name)          
            }else if(type.count > ratioThreshold.text && type.unique < uniqueThreshold.text*type.count && type.name=="String"){
                isText = true
                if(!types.includes(type.name)){
                    types.push(type.name)
                }
            }

            if(type.count > ratioThreshold.autocomplete*count && type.unique < uniqueThreshold.autocomplete*type.count && avgLenArrayVals(type.values) <= maxAvgCharLength.autocomplete && type.name=="String"){
                isAutocomplete = true;
                if(!types.includes(type.name)){
                    types.push(type.name)
                }
            }

        }
        
    })
    return {facet:isFacet,text:isText,autocomplete:isAutocomplete,types:types}
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

export function getCandidates(schema){
    const fieldTypes = getAllFields({},schema);
    const facet = []
    const text = []
    const autocomplete = []

    Object.keys(fieldTypes).forEach(path => {
        if(!evaluateEmbeddingField(fieldTypes[path])){
            const evaluate = evaluateField(fieldTypes[path],schema.count);
            if(evaluate.facet){
                facet.push({path:path,types:evaluate.types})
            }
            if(evaluate.text){
                text.push({path:path,types:evaluate.types})
            }
            if(evaluate.autocomplete){
                autocomplete.push({path:path,types:evaluate.types})
            }
        }
    })

    return {facet:facet,text:text,autocomplete:autocomplete};
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
