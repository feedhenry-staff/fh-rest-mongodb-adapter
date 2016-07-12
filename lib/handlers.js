'use strict';

var VError = require('verror');

module.exports = function (opts) {
  var db = require('./db')(opts)
    , handlers = {};

  // We only update single records, and only if they exist
  var updateOpts = {
    upsert: false,
    multi: false
  };

  handlers.doMongoUpdate = function doMongoUpdate (coll, params, callback) {
    db.ensureObjectId(params.id, onMongoId);

    function onMongoId (err, id) {
      if (err) {
        callback(
          new VError(err, 'invalid ObjectId "%s" passed to update', params.id),
          null
        );
      } else {
        coll.update({
          _id: id
        }, params.data, updateOpts, callback);
      }
    }
  };

  handlers.doMongoCreate = function doMongoCreate (coll, params, callback) {
    coll.insert(params.data, function onMongoInsert (err, res) {
      if (err) {
        callback(new VError(err, 'failed to perform insert'));
      } else {
        var ret = {};

        // Save the created _id as "uid"
        ret.uid = res.ops[0]._id;
        // Add data to result
        ret.data = res.ops[0];

        // Remove uid from result.data
        delete ret.data._id;

        callback(null, ret);
      }
    });
  };

  handlers.doMongoRead = function doMongoRead (coll, params, callback) {
    db.ensureObjectId(params.id, function onMongoIdForRead (err, id) {
      if (err) {
        callback(new VError(err, 'unable to parse to _id'), null);
      } else {
        coll.findOne({
          _id: id
        }, {
          // Don't return the _id, important!
          _id: false
        }, callback);
      }
    });
  };

  handlers.doMongoDelete = function doMongoDelete (coll, params, callback) {
    var ret = null;

    handlers.doMongoRead(coll, params, onRead);

    function onRead (err, oldData) {
      if (err) {
        callback(new VError(err, 'delete failed, could not read old object'));
      } else if (!oldData) {
        callback(null, null);
      } else {
        ret = oldData;

        db.ensureObjectId(params.id, onMongoIdForDelete);
      }
    }

    function onDelete (err) {
      if (err) {
        callback(new VError(err, 'failed to run mongo.delete'), null);
      } else {
        callback(null, ret);
      }
    }

    function onMongoIdForDelete (err, id) {
      if (err) {
        callback(
          new VError(err, 'invalid ObjectId "%s" passed to delete', params.id),
          null
        );
      } else {
        coll.remove({
          _id: id
        }, onDelete);
      }
    }
  };

  handlers.doMongoList = function doMongoList (coll, params, callback) {
    function onListData (err, list) {
      if (err) {
        callback(new VError(err, '"find" call returned error'), null);
      } else {
        var ret = {}
          , len = list.length;

        // Convert list to mongo format
        for (var i = 0; i < len; i++) {
          ret[list[i]._id] = list[i];
          delete list[i]._id;
        }

        callback(null, ret);
      }
    }

    coll.find(params.query).toArray(onListData);
  };

  return handlers;
};
