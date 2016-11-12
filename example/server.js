'use strict';

// Create an express http server that will host our API
var app = require('express')();

// Change this if you want to listen on a different port
var port = 8001;

// Our sweet bunyan based logger
var log = require('fh-bunyan').getLogger('mongodb adapter example');

// This enables us to create RESTful route handlers
var fhRestRouter = require('fh-rest-express-router');

// MongoDB adapater that can be used by instances of fh-rest-express-router
var fhRestMongoAdapter = require('../lib/adapter');

// Our MongoDB adapter for the "mobile_users" table
var itemsMongoAdapter = fhRestMongoAdapter({
  collection: 'items',
  pk: 'owner'
});

// Expose the "mobile_users" table as "/users"
app.use(
  '/items',
  fhRestRouter({
    name: 'items',
    adapter: itemsMongoAdapter
  })
);

// Start listening for http requests
app.listen(port, function (err) {
  if (err) {
    throw err;
  }

  log.info('fh-rest-mongodb-adapter example listening on %s', port);
});
