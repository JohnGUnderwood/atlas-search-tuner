function parseField(fieldMappings,parent,newFields){
    for(const field in fieldMappings){
        //Need to handle case when a field has just one definition object
        if(fieldMappings[field].constructor == Object){
            if(fieldMappings[field].type=="document"){
                parseField(fieldMappings[field].fields,`${parent}.${field}`,newFields)
            }else if(fieldMappings[field].type=="stringFacet"){
                newFields.facet.push({path:`${parent}.${field}`,types:['String']})
            }else if(fieldMappings[field].type=="numberFacet"){
                newFields.facet.push({path:`${parent}.${field}`,types:['Number']})
            }else if(fieldMappings[field].type=="dateFacet"){
                newFields.facet.push({path:`${parent}.${field}`,types:['Date']})
            }else if(fieldMappings[field].type=="string"){
                newFields.text.push({path:`${parent}.${field}`,types:['String']})
            }else if(fieldMappings[field].type=="autocomplete"){
                newFields.autocomplete.push({path:`${parent}.${field}`,types:['String']})
            }
        }else{
            //Need to handle case when a field has multiple definitions
            for(const def in fieldMappings[field]){
                if(def.type=="stringFacet"){
                    newFields.facet.push({path:`${parent}.${field}`,types:['String']})
                }else if(def.type=="numberFacet"){
                    newFields.facet.push({path:`${parent}.${field}`,types:['Number']})
                }else if(def.type=="dateFacet"){
                    newFields.facet.push({path:`${parent}.${field}`,types:['Date']})
                }else if(def.type=="string"){
                    newFields.text.push({path:`${parent}.${field}`,types:['String']})
                }else if(def.type=="autocomplete"){
                    newFields.autocomplete.push({path:`${parent}.${field}`,types:['String']})
                }
            }
        }
    }
}

function addNestedMapping(paths,parent,mapping){
    const children = paths.slice(1);
    const name = paths[0]

    if(children.length > 0){
        if(name in parent.fields){
            addNestedMapping(children,parent.fields[name],mapping);
        }else{
            parent.fields[name] = {
                "type":"document",
                "fields":{},
                "dynamic":false
            }
            addNestedMapping(children,parent.fields[name],mapping);
        }
    }else {
        parent.fields[name] = mapping
    }
}

export function parseSearchIndex(mappings){
    // ######### Helpful Comment ########
    //fields should be an object with keys containing array of fields with their types:
    // {
    //     facet/text/autocomplete: 
    //      [
    //         {
    //             path: <full path to field>
    //             types: [String/Number/Date/etc..]
    //         }
    //      ]
    // }
    // ######### Helpful Comment ########
    var newFields = {facet:[],text:[],autocomplete:[]};
    for(const field in mappings.fields){
        //Need to handle case when a field has just one definition object
        if(mappings.fields[field].constructor == Object){
            if(mappings.fields[field].type=="document"){
                parseField(mappings.fields[field].fields,field,newFields)
            }else if(mappings.fields[field].type=="stringFacet"){
                newFields.facet.push({path:field,types:['String']})
            }else if(mappings.fields[field].type=="numberFacet"){
                newFields.facet.push({path:field,types:['Number']})
            }else if(mappings.fields[field].type=="dateFacet"){
                newFields.facet.push({path:field,types:['Date']})
            }else if(mappings.fields[field].type=="string"){
                newFields.text.push({path:field,types:['String']})
            }else if(mappings.fields[field].type=="autocomplete"){
                newFields.autocomplete.push({path:field,types:['String']})
            }
        }else{
            //Need to handle case when a field has multiple definitions
            for(const def of mappings.fields[field]){
                if(def.type=="stringFacet"){
                    newFields.facet.push({path:field,types:['String']})
                }else if(def.type=="numberFacet"){
                    newFields.facet.push({path:field,types:['Number']})
                }else if(def.type=="dateFacet"){
                    newFields.facet.push({path:field,types:['Date']})
                }else if(def.type=="string"){
                    newFields.text.push({path:field,types:['String']})
                }else if(def.type=="autocomplete"){
                    newFields.autocomplete.push({path:field,types:['String']})
                }
            }
        }
    }
    return newFields;
}

export function buildSearchIndex(fields){
    // ######### Helpful Comment ########
    //fields should be an object with keys containing array of fields with their types:
    // {
    //     facet/text/autocomplete: 
    //      [
    //         {
    //             path: <full path to field>
    //             types: [String/Number/Date/etc..]
    //         }
    //      ]
    // }
    // ######### Helpful Comment ########
    var mappings = {fields:{}};
    if(fields.facet.length>0){
        fields.facet.forEach((field) => {
            let mapping;
            if(field.types.includes('String')){
                mapping = [
                    {type:'stringFacet'},
                    {type:'string',analyzer:"lucene.keyword",indexOptions:"docs",norms:"omit"}
                ]
            }else if(field.types.includes('Number')){
                mapping = [
                    {type:'numberFacet'},
                    {type:'number'}
                ]
            }
            if(mapping){
                addNestedMapping(field.path.split("."),mappings,mapping);
            }
        })
    }
    if(fields.text.length>0){
        fields.text.forEach((field) => {
            const mapping = [{type:'string',analyzer:'lucene.standard'}]
            mappings.fields[field.path] = mapping;
        });
    }
    if(fields.autocomplete.length>0){
        fields.autocomplete.forEach((field) => {
            if(mappings.fields[field.path]){
                mappings.fields[field.path].push({type:'autocomplete'});
            }else{
                mappings.fields[field.path] = [{type:'autocomplete'}];
            }
        });
    }

    if(fields.text.length>0 || fields.autocomplete.length>0){
        //Do not use mappings if text fields defined.
        mappings.dynamic = false;
    }else{
        //Use dynamic mappings if no text fields defined. This ensures we get results for test queries.
        mappings.dynamic = true;
    }

    return mappings;
}