import downLoadTools from '@/utils/downLoadTools';
import { Button, Modal } from 'antd';
import { connect } from 'dva';
import React from 'react';
import Ansi from '../../../../components/Ansi';
import globalUtil from '../../../../utils/global';
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
  }
  componentDidMount() {
    this.loadEventLog();
  }
  shouldComponentUpdate() {
    return true;
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
    const { EventID, showSocket } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'appControl/fetchLogContent',
      payload: {
        team_name: teamName,
        eventID: EventID
      },
      callback: res => {
        if (res) {
          this.setState(
            {
              logs: res.list
            },
            () => {
              if (showSocket) {
                this.showSocket();
              }
            }
          );
        } else if (showSocket) {
          this.showSocket();
        }
      }
    });
  }
  showSocket() {
    const { EventID, socket } = this.props;
    if (socket) {
      socket.watchEventLog(
        message => {
          const logs = this.state.logs || [];
          if (message.message.indexOf('id') !== -1) {
            try {
              const m = JSON.parse(message.message);
              if (m && m.id !== undefined) {
                const { dockerprogress } = this.state;
                if (dockerprogress.get(m.id) !== undefined) {
                  dockerprogress.set(m.id, m);
                } else {
                  dockerprogress.set(m.id, m);
                  logs.push(message);
                }
                this.setState({
                  dockerprogress,
                  logs,
                  dynamic: true
                });
                return;
              }
            } catch (err) {
              logs.push(message);
            }
          } else {
            logs.push(message);
          }
          if (this.refs.box) {
            this.refs.box.scrollTop = this.refs.box.scrollHeight;
          }
          this.setState({ logs, dynamic: true });
        },
        () => {
          this.setState({
            status: <p style={{ color: 'green' }}>操作已成功</p>
          });
        },
        () => {
          this.setState({ status: <p style={{ color: 'red' }}>操作失败</p> });
        },
        EventID
      );
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
    const isDownloadb = bodyText.length >= 1024*1024 && !dynamic;

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
