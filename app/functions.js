var client=require ('./connection.js');
var getJSON = require('get-json');

function results (constitLookup,callback) {
  client.search({
    index: 'gov',
    type: 'petitions',
    fields: ['action','signature_count'],
    body: {
      query: {
        bool: {
          must: [
            { match: { 'state': 'open' }},
            { range : {
                  'signature_count' : {
                      'gte' : 10000
                  }
              }
            },
            { nested: {
              path: 'signatures_by_constituency',
              query: {
                bool: {
                  must: [
                    { 'match': { 'signatures_by_constituency.name': constitLookup }}
                  ]
                }
              }
            }}
          ]
        }
      },
      sort: {
        'signatures_by_constituency.importance' : {
          order: 'desc',
          nested_path: 'signatures_by_constituency',
          nested_filter: {
            query: {
              bool: {
                must: [
                  { 'match': { 'signatures_by_constituency.name': constitLookup }}
                ]
              }
            }
          }
        },
        'signatures_by_constituency.signature_count' : {
          order: 'desc',
          nested_path: 'signatures_by_constituency',
          nested_filter: {
            query: {
              bool: {
                must: [
                  { 'match': { 'signatures_by_constituency.name': constitLookup }}
                ]
              }
            }
          }
        }
      }
    }
  },function (error, response, status) {
      if (error){
        console.log("search error: "+error)
      }
      else {
        makehtmllist(constitLookup,response.hits.hits,function(response){
          callback(response);
        });
      }
    });
}

function getconstituency(postcode,callback) {
  getJSON('https://api.postcodes.io/postcodes/'+postcode, function(error, response){
    if(error) {
      console.log(error);
    }
    else {
      console.log(response);
      results(response.result.parliamentary_constituency,function(response){
        callback(response);
      });

    }
  });
}

function validatepc(postcode, callback) {
  getJSON('https://api.postcodes.io/postcodes/'+postcode+'/validate',function(error,response){
      if(response.result){
        getconstituency(postcode,function(response){
          callback(response);
        });
      }
      else {
        console.log("Please enter a valid postcode");
      }
  });
}

function getresults(userinput, cb) {
  console.log("results starting...");
  var results = validatepc(userinput,function(response){
    cb(response);
  });
}

function makehtmllist(constituency,results,callback) {
  var htmllist = '<h2>Results for '+constituency+'</h2><ol class="petition-results">';
  results.forEach(function(petitiondetails){
    htmllist+='<li><span class="list-item-head"><a href="https://petition.parliament.uk/petitions/'+petitiondetails._id+'">'+petitiondetails.fields.action+'</a></span><span class="list-item-info">'+petitiondetails.sort[1]+' signatures from a total of '+petitiondetails.fields.signature_count+' </span></li>';
  })
  htmllist+='</ol>';
  callback(htmllist);
}

function getconstituencies(callback){
  client.search({
    index: 'gov',
    type: 'constituencies',
    size: 650,
    fields: 'constituencyname',
    body: {
      sort:
        {
          "constituencyname": {
            order: "asc"
          }
        }
    }
  },function (error, response,status) {
      if (error){
        console.log("search error: "+error)
      }
      if (response){
        var constitlist = [];
        response.hits.hits.forEach(function(hit){
          constitlist.push(hit.fields.constituencyname);
        })
        callback(constitlist.sort());
      }
      else {
        console.log("<p>No results</p>");
      }
  });
}


module.exports = {
  getresults: getresults,
  getconstituencies: getconstituencies,
  results: results
};
