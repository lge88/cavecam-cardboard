import React, { PropTypes } from 'react';
import StereoEffect from '../lib/StereoEffect';

var StereoViewer = React.createClass({

  propTypes: {
    // TODO:
    // eyeSeparation: PropTypes.number.isRequired
  },

  _stereoEffect: null,
  _animationHandle: null,
  _animations: [],

  componentWillMount() {
    const { renderer } = this.props;
    this._stereoEffect = new StereoEffect(renderer);
  },

  componentWillUnmount() {
    if (this._animationHandle) {
      this._animationHandle.removeFromLoop();
    }
  },

  render() {
    const { scene, camera, renderer, addToLoop } = this.props;
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const stereoEffect = this._stereoEffect;

    renderer.setClearColor(0x777777);
    stereoEffect.eyeSeparation = 0.08; // 8 cm
    stereoEffect.setSize(w, h);

    const children = Array.isArray(this.props.children) ? children : [this.props.children];

    let _addToLoop = (fn) => {
      this._animations.push(fn);
      return {
        removeFromLoop: () => {
          const i = this._animations.indexOf(fn);
          if (i > -1) { this._animations.splice(i, 1); }
        }
      };
    };

    children.forEach(function(child) {
      child.props = Object.assign({}, {
        scene,
        camera: camera,
        addToLoop: _addToLoop
      }, child.props);
    });

    if (this._animationHandle) {
      this._animationHandle.removeFromLoop();
    }
    this._animationHandle = addToLoop(this.frameFunc.bind(this));

    const dummy = (<div>{this.props.children}</div>);
    return dummy;
  },

  frameFunc(t) {
    const effect = this._stereoEffect;
    const { scene, camera, renderer, children } = this.props;
    renderer.clear();
    this._animations.forEach(function(fn) {
      fn(t);
    });
    effect.updateStereoCameras(camera);
    effect.renderToStereo(scene, camera);
  }

});

export default StereoViewer;
