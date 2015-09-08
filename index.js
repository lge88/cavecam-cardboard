import React from 'react';
import CavecamCardboardApp from './components/CavecamCardboardApp';
import appStore from './store/CavecamCardboardAppStore';
import * as actions from './actions/CavecamActions';

window.store = appStore;
window.actions = actions;

React.render(
  <CavecamCardboardApp />,
  document.getElementById('root')
);

window.store.dispatch(actions.fetchCavecams());
