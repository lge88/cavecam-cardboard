import EventEmitter from 'events';
import { fromJS, Map, List } from 'immutable';
import { Vector3 } from 'immutable';

let state = fromJS({
  manifestUrl: 'http://192.168.1.67:3002/cache/cavecams.json',
  error: null,
  fetching: false,
  cavecams: [],
  viewer: {
    width: 500,
    height: 500,
    running: true,
    sceneMode: 'SphereMenu',
    splitMode: 'Horizontal',
    controlMode: 'Touch'
  },
  cupcake: {
    y: 0
  }
});

const ChangeEvent = 'Change';
var emitter = new EventEmitter();

function emitChange() { emitter.emit(ChangeEvent); }

function updateState(newState) {
  const oldState = state;
  if (oldState !== newState) {
    state = newState;
    emitChange();
  }
}

// Return newState
function reducer(oldState, action) {
  if (!action || !(action.type)) return oldState;

  let newState = oldState;
  switch (action.type) {
  case 'FetchCavecamsAttempt':
    newState = oldState
      .setIn(['fetching'], true)
      .setIn(['error'], null);
    break;

  case 'FetchCavecamsSuccess':
    newState = oldState
      .setIn(['fetching'], false)
      .setIn(['error'], null)
      .setIn(['cavecams'], action.cavecams);
    break;

  case 'FetchCavecamsFail':
    newState = oldState
      .setIn(['fetching'], false)
      .setIn(['error'], action.error);
    break;

  case 'AddCavecam':
    let cams = oldState.getIn(['cavecams']);
    cams = addCavecam(cams, action.cavecam);
    newState = oldState.setIn(['cavecams'], cams);
    break;

  case 'UpdateViewerSize':
    newState = oldState
      .setIn(['viewer', 'width'], action.width)
      .setIn(['viewer', 'height'], action.height);
    break;

  case 'UpdateCupcakeY':
    newState = oldState
      .setIn(['cupcake', 'y'], action.y);
    break;

  default: break;
  }

  return newState;
}

function addCavecam(cavecams, newCavecam) {
  // Validate newCavecam
  if (newCavecam && newCavecam.name && newCavecam.thumb) {
    return cavecams.push(newCavecam);
  } else {
    return cavecams;
  }
}

var store = {};

store.addChangeListener = (cb) => {
  emitter.addListener(ChangeEvent, cb);
};

store.removeChangeListener = (cb) => {
  emitter.removeListener(ChangeEvent, cb);
};

store.getState = () => { return state; };

store.dispatch = (action) => {
  if (typeof action === 'function') {
    action(store.dispatch, store.getState);
  } else {
    const oldState = state;
    const newState = reducer(oldState, action);
    updateState(newState);
  }
  // TODO: return a promise
};


export default store;
