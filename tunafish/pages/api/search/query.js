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

export default function handler(req, res) {

    if(!req.query.conn || !req.query.coll || !req.query.db){
        res.status(400).json({error:"Missing Connection Details!"})
    }

    const terms = req.query.terms? req.query.terms : "" ;
    const weights = req.body.weights;
    
    // let types = Object.keys(weights);
    // types.forEach((type) => {
    //     let fields = Object.keys(weights[type]);
    //     fields.forEach((field) => console.log("type, field, weight: ",type,field,weights[type][field]))
    // });
  
    const query = buildQuery(terms,weights);

    // connect to your Atlas deployment
    const uri =  req.query.conn;
  
    const client = new MongoClient(uri);
  
    async function run() {
      try {
        const database = client.db(req.query.db);
        const collection = database.collection(req.query.coll);
        
        try{
            const results = await collection.aggregate(
                [
                    query.searchStage,
                    {
                        $project:{
                            title:1,
                            plot:1,
                            genres:1,
                            year:1,
                            cast:1,
                            score: { $round : [ {$meta:"searchScore"}, 2 ] }
                        }
                    },
                    {
                        $limit:5
                    }
                ]
            ).toArray();
            res.status(200).json({results:results,query:query});
        }catch (error){
            res.status(400).json({'error':error,query:query})
        }
      } finally {
        await client.close();
      }
    }
    run().catch(console.dir);
  }