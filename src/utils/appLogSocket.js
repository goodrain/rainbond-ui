/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
/*
	当对应用进行重新部署、启动、关闭、回滚等操作时会先去服务器请求一个操作事件eventId
	请求成功后会根据这个eventId发起ajax进行相应的操作
	操作成功后可以用webSocket来获取对应的操作日志信息， 需要把eventId send给服务器
	这个类就是对本webSocket的封装, 该类不会对需要的参数做校验

	本类依赖TimerQueue工具类
*/

import TimerQueue from './timerQueue';

function noop() {}

function AppLogSocket(op) {
  const option = op || {};
  this.url = option.url;
  this.serviceId = option.serviceId;
  this.onOpen = option.onOpen || noop;
  this.onMessage = option.onMessage || noop;
  this.onError = option.onError || noop;
  this.onClose = option.onClose || noop;
  this.onError = option.onError || noop;
  this.onSuccess = option.onSuccess || noop;
  this.onComplete = option.onComplete || noop;
  this.onFail = option.onFail || noop;
  // 当close 事件发生时， 是否自动重新连接
  this.isAutoConnect = option.isAutoConnect;
  this.destroyed = option.destroyed;
  if (
    this.url &&
    /(ws|wss):\/\/[\w\-_]+([\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/.test(
      this.url
    )
  ) {
    this.init();
  } else {
    this.isAutoConnect = false;
  }
}

AppLogSocket.prototype = {
  constructor: AppLogSocket,
  init() {
    this.webSocket = new WebSocket(this.url);
    this.webSocket.onopen = this._onOpen.bind(this);
    this.webSocket.onmessage = this._onMessage.bind(this);
    this.webSocket.onclose = this._onClose.bind(this);
    this.webSocket.onerror = this._onError.bind(this);
    this.timerQueue = new TimerQueue({
      onExecute: this.onMessage,
      autoStart: true
    });
    const i = 1;
  },
  getSocket() {
    return this.webSocket;
  },
  close() {
    this.webSocket && this.webSocket.close();
  },
  _onOpen() {
    // 通知服务器
    try {
      this.serviceId && this.webSocket.send(`topic=${this.serviceId}`);
      this.onOpen(this.webSocket);
    } catch (err) {
      console.log('err', err);
      return false;
    }
  },
  _onMessage(evt) {
    // 代表连接成功， 不做任何处理
    if (evt.data && evt.data !== 'ok') {
      let msg = evt.data;
      if (this.instanceId) {
        if (msg.substring(0, 12) === this.instanceId) {
          msg = msg.substr(13);
        } else {
          msg = '';
        }
      } else {
        msg = msg;
      }
      msg && this.timerQueue.add(msg);
    }
  },
  _onClose(evt) {
    this.webSocket.onopen = null;
    this.webSocket.onmessage = null;
    this.webSocket.onclose = null;
    this.webSocket.onerror = null;
    this.webSocket = null;
    if (!this.destroyed && this.isAutoConnect) {
      this.init();
    }
  },
  _onError() {
    this.onError();
  },
  destroy() {
    this.destroyed = true;
    this.webSocket && this.webSocket.close();
  }
};

export default AppLogSocket;
