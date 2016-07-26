'use strict';

var Joi = require('joi')
  , log = require('fh-bunyan').getLogger(require('../package.json'));

module.exports = function (opts) {

  log.debug('creating mongodb adapter for collection "%s"', opts.collection);

  var adapter = {}
    , db = require('./db')(opts)
    , handlers = require('./handlers')(opts);

  require('./indexes')(opts, function onIndexes (err) {
    if (err) {
      log.error(err, 'error occurred applying indexes');
    } else {
      log.debug('applied indexes');
    }
  });

  adapter.create = db.composeInteraction(
    opts.collection,
    handlers.doMongoCreate
  );

  adapter.read = db.composeInteraction(
    opts.collection,
    handlers.doMongoRead
  );

  adapter.update = db.composeInteraction(
    opts.collection,
    handlers.doMongoUpdate
  );

  adapter.delete = db.composeInteraction(
    opts.collection,
    handlers.doMongoDelete
  );

  adapter.list = db.composeInteraction(
    opts.collection,
    handlers.doMongoList
  );

  adapter.getJoiValidator = function () {
    // Allow any keys, except $where since it can be used for NoSQL injection
    // https://www.owasp.org/index.php/Testing_for_NoSQL_injection
    return Joi.object({
      '$where': Joi.forbidden()
    }).unknown();
  };

  return adapter;
};
