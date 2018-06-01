// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({1:[function(require,module,exports) {
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BUFFERING = 0;
var PLAYING = 1;

var MODE_LERP = 0;
var MODE_HERMITE = 1;

var InterpolationBuffer = function () {
  function InterpolationBuffer() {
    var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : MODE_LERP;
    var bufferTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.15;

    _classCallCheck(this, InterpolationBuffer);

    this.initialized = false;
    this.state = BUFFERING;
    this.buffer = [];
    this.bufferTime = bufferTime * 1000;
    this.time = 0;
    this.mode = mode;

    this.lastBufferFrame = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(1, 1, 1)
    };

    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = new THREE.Vector3(1, 1, 1);
  }

  _createClass(InterpolationBuffer, [{
    key: "hermite",
    value: function hermite(target, t, p1, p2, v1, v2) {
      var t2 = t * t;
      var t3 = t * t * t;
      var a = 2 * t3 - 3 * t2 + 1;
      var b = -2 * t3 + 3 * t2;
      var c = t3 - 2 * t2 + t;
      var d = t3 - t2;

      target.copy(p1.multiplyScalar(a));
      target.add(p2.multiplyScalar(b));
      target.add(v1.multiplyScalar(c));
      target.add(v2.multiplyScalar(d));
    }
  }, {
    key: "lerp",
    value: function lerp(target, v1, v2, alpha) {
      target.lerpVectors(v1, v2, alpha);
    }
  }, {
    key: "slerp",
    value: function slerp(target, r1, r2, alpha) {
      THREE.Quaternion.slerp(r1, r2, target, alpha);
    }
  }, {
    key: "appendBuffer",
    value: function appendBuffer(position, velocity, quaternion, scale) {
      var tail = this.buffer.length - 1;

      //update the last entry in the buffer if this is the same frame
      if (this.buffer.length > 0 && this.buffer[tail].time === this.time) {
        if (position) {
          this.buffer[tail].position.copy(position);
        }

        if (velocity) {
          this.buffer[tail].velocity.copy(velocity);
        }

        if (quaternion) {
          this.buffer[tail].quaternion.copy(quaternion);
        }

        if (scale) {
          this.buffer[tail].scale.copy(scale);
        }
      } else {
        if (position) {
          position = position.clone();
        } else {
          position = this.buffer.length > 0 ? this.buffer[tail].position.clone() : this.lastBufferFrame.position.clone();
        }

        if (velocity) {
          velocity = velocity.clone();
        } else {
          velocity = this.buffer.length > 0 ? this.buffer[tail].velocity.clone() : this.lastBufferFrame.velocity.clone();
        }

        if (quaternion) {
          quaternion = quaternion.clone();
        } else {
          quaternion = this.buffer.length > 0 ? this.buffer[tail].quaternion.clone() : this.lastBufferFrame.quaternion.clone();
        }

        if (scale) {
          scale = scale.clone();
        } else {
          scale = this.buffer.length > 0 ? this.buffer[tail].scale.clone() : this.lastBufferFrame.scale.clone();
        }

        this.buffer.push({
          position: position,
          velocity: velocity,
          quaternion: quaternion,
          scale: scale,
          time: this.time
        });
      }
    }
  }, {
    key: "setTarget",
    value: function setTarget(position, velocity, quaternion, scale) {
      this.appendBuffer(position, velocity, quaternion, scale);
    }
  }, {
    key: "setPosition",
    value: function setPosition(position, velocity) {
      this.appendBuffer(position, velocity, null, null);
    }
  }, {
    key: "setQuaternion",
    value: function setQuaternion(quaternion) {
      this.appendBuffer(null, null, quaternion, null);
    }
  }, {
    key: "setScale",
    value: function setScale(scale) {
      this.appendBuffer(null, null, null, scale);
    }
  }, {
    key: "update",
    value: function update(delta) {
      if (this.state === BUFFERING) {
        if (this.buffer.length > 0 && !this.initialized) {
          this.lastBufferFrame = this.buffer.shift();
          this.initialized = true;

          this.position.copy(this.lastBufferFrame.position);
          this.quaternion.copy(this.lastBufferFrame.quaternion);
          this.scale.copy(this.lastBufferFrame.scale);
        }

        if (this.buffer.length > 0 && this.initialized && this.time > this.bufferTime) {
          this.state = PLAYING;
        }
      }

      if (this.state == PLAYING) {
        var mark = this.time - this.bufferTime;
        //Purge this.buffer of expired frames
        while (this.buffer.length > 0 && mark > this.buffer[0].time) {
          //if this is the last frame in the buffer, just update the time and reuse it
          if (this.buffer.length > 1) {
            this.lastBufferFrame = this.buffer.shift();
          } else {
            this.lastBufferFrame.position.copy(this.buffer[0].position);
            this.lastBufferFrame.velocity.copy(this.buffer[0].velocity);
            this.lastBufferFrame.quaternion.copy(this.buffer[0].quaternion);
            this.lastBufferFrame.scale.copy(this.buffer[0].scale);
            this.lastBufferFrame.time = this.buffer[0].time;
            this.buffer[0].time = this.time + delta;
          }
        }
        if (this.buffer.length > 0 && this.buffer[0].time > 0) {
          var currentBufferFrame = this.buffer[0];
          var delta_time = currentBufferFrame.time - this.lastBufferFrame.time;
          var alpha = (mark - this.lastBufferFrame.time) / delta_time;

          if (this.mode === MODE_LERP) {
            this.lerp(this.position, this.lastBufferFrame.position, currentBufferFrame.position, alpha);
          } else if (this.mode === MODE_HERMITE) {
            this.hermite(this.position, alpha, this.lastBufferFrame.position, currentBufferFrame.position, this.lastBufferFrame.velocity.multiplyScalar(delta_time), currentBufferFrame.velocity.multiplyScalar(delta_time));
          }

          this.slerp(this.quaternion, this.lastBufferFrame.quaternion, currentBufferFrame.quaternion, alpha);

          this.lerp(this.scale, this.lastBufferFrame.scale, currentBufferFrame.scale, alpha);
        }
      }

      if (this.initialized) {
        this.time += delta;
      }
    }
  }, {
    key: "getPosition",
    value: function getPosition() {
      return this.position;
    }
  }, {
    key: "getQuaternion",
    value: function getQuaternion() {
      return this.quaternion;
    }
  }, {
    key: "getScale",
    value: function getScale() {
      return this.scale;
    }
  }]);

  return InterpolationBuffer;
}();

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = InterpolationBuffer;
}
},{}]},{},[1], null)