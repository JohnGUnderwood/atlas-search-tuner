import { MongoClient, BSON } from "mongodb";

function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
  
    return true;
  }

function buildQuery(terms,weights,facets,filters){
    var msg = [];
    if(weights === undefined || isEmpty(weights)){
        msg.push('No field weights defined. Searched using wildcard')
        return {
            searchStage:{
                $search:{
                    text:{
                        query:terms,
                        path:{wildcard:"*"}
                    }
                }
            },
            msg:msg
        };
    }

    var searchStage = {
      $search:{
        compound:{
          should:[],
          minimumShouldMatch:1
        }
      }
    }

    if(filters){
        searchStage['$search']['compound']['filter'] = []
        filters.forEach(filter => {
            const type = filter.name.split('_')[0];
            // Fieldname might have '_' in it
            const path = filter.name.split('_').slice(1).join('_');
            if(type == 'date'){
                searchStage['$search']['compound']['filter'].push(
                    {
                        equals:{
                            value:new Date(filter.value),
                            path:path
                        }
                    }
                )
            }else if(type == 'number'){
                searchStage['$search']['compound']['filter'].push(
                    {
                        equals:{
                            value:parseFloat(filter.value),
                            path:path
                        }
                    }
                )
            }else if(type == 'string'){
                searchStage['$search']['compound']['filter'].push(
                    {
                        text:{
                            query:filter.value,
                            path:path
                        }
                    }
                )
            }
        });
        
    }
    
    let stringTypes = Object.keys(weights).filter(type => ['text','autocomplete'].includes(type));
    stringTypes.forEach((type) => {
        let fields = Object.keys(weights[type]);
        fields.forEach((field) => {
            const weight = parseInt(weights[type][field]);
            var finalWeight;
            if(weight >= 0){
                finalWeight = weight+1;
            }else{
                finalWeight = -1/weight
            }
            if(type == 'text'){
                searchStage['$search']['compound']['should'].push(
                    {
                        text:{
                            query:terms,
                            path:field,
                            score:{boost:{value:finalWeight}}
                        }
                    }
                )
            }else if(type == "autocomplete"){
                searchStage['$search']['compound']['should'].push(
                    {
                        autocomplete:{
                            query:terms,
                            path:field,
                            score:{boost:{value:finalWeight}}
                        }
                    }
                )
            }else{
                msg.push(`${type} is ignored. Field path '${field}' not used for search.`)
            }
        });
    });

    if(searchStage['$search']['compound']['should'].length == 0){
        if(terms != ""){
            searchStage['$search'].compound.must.push({text:{query:terms,path:{wildcard:"*"}}})
        }else{
            searchStage['$search'].compound.must.push({wildcard:{query:"*",path:{wildcard:"*"},allowAnalyzedField: true}})
        }
    }

    var searchMetaStage = {
        $searchMeta:{
            facet:{
                operator:{...searchStage['$search']},
                facets:{}
            }
        }
    }

    if(facets === undefined || isEmpty(facets)){
        return {searchStage:searchStage,msg:msg};
    }else{
        let facetTypes = Object.keys(facets).filter(type => ['stringFacet','numberFacet','dateFacet'].includes(type));
        facetTypes.forEach((type) => {
            let fields = Object.keys(facets[type]);
            fields.forEach((field) => {
                if(type == 'stringFacet'){
                    searchMetaStage['$searchMeta']['facet']['facets']['string_'+field]= {
                        type : "string",
                        path : field,
                        numBuckets : parseInt(facets[type][field]),
                    }
                }else if(type == "numberFacet"){
                    const boundaries = facets[type][field].split(',').map(w => parseInt(w));
                    searchMetaStage['$searchMeta']['facet']['facets']['number_'+field]= {
                        type : "number",
                        path : field,
                        boundaries : boundaries,
                        default: "other"
                    }
                }else if(type == "dateFacet"){
                    const boundaries = facets[type][field].split(',').map(w => new Date(w));
                    searchMetaStage['$searchMeta']['facet']['facets']['date_'+field]= {
                        type : "date",
                        path : field,
                        boundaries : boundaries,
                        default: "other"
                    }
                }else{
                    msg.push(`${type} is ignored. Field path '${field}' not used for search.`)
                }
            });
        });
        return {searchStage:searchStage,searchMetaStage:searchMetaStage,msg:msg};
    }

    

    // if(Object.keys(searchMetaStage['$searchMeta']['facet']['facets']).length>0){
    //     return {searchStage:searchStage,searchMetaStage:searchMetaStage,msg:msg};
    // }else{
    //     return {searchStage:searchStage,msg:msg};
    // }
}

function buildFacetQueryFromFields(fields){
    var facets = {}
    if(fields.facet.length>0){
        fields.facet.forEach(field => {
            if(field.type == 'String'){
                facets[field.path] = {
                    type:"string",
                    path:field.path
                }
            }else if(field.type == 'Number'){
                facets[field.path] = {
                    type:"number",
                    path:field.path,
                    boundaries:[0,5,10,100,1000,10000,100000],
                    default:"other"
                }
            }
        })
        const searchStage = {
            $searchMeta:{
                facet:{
                    operator:{wildcard:{query:"*",path:{wildcard:"*"},allowAnalyzedField: true}},
                    facets:facets
                }
            }
        }
        return searchStage;
    }else{
        return null;
    }
}

function buildProjection(weights,filters,facets){
    var projectStage = {$project:{_id:0}}

    if(weights != undefined && !isEmpty(weights)){
        const types = Object.keys(weights)

        types.forEach((type)=>{
            const fields = Object.keys(weights[type])
            fields.forEach((field)=>{
                projectStage['$project'][field]=1
            })
        })
    }
    if(facets != undefined && !isEmpty(facets)){
        const types = Object.keys(facets)

        types.forEach((type)=>{
            const fields = Object.keys(facets[type])
            fields.forEach((field)=>{
                projectStage['$project'][field]=1
            })
        })
    }
    if(filters != undefined && filters.length>0){
        filters.forEach((filter)=>{
            const field = filter.name.split('_').toSpliced(0,1).join('_')
            projectStage['$project'][field]=1
        })
    }

    return projectStage;

}

async function getResults(client,conn,pipeline){
    try{
        const collection = client.db(conn.database).collection(conn.collection)
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    }catch(error){
        throw error
    }
}

export default async function handler(req, res) {
    if(!req.method === "POST"){
        console.log(`Method ${req.method} not allowed`)
        res.status(405).send(`Method ${req.method} not allowed`);
    }else if(!req.body.connection){
        console.log(`Request body missing connection parameter`)
        res.status(400).send(`Request body missing connection parameter`);
    }else{
        if(!req.body.connection.uri || !req.body.connection.database|| !req.body.connection.collection || !req.body.index){
            res.status(400).json({error:"Missing Connection Details!"});
        }else{
            try{
                const client = new MongoClient(req.body.connection.uri);
                try{
                    const index = req.body.index;

                    if(req.body.weights){
                        const terms = req.query.terms? req.query.terms : "" ;
                        const weights = req.body.weights;
                        const facets = req.body.facets;
                        const filters = req.body.filters? req.body.filters : null;
                        
                        const limit = req.query.rpp? parseInt(req.query.rpp) : 6;
                        const skip = req.query.page? parseInt(req.query.page-1)*limit : 0;

                        const query = buildQuery(terms,weights,facets,filters);
                        var searchStage = query.searchStage;
                        searchStage['$search']['index'] = index;

                        const projectStage = buildProjection(weights,filters,facets);

                        const pipeline = [
                            searchStage,
                            projectStage,
                            {
                                $addFields:{
                                    score: { $round : [ {$meta:"searchScore"}, 4 ] }
                                }
                            },
                            {
                                $skip:skip
                            },
                            {
                                $limit:limit
                            }
                        ]
            
                        try{
                            const response = await getResults(client,req.body.connection,pipeline)
                            if('searchMetaStage' in query){
                                var searchMetaStage = query.searchMetaStage;
                                searchMetaStage['$searchMeta']['index']=index;
                                const facets = await getResults(client,req.body.connection,[searchMetaStage])
                                if(facets.length>0){
                                    res.status(200).json({results:response,facets:facets[0].facet,query:query});
                                }else{
                                    res.status(200).json({results:response,facets:[],query:query});
                                }
                            }else{
                                res.status(200).json({results:response,query:query});
                            }
                        }catch(error){
                            res.status(405).json({'error':error,query:query});
                        }

                    }else if(req.body.fields){
                        const fields = req.body.fields;

                        const textFields = fields.text.map(field => field.path);
                        const autocompleteFields = fields.autocomplete.map(field => field.path);
                        const fieldPaths = textFields.concat(autocompleteFields);
                        var projectStage = {$project:{"_id":1}};
                        fieldPaths.forEach(field => {
                            projectStage['$project'][field]=1;
                        });

                        const facetStage = buildFacetQueryFromFields(fields);

                        var facets = [];
                        var results = [];
                        try{
                            if(facetStage){
                                facetStage['$searchMeta']['index'] = index;
                                facets = await getResults(client,req.body.connection,[facetStage]);
                                facets = facets[0].facet
                            }
                            results = await getResults(client,req.body.connection,[{$limit:1},projectStage])
                        }catch(error){
                            res.status(405).send(error);
                        }finally{
                            res.status(200).json({facets:facets,results:results});
                        }

                    }else{
                        res.status(400).send(`Request body missing fields or weights`);
                    }
                }catch(error){
                    console.log(error)
                    res.status(400).send(`${error}`)
                }finally{
                    client.close()
                }
            }catch(error){
              res.status(400).send(`${error}`)
            }
        }

    }
}