import downLoadTools from '@/utils/downLoadTools';
import { Button, Modal } from 'antd';
import { connect } from 'dva';
import React from 'react';
import Ansi from '../../../../components/Ansi';
import dateUtil from '../../../../utils/date-util';
import globalUtil from '../../../../utils/global';
import LogSocket from '../../../../utils/logSocket';
import {
  buildEventLogReplayBudget,
  buildEventLogStreamUrl,
  getEventLogTerminalState,
  shouldAppendEventStreamMessage,
  shouldAppendEventLog
} from './eventLogStreamHelpers';
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
      status: null,
      dynamic: false
    };
    this.state.dockerprogress = new Map();
    // 仅供需要保留历史行为的独立 WebSocket 日志去重
    this.seenMessages = new Set();
    this.eventLogReplayBudget = null;
    this.eventSource = null;
    this.socket = null;
    this.unmounted = false;
  }
  componentDidMount() {
    this.loadEventLog();
  }
  componentWillUnmount() {
    this.unmounted = true;
    this.closeEventSource();
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
    const { EventID } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'appControl/fetchLogContent',
      payload: {
        team_name: teamName,
        eventID: EventID
      },
      callback: res => {
        if (res) {
          this.setState(this.mergeHistoryLogs(res.list), this.startRealtimeLog);
        } else {
          this.startRealtimeLog();
        }
      }
    });
  }
  startRealtimeLog = () => {
    if (this.unmounted) {
      return;
    }
    const { showEventStream, showSocket, socketUrl } = this.props;
    if (showEventStream) {
      this.openEventStream();
    } else if (showSocket && socketUrl) {
      this.showSocket();
    }
  };
  // progress.id 保持覆盖更新；普通日志默认全部保留。
  // AppShareLoading 的独立 WebSocket 通过显式 prop 保留原去重行为。
  mergeHistoryLogs = list => {
    const { dockerprogress } = this.state;
    const { deduplicateMessages } = this.props;
    const logs = [];
    (list || []).forEach(item => {
      const progress = this.parseProgressMessage(item.message);
      if (progress) {
        if (dockerprogress.get(progress.id) === undefined) {
          logs.push(item);
        }
        dockerprogress.set(progress.id, progress);
        return;
      }
      if (
        shouldAppendEventLog(
          item.message,
          this.seenMessages,
          deduplicateMessages
        )
      ) {
        logs.push(item);
      }
    });
    return { logs, dockerprogress };
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
    const { deduplicateMessages } = this.props;
    const progress = this.parseProgressMessage(data.message);
    this.setState(
      prevState => {
        const logs = [...(prevState.logs || [])];
        const dockerprogress = new Map(prevState.dockerprogress);
        if (progress) {
          if (dockerprogress.get(progress.id) === undefined) {
            logs.push(data);
          }
          dockerprogress.set(progress.id, progress);
        } else if (
          shouldAppendEventLog(
            data.message,
            this.seenMessages,
            deduplicateMessages
          )
        ) {
          logs.push(data);
        }
        return { dockerprogress, logs, dynamic: true };
      },
      () => {
        if (this.refs.box) {
          this.refs.box.scrollTop = this.refs.box.scrollHeight;
        }
      }
    );
  };
  openEventStream = () => {
    const { EventID } = this.props;
    const regionName = globalUtil.getCurrRegionName();
    const url = buildEventLogStreamUrl(EventID, regionName);
    this.closeEventSource();
    const eventSource = new EventSource(url, { withCredentials: true });
    this.eventSource = eventSource;
    eventSource.onopen = () => {
      if (this.eventSource !== eventSource) {
        return;
      }
      this.eventLogReplayBudget = buildEventLogReplayBudget(this.state.logs);
    };
    eventSource.addEventListener('replay-complete', () => {
      if (this.eventSource !== eventSource) {
        return;
      }
      this.eventLogReplayBudget = null;
    });
    eventSource.onmessage = event => {
      if (this.eventSource !== eventSource) {
        return;
      }
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (err) {
        return;
      }
      if (
        shouldAppendEventStreamMessage(message, this.eventLogReplayBudget)
      ) {
        this.handleMessage(message);
      }
      const terminalState = getEventLogTerminalState(message);
      if (terminalState) {
        this.setState({
          status:
            terminalState === 'success' ? (
              <p style={{ color: 'green' }}>操作已成功</p>
            ) : (
              <p style={{ color: 'red' }}>操作失败</p>
            )
        });
        this.closeEventSource();
      }
    };
  };
  closeEventSource = () => {
    this.eventLogReplayBudget = null;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
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
    const { logs, status, dockerprogress, dynamic } = this.state;
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
        {status && <div style={{ textAlign: 'center' }}>{status}</div>}
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
