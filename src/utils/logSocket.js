/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
import TimerQueue from './timerQueue';

function noop() {}

function LogSocket(op) {
  const option = op || {};
  this.url = option.url;
  this.eventId = option.eventId;
  this.onOpen = option.onOpen || noop;
  this.onMessage = option.onMessage || noop;
  this.onError = option.onError || noop;
  this.onClose = option.onClose || noop;
  this.onTimeout = option.onTimeout || noop;
  this.onSuccess = option.onSuccess || noop;
  this.onComplete = option.onComplete || noop;
  this.onFail = option.onFail || noop;
  this.interval = option.interval || 10;
  try {
    this.init();
  } catch (e) {
    console.log(e);
  }
}

LogSocket.prototype = {
  constructor: LogSocket,
  init() {
    this.webSocket = new WebSocket(this.url);
    this.webSocket.onopen = this._onOpen.bind(this);
    this.webSocket.onmessage = this._onMessage.bind(this);
    this.webSocket.onclose = this._onClose.bind(this);
    this.webSocket.onerror = this._onError.bind(this);
    this.timerQueue = new TimerQueue({
      onExecute: this.onMessage,
      autoStart: true,
      interval: this.interval
    });
  },
  getSocket() {
    return this.webSocket;
  },
  close() {
    this.webSocket && this.webSocket.close();
  },
  _onOpen() {
    try {
      this.webSocket.send(`event_id=${this.eventId}`);
      this.onOpen();
    } catch (err) {
      console.log('err', err);
      return false;
    }
  },
  _onMessage(evt) {
    // 代表连接成功， 不做任何处理
    if (evt.data != 'ok') {
      const data = JSON.parse(evt.data);

      // 判断是否最后一步
      if (data.step === 'callback' || data.step === 'last') {
        this.webSocket && this.webSocket.close();
        if (data.status === 'success') {
          this.onSuccess(data);
        } else if (data.status === 'timeout') {
          this.onTimeout(data);
        } else if (data.status === 'failure') {
          data.message = `<span style="color:#a94442">${data.message}</span>`;
          this.onFail(data);
        }
        this.onComplete(data);
      }
      this.timerQueue.add(data);
    }
  },
  _onClose(evt) {
    this.onClose && this.onClose();
  },
  _onError() {
    this.onError && this.onError();
  },

  destroy() {
    this.onMessage = null;
    this.onError = null;
    this.onClose = null;
    this.onTimeout = null;
    this.onSuccess = null;
    this.onComplete = null;
    this.onFail = null;
    this.destroyed = true;
    this.close();
  }
};

export default LogSocket;
