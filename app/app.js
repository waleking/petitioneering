/*eslint-env node*/

//------------------------------------------------------------------------------
// Petitioneering - based on node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// The app's functions are in functions.js
var functions = require('./functions.js');

// Use Jade (now known as Pug) as the template engine
app.set('view engine', 'jade');
app.set('views', __dirname + '/public/views');

// Compile a list of constituencies on page load
app.get('/', function(request, response) {
  functions.getconstituencies(function(constituencyList){
    if(constituencyList){
      response.render('index', {
          constituencies: constituencyList
      });
    }
  });
});

// Respond to a search request from a user
app.get('/search', function(request, response) {
  if (!request.query.postcode && !request.query.constituency) {
    response.send("<p>Please enter a postcode or parliamentary constituency</p>");
  }
  if (request.query.postcode){
    functions.getresults(request.query.postcode, function(htmllist) {
      response.send(htmllist);
    });
  }
  if (request.query.constituency) {
    functions.results(request.query.constituency, function(htmllist){
      response.send(htmllist);
    });
  }
});
