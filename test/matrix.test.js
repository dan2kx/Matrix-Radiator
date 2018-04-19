var chai = require('chai');
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var Matrix = require('../js/Matrix.js')
var MatrixConfig = require('../js/Matrix.json')

var expect = chai.expect;

global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();

chai.use(sinonChai);

describe('Matrix Radiator', function() {
  it('should execute tests', function() {
    expect(true).to.be.true;
  });

  var matrix;
  var clock;

  beforeEach(function() {
    matrix = new Matrix();
    matrix._drawMatrix = function() {};
    clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    clock.restore();
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

    it('should call setConfig if config is undefined', function() {
      expect(matrix._getConfig()).to.be.undefined;
      var spy = sinon.spy(matrix, '_setConfig');
      matrix.start();
      expect(spy).to.have.been.called;
    })

  });

  describe('stop Matrix', function() {
    it('should execute Matrix stop when called', function() {
      var spy = sinon.spy(matrix, 'stopDrawing');
      matrix.start();
      matrix.stopDrawing();
      expect(spy).to.have.been.called;
    });

    it('should set active to false when matrix stop is called', function() {
      expect(matrix._getActive()).to.be.false;
      matrix.start();
      matrix.stopDrawing();
      expect(matrix._getActive()).to.be.false;
    });

  });

  describe('build status', function() {
    it('should begin with build status as success', function() {
      expect(matrix.getBuildStatus()).to.equal('success');
    })

    it('should remain with build status as false when matrix is started', function() {
      matrix.start();
      expect(matrix.getBuildStatus()).to.equal('success');
    })

    it('should set the build status as failed when checkBuildStatus detects a failed', function() {
      var stub = sinon.stub(matrix, 'getBuildStatus').callsFake(function() {
        return 'failed'
      });
      var spy = sinon.spy(matrix, 'stopDrawing')
      matrix.start();
      clock.tick(50);
      expect(matrix.getBuildStatus()).to.equal('failed');
      expect(spy).to.have.been.called;
    })

    it('should set the build status as failed when checkBuildStatus detects running', function() {
      var stub = sinon.stub(matrix, 'getBuildStatus').callsFake(function() {
        return 'running'
      });
      var spy = sinon.spy(matrix, '_drawTrace')
      matrix.start();
      clock.tick(50);
      expect(matrix.getBuildStatus()).to.equal('running');
      expect(spy).to.have.been.called;
    })

    it('should set the build status as failed when checkBuildStatus detects success', function() {
      var stub = sinon.stub(matrix, 'getBuildStatus').callsFake(function() {
        return 'success'
      });
      var spy = sinon.spy(matrix, '_drawMatrix')
      matrix.start();
      clock.tick(50);
      expect(matrix.getBuildStatus()).to.equal('success');
      expect(spy).to.have.been.called;
    })

  })

  describe('circle-ci build', function () {
    var response = [{
      branches: {
        a: {
          recent_builds: [{ outcome: 'success'}], running_builds: []
        },
        b: {
          recent_builds: [{ outcome: 'failed'}], running_builds: []
        }
      }
    }]

    it('should set a fake circle-ci response and build array with two status', function() {
      matrix._setBuildStatus(response);
      expect(matrix.getBuilds()).to.have.lengthOf(2);
    })

    it('should expect check status to set system failure to false if a branch has failed', function() {
      matrix._setBuildStatus(response);
      matrix._checkBuildStatus();
      expect(matrix.getBuildStatus()).to.equal('failed');
    })

  })

  describe('timer tests', function() {
    beforeEach(function () {
      matrix = new Matrix();
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
      matrix.stopDrawing();
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
    })

    it('should cause the matrix to stop and set active to false when build status is failed', function() {
      var stub = sinon.stub(matrix, 'getBuilds').callsFake(function() {
        return [ { state: 'failed' } ]
      });
      matrix.start();
      matrix._checkBuildStatus();
      clock.tick(50);
      expect(matrix._getActive()).to.be.false;
    })

    it('should cause the matrix to stop the drawing when build status is failed', function() {
      var spy = sinon.spy(matrix, '_drawMatrix');
      matrix.start();
      expect(spy).to.have.been.not.called;
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
      var stub = sinon.stub(matrix, 'getBuilds').callsFake(function() {
        return [ { state: 'failed' } ]
      });
      matrix._checkBuildStatus();
      clock.tick(50);
      expect(spy).to.have.been.calledOnce;
    })

  })

  describe('api tests', function() {
    var server;

    beforeEach(function() {
      server = sinon.createFakeServer();
      server.respondWith('js/matrix.json', function (xhr) {
          xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify(MatrixConfig));
      })
    })

    afterEach(function() {
      server.restore();
    })

    it('should get the circle-ci key from the json file', function() {
      var callback = sinon.spy();
      matrix._setConfig(callback);
      server.respond();
      expect(callback).to.have.been.called;
      expect(matrix._getConfig()).to.have.property('circleKey')
    })

    it('should fake a call circle-ci profiles method and return data', function() {
      matrix._setConfig();
      server.respond();
      var matrixConfig = matrix._getConfig();
      server.respondWith('https://circleci.com/api/v1.1/projects?circle-token=' + matrixConfig.circleKey, function (xhr) {
          xhr.respond(200, { "Content-Type": "application/json" }, JSON.stringify([]));
      });
      var callback = sinon.spy();
      matrix._getBuildStatusFromAPI(callback);
      server.respond();
      expect(callback).to.have.been.called;
    })

  })

});
