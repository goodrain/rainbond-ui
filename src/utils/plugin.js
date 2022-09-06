import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
const categoryMap = {
  'net-plugin:up': formatMessage({id:'utils.plugin.up'}),
  'net-plugin:in-and-out': formatMessage({id:'utils.plugin.in-and-out'}),
  'net-plugin:down': formatMessage({id:'utils.plugin.down'}),
  'analyst-plugin:perf': formatMessage({id:'utils.plugin.perf'}),
  'init-plugin': formatMessage({id:'utils.plugin.init'}),
  'general-plugin': formatMessage({id:'utils.plugin.general-plugin'}),
  'exporter-plugin': formatMessage({id:'utils.plugin.exporter-plugin'}),
  downstream_net_plugin: formatMessage({id:'utils.plugin.downstream_net_plugin'}),
  perf_analyze_plugin: formatMessage({id:'utils.plugin.perf'}),
  inandout_net_plugin: formatMessage({id:'utils.plugin.in-and-out'}),
};

const inType = {
  env: formatMessage({id:'utils.plugin.env'}),
  auto: formatMessage({id:'utils.plugin.auto'}),
};

const metaType = {
  un_define: formatMessage({id:'utils.plugin.un_define'}),
  upstream_port: formatMessage({id:'utils.plugin.upstream_port'}),
  downstream_port: formatMessage({id:'utils.plugin.downstream_port'}),
};

const buildStatusMap = {
  unbuild: formatMessage({id:'utils.plugin.unbuild'}),
  building: formatMessage({id:'utils.plugin.building'}),
  build_success: formatMessage({id:'notification.success.build_success'}),
  build_fail: formatMessage({id:'utils.plugin.build_fail'}),
  time_out: formatMessage({id:'utils.plugin.time_out'}),
};

const versionStatusMap = {
  fixed: formatMessage({id:'utils.plugin.fixed'}),
  unfixed: formatMessage({id:'utils.plugin.unfixed'}),
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
    return categoryMap[category] || `${formatMessage({id:'utils.plugin.type'})}`;
  },
  getMetaTypeCN(v) {
    return metaType[v] || `${formatMessage({id:'utils.plugin.unknown'})}`;
  },
  getInjectionCN(v) {
    return inType[v] || `${formatMessage({id:'utils.plugin.unknown'})}`;
  },
  // 是否从云市安装的插件
  isMarketPlugin(bean) {
    return bean.origin === 'market' || bean.origin === 'local_market';
  },
  // 获取插件版本构建状态的中文描述
  getBuildStatusCN(status) {
    return buildStatusMap[status] || `${formatMessage({id:'utils.plugin.unknown'})}`;
  },
  // 获取插件版本构建状态的中文描述
  getVersionStatusCN(status) {
    return versionStatusMap[status] || `${formatMessage({id:'utils.plugin.unknown'})}`;
  },
  // 是否可以修改基本信息和配置组信息, 已经版本固定的不能进行修改
  canEditInfoAndConfig(bean) {
    return bean.plugin_version_status !== 'fixed';
  },
  isMountPath(path) {
    return mountMap.includes(path);
  },
};
