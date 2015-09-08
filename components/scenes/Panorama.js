function CavecamViewer(options) {
  options || (options = {});

  // private:
  this._container = options.container || document.getElementById('container');
  this._camera = null;
  this._renderer = null;
  this._scenes = [];
  this._splitMode = 'none';
  this._controlMode = 'touch';

  // init:
  var container = this._container;
  var camera, renderer;
  var wh = getWindowSize(), w = wh.width, h = wh.height;
  var animationEnabled = !!(options.animationEnabled);

  camera = new THREE.PerspectiveCamera(75, w / h, 1, 1100);
  camera.target = new THREE.Vector3(0, 0, 0);
  this._camera = camera;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);
  this._renderer = renderer;

  // this._stereoEffect = new THREE.StereoEffect(this._renderer);
  // this._stereoEffect.eyeSeparation = 0.3;
  // this._stereoEffect.focalLength = 1.5;
  // this._stereoEffect.setSize(w, h);

  this.setSplitMode(this._splitMode);

  this.setControlMode(this._controlMode);

  this.setAnimationEnabled(animationEnabled);

  window.addEventListener('resize', this._onWindowResize.bind(this), false);
}

CavecamViewer.prototype.setState = function(obj, done) {
  if (typeof obj !== 'object') return;
  if (typeof done !== 'function') done = function() {};

  var _this = this;
  function updateViewOption() {
    if (typeof obj.splitMode !== 'undefined')
      _this.setSplitMode(obj.splitMode);

    if (typeof obj.controlMode !== 'undefined')
      _this.setControlMode(obj.controlMode);

    if (typeof obj.animationEnabled !== 'undefined')
      _this.setAnimationEnabled(obj.animationEnabled);

    done();
  }

  if (Array.isArray(obj.images)) {
    if (obj.images.length === 1) {
      this.loadPanorama(obj.images[0], updateViewOption);
    } else if (obj.images.length === 2) {
      this.loadStereoPanorama(obj.images[0], obj.images[1], updateViewOption);
    } else {
      updateViewOption();
    }
  } else {
    updateViewOption();
  }
};

CavecamViewer.prototype.start = function() {
  this._animate = (function() {
    requestAnimationFrame(this._animate);
    this._controls.update();
    this._render();
  }).bind(this);
  this._animate();
};

CavecamViewer.prototype.stop = function() {
  this._animate = function() {};
};

CavecamViewer.prototype.clear = function() {
  var renderer = this._renderer;
  var wh = getWindowSize();
  var w = wh.width;
  var h = wh.height;
  renderer.setViewport(0, 0, w, h);
  renderer.clear();
};

CavecamViewer.prototype.loadPanorama = function(textureUrl, done) {
  this._scenes = [this._createPanoramaScene(textureUrl, done)];
  this.setSplitMode('none');
};

CavecamViewer.prototype.loadStereoPanorama = function(leftEyeTextureUrl, rightEyeTextureUrl, aDone) {
  var count = 2,
      done = function(err) {
        if (err) { aDone(err); return; }
        count--;
        if (count === 0) aDone(null);
      };

  this._scenes = [
    this._createPanoramaScene(leftEyeTextureUrl, aDone),
    this._createPanoramaScene(rightEyeTextureUrl, aDone)
  ];
  // this.setSplitMode('vertical');
  this.setSplitMode('horizontal');
};

CavecamViewer.SPLIT_MODES = {
  horizontal: 1,
  vertical: 1,
  none: 1
};

// mode='horizontal'|'vertical'|'none'
CavecamViewer.prototype.setSplitMode = function(mode) {
  var wh = getWindowSize(),
      w = wh.width,
      h = wh.height;

  // for not stero, always set to 'none
  if (this._scenes.length < 2) {
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
    this._splitMode = 'none';
    return true;
  }

  if (mode in CavecamViewer.SPLIT_MODES) {
    if (mode === 'none') {
      this._camera.aspect = w / h;
    } else if (mode === 'vertical') {
      this._camera.aspect =  2 * w / h;
    } else {
      this._camera.aspect =  0.5 * w / h;
    }

    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
    // this._stereoEffect.setSize(w, h);

    this._splitMode = mode;
    return true;
  } else
    return false;
};

CavecamViewer.prototype._createTexture = function(url, done) {
  var im = new Image();
  var texture = new THREE.Texture(im);

  im.onload = function() {
    texture.needsUpdate = true;
    done(null, texture);
  };
  im.src = url;

  return texture;
};

function noop() {}

CavecamViewer.prototype._createPanoramaScene = function(textureUrl, aDone) {
  var scene = new THREE.Scene(),
      geometry,
      material,
      done = aDone || noop;

  geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));

  material = new THREE.MeshBasicMaterial({
    map: this._createTexture(textureUrl, done)
  });

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  scene.panoramaGeometry = geometry;
  scene.panoramaMaterial = material;
  scene.panoramaMesh = mesh;

  return scene;
};

CavecamViewer.prototype._render = function() {
  var renderer = this._renderer,
      scenes = this._scenes,
      camera = this._camera,
      splitMode = this._splitMode,
      wh = getWindowSize(),
      winW = wh.width,
      winH = wh.height,
      w = 0.5 * winW,
      h = 0.5 * winH;

  renderer.setViewport(0, 0, w, h);
  renderer.clear();

  if (splitMode === 'none' && scenes[0]) {
    renderer.setViewport(0, 0, winW, winH);
    renderer.setScissor(0, 0, winW, winH);
    renderer.enableScissorTest(true);
    renderer.render(scenes[0], camera);
  } else if (splitMode === 'vertical' && scenes[0] && scenes[1]) {
    // Top
    renderer.setViewport(0, h, winW, h);
    renderer.setScissor(0, h, winW, h);
    renderer.enableScissorTest(true);
    renderer.render(scenes[0], camera);

    // Bottom
    renderer.setViewport(0, 0, winW, h);
    renderer.setScissor(0, 0, winW, h);
    renderer.enableScissorTest(true);
    renderer.render(scenes[1], camera);
  } else if (splitMode === 'horizontal' && scenes[0] && scenes[1]) {

    // var effect = this._stereoEffect;
    // scenes[0].updateMatrixWorld();
    // scenes[1].updateMatrixWorld();

    // effect.updateStereoCameras(camera);
    // effect.clear();
    // effect.enableScissorTest(true);
    // effect.renderToLeft(scenes[0]);
    // effect.renderToRight(scenes[1]);
    // effect.enableScissorTest(false);

    // Left
    renderer.setViewport(0, 0, w, winH);
    renderer.setScissor(0, 0, w, winH);
    renderer.enableScissorTest(true);
    renderer.render(scenes[0], camera);

    // Right
    renderer.setViewport(w, 0, w, winH);
    renderer.setScissor(w, 0, w, winH);
    renderer.enableScissorTest(true);
    renderer.render(scenes[1], camera);
  }

};

CavecamViewer.prototype.touchControls = function() {
  if (!this._touchControls) {
    this._touchControls = new TouchControls({
      camera: this._camera,
      domEl: this._container
    });
    this._touchControls.disconnect();
  }
  return this._touchControls;
};

CavecamViewer.prototype.animationEnabled = function() {
  return this.touchControls().animationEnabled;
};

CavecamViewer.prototype.setAnimationEnabled = function(flag) {
  if (flag !== true && flag !== false)
    throw new Error('CavecamViewer#setAnimationEnabled(flag): ' +
                    'flag must be true or false.');
  this.touchControls().animationEnabled = flag;
};

CavecamViewer.prototype.controlMode = function(mode) {
  return this._controlMode;
};

CavecamViewer.prototype.setControlMode = function(mode) {
  if (this._controls) this._controls.disconnect();

  if (mode === 'touch') {
    this._controls = this.touchControls();
  } else if (mode === 'deviceOrientation') {
    this._controls = this.deviceOrientationControls();
  } else {
    throw new Error('Unknown control mode ' + mode + ', supported mode: ' +
                   '1)touch; 2)deviceOrientation');
  }

  this._controlMode = mode;
  this._controls.connect();
};

CavecamViewer.prototype.deviceOrientationControls = function() {
  if (!this._deviceOrientationControls)
    this._deviceOrientationControls = new THREE.DeviceOrientationControls(this._camera);
  return this._deviceOrientationControls;
};

CavecamViewer.prototype._onWindowResize = function() {
  this.setSplitMode(this._splitMode);
};
