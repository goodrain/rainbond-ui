import defaultSettings from '../src/defaultSettings';
import routerConfig from './router.config';
import theme from './theme.js';

let publcPath = '/static/dists/';
if (process.env.SEPARATION === 'true') {
  publcPath = `/`;
}
const isHistory = process.env.ROUTE_MODE === 'history';
const proxyTarget = process.env.CONSOLE_PROXY_TARGET || 'http://127.0.0.1:7070/';
const agentProxyTarget = process.env.AGENT_PROXY_TARGET || 'http://127.0.0.1:8787/';
const enableSentrySourceMap = /^(true|1|yes|on)$/i.test(process.env.RAINBOND_SENTRY_SOURCEMAP || '');
const sentrySourceMapDevtool = process.env.RAINBOND_SENTRY_SOURCEMAP_DEVTOOL || 'hidden-source-map';

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
  // mfsu: {},
  ignoreMomentLocale: true,
  theme,
  lessLoader: {
    javascriptEnabled: true
  },
  chainWebpack(config) {
    if (enableSentrySourceMap) {
      config.devtool(sentrySourceMapDevtool);
    }
  },
  devServer: {
    compress: false
  },

  routes: routerConfig,
  proxy: {
    '/api/v1/ai-engine': {
      target: 'http://127.0.0.1:9090',
      changeOrigin: true,
      onProxyReq: (proxyReq) => {
        proxyReq.removeHeader('Accept-Encoding');
      },
      onProxyRes: (proxyRes) => {
        if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
          proxyRes.headers['cache-control'] = 'no-cache';
          proxyRes.headers['x-accel-buffering'] = 'no';
        }
      }
    },
    '/v1': {
      target: 'http://127.0.0.1:9090',
      changeOrigin: true
    },
    '/console/regions/rainbond/static/plugins/rainbond-ai-engine': {
      target: 'http://127.0.0.1:9999',
      changeOrigin: true,
      pathRewrite: {
        '^/console/regions/rainbond/static/plugins/rainbond-ai-engine': '/main.js'
      }
    },
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
