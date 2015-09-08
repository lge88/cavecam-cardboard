var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  host: '192.168.1.67',
  port: 3000,
  stats: {
    colors: true
  }
}).listen(3000, '192.168.1.67', function (err) {
  if (err) {
    console.log(err);
  }

  console.log('http://192.168.1.67:3000');
});
