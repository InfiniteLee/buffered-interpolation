# buffered-interpolation

This package aims to provide a solution for interpolation of position, rotation, and scale for networked THREE.js objects. 

It specifically aims to work well both in situations with continuous and sparse network updates. 

Inspired by: [godot-snapshot-interpolation-demo](https://github.com/empyreanx/godot-snapshot-interpolation-demo)

For position and scale, uses either linear interpolation (default) or [hermite](https://en.wikipedia.org/wiki/Hermite_interpolation) function (which takes into account velocity).

For rotation (quaternions), uses spherical interpolation.

## Usage

```
var InterpolationBuffer = require('buffered-interpolation');
let interpolationBuffer = new InterpolationBuffer();
```

on receipt of networked data:
```
interpolationBuffer.setPosition(new THREE.Vector3(data.x, data.y, data.z));
```

in some update/tick method: 
```
object3d.position.copy(interpolationBuffer.getPosition());
```