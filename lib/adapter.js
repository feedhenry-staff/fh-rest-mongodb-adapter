'use strict';

const log = require('./log');

module.exports = function (opts) {
  // Allow custom primary key, but default to _id as is normal in mongo
  opts.pk = opts.pk || '_id';

  log.debug('creating mongodb adapter for collection "%s"', opts.collection);

  const adapter = {};
  const db = require('./db')(opts);
  const handlers = require('./handlers')(opts);

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

  return adapter;
};
