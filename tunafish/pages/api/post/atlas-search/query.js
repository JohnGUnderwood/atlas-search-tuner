import { MongoClient, BSON } from "mongodb";

function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
  
    return true;
  }

function buildQueryFromWeights(terms,weights,filter){
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
          must:[],
        }
      }
    }

    if(filter){
        console.log(filter);
        const type = filter.name.split('_')[0];
          // Fieldname might have '_' in it
        const path = filter.name.split('_').slice(1).join('_');
        console.log(type,path,filter.value);
        if(type == 'date'){
            searchStage['$search']['compound']['filter'] = [
                {
                    equals:{
                        value:new Date(filter.value),
                        path:path
                    }
                }
            ]
        }else if(type == 'number'){
            searchStage['$search']['compound']['filter'] = [
                {
                    equals:{
                        value:parseFloat(filter.value),
                        path:path
                    }
                }
            ]
        }else if(type == 'string'){
            searchStage['$search']['compound']['filter'] = [
                {
                    text:{
                        query:filter.value,
                        path:path
                    }
                }
            ]
        }
        
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
                searchStage['$search']['compound']['must'].push(
                    {
                        text:{
                            query:terms,
                            path:field,
                            score:{boost:{value:finalWeight}}
                        }
                    }
                )
            }else if(type == "autocomplete"){
                searchStage['$search']['compound']['must'].push(
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

    if(searchStage['$search']['compound']['must'].length == 0){
        if(terms != ""){
            searchStage['$search'].compound.must.push({text:{query:terms,path:{wildcard:"*"}}})
        }else{
            searchStage['$search'].compound.must.push({wildcard:{query:"*",path:{wildcard:"*"},allowAnalyzedField: true}})
        }
    }

    var searchMetaStage = {
        $searchMeta:{
            facet:{
                operator:JSON.parse(JSON.stringify(searchStage['$search'])),
                facets:{}
            }
        }
    }

    let facetTypes = Object.keys(weights).filter(type => !['text','autocomplete'].includes(type));
    facetTypes.forEach((type) => {
        let fields = Object.keys(weights[type]);
        fields.forEach((field) => {
            if(type == 'stringFacet'){
                searchMetaStage['$searchMeta']['facet']['facets']['string_'+field]= {
                    type : "string",
                    path : field,
                    numBuckets : parseInt(weights[type][field]),
                }
            }else if(type == "numberFacet"){
                const boundaries = weights[type][field].split(',').map(w => parseInt(w));
                searchMetaStage['$searchMeta']['facet']['facets']['number_'+field]= {
                    type : "number",
                    path : field,
                    boundaries : boundaries,
                    default: "other"
                }
            }else if(type == "dateFacet"){
                const boundaries = weights[type][field].split(',').map(w => new Date(w));
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

function buildFacetQueryFromFields(fields){
    var searchOperator = {
        compound:{
            should:[ ]
        }
    }

    let types = Object.keys(fields);

    if(!types.includes('string')){
        searchOperator.compound.should.push({wildcard:{query:"*",path:{wildcard:"*"},allowAnalyzedField: true}})
    }else{
        searchOperator = {
            compound:{
                should:[ 
                    {
                        wildcard:{
                            query:"*",
                            path:fields.string.map(field => {field.path}),
                            allowAnalyzedField: true
                        }
                    }
                ]
            }
        }
    }

    var facets = {}

    if(types.includes('facet')){
        fields.facet.forEach(field => {
            if(field.types.includes('String')){
                facets[field.path] = {
                    type:"string",
                    path:field.path
                }
            }else if(field.types.includes('Number')){
                facets[field.path] = {
                    type:"number",
                    path:field.path,
                    boundaries:[0,5,10,100,1000,10000,100000],
                    default:"other"
                }
            }
        })
    }

    const searchStage = {
        $searchMeta:{
            facet:{
                operator:searchOperator,
                facets:facets
            }
        }
    }
    return searchStage;
}

function buildProjectionFromWeights(weights){
    var projectStage = {$project:{_id:0}}

    if(weights === undefined || isEmpty(weights)){
        return projectStage;
    }else{
        const types = Object.keys(weights)

        types.forEach((type)=>{
            const fields = Object.keys(weights[type])
            fields.forEach((field)=>{
                projectStage['$project'][field]=1
            })
        })

        return projectStage;
    }

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
                        const filter = req.body.filter? req.body.filter : null;
                        
                        const limit = req.query.rpp? parseInt(req.query.rpp) : 6;
                        const skip = req.query.page? parseInt(req.query.page-1)*limit : 0;

                        const query = buildQueryFromWeights(terms,weights,filter);
                        var searchStage = query.searchStage;
                        var searchMetaStage = query.searchMetaStage;
                        searchStage['$search']['index'] = index;
                        searchMetaStage['$searchMeta']['index']=index;

                        const projectStage = buildProjectionFromWeights(weights);

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
                            const facets = await getResults(client,req.body.connection,[searchMetaStage])
                            res.status(200).json({results:response,facets:facets[0].facet,query:query});
                        }catch(error){
                            res.status(405).json({'error':error,query:query});
                        }

                    }else if(req.body.fields){
                        const fields = req.body.fields;
                        if(req.body.type == "facet"){
                            const searchStage = buildFacetQueryFromFields(fields);
                            searchStage['$searchMeta']['index'] = index;
                            const pipeline = [
                                searchStage
                                ]
                            console.log(JSON.stringify(pipeline))
                            try{
                                const response = await getResults(client,req.body.connection,pipeline)
                                res.status(200).json(response[0]);
                            }catch(error){
                                console.log(JSON.stringify(pipeline))
                                res.status(405).send(error);
                            }
                        }else if(req.body.type == "text"){
                            const projectStage = {$project:{"_id":1}};
                            const textFields = fields.text.map(field => field.path);
                            const autocompleteFields = fields.autocomplete.map(field => field.path);
                            const fieldPaths = textFields.concat(autocompleteFields);
                            fieldPaths.forEach(field => {
                                projectStage['$project'][field]=1;
                            });
                            const pipeline =[
                                {$limit:1},
                                projectStage,
                            ];
                            console.log(JSON.stringify(pipeline))
                            try{
                                const response = await getResults(client,req.body.connection,pipeline)
                                res.status(200).json(response);
                            }catch(error){
                                console.log(JSON.stringify(pipeline))
                                res.status(405).send(error);
                            }
                        }else{
                            res.status(400).send(`Request body 'type' parameter missing, undefined, or not allowed`);
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