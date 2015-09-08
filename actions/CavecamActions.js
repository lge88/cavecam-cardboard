import { fromJS, Map, List } from 'immutable';
import { getWindowSize } from '../lib/utils';
import jsonp from 'jsonp';

function fetchCavecamAttempt() {
  return { type: 'FetchCavecamsAttempt' };
}

function fetchCavecamFail(error) {
  return { type: 'FetchCavecamsFail', error };
}

function fetchCavecamSuccess(cavecams) {
  return { type: 'FetchCavecamsSuccess', cavecams };
}

export function fetchCavecams() {
  return function(dispatch, getState) {
    const oldState = getState();
    const url = oldState.getIn(['manifestUrl'], null);

    if (!url) return;

    dispatch(fetchCavecamAttempt());

    jsonp(url, {}, function(err, result) {
      if (err) {
        // Generate error object:
        const error = err;
        dispatch(fetchCavecamFail(err));
      } else {
        let data = result.data;

        data = data
          .filter(function(d) {
            return d.thumb && Array.isArray(d.images);
          })
          .map(function(d) {
            d.thumb = 'http://192.168.1.67:3002' + d.thumb;
            d.images = d.images.map(function(im) {
              return 'http://192.168.1.67:3002' + im;
            });
            return d;
          });

        const cavecams = fromJS(data);
        dispatch(fetchCavecamSuccess(cavecams));
      }
    });
  };
}

export function updateViewerSize() {
  const wh = getWindowSize(), w = wh.width, h = wh.height;
  return {
    type: 'UpdateViewerSize',
    width: w,
    height: h
  };
}
