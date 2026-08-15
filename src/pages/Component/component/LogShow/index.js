import downLoadTools from '@/utils/downLoadTools';
import { Button, Modal } from 'antd';
import { connect } from 'dva';
import React from 'react';
import Ansi from '../../../../components/Ansi';
import dateUtil from '../../../../utils/date-util';
import globalUtil from '../../../../utils/global';
import LogSocket from '../../../../utils/logSocket';
import styles from './index.less';

@connect(
  ({ user }) => ({
    currUser: user.currentUser
  }),
  null,
  null,
  { withRef: true }
)
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: [],
      dockerprogress: null,
      dynamic: false
    };
    this.state.dockerprogress = new Map();
    // 记录已渲染的无 id 日志行，避免 HTTP 快照重复追加
    this.seenMessages = new Set();
    this.pollTimer = null;
    this.unmounted = false;
  }
  componentDidMount() {
    this.loadEventLog();
  }
  componentWillUnmount() {
    this.unmounted = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
  shouldComponentUpdate() {
    return true;
  }
  componentDidUpdate(prevProps, prevState) {
    // 判断日志是否有更新
    if (prevState.logs.length !== this.state.logs.length && this.refs.box) {
      // 将滚动条滚动到底部
      this.refs.box.scrollTop = this.refs.box.scrollHeight;
    }
  }
  getLineHtml = (lineNumber, message) => {
    return (
      <div className={styles.logline} key={lineNumber}>
        <a>{lineNumber}</a>
        <Ansi>{message}</Ansi>
      </div>
    );
  };
  handleCancel = () => {
    this.props.handleCancel();
  };
  loadEventLog() {
    const { EventID, showSocket, socketUrl } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'appControl/fetchLogContent',
      payload: {
        team_name: teamName,
        eventID: EventID
      },
      callback: res => {
        if (this.unmounted) {
          return;
        }
        if (res) {
          this.setState(
            this.mergeHistoryLogs(res.list),
            () => {
              if (showSocket && socketUrl) {
                this.showSocket();
              } else if (showSocket) {
                this.scheduleLogPoll();
              }
            }
          );
        } else if (showSocket && socketUrl) {
          this.showSocket();
        } else if (showSocket) {
          this.scheduleLogPoll();
        }
      }
    });
  }
  scheduleLogPoll = () => {
    const { showSocket, socketUrl } = this.props;
    if (this.unmounted || !showSocket || socketUrl) {
      return;
    }
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      this.loadEventLog();
    }, 2000);
  };
  // HTTP 接口返回完整日志快照，登记已显示内容后只追加新增日志。
  mergeHistoryLogs = list => {
    const { dockerprogress } = this.state;
    const logs = [...(this.state.logs || [])];
    (list || []).forEach(item => {
      const progress = this.parseProgressMessage(item.message);
      if (progress) {
        if (dockerprogress.get(progress.id) === undefined) {
          logs.push(item);
        }
        dockerprogress.set(progress.id, progress);
        return;
      }
      if (!this.seenMessages.has(item.message)) {
        this.seenMessages.add(item.message);
        logs.push(item);
      }
    });
    return {
      logs,
      dockerprogress,
      dynamic: this.state.dynamic || this.props.showSocket
    };
  };
  parseProgressMessage = message => {
    if (!message || message.indexOf('id') === -1) {
      return null;
    }
    try {
      const m = JSON.parse(message);
      if (m && m.id !== undefined) {
        return m;
      }
    } catch (err) {
      // 非 JSON 进度消息，按普通日志处理
    }
    return null;
  };
  handleMessage = data => {
    const logs = this.state.logs || [];
    const progress = this.parseProgressMessage(data.message);
    if (progress) {
      const { dockerprogress } = this.state;
      if (dockerprogress.get(progress.id) === undefined) {
        logs.push(data);
      }
      dockerprogress.set(progress.id, progress);
      this.setState({
        dockerprogress,
        logs,
        dynamic: true
      });
      return;
    }
    if (!this.seenMessages.has(data.message)) {
      this.seenMessages.add(data.message);
      logs.push(data);
    }
    if (this.refs.box) {
      this.refs.box.scrollTop = this.refs.box.scrollHeight;
    }
    this.setState({ logs, dynamic: true });
  };
  showSocket() {
    const { EventID, socketUrl } = this.props;
    if (socketUrl) {
      const { onClose, onSuccess, onTimeout, onFail, onComplete } = this.props;
      const isThrough = dateUtil.isWebSocketOpen(socketUrl);
      if (isThrough && isThrough === 'through') {
        this.socket = new LogSocket({
          eventId: EventID,
          url: socketUrl,
          onClose: () => {
            if (onClose) {
              onClose();
            }
          },
          onSuccess: data => {
            if (onSuccess) {
              onSuccess(data);
            }
          },
          onTimeout: data => {
            if (onTimeout) {
              onTimeout(data);
            }
          },
          onFail: data => {
            if (onFail) {
              onFail(data);
            }
          },
          onMessage: data => {
            this.handleMessage(data);
          },
          onComplete: () => {
            if (onComplete) {
              onComplete();
            }
          }
        });
      }
    }
  }

  render() {
    const { title, onOk, onCancel, width } = this.props;
    const { logs, dockerprogress, dynamic } = this.state;
    let lineNumber = 0;
    let bodyText = '';
    const box = (
      <div>
        <div className={styles.logsss} ref="box">
          {logs &&
            logs.map(log => {
              lineNumber += 1;
              try {
                if (log.message.indexOf('"stream"') != -1) {
                  const m = JSON.parse(log.message);
                  if (m && m.stream !== undefined) {
                    return this.getLineHtml(lineNumber, m.stream);
                  }
                }
                if (
                  log.message.indexOf('status') != -1 ||
                  log.message.indexOf('progress') != -1
                ) {
                  if (!dynamic) {
                    lineNumber -= 1;
                    return null;
                  }
                  const m = JSON.parse(log.message);
                  if (m && m.status !== undefined && m.id !== undefined) {
                    const dp = dockerprogress.get(m.id);
                    if (dp && dp.progress !== undefined) {
                      return this.getLineHtml(
                        lineNumber,
                        `${m.id}:${m.status} ${dp.progress}`
                      );
                    }
                    return this.getLineHtml(lineNumber, `${m.id}:${m.status}`);
                  }
                  if (m && m.status !== undefined) {
                    return this.getLineHtml(lineNumber, m.status);
                  }
                  if (m && m.progress !== undefined && m.id !== undefined) {
                    return this.getLineHtml(
                      lineNumber,
                      `${m.id}:${m.progress}`
                    );
                  }
                }
                return this.getLineHtml(lineNumber, log.message);
              } catch (err) {
                // ignore
                return this.getLineHtml(lineNumber, log.message);
              }
            })}
        </div>
      </div>
    );

    const downloadbBox = (
      <div>
        当前日志过大请下载后查看
        <a
          style={{ marginLeft: '30px' }}
          onClick={() => {
            downLoadTools.saveTXT(bodyText, '日志');
          }}
        >
          下载日志
        </a>
      </div>
    );

    if (logs && logs.length > 0) {
      logs.map(item => {
        lineNumber += 1;
        bodyText = `${bodyText}\n${item.message}`;
      });
    }
    const isDownloadb = bodyText.length >= 1024 * 1024 && !dynamic;

    return (
      <Modal
        className={!isDownloadb && styles.logModal}
        title={title}
        maskClosable={false}
        visible
        onOk={onOk}
        onCancel={onCancel}
        width={isDownloadb ? '520px' : width}
        bodyStyle={isDownloadb ? {} : { background: '#222222', color: '#fff' }}
        footer={isDownloadb ? [<Button onClick={onCancel}>关闭</Button>] : null}
      >
        <div>{isDownloadb ? downloadbBox : box}</div>
      </Modal>
    );
  }
}

export default Index;
