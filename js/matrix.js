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
    var systemFailure = false;
    var matrixConfig = undefined;
    var colors = ['#84FFA8', '#67F383', '#009933'];
    var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!$%^&*(){}[];:#~<>?,./|\\=+-';
    var matrixDrawInterval = undefined;

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.getElementById("matrix-canvas") !== null) {
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

    this._getConfig = function() {
      return matrixConfig;
    }

    this._getSystemFailure = function() {
      return systemFailure;
    }

    this._setActive = function() {
      active = !active;
    }

    this._setConfig = function(callback) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          var myObj = JSON.parse(this.responseText);
          if (typeof callback === 'function') {
            callback(this.response);
          }
        }
        else {
          callback(undefined);
        }
      };
      xmlhttp.open("GET", "js/matrix.json", true);
      xmlhttp.send();
    }

    this._setSystemFailure = function(bool) {
      systemFailure = bool;
    }

    this.start = function() {
      var start = function() {
        if (_this._getActive() === false) {
          _this._setActive();
          if (typeof matrixDrawInterval !== 'undefined') {
            clearInterval(matrixDrawInterval);
          };
          matrixDrawInterval = setInterval(function() {
            if (_this._getSystemFailure() === false) {
              _this._drawMatrix();
            } else {
              _this.stop();
              _this._drawSystemFailure();
            }
          }, 50);
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
