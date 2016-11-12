'use strict';

const mongo = require('mongo-utils');
const env = require('env-var');
const MONGO_URL = 'mongodb://127.0.0.1:27017/FH_LOCAL';

module.exports = function getDatabaseWrapper (opts) {
  return mongo.getDatabaseManager({
    mongoUrl: opts.mongoUrl || env('FH_MONGODB_CONN_URL', MONGO_URL)
  });
};
