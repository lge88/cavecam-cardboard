import React, { Component } from 'react';
import { Map, List } from 'immutable';
import CavecamCardboardViewer from './CavecamCardboardViewer';
import CupcakeScene from './scenes/CupcakeScene';
import store from '../store/CavecamCardboardAppStore';
import * as actions from '../actions/CavecamActions';
import { Vector3, Quaternion, Euler } from 'three';

var CavecamCardboardApp = React.createClass({

  componentDidMount() {
    store.addChangeListener(this._onAppStoreChange);
    window.addEventListener('resize', this._onWindowResize);
    this._onWindowResize();
    this._onAppStoreChange();
  },

  componentWillUnmount() {
    store.removeChangeListener(this._onAppStoreChange);
    window.removeEventListener('resize', this._onWindowResize);
  },

  _onWindowResize() {
    store.dispatch(actions.updateViewerSize());
  },

  _onAppStoreChange() {
    this.setState({ state: store.getState() });
  },

  getInitialState() {
    return { state: store.getState() };
  },

  _renderCavecamList(cavecams) {
    return cavecams.map(function(cavecam, i) {
      const nickname = cavecam.get('nickname', 'N/A');
      const thumb = cavecam.get('thumb', 'N/A');
      return (
        <li key={nickname+i}>
          <a href={thumb}>{nickname}</a>
        </li>
      );
    });
  },

  _renderCavecamViewer() {
    const state = this.state.state;
    const viewerState = this.state.state.getIn(['viewer']).toJSON();
    const { width, height, running, sceneMode, splitMode, controlMode } = viewerState;
    const cavecams = state.getIn(['cavecams'], []).toJSON();
    const styles = {
      position: 'absolute',
      top: 0,
      left: 0
    };
    return (
      <CavecamCardboardViewer
        width={width}
        height={height}
        running={running}
        sceneMode={sceneMode}
        splitMode={splitMode}
        controlMode={controlMode}
        cavecams={cavecams}
        onSelectCavecam={() => {}}
        style={styles}
      />
    );
  },

  _renderCupcakeScene() {
    const state = this.state.state;
    const viewerState = state.getIn(['viewer']).toJSON();
    const { width, height, running, sceneMode, splitMode, controlMode } = viewerState;
    const cavecams = state.getIn(['cavecams'], []).toJSON();
    const styles = {
      position: 'absolute',
      top: 0,
      left: 0
    };
    const y = state.getIn(['cupcake', 'y']);

    return (
      <CupcakeScene
        width={width}
        height={height}
        cupcakedata={{y}}
      />
    );
  },

  render() {
    const state = this.state.state;
    var cavecams = state.getIn(['cavecams'], []);
    return this._renderCupcakeScene();
    // return (
    //   <div id="xxx">
    //     <h1>Cavecam Cardboard</h1>
    //     { this._renderCupcakeScene() }
    //     { false && this._renderCavecamViewer() }
    //     <ul>
    //       { false && this._renderCavecamList(cavecams) }
    //     </ul>
    //   </div>
    // );
  }
});

export default CavecamCardboardApp;
