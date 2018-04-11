var chai = require('chai');
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var Matrix = require('../js/Matrix.js')
var expect = chai.expect;

chai.use(sinonChai);

describe('Matrix Radiator', function() {
  it('should execute tests', function() {
    expect(true).to.be.true;
  });

  var matrix;

  beforeEach(function() {
    matrix = new Matrix();
    matrix._drawMatrix = function() {};
  });

  describe('start Matrix', function() {

    it('should execute Matrix start when called', function() {
      var spy = sinon.spy(matrix, 'start');
      matrix.start();
      expect(spy).to.have.been.called;
    });

    it('should begin with active as false', function() {
      expect(matrix._getActive()).to.be.false;
    });

    it('should set active to true when false', function() {
      matrix._setActive();
      expect(matrix._getActive()).to.be.true;
    });

    it('should activate the matrix when matrix start is called', function() {
      expect(matrix._getActive()).to.be.false;
      matrix.start();
      expect(matrix._getActive()).to.be.true;
    });

  });

  describe('stop Matrix', function() {
    it('should execute Matrix stop when called', function() {
      var spy = sinon.spy(matrix, 'stop');
      matrix.start();
      matrix.stop();
      expect(spy).to.have.been.called;
    });

    it('should set active to false when matrix stop is called', function() {
      expect(matrix._getActive()).to.be.false;
      matrix.start();
      matrix.stop();
      expect(matrix._getActive()).to.be.false;
    });

  });

  describe('system failure', function() {
    it('should begin with systemFailure as false', function() {
      expect(matrix._getSystemFailure()).to.be.false;
    })

    it('should remain with systemFailure as false when matrix is started', function() {
      matrix.start();
      expect(matrix._getSystemFailure()).to.be.false;
    })

    it('should set the error condition when called with true', function() {
      matrix._setSystemFailure(true);
      expect(matrix._getSystemFailure()).to.be.true;
    })

  })

  describe('timer tests', function() {
    var clock;

    beforeEach(function () {
      matrix = new Matrix();
      clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      clock.restore();
    });

    it('should start the draw timer when the matrix is started', function() {
      var spy = sinon.spy(matrix, '_drawMatrix');
      matrix.start();
      expect(spy).to.have.been.not.called;
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
      clock.tick(50);
      expect(spy).to.have.been.calledTwice;
    })

    it('should stop the draw timer when the matrix is stopped', function() {
      var spy = sinon.spy(matrix, '_drawMatrix');
      matrix.start();
      expect(spy).to.have.been.not.called;
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
      matrix.stop();
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
    })

    it('should cause the matrix to stop and set active to false when systemFailure is true', function() {
      matrix.start();
      matrix._setSystemFailure(true);
      clock.tick(50);
      expect(matrix._getActive()).to.be.false;
    })

    it('should cause the matrix to stop the drawing when systemFailure is called with true', function() {
      var spy = sinon.spy(matrix, '_drawMatrix');
      matrix.start();
      expect(spy).to.have.been.not.called;
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
      matrix._setSystemFailure(true);
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
    })

  })

});
