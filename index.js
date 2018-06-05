const INITIALIZING = 0;
const BUFFERING = 1;
const PLAYING = 2;

const MODE_LERP = 0;
const MODE_HERMITE = 1;

class InterpolationBuffer {
  constructor(mode = MODE_LERP, bufferTime = 0.15) {
    this.state = INITIALIZING;
    this.buffer = [];
    this.bufferTime = bufferTime * 1000;
    this.time = 0;
    this.mode = mode;

    this.originFrame = {
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
    const tail = this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
    // update the last entry in the buffer if this is the same frame
    if (tail && tail.time === this.time) {
      if (position) {
        tail.position.copy(position);
      }

      if (velocity) {
        tail.velocity.copy(velocity);
      }

      if (quaternion) {
        tail.quaternion.copy(quaternion);
      }

      if (scale) {
        tail.scale.copy(scale);
      }
    } else {
      const priorFrame = tail || this.originFrame;
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
    if (this.state === INITIALIZING) {
      if (this.buffer.length > 0) {
        this.originFrame = this.buffer.shift();
        this.position.copy(this.originFrame.position);
        this.quaternion.copy(this.originFrame.quaternion);
        this.scale.copy(this.originFrame.scale);
        this.state = BUFFERING;
      }
    }

    if (this.state === BUFFERING) {
      if (this.buffer.length > 0 && this.time > this.bufferTime) {
        this.state = PLAYING;
      }
    }

    if (this.state === PLAYING) {
      const mark = this.time - this.bufferTime;
      //Purge this.buffer of expired frames
      while (this.buffer.length > 0 && mark > this.buffer[0].time) {
        //if this is the last frame in the buffer, just update the time and reuse it
        if (this.buffer.length > 1) {
          this.originFrame = this.buffer.shift();
        } else {
          this.originFrame.position.copy(this.buffer[0].position);
          this.originFrame.velocity.copy(this.buffer[0].velocity);
          this.originFrame.quaternion.copy(this.buffer[0].quaternion);
          this.originFrame.scale.copy(this.buffer[0].scale);
          this.originFrame.time = this.buffer[0].time;
          this.buffer[0].time = this.time + delta;
        }
      }
      if (this.buffer.length > 0 && this.buffer[0].time > 0) {
        const targetFrame = this.buffer[0];
        const delta_time = targetFrame.time - this.originFrame.time;
        const alpha = (mark - this.originFrame.time) / delta_time;

        if (this.mode === MODE_LERP) {
          this.lerp(this.position, this.originFrame.position, targetFrame.position, alpha);
        } else if (this.mode === MODE_HERMITE) {
          this.hermite(
            this.position,
            alpha,
            this.originFrame.position,
            targetFrame.position,
            this.originFrame.velocity.multiplyScalar(delta_time),
            targetFrame.velocity.multiplyScalar(delta_time)
          );
        }

        this.slerp(this.quaternion, this.originFrame.quaternion, targetFrame.quaternion, alpha);

        this.lerp(this.scale, this.originFrame.scale, targetFrame.scale, alpha);
      }
    }

    if (this.state !== INITIALIZING) {
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
