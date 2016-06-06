var elasticsearch=require('elasticsearch');
var getJSON = require('get-json');

var client=new elasticsearch.Client( {
  hosts: [
    'https://[username]:[password]@[server_name]:[port]/',
    'https://[username]:[password]@[server_name]:[port]/'
  ],
  maxSockets:50
});

var inputfile = require("./constituencies.json");
var bulk = [];

var makebulk = function(constituencylist,callback){
  for (var current in constituencylist){
    console.log(constituencylist[current].ConstituencyName);

    bulk.push(
      { index: {_index: 'gov', _type: 'constituencies', _id: constituencylist[current].PANO } },
      {
        'constituencyname': constituencylist[current].ConstituencyName,
        'constituencyID': constituencylist[current].ConstituencyID,
        'constituencytype': constituencylist[current].ConstituencyType,
        'electorate': constituencylist[current].Electorate,
        'validvotes': constituencylist[current].ValidVotes,
        'regionID': constituencylist[current].RegionID,
        'county': constituencylist[current].County,
        'region': constituencylist[current].Region,
        'country': constituencylist[current].Country
      }
    );
  }
  callback(bulk);
}

var indexall = function(madebulk,callback) {
  client.bulk({
    maxRetries: 5,
    index: 'gov',
    type: 'constituencies',
    body: madebulk
  },function(err,resp,status) {
      if (err) {
        console.log(err);
      }
      else {
        callback(resp.items);
      }
  })
}

makebulk(inputfile,function(response){
  console.log("made bulk");
  indexall(response,function(response){
    console.log(response);
  })
});
