
var APP_STATUS = {
  SPHERE_MENU: 'SPHERE_MENU',
  PANO_VIEWER: 'PANO_VIEWER'
};

var appState = {
  status: APP_STATUS.SPHERE_MENU,
  menuItems: [],
  viewingItem: null
};

var container = document.getElementById('container');
var viewer = new CavecamViewer({
  container: container
});
viewer.start();
var renderer = viewer._renderer;
var sphereMenu = new CavecamSphere3DMenu(renderer, container);

function enterSphereMenu() {
  viewer.stop();
  sphereMenu.setState({
    visible: true,
    items: appState.menuItems,
    onSelect: function(item) {
      console.log('item', item, 'is selected.');
      appState.viewingItem = item;
      enterPanoViewer();
    }
    // TODO: controlMode: 'deviceOrientation'
  });
  appState.status = APP_STATUS.SPHERE_MENU;
}

function enterPanoViewer() {
  // validate viewer.setState parameters first:
  if (!(appState.viewingItem) ||
      !(appState.viewingItem.images) ||
      appState.viewingItem.images.length === 0) {
    return;
  }

  sphereMenu.setState({ visible: false });

  // TODO: viewer.update({ visible: true, images: ... });
  viewer.start();
  viewer.setState({
    // TODO: visible: true,
    images: appState.viewingItem.images,
    splitMode: 'horizontal',
    controlMode: 'deviceOrientation',
    animationEnabled: false
    // TODO: onLookingUpOrDown: function() { ... }
  });

  viewer.deviceOrientationControls().onLookingUpOrDown = function() {
    console.log('You looked up or down!');
    enterSphereMenu();
    appState.viewingItem = null;
  };

  appState.status = APP_STATUS.PANO_VIEWER;
}

var entriesUrl = '/cache/cavecams.json';

ajaxGet(entriesUrl, function(err, txt) {
  if (err) {
    console.log(err);
    return;
  }

  var menuItems = JSON.parse(txt).data;
  menuItems = menuItems.filter(function(item) {
    return item && item.images && item.images.length == 2 && item.thumb;
  });
  console.log("entries = ", menuItems);
  appState.menuItems = menuItems;

  enterSphereMenu();
});
