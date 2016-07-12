'use strict';

var isObject = require('is-object')
  , VError = require('verror')
  , assert = require('assert')
  , async = require('async');

module.exports = function (opts, callback) {
  /* istanbul ignore else */
  if (opts.indexes) {
    assert(
      Array.isArray(opts.indexes),
      'opts.indexes must be an Array of non-empty Objects'
    );

    opts.indexes.forEach(function (idx) {
      assert(
        isObject(idx),
        'opts.indexes must be an Array of non-empty Objects'
      );
    });

    applyIndexes(opts, callback);
  }
};

function applyIndexes (opts, callback) {
  var db = require('./db')(opts);

  db.getCollection(opts.collection, onCollection);

  function onCollection (err, coll) {
    if (err) {
      callback(new VError(err, 'could not load collection'), null);
    } else {
      async.eachSeries(opts.indexes, function applyIndex (idx, next) {
        coll.ensureIndex(idx, function onIndex (err) {
          if (err) {
            next(new VError(err, 'failed to apply index %j', idx));
          } else {
            next();
          }
        });
      }, callback);
    }
  }
}
