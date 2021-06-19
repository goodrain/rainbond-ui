/* eslint-disable no-unused-expressions */
/* eslint-disable react/no-redundant-should-component-update */
import moment from 'moment';
import React, { PureComponent } from 'react';
import dateUtil from '../../utils/date-util';
import domUtil from '../../utils/dom-util';
import LogSocket from '../../utils/logSocket';

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      datas: []
    };
    this.socketUrl = this.props.socketUrl;
    this.eventId = this.props.eventId;
  }
  componentDidMount() {
    this.createTmpElement();
    if (this.socketUrl) {
      const isThrough = dateUtil.isWebSocketOpen(this.socketUrl);
      if (isThrough && isThrough === 'through') {
        this.socket = new LogSocket({
          eventId: this.eventId,
          url: this.socketUrl,
          onClose: () => {
            this.props.onClose && this.props.onClose();
          },
          onSuccess: data => {
            this.props.onSuccess && this.props.onSuccess(data);
          },
          onTimeout: data => {
            this.props.onTimeout && this.props.onTimeout(data);
          },
          onFail: data => {
            this.props.onFail && this.props.onFail(data);
          },
          onMessage: data => {
            const ele = this.ele.cloneNode();
            try {
              if (this.ref) {
                const box = document.getElementById('box');
                box.scrollTop = box.scrollHeight;
                data.message = JSON.parse(data.message);
                const msg = data.message;
                ele.innerHTML = this.getItemHtml(data);
                if (msg.id) {
                  ele.setAttribute('data-id', msg.id);
                  const hasEle = document.querySelector(
                    `p[data-id="${msg.id}"]`
                  );
                  if (hasEle) {
                    this.ref.replaceChild(ele, hasEle);
                  } else {
                    domUtil.prependChild(this.ref, ele);
                  }
                } else {
                  domUtil.prependChild(this.ref, ele);
                }
              }
            } catch (e) {
              ele.innerHTML = this.getItemHtml(data);
              domUtil.prependChild(this.ref, ele);
            }
          },
          onComplete: () => {
            this.props.onComplete && this.props.onComplete();
          }
        });
      }
    }
  }
  componentWillUnmount() {
    if (this.socket) {
      this.socket.close() ? this.socket.close() : '';
      this.socket = null;
    }
    this.state.datas = [];
  }
  getItemHtml = data => {
    if (typeof data.message === 'string') {
      var msg = data.message;
      return `<span className="time" style="display:inline-block;margin-right: 8px;">${moment(
        data.time
      )
        .locale('zh-cn')
        .format('HH:mm:ss')}</span><span>${msg || ''}</span>`;
    }
    try {
      const { message } = data;
      var msg = '';
      if (message.id) {
        msg += `${message.id}:`;
      }
      msg += message.status || '';
      msg += message.progress || '';
      if (msg) {
        return `<span className="time" style="display:inline-block;margin-right: 8px;">${moment(
          data.time
        )
          .locale('zh-cn')
          .format('HH:mm:ss')}</span><span>${msg || ''}</span>`;
      }
      return `<span className="time" style="display:inline-block;margin-right: 8px;">${moment(
        data.time
      )
        .locale('zh-cn')
        .format('HH:mm:ss')}</span><span>${message.stream}</span>`;
    } catch (e) {
      if (data.message) {
        return `<span className="time" style="display:inline-block;margin-right: 8px;">${moment(
          data.time
        )
          .locale('zh-cn')
          .format('HH:mm:ss')}</span><span>${msg || ''}</span>`;
      }
      return '';
    }
  };
  createTmpElement() {
    this.ele = document.createElement('p');
    this.ele.cssText = 'margin-bottom:0';
  }

  findProgressById = id => {
    const { datas } = this.state;
    const d = datas.filter(data => data.message.id === id)[0];
    return d;
  };
  saveRef = ref => {
    this.ref = ref;
  };
  shouldComponentUpdate() {
    return true;
  }
  render() {
    const datas = this.state.datas || [];
    const logs = this.props.list || [];

    return (
      <div
        style={{ maxHeight: this.props.opened ? 350 : 30, overflowY: 'auto' }}
        id="box"
        ref={this.saveRef}
      >
        {logs &&
          logs.length > 0 &&
          logs.map((item, index) => (
            <p key={index}>
              <span
                style={{
                  marginRight: 10
                }}
              >
                {dateUtil.format(item.time, 'hh:mm:ss')}
              </span>
              <span>{item.message}</span>
            </p>
          ))}
      </div>
    );
  }
}
