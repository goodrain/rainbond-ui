var path = require('path');
export default {
  entry: 'src/index.js',
  extraBabelPlugins: [
    'transform-decorators-legacy',
    [
      'import',
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true
      }
    ]
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  outputPath: path.resolve(__dirname, '../../dists'), //
  env: {
    development: {
      extraBabelPlugins: ['dva-hmr']
    }
  },
  ignoreMomentLocale: true,
  theme: './src/theme.js',
  html: {
    filename: '../../templates/index.html', //
    template: './src/index.ejs'
  },
  publicPath: '/static/dists/', //
  //"publicPath" : "/", ///
  disableDynamicImport: true,
  hash: true,
  proxy: {
    '/api': {
      target: 'baidu.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': ''
      }
    }
  }
};
