import React, { PropTypes } from 'react';
import Controls from '../lib/DeviceOrientationControls';

var DeviceOrientationControls = React.createClass({

  _controls: null,

  componentWillMount() {
    const { camera } = this.props;
    this._controls = new Controls(camera);
  },

  _animationHandle: null,

  render() {
    const { enabled, addToLoop } = this.props;

    if (enabled) { this._controls.connect(); }
    else { this._controls.disconnect(); }

    if (this._animationHandle) { this._animationHandle.removeFromLoop(); }
    this._animationHandle = addToLoop(this.frameFunc.bind(this));

    return null;
  },

  componentWillUnmount() {
    this._controls.disconnect();
  },

  frameFunc(t) {
    this._controls.update();
  }

});

export default DeviceOrientationControls;
