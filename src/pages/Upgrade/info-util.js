const statusMap = {
  '1': '未升级',
  '2': '升级中',
  '3': '已升级',
  '4': '回滚中',
  '5': '已回滚',
  '6': '部分升级',
  '7': '部分回滚',
  '8': '升级失败',
  '9': '回滚失败'
};

const statusMaps = {
  '1': '未升级',
  '2': '升级中',
  '3': '升级完成',
  '4': '回滚中',
  '5': '回滚完成',
  '6': '部分升级',
  '7': '部分回滚',
  '8': '升级失败',
  '9': '回滚失败'
};
const helmStatusMaps = {
  'not-configured': '未配置',
  unknown: '未知',
  deployed: '已部署',
  superseded: '可升级',
  failed: '失败',
  uninstalled: '已卸载',
  uninstalling: '卸载中',
  'pending-install': '安装中',
  'pending-upgrade': '升级中',
  'pending-rollback': '回滚中'
};
const util = {
  getStatusCN: status => {
    return statusMap[status] || '-';
  },
  getStatusCNS: status => {
    return statusMaps[status] || '-';
  },
  getHelmStatus: status => {
    return helmStatusMaps[status] || '-';
  }
};
export default util;
