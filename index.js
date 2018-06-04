const BUFFERING = 0;
const PLAYING = 1;

const MODE_LERP = 0;
const MODE_HERMITE = 1;

class InterpolationBuffer {
  constructor(mode = MODE_LERP, bufferTime = 0.15) {
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

    // update the last entry in the buffer if this is the same frame
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
      const priorFrame = this.buffer.length > 0 ? this.buffer[tail] : this.lastBufferFrame;
      this.buffer.push({
        position: position ? position.clone() : priorFrame.position.clone(),
        velocity: velocity ? velocity.clone() : priorFrame.velocity.clone(),
        quaternion: quaternion ? quaternion.clone() : priorFrame.quaternion.clone(),
        scale: scale ? scale.clone() : priorFrame.scale.clone(),
        time: this.time
      });
    }
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

    if (this.state === PLAYING) {
      const mark = this.time - this.bufferTime;
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
        const currentBufferFrame = this.buffer[0];
        const delta_time = currentBufferFrame.time - this.lastBufferFrame.time;
        const alpha = (mark - this.lastBufferFrame.time) / delta_time;

        if (this.mode === MODE_LERP) {
          this.lerp(this.position, this.lastBufferFrame.position, currentBufferFrame.position, alpha);
        } else if (this.mode === MODE_HERMITE) {
          this.hermite(
            this.position,
            alpha,
            this.lastBufferFrame.position,
            currentBufferFrame.position,
            this.lastBufferFrame.velocity.multiplyScalar(delta_time),
            currentBufferFrame.velocity.multiplyScalar(delta_time)
          );
        }

        this.slerp(this.quaternion, this.lastBufferFrame.quaternion, currentBufferFrame.quaternion, alpha);

        this.lerp(this.scale, this.lastBufferFrame.scale, currentBufferFrame.scale, alpha);
      }
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
