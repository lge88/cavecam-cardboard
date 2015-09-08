import React, { findDOMNode, PropTypes } from 'react';
import { Scene, PerspectiveCamera, Vector3, WebGLRenderer } from 'three';

var ContainerViewer = React.createClass({
  propTypes: {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    running: PropTypes.bool.isRequired,
    children: PropTypes.arrayOf(PropTypes.shape({
      frameFunc: PropTypes.func.isRequired
    }))
  },

  _context: null,
  _animations: [],
  _animationLoop: function() {},

  componentWillMount() {
    const props = this.props;
    const w = props.width, h = props.height;
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, w / h, 1, 100000);
    const renderer = new WebGLRenderer();

    let addToLoop = (fn) => {
      this._animations.push(fn);
      return {
        removeFromLoop: () => {
          const i = this._animations.indexOf(fn);
          if (i > -1) { this._animations.splice(i, 1); }
        }
      };
    };

    this._context = { scene, camera, renderer, addToLoop };
    this._updateCamera();
    this._updateRenderer();
    this._updateAnimationLoop();
  },

  componentDidMount() {
    const { renderer } = this._context;
    const container = findDOMNode(this.refs.container);
    container.appendChild(renderer.domElement);
  },

  _updateCamera() {
    const { camera } = this._context;
    const w = this.props.width, h = this.props.height;
    camera.target = new Vector3(0, 0, 0);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  },

  _updateRenderer() {
    const { renderer } = this._context;
    const w = this.props.width, h = this.props.height;
    renderer.setSize(w, h);
  },

  _updateAnimationLoop() {
    const running = this.props.running;
    function getMs() { return (new Date()).getTime(); }

    if (running) {
      const started = getMs();
      this._animationLoop = (function() {
        const t = getMs() - started;
        this._animations.forEach(function(fn) {
          fn(t);
        });

        requestAnimationFrame(this._animationLoop);
      }).bind(this);
      this._animationLoop();
    } else {
      this._animationLoop = function() {};
    }
  },

  componentDidUpdate(prevProps) {
    this._updateCamera();
    this._updateRenderer();
    this._updateAnimationLoop();
  },

  render() {
    const context = this._context;
    this.props.children.forEach(function(child) {
      child.props = Object.assign({}, context, child.props);
    });

    return (
      <div ref="container" style={this.props.style}>{this.props.children}</div>
    );
  }

});

export default ContainerViewer;
