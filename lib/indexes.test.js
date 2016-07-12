'use strict';

var proxyquire = require('proxyquire')
  , expect = require('chai').expect
  , sinon = require('sinon');

describe(__filename, function () {

  var mod, stubs, collectionStub, dbStub;

  beforeEach(function () {
    collectionStub = {
      ensureIndex: sinon.stub()
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
    collectionStub.ensureIndex.yields(null);

    mod({
      indexes: [{
        name: 1
      }]
    }, function (err) {
      expect(err).to.not.exist;
      expect(collectionStub.ensureIndex.calledOnce).to.be.true;
      done();
    });
  });

  it('should handle getCollection error', function (done) {
    dbStub.getCollection.yields(new Error('cannot get collection'));

    mod({
      indexes: [{
        name: 1
      }]
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should handle ensureIndex error', function (done) {
    dbStub.getCollection.yields(null, collectionStub);
    collectionStub.ensureIndex.yields(new Error('oops'));

    mod({
      indexes: [{
        name: 1
      }]
    }, function (err) {
      expect(err).to.exist;
      done();
    });
  });

});
