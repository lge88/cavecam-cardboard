
//
// Basic React-THREE example using a custom 'Cupcake' Component which consists of two cubes
//

/* jshint strict: false */
/* global React : false */
/* global ReactTHREE : false */
/* global THREE : false */

import React from 'react';
import * as ReactTHREE from '../../lib/react-three/ReactTHREE';
import * as THREE from 'three';
import Scene from '../../lib/react-three/components/THREEScene';
import { Spring } from 'react-motion';

var MeshFactory = React.createFactory(ReactTHREE.Mesh);

//
// Cupcake component is two cube meshes textured with cupcake textures
//

var boxgeometry = new THREE.BoxGeometry( 200,200,200);

var cupcakematerial = new THREE.MeshBasicMaterial( { color: 0x0000ff } );

var creammaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

var Cupcake = React.createClass({
  displayName: 'Cupcake',
  propTypes: {
    position: React.PropTypes.instanceOf(THREE.Vector3),
    quaternion: React.PropTypes.instanceOf(THREE.Quaternion).isRequired
  },
  render: function() {
    let render = (interpolated) => {
      console.log('interpolated', interpolated);
      return (
        <ReactTHREE.Object3D
          position={new THREE.Vector3(0, interpolated.y, 0)}>

          <ReactTHREE.Mesh position={new THREE.Vector3(0,-100,0)}
            geometry={boxgeometry} material={cupcakematerial} />

          <ReactTHREE.Mesh position={new THREE.Vector3(0, 100,0)}
            geometry={boxgeometry} material={cupcakematerial} />

        </ReactTHREE.Object3D>
      );
    };

    console.log('this.props', this.props);

    return (
      <Spring defaultValue={{y:0}} endValue={{y:this.props.y}}>
        { render }
      </Spring>
    );
  }
});

//
// The top level component
// props:
// - width,height : size of the overall render canvas in pixels
// - xposition: x position in pixels that governs where the elements are placed
//

var CupcakeScene = React.createClass({
  displayName: 'CupcakeScene',
  render: function() {
    const camera = (
      <ReactTHREE.PerspectiveCamera
        name="maincamera"
        fov={75}
        aspect={this.props.width/this.props.height}
        near={1}
        far={5000}
        position={new THREE.Vector3(0,0,600)}
        lookat={new THREE.Vector3(0,0,0)}
      />
    );

    return (
      <Scene
        width={this.props.width}
        height={this.props.height}
        camera="maincamera">
        {camera}
        <Cupcake {...this.props.cupcakedata} />
      </Scene>
    );
  }
});

export default CupcakeScene;

/* jshint unused:false */
export function cupcakestart() {
  var renderelement = document.getElementById("three-box");

  var w = window.innerWidth-6;
  var h = window.innerHeight-6;

  var sceneprops = {width:w, height:h, cupcakedata:{position:new THREE.Vector3(0,0,0), quaternion:new THREE.Quaternion()}};
  var cupcakeprops = sceneprops.cupcakedata;
  var rotationangle = 0;

  var reactinstance = React.render(React.createElement(CupcakeScene,sceneprops), renderelement);

  function spincupcake(t) {
    rotationangle = t * 0.001;
    cupcakeprops.quaternion.setFromEuler(new THREE.Euler(rotationangle,rotationangle*3,0));
    cupcakeprops.position.x = 300  * Math.sin(rotationangle);
    reactinstance.setProps(sceneprops);

    requestAnimationFrame(spincupcake);
  }

  spincupcake();
}
