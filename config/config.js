import defaultSettings from '../src/defaultSettings';
import routerConfig from './router.config';
import theme from './theme.js';

let publcPath = '/static/dists/';
if (process.env.SEPARATION === 'true') {
  publcPath = `/`;
}
const isHistory = process.env.ROUTE_MODE === 'history';

export default {
  history: { type: isHistory ? 'browser' : 'hash' },
  publicPath: publcPath,
  hash: !isHistory,
  antd: {},
  dva: {
    hmr: true
  },
  locale: {
    default: 'zh-CN',
    antd: false,  // antd 3.x 不兼容，需要手动配置 LocaleProvider
    baseNavigator: true,
    baseSeparator: '-',
  },
  dynamicImport: false,
  ignoreMomentLocale: true,
  theme,
  lessLoader: {
    javascriptEnabled: true
  },

  routes: routerConfig,
  proxy: {
    '/console': {
      target: 'http://127.0.0.1:7070',
      changeOrigin: true
    },
    '/data': {
      target: 'http://127.0.0.1:7070',
      changeOrigin: true
    },
    '/openapi/v1': {
      target: 'http://127.0.0.1:7070',
      changeOrigin: true
    },
    '/enterprise-server': {
      target: 'http://127.0.0.1:7070',
      changeOrigin: true
    },
  }
};