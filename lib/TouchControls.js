function TouchControls(options) {
  var AMPLIFY_FACTOR = 15;
  var REF_FOV = 75;

  var scope = {};

  if (!options) options = {};

  if (!options.camera)
    throw new Error('TouchControls#contructor(): must initialized with camera.');
  scope.camera = options.camera;

  if (!options.domElement)
    throw new Error('TouchControls#contructor(): must initialized with domElement.');
  scope.domElement = options.domElement;

  scope.animationEnabled = !!(options.animationEnabled);

  var isUserInteracting = false;
  var onPointerDownPointerX = 0, onPointerDownPointerY = 0;
  var lon = 0, lat = 0;
  var onPointerDownLon = 0, onPointerDownLat = 0;
  var startPinchFov, multiTouchStartFingerDistance;

  function _onMouseDown(event) {

    event.preventDefault();

    isUserInteracting = true;

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;
  };

  function _onMouseMove(event) {
    var camera = scope.camera;
    var moveScale;
    if (isUserInteracting === true) {
      moveScale = camera.fov / REF_FOV;
      lon = moveScale * (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
      lat = moveScale * (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
    }
  };

  function _onMouseUp(event) {
    isUserInteracting = false;
  };

  function distance(x0, y0, x1, y1) {
    return Math.sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1));
  }

  function _onTouchStart(event) {
    var x0, y0, x1, y1;
    event.preventDefault();

    if (event.touches.length > 1) {
      // pinch start
	    x0 = event.touches[0].clientX,
	    y0 = event.touches[0].clientY,
	    x1 = event.touches[1].clientX,
      y1 = event.touches[1].clientY;

      multiTouchStartFingerDistance = distance(x0, y0, x1, y1);
      startPinchFov = scope.camera.fov;
    } else {

      isUserInteracting = true;

      onPointerDownPointerX = event.touches[0].clientX;
      onPointerDownPointerY = event.touches[0].clientY;

      onPointerDownLon = lon;
      onPointerDownLat = lat;
    }
  };

  function _onTouchMove(event) {
    var camera = scope.camera;
    var x0, y0, x1, y1;
    var d0, d;
    var scale;
    var moveScale;

    if (event.touches.length > 1) {
      // pinch
      x0 = event.touches[0].clientX,
      y0 = event.touches[0].clientY,
      x1 = event.touches[1].clientX,
      y1 = event.touches[1].clientY,
      d0 = multiTouchStartFingerDistance,
      d = distance(x0, y0, x1, y1),
      scale = d/d0;

      camera.fov = startPinchFov - AMPLIFY_FACTOR*Math.log(scale);
      camera.updateProjectionMatrix();
    } else {
      if (isUserInteracting === true) {
        moveScale = camera.fov / REF_FOV;
        lon = moveScale * (onPointerDownPointerX - event.touches[0].clientX) * 0.1 + onPointerDownLon;
        lat = moveScale * (event.touches[0].clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
      }
    }
  };

  function _onTouchEnd(event) {
    isUserInteracting = false;
    startPinchFov = scope.camera.fov;
  };

  function _onMouseWheel(event) {
    var camera = scope.camera;
    if (event.wheelDeltaY) {
      // WebKit
      camera.fov -= event.wheelDeltaY * 0.05;
    } else if (event.wheelDelta) {
      // Opera / Explorer 9
      camera.fov -= event.wheelDelta * 0.05;
    } else if (event.detail) {
      // Firefox
      camera.fov += event.detail * 1.0;
    }

    camera.updateProjectionMatrix();
  };

  function connect() {
    var domElement = scope.domElement;
    domElement.addEventListener('mousedown', _onMouseDown, false);
    domElement.addEventListener('mousemove', _onMouseMove, false);
    domElement.addEventListener('mouseup', _onMouseUp, false);

    domElement.addEventListener('touchstart', _onTouchStart, false);
    domElement.addEventListener('touchmove', _onTouchMove, false);
    domElement.addEventListener('touchend', _onTouchEnd, false);

    domElement.addEventListener('mousewheel', _onMouseWheel, false);
    domElement.addEventListener('DOMMouseScroll', _onMouseWheel, false);
  }

  function disconnect() {
    var domElement = scope.domElement;
    domElement.removeEventListener('mousedown', _onMouseDown, false);
    domElement.removeEventListener('mousemove', _onMouseMove, false);
    domElement.removeEventListener('mouseup', _onMouseUp, false);

    domElement.removeEventListener('touchstart', _onTouchStart, false);
    domElement.removeEventListener('touchmove', _onTouchMove, false);
    domElement.removeEventListener('touchend', _onTouchEnd, false);

    domElement.removeEventListener('mousewheel', _onMouseWheel, false);
    domElement.removeEventListener('DOMMouseScroll', _onMouseWheel, false);
  }

  function deg2rad(deg) { return deg/180*Math.PI; }

  function update() {
    var camera = scope.camera;
    var animationEnabled = scope.animationEnabled;
    var phi, theta;

    if (isUserInteracting === false && animationEnabled)
      lon += 0.1;

    lat = Math.max(- 85, Math.min(85, lat));
    // phi = THREE.Math.degToRad(90 - lat);
    // theta = THREE.Math.degToRad(lon);
    phi = deg2rad(90 - lat);
    theta = deg2rad(lon);

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(camera.target);

    // distortion
    // camera.position.copy(camera.target).negate();
    // console.log('update: ', lat, phi, theta);

  }

  scope.connect = connect;
  scope.disconnect = disconnect;
  scope.update = update;
  return scope;
}

export default TouchControls;
