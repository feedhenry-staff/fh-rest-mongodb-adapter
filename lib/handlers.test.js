'use strict';

var expect = require('chai').expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire');

describe(__filename, function () {

  var mod, collectionStubs, stubs, ensureObjectIdStub;

  beforeEach(function () {
    collectionStubs = {
      findAndModify: sinon.stub(),
      insert: sinon.stub(),
      findOne: sinon.stub(),
      find: sinon.stub(),
      remove: sinon.stub()
    };

    stubs = {
      './db': sinon.spy(function () {
        ensureObjectIdStub = sinon.stub();
        return {
          ensureObjectId: ensureObjectIdStub
        };
      })
    };

    mod = proxyquire('./handlers.js', stubs)({
      pk: '_id'
    });
  });

  describe('#doMongoUpdate', function () {
    it('should return an error, _id parse fail', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(new Error('bad id...'));

      mod.doMongoUpdate(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('bad id');
        done();
      });
    });

    it('should handle custom pk', function (done) {
      var mod = proxyquire('./handlers.js', stubs)({
        pk: 'username'
      });

      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      collectionStubs.findAndModify.yields(null, {
        value: {
          key: 'value',
          username: '123'
        }
      });

      mod.doMongoUpdate(collectionStubs, params, function (err) {
        expect(err).to.not.exist;
        expect(collectionStubs.findAndModify.getCall(0).args[2]).to.eql({
          key: 'value',
          username: '123'
        });
        done();
      });
    });

    it('should return an error, mongo call fail', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(null, params.id);
      collectionStubs.findAndModify.yields(
        new Error('cannot connect, or similar')
      );

      mod.doMongoUpdate(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('cannot connect, or similar');
        done();
      });
    });

    it('should run successfully', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(null, params.id);
      collectionStubs.findAndModify.yields(null, {
        value: params.data
      });

      mod.doMongoUpdate(collectionStubs, params, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.deep.equal(params.data);
        done();
      });
    });
  });

  describe('doMongoCreate', function () {
    it('should return an error, mongo call fail', function (done) {
      var params = {
        data: {
          key: 'value'
        }
      };

      collectionStubs.insert.yields(new Error('cannot connect, or similar'));

      mod.doMongoCreate(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('cannot connect, or similar');
        done();
      });
    });

    it('should run successfully', function (done) {
      var params = {
        data: {
          key: 'value'
        }
      };

      var ret = {
        uid: '12345',
        data: params.data
      };

      var mongoRes = {
        ops: [{
          _id: '12345',
          key: 'value'
        }]
      };

      collectionStubs.insert.yields(null, mongoRes);

      mod.doMongoCreate(collectionStubs, params, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.deep.equal(ret);
        done();
      });
    });
  });

  describe('doMongoRead', function () {
    it('should return an error, _id parse fail', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(new Error('bad id...'));

      mod.doMongoRead(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('bad id');
        done();
      });
    });


    it('should run successfully', function (done) {
      var id = '12345';
      var ret = {
        name: 'val'
      };

      ensureObjectIdStub.yields(null, '12345');

      collectionStubs.findOne.yields(null, ret);

      mod.doMongoRead(collectionStubs, {
        id: id
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.deep.equal(ret);
        done();
      });
    });
  });

  describe('doMongoDelete', function () {
    it('should return an error, _id parse fail for read', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(new Error('bad id...'));

      mod.doMongoDelete(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('bad id');
        done();
      });
    });

    it('should return an error, _id parse fail for delete', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.onCall(0).yields(null, params.id);
      ensureObjectIdStub.onCall(1).yields(new Error('bad id 2...'), null);

      collectionStubs.findOne.yields(null, params.data);

      mod.doMongoDelete(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('bad id 2');
        done();
      });
    });

    it('should return an error, read for delete fail', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(null, params.id);

      collectionStubs.findOne.yields(new Error('read fail'));

      mod.doMongoDelete(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('read fail');
        done();
      });
    });

    it('should return null, id does not exist', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(null, params.id);

      collectionStubs.findOne.yields(null, null);

      mod.doMongoDelete(collectionStubs, params, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.not.exist;
        done();
      });
    });

    it('should return delete error', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(null, params.id);

      collectionStubs.findOne.yields(null, params.data);

      collectionStubs.remove.yields(new Error('oh noes'), null);

      mod.doMongoDelete(collectionStubs, params, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('oh noes');
        done();
      });
    });

    it('should return deleted object', function (done) {
      var params = {
        id: '123',
        data: {
          key: 'value'
        }
      };

      ensureObjectIdStub.yields(null, params.id);

      collectionStubs.findOne.yields(null, params.data);

      collectionStubs.remove.yields(null, null);

      mod.doMongoDelete(collectionStubs, params, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.deep.equal(params.data);
        done();
      });
    });
  });

  describe('doMongoList', function () {
    it('should return an error', function (done) {
      var query = {
        name: 'john'
      };

      var fStub = {
        toArray: sinon.stub()
      };

      fStub.toArray.yields(new Error('oops'));

      collectionStubs.find.returns(fStub);

      mod.doMongoList(collectionStubs, {
        query: query
      }, function (err) {
        expect(err).to.exist;
        expect(err.toString()).to.contain('oops');
        expect(collectionStubs.find.getCall(0).args[0]).to.deep.equal(query);
        done();
      });
    });

    it('should return a list', function (done) {
      var query = {
        name: 'john'
      };

      var res = [query];

      var fStub = {
        toArray: sinon.stub()
      };

      fStub.toArray.yields(null, res);

      collectionStubs.find.returns(fStub);

      mod.doMongoList(collectionStubs, {
        query: query
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.deep.equal(res);
        expect(collectionStubs.find.getCall(0).args[0]).to.deep.equal(query);
        done();
      });
    });
  });


});
