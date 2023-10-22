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
        //Use dynamice mappings if no text fields defined. This ensures we get results for test queries.
        mappings.dynamic = true;
    }

    return mappings;
}