import React, { PropTypes } from 'react';
import { Geometry, Raycaster, Vector2, Vector3, PerspectiveCamera,
         PointLight, NearestFilter, MeshBasicMaterial, DoubleSide,
         LineBasicMaterial, Scene, Line, PlaneGeometry, Object3D,
         Mesh, Texture } from 'three';

var SphereMenu3D = React.createClass({

  propTypes: {
    items: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
  },

  _root: null,
  _raycaster: new Raycaster(),
  _objects: [],
  _animationHandle: null,

  render() {
    const { scene, items, addToLoop } = this.props;

    scene.remove(this._root);
    this._root = this._createRoot(items);
    scene.add(this._root);

    if (this._animationHandle) { this._animationHandle.removeFromLoop(); }
    this._animationHandle = addToLoop(this.frameFunc.bind(this));

    return null;
  },

  _createRoot(items) {
    var root = new Object3D();

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
    var item, mesh;
    var i, j, k = 0, len = items.length;

    this._objects = [];
    for (i = 0; k < len && i < nThetas; i++) {
      for (j = 0; k < len && j < nPhis; j++) {
        item = items[k];
        theta = thetas[i];
        phi = phis[j];

        mesh = this._createImageOnSphere(item, imageWidth, radius, phi, theta);
        root.add(mesh);

		    this._objects.push(mesh);
        k++;
        if (k >= items.length) { k = 0; }
      }
	  }

    // init lights
    var particleLight = new Object3D();
    var pointLight = new PointLight(0xffffff, 1);
	  particleLight.add(pointLight);
	  root.add(particleLight);

    return root;
  },

  _createImageOnSphere(item, imageWidth, radius, phi, theta) {
    var im = new Image();
    var texture = new Texture(im);
    var url = item.thumb;

    im.crossOrigin = '';
    im.onload = function() {
      var hOverW = im.height/im.width;
      image3d.scale.y = hOverW;
      border.scale.y = hOverW;
      border.oldScale = border.scale;
      // console.log("border.oldScale = ", border.oldScale);
      texture.needsUpdate = true;
    };
    im.src = url;
    texture.minFilter = NearestFilter;

    var material = new MeshBasicMaterial({
      map: texture,
      side: DoubleSide
    });

    var boarderMaterial = new LineBasicMaterial({
      color: 0xff0000,
      lineWidth: 50
    });

    var geometry = new PlaneGeometry(imageWidth, imageWidth);
    var mesh = new Object3D();

    var image3d = new Mesh(geometry, material);

	  mesh.position.x = radius*Math.sin(theta)*Math.cos(phi);
	  mesh.position.y = radius*Math.sin(theta)*Math.sin(phi);
	  mesh.position.z = radius*Math.cos(theta);

    function swap(obj, a, b) {
      var tmp = obj[a];
      obj[a] = obj[b];
      obj[b] = tmp;
    }
    swap(mesh.position, 'y', 'z');

    var border = new Line(this._createSquare(imageWidth+0.01), boarderMaterial);
    // border.position.z = 1;
    border.visible = false;

    mesh.add(image3d);
    mesh.add(border);
    mesh.lookAt(new Vector3(0, 0, 0));

    mesh.timeWhenPick = null;
    mesh.menuItem = item;

    var _this = this;
    mesh.onSelect = this.props.onSelect.bind(null, mesh.menuItem);
    mesh.border = border;
    mesh.image3d = image3d;

    return mesh;
  },

  _createSquare(w) {
    var hfW = 0.5*w;
    var geometry = new Geometry();
    geometry.vertices.push(
	    new Vector3(-hfW, -hfW, 0),
	    new Vector3(-hfW, hfW, 0),
	    new Vector3(hfW, hfW, 0),
	    new Vector3(hfW, -hfW, 0),
	    new Vector3(-hfW, -hfW, 0)
    );
    return geometry;
  },

  componentWillUnmount() {
    this._root = null;
    this._raycaster = null;
    this._objects = null;
  },

  frameFunc(t) {
    const { camera } = this.props;
    const raycaster = this._raycaster;
    const objects = this._objects;

    const centerOfScreen = new Vector2(0, 0);
    const highlighColor = 0xff0000;
    const pickingTimeThres = 2000;
    const scaleOnHover = 1.5;

    // high light and select;
    raycaster.setFromCamera(centerOfScreen, camera);
    const images = objects.map(function(x) { return x.image3d; });
	  const intersects = raycaster.intersectObjects(images);
    const picked = intersects.length > 0 ? intersects[0].object.parent : null;

    objects.forEach(function(item) {
      if (item === picked) {
        // first pick
        if (item.timeWhenPick === null) {
          item.border.visible = true;
          item.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
          item.timeWhenPick = t;
        } else {
          // do I stare it long enough?
          var timePassed = t - item.timeWhenPick;
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
  }

});

export default SphereMenu3D;
