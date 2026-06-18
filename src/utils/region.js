import cookie from './cookie';

function getConsoleWebSocketBase(bean = {}) {
  const regionName = bean.team_region_name || bean.region_name || bean.regionName || cookie.get('region_name');
  if (!regionName || typeof window === 'undefined' || !window.location) {
    return bean.websocket_uri || '';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/console/regions/${regionName}/websocket`;
}

function appendWebSocketPath(bean, path) {
  let uri = getConsoleWebSocketBase(bean);
  if (!uri) {
    return '';
  }
  if (uri[uri.length - 1] !== '/') {
    uri += '/';
  }
  return `${uri}${path}`;
}

const regioniUtil = {
  actionToCN(action = []) {
    let res = [];
    res = action.map(item => actionMap[item]);
    return res.join(', ');
  },
  // 获取监控页面 SocketUrl
  getMonitorWebSocketUrl(bean) {
    return appendWebSocketPath(bean, 'new_monitor_message');
  },
  // 获取操作日志SocketUrl
  getEventWebSocketUrl(bean) {
    return appendWebSocketPath(bean, 'event_log');
  },
  getNewWebSocketUrl(bean, serviceID) {
    return appendWebSocketPath(bean, `services/${serviceID}/pubsub`);
  },
};

export default regioniUtil;
