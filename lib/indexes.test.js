'use strict';

var proxyquire = require('proxyquire')
  , expect = require('chai').expect
  , sinon = require('sinon');

describe(__filename, function () {

  var mod, stubs, collectionStub, dbStub;

  beforeEach(function () {
    collectionStub = {
      createIndex: sinon.stub(),
      dropIndexes: sinon.stub()
    };

    dbStub = {
      getCollection: sinon.stub()
    };

    stubs = {
      './db': sinon.spy(function () {
        return dbStub;
      })
    };

    mod = proxyquire('./indexes.js', stubs);
  });

  it('should apply indexes', function (done) {
    dbStub.getCollection.yields(null, collectionStub);
    collectionStub.createIndex.yields(null);
    collectionStub.dropIndexes.yields(null);

    mod({
      indexes: [{
        name: 1
      }],
      pk: '_id'
    }, function (err) {
      expect(err).to.not.exist;
      expect(collectionStub.createIndex.called).to.be.true;
      expect(collectionStub.dropIndexes.calledOnce).to.be.true;
      done();
    });
  });

  it('should not need to apply indexes', function (done) {
    dbStub.getCollection.yields(null, collectionStub);
    collectionStub.createIndex.yields(null);
    collectionStub.dropIndexes.yields(null);

    mod({
      pk: 'username'
    }, function (err) {
      expect(err).to.not.exist;
      expect(collectionStub.createIndex.calledOnce).to.be.true;
      expect(collectionStub.dropIndexes.calledOnce).to.be.true;
      done();
    });
  });

  it('should handle getCollection error', function (done) {
    dbStub.getCollection.yields(new Error('cannot get collection'));

    mod({
      indexes: [{
        name: 1
      }],
      pk: '_id'
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should handle createIndex error', function (done) {
    dbStub.getCollection.yields(null, collectionStub);
    collectionStub.createIndex.yields(new Error('oops'));
    collectionStub.dropIndexes.yields(null);

    mod({
      indexes: [{
        name: 1
      }],
      pk: '_id'
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should handle dropIndexes error', function (done) {
    dbStub.getCollection.yields(null, collectionStub);
    collectionStub.dropIndexes.yields(new Error('oops'));

    mod({
      indexes: [{
        name: 1
      }],
      pk: '_id'
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should handle dropIndexes error', function (done) {
    dbStub.getCollection.yields(null, collectionStub);
    collectionStub.dropIndexes.yields(new Error('oops'));

    mod({
      indexes: [{
        name: 1
      }],
      pk: '_id'
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should handle getCollection error in applyIndexes', function (done) {
    dbStub.getCollection.onCall(0).yields(null, collectionStub);
    dbStub.getCollection.onCall(1).yields(new Error('oops'));
    collectionStub.dropIndexes.yields(null);

    mod({
      indexes: [{
        name: 1
      }],
      pk: '_id'
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

});
