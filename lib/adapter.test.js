'use strict';

var expect = require('chai').expect
  , sinon = require('sinon')
  , proxyquire = require('proxyquire');

describe(__filename, function () {

  var mod, stubs;

  beforeEach(function () {
    stubs = {
      './indexes': sinon.stub()
    };
    mod = proxyquire('./adapter.js', stubs);
  });

  it('should expose CRUDL functions', function () {
    stubs['./indexes'].yields(null);

    var adapter = mod({
      indexes: []
    });

    expect(adapter.create).to.be.a('function');
    expect(adapter.read).to.be.a('function');
    expect(adapter.update).to.be.a('function');
    expect(adapter.delete).to.be.a('function');
    expect(adapter.list).to.be.a('function');
  });

  it('should handle indexes error', function (done) {
    stubs['./indexes'].yields(new Error('oops'));

    mod({
      indexes: [{}]
    });

    setTimeout(function () {
      done();
    });
  });
});
