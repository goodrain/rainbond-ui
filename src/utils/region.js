import cookie from './cookie';

const regioniUtil = {
  actionToCN(action = []) {
    let res = [];
    res = action.map(item => actionMap[item]);
    return res.join(', ');
  },
  // 获取监控页面 SocketUrl
  getMonitorWebSocketUrl(bean) {
    let uri = bean.websocket_uri;

    if (uri[uri.length - 1] !== '/') {
      uri += '/';
    }

    return `${uri}new_monitor_message`;
  },
  // 获取操作日志SocketUrl
  getEventWebSocketUrl(bean) {
    let uri = bean.websocket_uri;
    if (uri[uri.length - 1] !== '/') {
      uri += '/';
    }
    return `${uri}event_log`;
  },
  getNewWebSocketUrl(bean, serviceID) {
    let uri = bean.websocket_uri;
    if (uri[uri.length - 1] !== '/') {
      uri += '/';
    }
    return `${uri}services/${serviceID}/pubsub`;
  },
};

export default regioniUtil;
