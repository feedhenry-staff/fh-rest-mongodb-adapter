'use strict';

var proxyquire = require('proxyquire')
  , expect = require('chai').expect
  , sinon = require('sinon');

describe(__filename, function () {

  var mod, stubs;

  beforeEach(function () {
    stubs = {
      'mongo-utils': {
        getDatabaseManager: sinon.stub()
      }
    };

    mod = proxyquire('./db.js', stubs);
  });

  it('should return an object', function () {
    stubs['mongo-utils'].getDatabaseManager.returns({});

    var db = mod({});

    expect(db).to.be.an('object');
    expect(stubs['mongo-utils'].getDatabaseManager.called).to.be.true;
  });

  it('should use the url in supplied options', function () {
    var url = 'mongodb://127.0.0.1:5678';

    stubs['mongo-utils'].getDatabaseManager.returns({});

    var db = mod({
      mongoUrl: url
    });

    expect(db).to.be.an('object');
    expect(stubs['mongo-utils'].getDatabaseManager.called).to.be.true;
    expect(
      stubs['mongo-utils'].getDatabaseManager.getCall(0).args[0].mongoUrl
    ).to.equal(url);
  });

});
