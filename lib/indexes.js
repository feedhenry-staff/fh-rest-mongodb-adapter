'use strict';

const isObject = require('is-object');
const VError = require('verror');
const assert = require('assert');
const async = require('async');
const xtend = require('xtend');
const log = require('./log');


module.exports = function (opts, callback) {
  log.info('applying indexes if required');

  const db = require('./db')(opts);

  function dropAllIndexes (done) {
    log.warn('dropping existing indexes on "%s"', opts.collection);

    db.getCollection(opts.collection, function drop (err, col) {
      if (err) {
        done(err);
      } else {
        col.dropIndexes(done);
      }
    });
  }

  function doUserIndexes (done) {
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

      log.info('applying indexes "%j"', opts.indexes);

      applyIndexes(opts, {}, done);
    } else {
      done();
    }
  }

  function doPkIndex (done) {
    log.info('applying unique index for "pk" of "%s"', opts.pk);
    if (opts.pk !== '_id') {
      const pkIdx = [{
        [opts.pk]: 1
      }];

      applyIndexes(xtend(opts, {
        indexes: pkIdx
      }), {
        unique: true
      }, done);
    } else {
      done();
    }
  }

  function applyIndexes (opts, modifiers, callback) {
    db.getCollection(opts.collection, onCollection);

    function onCollection (err, coll) {
      if (err) {
        callback(new VError(err, 'could not load collection'), null);
      } else {
        async.eachSeries(opts.indexes, function applyIndex (idx, next) {
          log.info('ensure index with idx %j and opts %j', idx, modifiers);
          coll.createIndex(idx, modifiers, function onIndex (err) {
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

  async.series([dropAllIndexes, doUserIndexes, doPkIndex], callback);
};
