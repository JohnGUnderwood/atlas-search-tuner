export function getCount(schema){
    return schema.count;
}

function evaluateFacetField(schema,field){
    console.log(field)
    // What proportion of the sample must have the field
    const ratioThreshold = 0.6;

    // Threshold for uniqueness, facets should have a low number of unique values
    const uniqueThreshold = 0.1;

    if(field.count > ratioThreshold*schema.count && field.unique < uniqueThreshold*field.count){
        return true
    }else if('types' in field){
        field.types.forEach(tField => { 
            evaluateFacetField(schema,tField);
        })
    
    }
}

export function getFacetCandidates(schema){
    schema.fields.forEach(field => {
        if(evaluateFacetField(schema,field)){
            console.log(`Facet candidate ${JSON.stringify(field)}`)
        }
    });
}