function avgLenArrayVals(array){
    var sum = 0
    array.forEach(val => {
        sum += String(val).length
    })

    return sum/array.length
}

function getAllFields(output,fields){

    fields.forEach(field => {
        const type = field.types.sort(function(a,b){b.probability-a.probability})[0]; // Get most probable type
        if(type.name != "Array" && type.name != "Document"){
            output.push(type);
        }else if(type.name=="Array"){
            var arrayType = type.types.sort(function(a,b){b.probability-a.probability})[0];
            if(arrayType.bsonType != "Document" && arrayType.bsonType != "Array"){ // Doesn't handle embedded documents or array of arrays.
                arrayType = {...arrayType,averageLength:type.averageLength,arrayCount:type.count}
                output.push(arrayType);
            }
        }else if(type.name=="Document"){
            getAllFields(output,type.fields);
        }
    });
    
    return output;
}

function evaluateField(field,sampleSize){
    // What proportion of the sample must have the field to satisfy type
    const ratioThreshold = {facet:0.6,text:0.6,autocomplete:0.6};
    // Threshold for uniqueness, facets should have a low number of unique values, text can be high
    // const uniqueThreshold = {facet:0.05,text:1,autocomplete:1};
    // Check if the average character length of the field values make it viable as a facet or autocomplete
    const maxAvgCharLength = {facet:25,autocomplete:100};
    
    var isFacet = false;
    var isText = false;
    var isAutocomplete = false;
    var types = [];

// Only suggesting string facets for the time being
    if(field.count/sampleSize > ratioThreshold.facet && avgLenArrayVals(field.values) <= maxAvgCharLength.facet && field.bsonType=="String"){
        isFacet = true;        
    }

    if(field.count/sampleSize > ratioThreshold.autocomplete && avgLenArrayVals(field.values) <= maxAvgCharLength.autocomplete && field.bsonType=="String"){
        isAutocomplete = true;
    }

    if(field.count/sampleSize > ratioThreshold.text && field.bsonType=="String"){
        isText = true
    }

    return {facet:isFacet,text:isText,autocomplete:isAutocomplete}
}

function evaluateEmbeddingField(field){    
    //If all the sampled values for an array field are the same length then this is likely an embedding field
    //Also check that the length is longer than 100
    var isEmbedding = false;
    if (field.bsonType == 'Number' && field.averageLength > 100 && field.count == field.averageLength*field.arrayCount){
        isEmbedding = true;
    }
    return isEmbedding
}

export function getCandidates(schema){
    const fields = getAllFields([],schema.fields);
    const facet = []
    const text = []
    const autocomplete = []

    console.log("fieldTypes: ",fields);
    fields.forEach(field => {
        if(!evaluateEmbeddingField(field)){
            console.log("processing field:",field.path.join('.'))
            const evaluate = evaluateField(field,schema.count);
            if(evaluate.facet){
                facet.push({path:field.path.join('.'),type:field.bsonType})
            }
            if(evaluate.text){
                text.push({path:field.path.join('.'),type:field.bsonType})
            }
            if(evaluate.autocomplete){
                autocomplete.push({path:field.path.join('.'),type:field.bsonType})
            }
        }
    });

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
