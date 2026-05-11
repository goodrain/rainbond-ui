// Mirror 配置文件类型 - 根据包管理器映射。
// pnpm 使用 .npmrc（不是 .pnpmrc），与 npm 相同。
const MIRROR_CONFIG_MAP = {
  npm: { value: '.npmrc', label: '.npmrc', fieldName: 'CNB_MIRROR_NPMRC' },
  yarn: { value: '.yarnrc', label: '.yarnrc', fieldName: 'CNB_MIRROR_YARNRC' },
  pnpm: { value: '.npmrc', label: '.npmrc', fieldName: 'CNB_MIRROR_NPMRC' }
};

// 默认镜像配置模板
const DEFAULT_MIRROR_CONFIGS = {
  '.npmrc': `registry=https://registry.npmmirror.com
disturl=https://npmmirror.com/dist
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
profiler_binary_host_mirror=https://npmmirror.com/mirrors/node-inspector/
fse_binary_host_mirror=https://npmmirror.com/mirrors/fsevents
node_sqlite3_binary_host_mirror=https://npmmirror.com/mirrors
sqlite3_binary_host_mirror=https://npmmirror.com/mirrors
sqlite3_binary_site=https://npmmirror.com/mirrors/sqlite3
sass_binary_site=https://npmmirror.com/mirrors/node-sass
electron_mirror=https://npmmirror.com/mirrors/electron/
puppeteer_download_host=https://npmmirror.com/mirrors
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver
operadriver_cdnurl=https://npmmirror.com/mirrors/operadriver
phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs
python_mirror=https://npmmirror.com/mirrors/python`,
  '.yarnrc': `registry "https://registry.npmmirror.com"
disturl "https://npmmirror.com/dist"
sharp_binary_host "https://npmmirror.com/mirrors/sharp"
sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips"
profiler_binary_host_mirror "https://npmmirror.com/mirrors/node-inspector/"
fse_binary_host_mirror "https://npmmirror.com/mirrors/fsevents"
node_sqlite3_binary_host_mirror "https://npmmirror.com/mirrors"
sqlite3_binary_host_mirror "https://npmmirror.com/mirrors"
sqlite3_binary_site "https://npmmirror.com/mirrors/sqlite3"
sass_binary_site "https://npmmirror.com/mirrors/node-sass"
electron_mirror "https://npmmirror.com/mirrors/electron/"
puppeteer_download_host "https://npmmirror.com/mirrors"
chromedriver_cdnurl "https://npmmirror.com/mirrors/chromedriver"
operadriver_cdnurl "https://npmmirror.com/mirrors/operadriver"
phantomjs_cdnurl "https://npmmirror.com/mirrors/phantomjs"
python_mirror "https://npmmirror.com/mirrors/python"`
};

const getConfigForPackageManager = pmName => {
  const pm = (pmName || '').toLowerCase() || 'npm';
  return MIRROR_CONFIG_MAP[pm] || MIRROR_CONFIG_MAP.npm;
};

const getMirrorContentForPackageManager = (pmName, envs = {}) => {
  const mirrorConfig = getConfigForPackageManager(pmName);
  return envs[mirrorConfig.fieldName] || DEFAULT_MIRROR_CONFIGS[mirrorConfig.value] || '';
};

const getDefaultMirrorEnvByPackageManager = (pmName, envs = {}) => {
  const mirrorConfig = getConfigForPackageManager(pmName);
  return {
    CNB_MIRROR_NPMRC: '',
    CNB_MIRROR_YARNRC: '',
    [mirrorConfig.fieldName]: getMirrorContentForPackageManager(pmName, envs)
  };
};

module.exports = {
  DEFAULT_MIRROR_CONFIGS,
  getConfigForPackageManager,
  getDefaultMirrorEnvByPackageManager,
  getMirrorContentForPackageManager,
  MIRROR_CONFIG_MAP
};
