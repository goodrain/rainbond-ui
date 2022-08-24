import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
const categoryMap = {
  'net-plugin:up': '入口网络',
  'net-plugin:in-and-out': '出口入口共治网络',
  'net-plugin:down': '出口网络',
  'analyst-plugin:perf': '性能分析',
  'init-plugin': '初始化类型',
  'general-plugin': '一般类型',
  'exporter-plugin': '监控',
  downstream_net_plugin: '网络治理',
  perf_analyze_plugin: '性能分析',
  inandout_net_plugin: '出口入口共治网络',
};

const inType = {
  env: '环境变量',
  auto: '主动发现',
};

const metaType = {
  un_define: '不依赖',
  upstream_port: '应用端口',
  downstream_port: '下游应用端口',
};

const buildStatusMap = {
  unbuild: '未构建',
  building: '构建中',
  build_success: '构建成功',
  build_fail: '构建失败',
  time_out: '构建超时',
};

const versionStatusMap = {
  fixed: '固定',
  unfixed: '未固定',
};

const mountMap = [
  '/',
  '/bin',
  '/boot',
  '/dev',
  '/etc',
  '/home',
  '/lib',
  '/lib64',
  '/opt',
  '/proc',
  '/root',
  '/sbin',
  '/srv',
  '/sys',
  '/tmp',
  '/usr',
  '/var',
  '/user/local',
  '/user/sbin',
  '/user/bin',
];
export default {
  getCategoryCN(category) {
    return categoryMap[category] || '未知类型';
  },
  getMetaTypeCN(v) {
    return metaType[v] || '未知';
  },
  getInjectionCN(v) {
    return inType[v] || '未知';
  },
  // 是否从云市安装的插件
  isMarketPlugin(bean) {
    return bean.origin === 'market' || bean.origin === 'local_market';
  },
  // 获取插件版本构建状态的中文描述
  getBuildStatusCN(status) {
    return buildStatusMap[status] || '未知';
  },
  // 获取插件版本构建状态的中文描述
  getVersionStatusCN(status) {
    return versionStatusMap[status] || '未知';
  },
  // 是否可以修改基本信息和配置组信息, 已经版本固定的不能进行修改
  canEditInfoAndConfig(bean) {
    return bean.plugin_version_status !== 'fixed';
  },
  isMountPath(path) {
    return mountMap.includes(path);
  },
};
