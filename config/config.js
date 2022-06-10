import defaultSettings from '../src/defaultSettings';
import routerConfig from './router.config';

let publcPath = '/static/dists/';
if (process.env.SEPARATION === 'true') {
  publcPath = `/`;
}
const isHistory = process.env.ROUTE_MODE === 'history';

export default {
  history: isHistory ? 'browser' : 'hash',
  publicPath: publcPath,
  hash: !isHistory,
  plugins: [
    [
      'umi-plugin-react',
      {
        antd: true,
        dva: {
          hmr: true
        },
        dynamicImport: {
          loadingComponent: './components/PageLoading/index',
          webpackChunkName: true,
          level: 3
        },
        locale: {
          // default false
          enable: false,
          // default zh-CN
          default: 'zh-CN',
          // default true, when it is true, will use `navigator.language` overwrite default
          baseNavigator: false
        }
      }
    ]
  ],
  ignoreMomentLocale: true,
  theme: {
    'card-actions-background': defaultSettings.primaryColor,
    'primary-color': defaultSettings.primaryColor
  },
  lessLoaderOptions: {
    javascriptEnabled: true
  },
  disableDynamicImport: true,

  routes: routerConfig,
  proxy: {
    '/console': {
      target: 'http://4000.gr17ba3a.2c9v614j.17f4cc.grapps.cn',
      changeOrigin: true
    },
    '/data': {
      target: 'http://4000.gr17ba3a.2c9v614j.17f4cc.grapps.cn',
      changeOrigin: true
    },
    '/enterprise-server': {
      target: 'http://8080.gr2652c0.2c9v614j.17f4cc.grapps.cn',
      changeOrigin: true
    }
  }
};
