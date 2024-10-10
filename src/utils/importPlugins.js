import System from 'systemjs/dist/system.js';
import _ from 'lodash';
import moment from 'moment';
import react from 'react';
import * as ReactDom from 'react-dom';
import * as RbdData from 'xu-demo-data';
import { RainbondRootPagePlugin, RainbondEnterprisePagePlugin } from 'xu-demo-data'



export const SystemJS = System;
const cache = {};
const initializedAt = Date.now();


SystemJS.registry.set('plugin-loader', SystemJS.newModule({ locate: locateWithCache }));

SystemJS.config({
  baseURL: '/public',
  defaultExtension: 'js',
  packages: {
    plugins: {
      defaultExtension: 'js',
    },
  },
  meta: {
    '/*': {
      esModule: true,
      authorization: false,
      loader: 'plugin-loader',
    }
  },
});


export function exposeToPlugin(name, component) {
  SystemJS.registerDynamic(name, [], true, function (require, exports, module) {
    module.exports = component;
  });
}
exposeToPlugin('lodash', _);
exposeToPlugin('moment', moment);
exposeToPlugin('react', react);
exposeToPlugin('react-dom', ReactDom);
exposeToPlugin('xu-demo-data', RbdData);

export async function importPluginModule(meta, regionName) {
  const path = `/console/regions/${regionName}/static/plugins/${meta.name}/${meta.fronted_relative_path}`
  const module = await SystemJS.import(path);
  return module
}

export async function importAppPagePlugin(meta, regionName, type) {
  const xu = await importPluginModule(meta, regionName).then(function (pluginExports) {
    const plugin = pluginExports.plugin ? (pluginExports.plugin) :type == 'enterprise' ? new RainbondEnterprisePagePlugin() : new RainbondRootPagePlugin();
    plugin.init(meta);
    plugin.meta = meta;
    return plugin;
  });
  return xu
}

export function locateWithCache(load, defaultBust = initializedAt) {
  const { address } = load;
  const path = extractPath(address);
  if (!path) {
    return `${address}?_cache=${defaultBust}`;
  }
  const version = cache[path];
  const bust = version || defaultBust;
  return `${address}?_cache=${bust}`;
}

function extractPath(address) {
  const match = /\/public\/(plugins\/.+\/module)\.js/i.exec(address);
  if (!match) {
    return;
  }
  const [_, path] = match;
  if (!path) {
    return;
  }
  return path;
}