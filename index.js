const BUFFERING = 0;
const PLAYING = 1;

const MODE_LERP = 0;
const MODE_HERMITE = 1;

class InterpolationBuffer {
  constructor(mode = MODE_LERP, bufferTime = 0.15) {
    this.initialized = false;
    this.set = false;
    this.state = BUFFERING;
    this.buffer = [];
    this.bufferTime = bufferTime;
    this.time = 0;
    this.mark = 0;
    this.lastTime = 0.0;

    this.mode = mode;

    this.lastPosition = new THREE.Vector3();
    this.lastVelocity = new THREE.Vector3();
    this.lastQuaternion = new THREE.Quaternion();
    this.lastScale = new THREE.Vector3(1, 1, 1);

    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = new THREE.Vector3(1, 1, 1);
  }

  hermite(target, t, p1, p2, v1, v2) {
    const t2 = t * t;
    const t3 = t * t * t;
    const a = 2 * t3 - 3 * t2 + 1;
    const b = -2 * t3 + 3 * t2;
    const c = t3 - 2 * t2 + t;
    const d = t3 - t2;

    target.copy(p1.multiplyScalar(a));
    target.add(p2.multiplyScalar(b));
    target.add(v1.multiplyScalar(c));
    target.add(v2.multiplyScalar(d));
  }

  lerp(target, v1, v2, alpha) {
    target.lerpVectors(v1, v2, alpha);
  }

  slerp(target, r1, r2, alpha) {
    THREE.Quaternion.slerp(r1, r2, target, alpha);
  }

  appendBuffer(position, velocity, quaternion, scale) {
    const tail = this.buffer.length - 1;

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
        position =
          this.buffer.length > 0
            ? this.buffer[tail].position.clone()
            : this.lastPosition.clone();
      }

      if (velocity) {
        velocity = velocity.clone();
      } else {
        velocity =
          this.buffer.length > 0
            ? this.buffer[tail].velocity.clone()
            : this.lastVelocity.clone();
      }

      if (quaternion) {
        quaternion = quaternion.clone();
      } else {
        quaternion =
          this.buffer.length > 0
            ? this.buffer[tail].quaternion.clone()
            : this.lastQuaternion.clone();
      }

      if (scale) {
        scale = scale.clone();
      } else {
        scale =
          this.buffer.length > 0
            ? this.buffer[tail].scale.clone()
            : this.lastScale.clone();
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

  isSet() {
    return this.set;
  }

  setTarget(position, velocity, quaternion, scale) {
    this.appendBuffer(position, velocity, quaternion, scale);
  }

  setPosition(position, velocity) {
    this.appendBuffer(position, velocity, null, null);
  }

  setQuaternion(quaternion) {
    this.appendBuffer(null, null, quaternion, null);
  }

  setScale(scale) {
    this.appendBuffer(null, null, null, scale);
  }

  update(delta) {
    if (this.state === BUFFERING) {
      if (this.buffer.length > 0 && !this.initialized) {
        this.lastPosition.copy(this.buffer[0].position);
        this.lastVelocity.copy(this.buffer[0].velocity);
        this.lastQuaternion.copy(this.buffer[0].quaternion);
        this.lastScale.copy(this.buffer[0].scale);
        this.lastTime = this.buffer[0].time;
        this.initialized = true;
        this.buffer.shift();

        this.position.copy(this.lastPosition);
        this.quaternion.copy(this.lastQuaternion);
        this.scale.copy(this.lastScale);
      }

      if (this.buffer.length > 0 && this.initialized && this.time > this.bufferTime) {
        this.mark = this.time - this.bufferTime * 1000;
        this.state = PLAYING;
      }
    } else if (this.state == PLAYING) {
      //Purge this.buffer of expired frames
      while (this.buffer.length > 0 && this.mark > this.buffer[0].time) {
        this.lastPosition.copy(this.buffer[0].position);
        this.lastVelocity.copy(this.buffer[0].velocity);
        this.lastQuaternion.copy(this.buffer[0].quaternion);
        this.lastScale.copy(this.buffer[0].scale);
        this.lastTime = this.buffer[0].time;

        //if this is the last frame in the buffer, just update the time and reuse it
        if (this.buffer.length > 1) {
          this.buffer.shift();
        } else {
          this.buffer[0].time = this.time + delta;
        }
      }
      if (this.buffer.length > 0 && this.buffer[0].time > 0) {
        const delta_time = this.buffer[0].time - this.lastTime;
        const alpha = (this.mark - this.lastTime) / delta_time;

        if (this.mode === MODE_LERP) {
          this.lerp(
            this.position,
            this.lastPosition,
            this.buffer[0].position,
            alpha
          );
        } else if (this.mode === MODE_HERMITE) {
          this.hermite(
            this.position,
            alpha,
            this.lastPosition,
            this.buffer[0].position,
            this.lastVelocity.multiplyScalar(delta_time),
            this.buffer[0].velocity.multiplyScalar(delta_time)
          );
        }

        this.slerp(
          this.quaternion,
          this.lastQuaternion,
          this.buffer[0].quaternion,
          alpha
        );

        this.lerp(this.scale, this.lastScale, this.buffer[0].scale, alpha);

        this.set = true;
      }

      this.mark += delta;
    }

    if (this.initialized) {
      this.time += delta;
    }
  }

  getPosition() {
    return this.position;
  }

  getQuaternion() {
    return this.quaternion;
  }

  getScale() {
    return this.scale;
  }
}

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = InterpolationBuffer;
}
