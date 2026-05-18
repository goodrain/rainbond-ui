import defaultSettings from '../src/defaultSettings';
import routerConfig from './router.config';
import theme from './theme.js';

let publcPath = '/static/dists/';
if (process.env.SEPARATION === 'true') {
  publcPath = `/`;
}
const isHistory = process.env.ROUTE_MODE === 'history';
const proxyTarget = process.env.CONSOLE_PROXY_TARGET || 'http://14.103.233.199:7070/';
const agentProxyTarget = process.env.AGENT_PROXY_TARGET || 'http://127.0.0.1:8787/';

export default {
  history: { type: isHistory ? 'browser' : 'hash' },
  publicPath: publcPath,
  hash: true,
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
  dynamicImport: {
    loading: '@/components/PageLoading/index'
  },
  mfsu: {},
  ignoreMomentLocale: true,
  theme,
  lessLoader: {
    javascriptEnabled: true
  },

  routes: routerConfig,
  proxy: {
    '/console': {
      target: proxyTarget,
      changeOrigin: true
    },
    '/data': {
      target: proxyTarget,
      changeOrigin: true
    },
    '/openapi/v1': {
      target: proxyTarget,
      changeOrigin: true
    },
    '/enterprise-server': {
      target: proxyTarget,
      changeOrigin: true
    },
    '/app-server': {
      target: proxyTarget,
      changeOrigin: true
    },
    '/api/v1/copilot': {
      target: agentProxyTarget,
      changeOrigin: true
    },
  }
};
