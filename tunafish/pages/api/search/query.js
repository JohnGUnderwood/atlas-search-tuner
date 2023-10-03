import { MongoClient } from "mongodb";

function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
  
    return true;
  }

function buildQuery(terms,weights){
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
        }
      }
    }
    
    let types = Object.keys(weights);
    types.forEach((type) => {
        let fields = Object.keys(weights[type]);
        fields.forEach((field) => {
            const weight = parseInt(weights[type][field]);
            var finalWeight;
            if(weight >= 0){
                finalWeight = weight+1;
            }else{
                finalWeight = -1/weight
            }
            if(type == 'string'){
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
        searchStage = {
            $search:{
                text:{
                    query:terms,
                    path:{wildcard:"*"}
                }
            }
        }
    }

    return {searchStage:searchStage,msg:msg};
}

function buildProjection(weights){
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

async function getResults(conn,db,coll,pipeline){
    const client = new MongoClient(conn);
    const collection = client.db(db).collection(coll)
    const results = await collection.aggregate(pipeline).toArray();
    client.close();
    return results;
}

export default async function handler(req, res) {

    const index = req.query.index? req.query.index : "default" ;
    const terms = req.query.terms? req.query.terms : "" ;
    const weights = req.body.weights;

    const query = buildQuery(terms,weights);
    var searchStage = query.searchStage;
    searchStage['$search']['index'] = index;

    const projectStage = buildProjection(weights);

    return new Promise((resolve, reject) => {
        if(!req.query.conn || !req.query.db || !req.query.coll){
            res.status(400).json({error:"Missing Connection Details!"});
            resolve();
        }

        const pipeline = [
            searchStage,
            projectStage,
            {
                $addFields:{
                    score: { $round : [ {$meta:"searchScore"}, 4 ] }
                }
            },
            {
                $limit:5
            }
        ]

        getResults(req.query.conn,req.query.db,req.query.coll,pipeline)
            .then(response => {
                res.status(200).json({results:response,query:query}).end();
                resolve();
            })
            .catch(error => {
                res.json({'error':error,query:query})
                res.status(405).end();
                resolve();
            });

    });
  }