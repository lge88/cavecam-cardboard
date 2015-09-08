var app = new CavecamApp();
var entriesUrl = CavecamApp.parseEntriesUrlFromUrl(location.href);

console.log("entriesUrl = ", entriesUrl);

if (!entriesUrl) entriesUrl = '/cache/cavecams.json';

// TODO: use window.fetch() instead.
ajaxGet(entriesUrl, function(err, txt) {
  if (err) {
    console.log(err);
    return;
  }

  var entries = JSON.parse(txt).data;
  app.setState({
    fullScreen: false,
    menuVisible: false,
    useStereo: false,
    useDeviceOrientation: false,
    useVerticalSplit: false,
    animationEnabled: false,

    entries: entries,
    // florence duomo
    selectedIndex: 7
  });
});
