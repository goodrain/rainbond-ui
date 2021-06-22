const statusMap = {
  1: '升级',
  2: '升级中',
  3: '已升级',
  4: '回滚中',
  5: '已回滚',
  6: '部分升级完成',
  7: '部分回滚',
  8: '升级失败',
  9: '回滚失败',
  10: '部署失败'
};

const statusMaps = {
  1: '升级',
  2: '升级中',
  3: '升级完成',
  4: '回滚中',
  5: '回滚完成',
  6: '部分升级完成',
  7: '部分回滚',
  8: '升级失败',
  9: '回滚失败',
  10: '部署失败'
};
const statusColors = {
  1: '#13c2c2',
  2: '#13c2c2',
  3: '#4d73b1',
  4: '#13c2c2',
  5: '#4d73b1',
  6: '#1890ff',
  7: '#1890ff',
  8: '#f5222d',
  9: '#f5222d',
  10: '#f5222d'
};

const util = {
  getStatusText: status => {
    return statusMap[status] || '-';
  },
  getStatusCNS: status => {
    return statusMaps[status] || '-';
  },
  getStatusColor: status => {
    return statusColors[status] || '-';
  }
};
export default util;
