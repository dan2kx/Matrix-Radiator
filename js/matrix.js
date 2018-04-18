//Matrix Plugin

'use strict';

(function(root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.Matrix = factory(root);
  }
})(typeof global !== 'undefined' ? global : this.window || this.global, function(root) {

  function Matrix () {
    var _this = this;
    var active = false;
    var builds = [];
    var buildStatus = 'success';
    var colors = ['#84FFA8', '#67F383', '#009933'];
    var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!$%^&*(){}[];:#~<>?,./|\\=+-';
    var matrixConfig = undefined;
    var matrixDrawInterval = undefined;
    var matrixBuildStatusInterval = undefined;

    if (typeof window !== 'undefined') {
      var screen = window.screen;
      var matrixCanvas = document.getElementById("matrix-canvas");
      var canvasContext = matrixCanvas.getContext('2d');

      var width = matrixCanvas.width = screen.width;
      var height = matrixCanvas.height = screen.height;
      var Scale = 1;
      var xOffset = 10 * Scale;
      var yOffset = 15 * Scale;
      var columns = Math.floor(width / xOffset) + 1;

      var yPositions = Array(columns).join(0).split('');
      var yColors = Array(columns).join('').split('');

      this._drawMatrix = function() {
        var xPositions = [];
        var getColor = function() {
          return colors[Math.floor(Math.random() * colors.length)];
        }

        canvasContext.fillStyle = 'rgba(0, 0, 0, .05)';
        canvasContext.fillRect(0, 0, width, height);
        canvasContext.font = Scale + '0pt Matrix';

        yPositions.map(function(y, index) {
          var char = Math.floor(Math.random() * characters.length);
          var text = characters.substring(char, char + 1);
          var max = Math.random() * 1.2e5;
          var x = index * xOffset;

          if (y > max) {
            xPositions.push(index);
            yPositions[index] = 0;
            yColors[index] = getColor();
          } else {
            yPositions[index] = y + yOffset;
          }

          canvasContext.fillStyle = yColors[index] || getColor();
          canvasContext.fillText(text, x, y);
        });

      };

      this._drawSystemFailure = function() {
        document.getElementById('system-failure').style.visibility = 'visible';
      }
    }
    else {
      //null for testing without browser
      this._drawMatrix = function() {};
      this._drawSystemFailure = function() {};
    }

    this._getActive = function() {
      return active;
    }

    this._getBuildStatusFromAPI = function(callback) {
      var config = this._getConfig();
      var systemFailure = true;
      if (typeof config === 'object' && 'circleKey' in config) {
        this._getRequest('https://circleci.com/api/v1.1/projects?circle-token=' + config.circleKey, callback)
      }
    }

    this._getConfig = function() {
      return matrixConfig;
    }

    this._getRequest = function(url, callback) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {;
        if (typeof callback === 'function') {
          callback(this.readyState === 4 && this.status === 200 ? JSON.parse(this.response) : undefined);
        }
      };
      xmlhttp.open("GET", url, true);
      xmlhttp.send();
    }

    this._setActive = function() {
      active = !active;
    }

    this._setBuildStatus = function(response) {
      if (typeof response !== 'undefined') {
        builds = response.reduce(function(acc, repository) {
           return acc.concat(Object.keys(repository.branches).map(function(branchName) {
              var branch = repository.branches[branchName];
              var buildIsRunning = branch.running_builds.length !== 0;
              var build = buildIsRunning ? branch.running_builds[0] : branch.recent_builds[0];
              var status = buildIsRunning ? build.status : build.outcome;
              return {
                 repository: repository.reponame,
                 branch: branchName,
                 started: new Date(build.pushed_at),
                 state: status
              }
           }))
        }, [])
      }
    }

    this._checkBuildStatus = function() {
      var builds = this.getBuilds();
      var buildIsRunning = builds.some(function(build) {
        return build.state === 'running';
      })
      var buildIsFailing = builds.some(function(build) {
        return build.state === 'failed';
      })
      buildStatus = buildIsRunning && 'status' || buildIsFailing && 'failed' || 'success';
    }

    this._setConfig = function(callback) {
      this._getRequest('js/matrix.json', function(response) {
        matrixConfig = response;
        if (typeof callback === 'function') {
          callback();
        }
      });
    }

    this.getBuilds = function() {
        return builds;
    }

    this.getBuildStatus = function() {
      return buildStatus;
    }

    this.start = function() {
      var start = function() {
        if (_this._getActive() === false) {
          _this._setActive();
          if (typeof matrixDrawInterval !== 'undefined') {
            clearInterval(matrixDrawInterval);
          }
          matrixDrawInterval = setInterval(function() {
            _this._checkBuildStatus();
            var buildStatus = _this.getBuildStatus();
            if (buildStatus === 'success') {
              _this._drawMatrix();
            } else if (buildStatus === 'failed') {
              _this.stop();
              _this._drawSystemFailure();
            }
          }, 50);
        }
        if (typeof matrixBuildStatusInterval === 'undefined') {
          matrixBuildStatusInterval = setInterval(function() {
            _this._getBuildStatusFromAPI(_this._setBuildStatus);
          }, 60000);
        }
      }
      if (typeof this._getConfig() !== 'undefined') {
        start();
      } else {
        this._setConfig(start);
      }
    }

    this.stop = function() {
      if (this._getActive() === true) {
        this._setActive();
        if (typeof matrixDrawInterval !== 'undefined') {
          clearInterval(matrixDrawInterval);
        }
      }
    }

  }

  return Matrix;
});
