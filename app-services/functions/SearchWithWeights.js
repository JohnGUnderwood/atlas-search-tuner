// This function is the endpoint's request handler.
exports = function({ query, headers, body}, response) {
    // Data can be extracted from the request as follows:

    // Query params, e.g. '?arg1=hello&arg2=world' => {arg1: "hello", arg2: "world"}
    const {terms} = query;

    // Headers, e.g. {"Content-Type": ["application/json"]}
    // const contentTypes = headers["Content-Type"];

    // Raw request body (if the client sent one).
    // This is a binary object that can be accessed as a string using .text()
    const reqBody = JSON.parse(body.text());
    const weights = reqBody.weights;

    console.log("terms: ", terms);
    
    let fields = Object.keys(weights);
    fields.forEach((field) => console.log("field, weight: ",field, weights[field]));

    // You can use 'context' to interact with other application features.
    // Accessing a value:
    // var x = context.values.get("value_name");

    // Querying a mongodb service:
    const collection = context.services.get("mongodb-atlas").db("sample_mflix").collection("movies");

    // Calling a function:
    // const result = context.functions.execute("function_name", arg1, arg2);

    // The return value of the function is sent as the response back to the client
    // when the "Respond with Result" setting is set.
    
    var searchStage = {
      $search:{
        compound:{
          should:[],
        }
        
      }
    }
    
    fields.forEach((field) => {
      const weight = parseInt(weights[field]);
      var finalWeight;
      if(weight >= 0){
        finalWeight = weight+1;
      }else{
        finalWeight = -1/weight
      }
      searchStage['$search']['compound']['should'].push(
        {
          text:{
            query:terms,
            path:field,
            score:{boost:{value:finalWeight}}
          }
        }
      )
    });

    const results = collection.aggregate(
      [
        searchStage,
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
    
    return  results;
};
