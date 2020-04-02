const categoryMap = {
  'net-plugin:up': '入口网络',
  'net-plugin:in-and-out': '出口入口共治网络',
  'net-plugin:down': '出口网络',
  'analyst-plugin:perf': '性能分析',
  'init-plugin': '初始化类型',
  'general-plugin': '一般类型',
  downstream_net_plugin: '网络治理',
  perf_analyze_plugin: '性能分析',
  inandout_net_plugin: '出口入口共治网络',
};

export default {
  getCategoryCN(category) {
    return categoryMap[category] || '未知类型';
  },
  handlUnit(num) {
    return num && (num / 1024).toFixed(2) / 1;
  },
};
