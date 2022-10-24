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

function AppPubSubSocket(op) {
  const option = op || {};
  this.url = option.url;
  this.serviceId = option.serviceId;
  this.onOpen = option.onOpen || noop;
  this.onLogMessage = option.onLogMessage || noop;
  this.onMonitorMessage = option.onMonitorMessage || noop;
  this.onError = option.onError || noop;
  this.onClose = option.onClose || noop;
  this.onError = option.onError || noop;
  this.onSuccess = option.onSuccess || noop;
  this.onComplete = option.onComplete || noop;
  this.onFail = option.onFail || noop;
  // 当close 事件发生时， 是否自动重新连接
  this.isAutoConnect = option.isAutoConnect;
  this.destroyed = option.destroyed;
  try {
    this.init();
  } catch (e) {
    console.log(e);
  }
}

AppPubSubSocket.prototype = {
  constructor: AppPubSubSocket,
  init() {
    this.webSocket = new WebSocket(this.url);
    this.webSocket.onopen = this._onOpen.bind(this);
    this.webSocket.onmessage = this._onMessage.bind(this);
    this.webSocket.onclose = this._onClose.bind(this);
    this.webSocket.onerror = this._onError.bind(this);
    this.serviceLogQueue = new TimerQueue({
      interval: 20,
      autoStart: false,
      batchout: true,
      maxCache: 5000,
      onExecute: message => {
        if (message === undefined) {
          return;
        }
        this.onLogMessage(message);
      }
    });
    this.monitorLogQueue = new TimerQueue({
      interval: 5,
      autoStart: false,
      onExecute: message => {
        if (message === undefined) {
          return;
        }
        this.onMonitorMessage(message);
      }
    });
    this.eventLogQueue = new Map();
    this.opened = false;
    this.waitingSendMessage = [];
  },
  getEventLogQueue(channel) {
    if (this.eventLogQueue.has(channel)) {
      return this.eventLogQueue.get(channel);
    }
    const queue = new TimerQueue({ autoStart: true });
    this.eventLogQueue.set(channel, queue);
    return queue;
  },
  watchEventLog(onMessage, onSuccess, onFailure, eventID) {
    const channel = `event-${eventID}`;
    if (this.eventLogQueue.has(channel)) {
      this.eventLogQueue.get(channel).onExecute = item => {
        if (item.action !== undefined && item.status !== undefined) {
          if (item.status === 'success') {
            onSuccess(item.message);
          } else {
            onFailure(item.message);
          }
        }
        onMessage(item);
      };
    } else {
      this.eventLogQueue.set(
        channel,
        new TimerQueue({
          autoStart: true,
          onExecute: item => {
            if (item.action !== undefined && item.status !== undefined) {
              if (item.status === 'success') {
                onSuccess(item.message);
              } else {
                onFailure(item.message);
              }
            }
            onMessage(item);
          }
        })
      );
      const message = {
        event: 'pusher:subscribe',
        data: {
          channel: `e-${eventID}`
        }
      };
      try {
        if (this.opened) {
          this.webSocket.send(JSON.stringify(message));
        } else {
          this.waitingSendMessage.push(JSON.stringify(message));
        }
      } catch (err) {
        console.log('err', err);
        return false;
      }
    }
  },
  setOnLogMessage(callbackAll, onLogMessage) {
    try {
      if (this.serviceId) {
        const message = {
          event: 'pusher:subscribe',
          data: {
            channel: `l-${this.serviceId}`
          }
        };
        if (this.webSocket.readyState === 1) {
            this.webSocket.send(JSON.stringify(message));
        }
      }
      callbackAll(this.serviceLogQueue.brushout());
      this.onLogMessage = onLogMessage;
      this.serviceLogQueue.start();
    } catch (err) {
      console.log('err', err);
      return false;
    }
  },
  setOnMonitorMessage(onMonitorMessage) {
    try {
      if (this.serviceId) {
        const message = {
          event: 'pusher:subscribe',
          data: {
            channel: `m-${this.serviceId}`
          }
        };
        this.webSocket.send(JSON.stringify(message));
      }
      this.onMonitorMessage = onMonitorMessage;
      this.monitorLogQueue.start();
    } catch (err) {
      console.log('err', err);
      return false;
    }
  },
  closeLogMessage() {
    try {
      if (this.serviceId) {
        const message = {
          event: 'cancel:subscribe',
          data: {
            channel: `docker-${this.serviceId}`
          }
        };
        this.webSocket.send(JSON.stringify(message));
      }
      this.serviceLogQueue.stop();
    } catch (err) {
      console.log('err', err);
      return false;
    }
  },
  closeMonitorMessage() {
    try {
      if (this.serviceId) {
        const message = {
          event: 'cancel:subscribe',
          data: {
            channel: `newmonitor-${this.serviceId}`
          }
        };
        this.webSocket.send(JSON.stringify(message));
      }
    } catch (err) {
      console.log('err', err);
      return false;
    }
  },
  close() {
    if (this.webSocket) {
      this.webSocket.close();
    }
  },

  _onOpen() {
    try {
      this.onOpen(this.webSocket);
      this.opened = true;
      if (this.waitingSendMessage.length > 0) {
        this.waitingSendMessage.map(m => {
          this.webSocket.send(m);
          return null;
        });
      }
    } catch (err) {
      console.log('err', err);
    }
  },
  _onMessage(message) {
    const me = JSON.parse(message.data);
    if (!me) {
      return;
    }
    if (!me.event) {
      return;
    }
    if (me.event === 'monitor') {
      if (me.data) {
        const msg = JSON.parse(me.data);
        if (msg) {
          this.monitorLogQueue.add(msg);
        }
      }
    }
    if (me.event === 'service:log') {
      if (me.data) {
        this.serviceLogQueue.add(me.data);
      }
    }
    if (me.event === 'event:log') {
      if (me.data) {
        const msg = JSON.parse(me.data);
        if (msg) {
          this.getEventLogQueue(me.channel).add(msg);
        }
      }
    }
    if (me.event === 'event:success') {
      this.getEventLogQueue(me.channel).add({
        action: 'closed',
        message: me.data,
        status: 'success'
      });
    }
    if (me.event === 'event:failure') {
      this.getEventLogQueue(me.channel).add({
        action: 'closed',
        message: me.data,
        status: 'failure'
      });
    }
  },
  _onClose() {
    this.webSocket.onopen = null;
    this.webSocket.onmessage = null;
    this.webSocket.onclose = null;
    this.webSocket.onerror = null;
    this.webSocket = null;
    if (!this.destroyed && this.isAutoConnect) {
      setTimeout(() => {
        this.init();
      }, 2000);
    }
  },
  _onError() {
    this.onError();
  },
  destroy() {
    this.destroyed = true;
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
};

export default AppPubSubSocket;
