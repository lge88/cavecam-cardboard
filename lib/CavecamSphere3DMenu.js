
function CavecamSphere3DMenu(renderer, container) {
  // states:
  this._menuItems = [];
  this._onSelect = function() {};
  this._menuItemSceneObjects = [];

  var wh = getWindowSize(), w = wh.width, h = wh.height;

  // init camera;
  this._camera = new THREE.PerspectiveCamera(60, w / h, 1, 100000);
  this._camera.target = new THREE.Vector3(1, 0, 0);

  // renderer and container are shared with pano viewer.
  this._renderer = renderer;
  this._container = container;

  // scene is not initialized at start.
  this._scene = null;

  // init ray
  this._raycaster = new THREE.Raycaster();
  this._centerOfScreen = new THREE.Vector2(0, 0);

  // init stereo effect
  this._stereoEffect = new THREE.StereoEffect(this._renderer);
  // this._stereoEffect.eyeSeparation = 10;
  this._stereoEffect.eyeSeparation = 0.08; // 8 cm
  // this._stereoEffect.focalLength = 1.5;
  this._stereoEffect.setSize(w, h);

  // init controls, by default touch control is enabled.
  // this._touchControls = new TouchControls({
  //   camera: this._camera,
  //   domEl: this._container
  // });
  this._deviceOrientationControls = new THREE.DeviceOrientationControls(this._camera);

  // this._touchControls.connect();
  this._deviceOrientationControls.connect();
  this._controls = this._deviceOrientationControls;
}

// public API:
// menu.setState({ visible: true, items: [], onSelect: (selectedItem)->Void })
CavecamSphere3DMenu.prototype.setState = function(state) {
  if (typeof state !== 'object') { state = {}; }
  function noop() {}

  var visible = !!(state.visible);
  var items = Array.isArray(state.items) ? state.items : [];
  var onSelect = typeof state.onSelect === 'function' ? state.onSelect : noop;

  this._clear();
  if (!visible || items.length === 0) {
    this._stop();
    return;
  }

  this._onSelect = onSelect;

  // TODO: accept controlMode from state object.
  // this._touchControls.connect();
  this._deviceOrientationControls.connect();
  this._controls = this._deviceOrientationControls;

  // TODO: so now it doesnot refresh the scene if new data in
  if (!this._scene) {
    this._menuItems = items;
    this._initScene();
  }
  this._start();
};

CavecamSphere3DMenu.prototype._createSquare = function(w) {
  var hfW = 0.5*w;
  var geometry = new THREE.Geometry();
  geometry.vertices.push(
	  new THREE.Vector3( -hfW, -hfW, 0 ),
	  new THREE.Vector3( -hfW, hfW, 0 ),
	  new THREE.Vector3( hfW, hfW, 0 ),
	  new THREE.Vector3( hfW, -hfW, 0 ),
	  new THREE.Vector3( -hfW, -hfW, 0 )
  );

  return geometry;
};

CavecamSphere3DMenu.prototype._createImageOnSphere = function(menuItem, imageWidth, radius, phi, theta) {
  var im = new Image();
  var texture = new THREE.Texture(im);
  var url = menuItem.thumb;

  im.onload = function() {
    var hOverW = im.height/im.width;
    image3d.scale.y = hOverW;
    border.scale.y = hOverW;
    border.oldScale = border.scale;
    // console.log("border.oldScale = ", border.oldScale);
    texture.needsUpdate = true;
  };
  im.src = url;
  texture.minFilter = THREE.NearestFilter;

  var material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  var boarderMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    lineWidth: 50
  });

  var geometry = new THREE.PlaneGeometry(imageWidth, imageWidth);
  var mesh = new THREE.Object3D();

  var image3d = new THREE.Mesh(geometry, material);

	mesh.position.x = radius*Math.sin(theta)*Math.cos(phi);
	mesh.position.y = radius*Math.sin(theta)*Math.sin(phi);
	mesh.position.z = radius*Math.cos(theta);

  function swap(obj, a, b) {
    var tmp = obj[a];
    obj[a] = obj[b];
    obj[b] = tmp;
  }
  swap(mesh.position, 'y', 'z');

  var border = new THREE.Line(this._createSquare(imageWidth+0.01), boarderMaterial);
  // border.position.z = 1;
  border.visible = false;

  mesh.add(image3d);
  mesh.add(border);
  mesh.lookAt(new THREE.Vector3(0, 0, 0));

  mesh.timeWhenPick = null;
  mesh.menuItem = menuItem;

  var _this = this;
  mesh.onSelect = function() {
    _this._onSelect(mesh.menuItem);
    // console.log("select mesh.menuItem = ", mesh.menuItem);
  };

  mesh.border = border;
  mesh.image3d = image3d;

  return mesh;
};

CavecamSphere3DMenu.prototype._initScene = function() {
  var scene = new THREE.Scene();

  function deg2rad(deg) { return deg/180*Math.PI; }

  function seq(n) {
    var i = 0, out = [];
    while (i < n) { out.push(i++); }
    return out;
  }
  function linspace(start, end, numPoints) {
    console.assert(numPoints > 1);
    var dx = (end - start)/(numPoints - 1);
    return seq(numPoints).map(function(i) { return start+i*dx; });
  }

  // generate 6 x 20 image grid:
  // theta from 40deg to 140deg
  // phi from -180deg to 180deg

  // Units: meter
  var radius = 10.0, imageWidth = 3.0;
  var nThetas = 8, nPhis = 15;
  var phi, theta;
  var thetaFrom = 40, thetaTo = 140;
  var phiFrom = -180, phiTo = 180;
  var thetas = linspace(thetaFrom, thetaTo, nThetas).map(deg2rad);
  var phis = linspace(phiFrom, phiTo, nPhis).map(deg2rad);
  var items = this._menuItems, item, mesh;
  var i, j, k = 0;

  this._menuItemSceneObjects = [];
  for (i = 0; i < nThetas; i++) {
    for (j = 0; j < nPhis; j++) {
      item = items[k];
      theta = thetas[i];
      phi = phis[j];

      mesh = this._createImageOnSphere(item, imageWidth, radius, phi, theta);
      scene.add(mesh);

		  this._menuItemSceneObjects.push( mesh );
      k++;
      if (k >= items.length) { k = 0; }
    }
	}

  // init lights
  var particleLight = new THREE.Object3D();
  var pointLight = new THREE.PointLight(0xffffff, 1);
	particleLight.add(pointLight);
	scene.add(particleLight);

  this._scene = scene;
};

CavecamSphere3DMenu.prototype._start = function() {
  this._clear();
  this._animate = (function() {
    requestAnimationFrame(this._animate);
    this._controls.update();
    this._render();
  }).bind(this);
  this._animate();
};

CavecamSphere3DMenu.prototype._render = function() {
  var effect = this._stereoEffect;
  var scene = this._scene;
  var camera = this._camera;
  var raycaster = this._raycaster;
  var centerOfScreen = this._centerOfScreen;
  var highlighColor = 0xff0000;
  var pickingTimeThres = 2000;
  var scaleOnHover = 1.5;
  function getMs() { return (new Date()).getTime(); }

  this._renderer.clear();

  // high light and select;
  raycaster.setFromCamera(centerOfScreen, camera);
  var imgs = this._menuItemSceneObjects.map(function(x) { return x.image3d; });
	var intersects = raycaster.intersectObjects(imgs);
  var picked = intersects.length > 0 ? intersects[0].object.parent : null;

  this._menuItemSceneObjects.forEach(function(item) {
    if (item === picked) {
      // first pick
      if (item.timeWhenPick === null) {
        item.border.visible = true;
        item.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
        item.timeWhenPick = getMs();
      } else {
        // do I stare it long enough?
        var timePassed = getMs() - item.timeWhenPick;
        if (timePassed > pickingTimeThres) {
          item.timeWhenPick = null;
          item.onSelect();
        } else {
          // animation NOT working
          // var t = timePassed / pickingTimeThres;;
          // var T = 500, w = 2*Math.PI/T, s = 1 + 0.2*Math.sin(w*t);
          // t = timePassed / pickingTimeThres;
          // item.border.scale.x = item.border.oldScale.x*s;
          // item.border.scale.y = item.border.oldScale.y*s;
          // item.border.scale.z = item.border.oldScale.z*s;
          // console.log("item.border.scale = ", item.border.scale);
        }
      }
    } else {
      item.scale.set(1.0, 1.0, 1.0);
      item.border.visible = false;
      item.timeWhenPick = null;
    }
  });

  effect.updateStereoCameras(camera);
  effect.renderToStereo(scene, camera);
};

CavecamSphere3DMenu.prototype._stop = function() {
  this._animate = function() {};
};

CavecamSphere3DMenu.prototype._clear = function() {
  var renderer = this._renderer;
  var wh = getWindowSize();
  var w = wh.width;
  var h = wh.height;
  renderer.setViewport(0, 0, w, h);
  renderer.clear();
};
