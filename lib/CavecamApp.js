function CavecamApp() {
  // TODO: use immutable.Map?
  // states:
  this._menuVisible = false;
  this._fullScreen = false;
  this._animationEnabled = false;
  this._useVerticalSplit = false;
  this._useStereo = false;
  this._useDeviceOrientation = false;
  this._selectedIndex = -1;
  this._entries = [];

  this.viewer = new CavecamViewer({
    container: document.getElementById('container')
  });
  this.viewer.start();

  this.fullScreenBtn = document.getElementById('fullscreen-btn');
  this.homeBtn = document.getElementById('home-btn');

  this.entriesMenu = document.getElementById('entries-menu');

  var _this = this;

  this.fullScreenBtn.addEventListener('click', function() {
    _this.setState({ fullScreen: true });
  });

  this.homeBtn.addEventListener('click', function() {
    _this.setState({ menuVisible: true });
  });

  document.getElementById('close-menu-btn').addEventListener('click', function() {
    _this.setState({ menuVisible: false });
  });

  document.getElementById('use-device-orientation').addEventListener('click', function() {
    var oldState = _this.getState();
    var useDeviceOrientation = oldState.useDeviceOrientation;
    _this.setState({ useDeviceOrientation: !useDeviceOrientation });
  });

  document.getElementById('use-stereo').addEventListener('click', function() {
    var oldState = _this.getState();
    var useStereo = oldState.useStereo;
    _this.setState({ useStereo: !useStereo });
  });

  // TODO: split mode checkbox
  document.getElementById('use-vertical-split').addEventListener('click', function() {
    var oldState = _this.getState();
    var useVerticalSplit = oldState.useVerticalSplit;
    _this.setState({ useVerticalSplit: !useVerticalSplit });
  });

  // won't detect exit full screen event :(, so poll the state every 3 seconds.
  // document.addEventListener("fullscreenchange", this.updateFullScreenUI.bind(this), false);
  setInterval(function() {
    var oldState = _this.getState();
    _this.updateFullScreenUI({
      fullScreen: oldState.fullScreen
    });
  }, 3000);
}

// Native implementations:
function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepEquals(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

CavecamApp.prototype.getState = function() {
  return {
    fullScreen: this._fullScreen,
    menuVisible: this._menuVisible,
    useStereo: this._useStereo,
    useDeviceOrientation: this._useDeviceOrientation,
    useVerticalSplit: this._useVerticalSplit,
    animationEnabled: this._animationEnabled,

    entries: cloneDeep(this._entries.slice()),
    selectedIndex: this._selectedIndex
  };
};

CavecamApp.prototype.setState = function(state, done) {
  if (typeof state !== 'object') return;

  var prevState = this.getState();
  var entriesShouldUpdate = false;
  var menuVisibleShouldUpdate = false;
  var cavecamShouldUpdate = false;
  var fullScreenUIShouldUpdate = false;
  var useSteroCheckShouldUpdate = false;
  var useDeviceOrientationCheckShouldUpdate = false;

  if (Array.isArray(state.entries)) {
    if (!deepEquals(state.entries, prevState.entries)) {
      this._entries = cloneDeep(state.entries);
      entriesShouldUpdate = true;
    }
  }

  if (typeof state.menuVisible === 'boolean' &&
      state.menuVisible !== prevState.menuVisible) {
    this._menuVisible = state.menuVisible;
    menuVisibleShouldUpdate = true;
  }

  if (typeof state.fullScreen === 'boolean' &&
      state.fullScreen !== prevState.fullScreen) {
    this._fullScreen = state.fullScreen;
    fullScreenUIShouldUpdate = true;
  }

  if ((state.selectedIndex | 0) === state.selectedIndex &&
      state.selectedIndex >= 0 &&
      state.selectedIndex < this._entries.length) {
    this._selectedIndex = state.selectedIndex;
  }

  var prevCavecam = prevState.entries[prevState.selectedIndex];
  var cavecam = this._entries[this._selectedIndex];
  if (!deepEquals(cavecam, prevCavecam)) {
    cavecamShouldUpdate = true;
  }

  if (typeof state.useStereo === 'boolean' &&
      state.useStereo !== prevState.useStereo) {
    this._useStereo = state.useStereo;
    cavecamShouldUpdate = true;
    useSteroCheckShouldUpdate = true;
  }

  if (typeof state.animationEnabled === 'boolean' &&
      state.animationEnabled !== prevState.animationEnabled) {
    this._animationEnabled = state.animationEnabled;
    cavecamShouldUpdate = true;
  }

  if (typeof state.useVerticalSplit === 'boolean' &&
      state.useVerticalSplit !== prevState.useVerticalSplit) {
    this._useVerticalSplit = state.useVerticalSplit;
    cavecamShouldUpdate = true;
  }

  if (typeof state.useDeviceOrientation === 'boolean' &&
      state.useDeviceOrientation !== prevState.useDeviceOrientation) {
    this._useDeviceOrientation = state.useDeviceOrientation;
    cavecamShouldUpdate = true;
    useDeviceOrientationCheckShouldUpdate = true;
  }

  // Update:
  var newState = this.getState();
  var options =  {
    entriesShouldUpdate: entriesShouldUpdate,
    cavecamShouldUpdate: cavecamShouldUpdate,
    fullScreenUIShouldUpdate: fullScreenUIShouldUpdate,
    useSteroCheckShouldUpdate: useSteroCheckShouldUpdate,
    useDeviceOrientationCheckShouldUpdate: useDeviceOrientationCheckShouldUpdate
  };

  console.log("newState = ", newState);
  console.log("options = ", options);

  this.update(newState, options, done);
};

CavecamApp.prototype.update = function(state, aOptions) {
  var options = Object.assign({}, {
    menuVisibleShouldUpdate: true,
    entriesShouldUpdate: true,
    useSteroCheckShouldUpdate: true,
    useDeviceOrientationCheckShouldUpdate: true,
    cavecamShouldUpdate: true,
    fullScreenUIShouldUpdate: true
  }, aOptions);

  if (options.menuVisibleShouldUpdate ||
      options.entriesShouldUpdate ||
      options.useSteroCheckShouldUpdate ||
      options.useDeviceOrientationCheckShouldUpdate) {
    this.updateMenu(state, options);
  }

  if (options.fullScreenUIShouldUpdate) {
    this.updateFullScreenUI(state, options);
  }

  if (options.cavecamShouldUpdate) {
    this.updateCavecam(state, options);
  }
};

CavecamApp.prototype.updateMenu = function(state, options) {
  // unboxing states
  var entries = state.entries;
  var menuVisible = state.menuVisible;
  var useDeviceOrientation = state.useDeviceOrientation;
  var useStereo = state.useStereo;
  var useVerticalSplit = state.useVerticalSplit;

  // get reference of UIs
  var menu = document.getElementById('menu');
  var entriesContainer = document.getElementById('entries');
  var useDeviceOrientationCheck = document.getElementById('use-device-orientation');
  var useStereoCheck = document.getElementById('use-stereo');
  var useVerticalSplitCheck = document.getElementById('use-vertical-split');

  if (!menuVisible) {
    this.homeBtn.style.display = '';
    menu.style.display = 'none';
  } else {
    this.homeBtn.style.display = 'none';
    if (isSafari()) {
      menu.style.display = '-webkit-flex';
    } else {
      menu.style.display = 'flex';
    }
  }

  if (entries.length > 0 && options.entriesShouldUpdate) {
    entriesContainer.innerHTML = renderEntries(entries);
  }

  useStereo.checked = useStereo;
  useDeviceOrientationCheck.checked = useDeviceOrientation;
  useVerticalSplitCheck.checked = useVerticalSplit;

  function renderEntries(entries) {
    var str = '';

    str += entries.map(function(entry, i) {
      return '<div onclick="app.setState({ selectedIndex: ' + i + '});"' +
        '>' + entry.nickname + '</div>';
    }).join('\n');

    return str;
  }

  function isSafari() {
    return navigator.userAgent.indexOf("Safari") > -1;
  }
};

CavecamApp.prototype.updateFullScreenUI = function(state, options) {
  if (state.fullScreen && !isInFullScreen()) {
    requestFullScreen();
  } else if (!state.fullScreen && isInFullScreen()) {
    exitFullScreen();
  }

  if (isInFullScreen()) {
    this.fullScreenBtn.style.display = 'none';
  } else {
    this.fullScreenBtn.style.display = '';
  }
};

CavecamApp.prototype.updateCavecam = function(state, options) {
  var entries = state.entries;
  var idx = state.selectedIndex;
  var entry = entries[idx];
  var splitMode = state.useVerticalSplit ? 'vertical' : 'horizontal';
  var useStereo = state.useStereo;
  var controlMode = state.useDeviceOrientation ? 'deviceOrientation' : 'touch';
  var animationEnabled = state.animationEnabled;

  if (!entry) entry = {};

  var done = function() {};
  var viewer = this.viewer;
  var images;
  if (isMobileSafari()) {
    images = entry.low_res_images.slice();
  } else {
    images = entry.images.slice();
  }

  if (!useStereo) {
    images = [images[0]];
  }

  var viewState = {
    images: images,
    splitMode: splitMode,
    controlMode: controlMode,
    animationEnabled: animationEnabled
  };
  console.log("viewState = ", JSON.stringify(viewState));

  viewer.setState(viewState, done);
};

CavecamApp.parseEntriesUrlFromUrl = function(url) {
  var re = /\/\?(.*)&?entriesUrl=(.*)$/;
  var match = re.exec(url);
  if (match) {
    return match[2];
  }
  return null;
};
