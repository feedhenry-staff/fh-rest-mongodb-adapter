'use strict';

const VError = require('verror');
const log = require('./log');

module.exports = function (opts) {
  const db = require('./db')(opts);
  const handlers = {};

  function parseId (id, callback) {
    if (opts.pk === '_id') {
      log.trace('try parse _id "%s" to ObjectID', id);
      db.ensureObjectId(id, callback);
    } else {
      callback(null, id);
    }
  }

  handlers.doMongoUpdate = function doMongoUpdate (coll, params, callback) {
    parseId(params.id, onMongoId);

    // Don't allow the _id to be changed!
    delete params.data._id;

    function onMongoId (err, id) {

      // Since an update replaces the entire mongo document, we need to ensure
      // a custom primary key is retained!
      if (opts.pk !== '_id' && params.data[opts.pk] === undefined) {
        params.data[opts.pk] = id;
      }

      if (err) {
        callback(
          new VError(err, 'invalid ObjectId "%s" passed to update', params.id),
          null
        );
      } else {
        coll.findAndModify(
          {
            [opts.pk]: id
          },
          {
            // no sorting
          },
          params.data,
          {
            upsert: false,
            new: true
          },
          onUpdated
        );
      }
    }

    function onUpdated (err, res) {
      if (err) {
        callback(new VError(err, 'update failed'));
      } else {
        delete res.value._id;
        delete res.value[opts.pk];
        callback(null, res.value);
      }
    }
  };

  handlers.doMongoCreate = function doMongoCreate (coll, params, callback) {
    coll.insert(params.data, function onMongoInsert (err, res) {
      if (err) {
        callback(new VError(err, 'failed to perform insert'));
      } else {
        const ret = {};

        // Save the created _id as "uid"
        ret.uid = res.ops[0][opts.pk];
        // Add data to result
        ret.data = res.ops[0];

        // Remove _id and primary key from result.data
        delete ret.data._id;
        delete ret.data[opts.pk];

        callback(null, ret);
      }
    });
  };

  handlers.doMongoRead = function doMongoRead (coll, params, callback) {
    parseId(params.id, function onMongoIdForRead (err, id) {
      if (err) {
        callback(new VError(err, 'unable to parse to _id'), null);
      } else {
        coll.findOne({
          [opts.pk]: id
        }, {
          // Don't return the _id, important!
          _id: false,
          [opts.pk]: false
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

        delete oldData._id;
        delete oldData[opts.pk];

        parseId(params.id, onMongoIdForDelete);
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
          [opts.pk]: id
        }, onDelete);
      }
    }
  };

  handlers.doMongoList = function doMongoList (coll, params, callback) {
    function onListData (err, list) {
      if (err) {
        callback(new VError(err, '"find" call returned error'), null);
      } else {
        const ret = {};
        const len = list.length;

        // Convert list to mongo format
        for (let i = 0; i < len; i++) {
          ret[list[i][opts.pk]] = list[i];

          delete list[i]._id;
          delete list[i][opts.pk];
        }

        callback(null, ret);
      }
    }

    coll.find(params.query).toArray(onListData);
  };

  return handlers;
};
