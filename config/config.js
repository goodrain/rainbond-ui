import routerConfig from "./router.config";
import defaultSettings from '../src/defaultSettings';

export default {
  history: 'hash',
  publicPath: '/static/',
  hash: true,
  plugins: [
    [
      "umi-plugin-react",
      {
        antd: true,
        dva: {
          hmr: true
        }
      }
    ]
  ],

  // externals: {
  //   "@antv/data-set": "DataSet",
  //   rollbar: "rollbar"
  // },
  ignoreMomentLocale: true,
  theme: {
    "card-actions-background":  defaultSettings.primaryColor, 
  },
  // env: {
  //   development: {
  //     extraBabelPlugins: ["dva-hmr"],
  //     html: {
  //       template: "./src/index.ejs"
  //     },
  //     publicPath: "/" ///
  //   },
  //   production: {
  //     html: {
  //       filename: "./index.html", //
  //       template: "./src/index.ejs"
  //     },
  //     publicPath: "/static/dists/" //
  //     // outputPath: path.resolve(__dirname, "../../pythonWork/rainbond-console/www/static/dists"),
  //     // outputPath: path.resolve(__dirname, "/static/dists"),
  //   }
  // },
  lessLoaderOptions: {
    javascriptEnabled: true
  },
  disableDynamicImport: true,

  routes: routerConfig
};
