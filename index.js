import React from 'react';
import CavecamCardboardApp from './components/CavecamCardboardApp';
import store from './store/CavecamCardboardAppStore';
import * as actions from './actions/CavecamActions';

React.render(
  <CavecamCardboardApp />,
  document.getElementById('root')
);

store.dispatch(actions.fetchCavecams());

let cupcakeshake = (duration) => {
  return (dispatch, getState) => {
    var rotationangle = getState().getIn(['cupcake', 'rotationangle']);
    let getMs = () => { return (new Date()).getTime(); };

    const started = getMs();

    function spincupcake() {
      const t = (getMs() - started)/duration;

      rotationangle = t * Math.PI * 2;

      store.dispatch({
        type: 'UpdateCupcakeY',
        angle: rotationangle
      });

      if (t < 1) {
        requestAnimationFrame(spincupcake);
      }
    }

    spincupcake();
  };
};

var pos = 100;
document.addEventListener('click', function() {
  pos *= -1;
  store.dispatch({ type: 'UpdateCupcakeY', y: pos });
});

window.store = store;
window.actions = actions;
