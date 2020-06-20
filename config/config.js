import defaultSettings from "../src/defaultSettings";
import routerConfig from "./router.config";

export default {
  history: "hash",
  // publicPath: "/static/dists/",
  publicPath: "/",
  hash: true,
  plugins: [
    [
      "umi-plugin-react",
      {
        antd: true,
        dva: {
          hmr: true
        },
        dynamicImport: {
          loadingComponent: './components/PageLoading/index',
          webpackChunkName: true,
          level: 3,
        },
        locale: {
          // default false
          enable: false,
          // default zh-CN
          default: 'zh-CN',
          // default true, when it is true, will use `navigator.language` overwrite default
          baseNavigator: false,
        }
      },
    ]
  ],
  ignoreMomentLocale: true,
  theme: {
    "card-actions-background": defaultSettings.primaryColor
  },
  lessLoaderOptions: {
    javascriptEnabled: true
  },
  disableDynamicImport: true,

  routes: routerConfig,
  proxy: {
    '/console/proxy': {
      target: 'http://zengqg.pre.goodrain.com',
      changeOrigin: true
    }
  }
};
