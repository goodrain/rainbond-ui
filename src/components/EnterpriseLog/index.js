/* eslint-disable react/sort-comp */
/* eslint-disable react/no-array-index-key */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-string-refs */
import { Button, Card, Cascader, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import Ansi from '../../components/Ansi/index';
import NoPermTip from '../../components/NoPermTip';
import { getContainerLog, getServiceLog } from '../../services/app';
import appUtil from '../../utils/app';
import AppPubSubSocket from '../../utils/appPubSubSocket';
import globalUtil from '../../utils/global';
import regionUtil from '../../utils/region';
import roleUtil from '../../utils/role';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import download from '@/utils/download';
import HistoryLog from './history';
import History1000Log from './history1000';
import styles from './Log.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import LoginPage from '@/pages/User/Login';

const { Option } = Select;

@connect(
  ({ user }) => ({
    currUser: user.currentUser
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      containerLog: [],
      logs: [],
      instances: [],
      started: true,
      showHistoryLog: false,
      showHistory1000Log: false,
      showHighlighted: '',
      filter: '',
      pod_name: '',
      container_name: '',
      refreshValue: 5,
    };
    this.socket = null;
  }
  componentWillMount() {
    this.createSocket();
  }
  componentDidMount() {
    const { type } = this.props
    if (type) {
      this.fetchConsoleLogs()
    } else {
      this.loadLog();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      this.refs.box &&
      prevState.logs.length !== this.state.logs.length &&
      this.state.showHighlighted === ''
    ) {
      this.refs.box.scrollTop = this.refs.box.scrollHeight;
    }
  }
  componentWillUnmount() {
    if (this.socket) {
      this.socket.closeLogMessage();
      this.socket.destroy();
      this.socket = null;
    }
  }
  fetchConsoleLogs = () => {
    const { dispatch, region } = this.props;
    dispatch({
      type: 'region/fetchConsoleLogs',
      callback: res => {
        if (res) {
          // if (this.refs.box) {
          //   this.refs.box.scrollTop = this.refs.box.scrollHeight;
          // }
          this.setState({ logs: res.bean || [] }, () => {
            this.hanleConsoTimer()
          });
          this.watchLog();
        }
      }
    });
  };
  createSocket() {
    const { RbdName, region, tcpUrl } = this.props
    const url = `${tcpUrl}/services/${region}/pubsub`
    if (tcpUrl) {
      this.socket = new AppPubSubSocket({
        url: url,
        serviceId: RbdName,
        isAutoConnect: true,
        destroyed: false,
        time: '',
      });
    }

  }
  onFinish = value => {
    const { type ,ss} = this.props
    this.setState({ filter: value }, () => {
      const { logs, pod_name: podName } = this.state;
      if (value === '') {
        if ( type ){
          this.fetchConsoleLogs(),
          clearInterval(ss)
        }else{
          if (podName) {
            this.fetchContainerLog();
          } else {
            this.fetchClusterLogInfoSingle();
          }
        }
      } else {
        this.setLogs(logs);
      }
    });
  };
  setLogs = logs => {
    const { filter, pod_name: podName } = this.state;
    let newlogs = logs;
    newlogs = logs.filter(item => {
      if (filter == '' || item.indexOf(filter) != -1) {
        return true;
      }
      return false;
    });
    newlogs = newlogs.map(item => {
      if (item.indexOf(filter) != -1) {
        const newitem = item.replace(filter, `\x1b[33m${filter}\x1b[0m`);
        return newitem;
      }
      return item;
    });
    if (newlogs.length > 5000) {
      newlogs = newlogs.slice(logs.length - 5000, logs.length);
    }
    const upDataInfo = podName ? { containerLog: newlogs } : { logs: newlogs };
    this.setState(upDataInfo);
  };
  watchLog = () => {
    if (this.socket) {
      this.socket.setOnLogMessage(
        messages => {
          if (messages && messages.length > 0) {
            const logs = this.state.logs || [];
            const newlogs = logs.concat(messages);
            this.setLogs(newlogs);
          }
        },
        messages => {
          if (this.state.started) {
            let logs = this.state.logs || [];
            logs = logs.concat(messages);
            if (this.refs.box) {
              this.refs.box.scrollTop = this.refs.box.scrollHeight;
            }
            this.setLogs(logs);
          }
        }
      );
    }
  }
  loadLog() {
    const { logs } = this.state;
    if (logs.length == 0) {
      this.fetchClusterLogInfoSingle();
    } else {
      this.watchLog();
    }
  }
  fetchClusterLogInfoSingle = () => {
    const { dispatch, region, RbdName } = this.props;
    dispatch({
      type: 'region/fetchClusterLogInfoSingle',
      payload: {
        region_name: region,
        rbd_name: RbdName,
        lines: 100
      },
      callback: res => {
        if (res) {
          if (this.refs.box) {
            this.refs.box.scrollTop = this.refs.box.scrollHeight;
          }
          this.setState({ logs: res.bean || [] });
          this.watchLog();
        }
      }
    });
  }
  hanleTimer = () => {
    const { refreshValue } = this.state;
    this.closeTimer();
    if (!refreshValue) {
      return null;
    }
    var ss = setTimeout(() => {
      this.fetchContainerLog();
    }, refreshValue * 1000);
    this.setState({
      time: ss
    })
  };
  hanleConsoTimer = () => {
    this.closeTimer();
    var ss = setTimeout(() => {
      this.fetchConsoleLogs();
    }, 2 * 1000);
    this.setState({
      time: ss
    })
  };
  handleTimers = (timerName, callback, times) => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };

  closeTimer = () => {
    const { time } = this.state
    if (time) {
      clearInterval(time);
    }
  };

  fetchContainerLog = () => {
    const { pod_name, container_name } = this.state;
    const { region, dispatch } = this.props;
    dispatch({
      type: 'region/fetchNodeInfo',
      payload: {
        region_name: region,
        pod_name: pod_name
      },
      callback: res => {
        if (
          res &&
          res.status_code &&
          res.status_code === 200 &&
          res.response_data
        ) {
          const arr = res.response_data.split('\n');
          this.setState(
            {
              containerLog: arr || []
            },
            () => {
              this.hanleTimer();
            }
          );
        }
      }
    });
  };

  canView() {
    return appUtil.canManageAppLog(this.props.appDetail);
  }
  handleStop = () => {
    this.setState({ started: false });
    if (this.socket) {
      this.socket.closeLogMessage();
    }
  };
  handleStart = () => {
    this.setState({ started: true });
    this.watchLog();
  };
  showDownHistoryLog = () => {
    this.setState({ showHistoryLog: true });
  };
  hideDownHistoryLog = () => {
    this.setState({ showHistoryLog: false });
  };
  showDownHistory1000Log = () => {
    this.setState({ showHistory1000Log: true });
  };
  hideDownHistory1000Log = () => {
    this.setState({ showHistory1000Log: false });
  };
  onChangeCascader = value => {
    if (value && value.length > 1) {
      this.setState(
        {
          pod_name: value,
          container_name: value[1].slice(3)
        },
        () => {
          this.fetchContainerLog();
        }
      );
    } else {
      this.setState(
        {
          pod_name: '',
          container_name: '',
          containerLog: []
        },
        () => {
          this.closeTimer();
          this.fetchClusterLogInfoSingle();
        }
      );
    }
  };
  handleChange = value => {
    this.setState({
      refreshValue: value
    });
    if (!value) {
      this.closeTimer();
    }
  };
  downloadLogs = () => {
    download("/console/enterprise/download/goodrain_log", 'goodrain.log')
  }

  render() {
    const {
      logs,
      pod_name,
      containerLog,
      showHighlighted,
      // instances,
      started,
      refreshValue,
      showHistoryLog,
      showHistory1000Log,
      time
    } = this.state;
    const { instances, type, RbdName, region } = this.props;
    return (
      <Card
        title={
          <Fragment>
            {type ? (
              <><Button onClick={this.downloadLogs} >
              {formatMessage({id:'LogEnterprise.download'})}
            </Button></>
            ) : (
              started ? (
                <Button onClick={this.handleStop}>
                  {/* 暂停推送 */}
                  <FormattedMessage id='componentOverview.body.tab.log.push' />
                </Button>
              ) : (
                <Button onClick={this.handleStart}>
                  {/* 开始推送 */}
                  <FormattedMessage id='componentOverview.body.tab.log.startPushing' />
                </Button>
              )

            )}

          </Fragment>
        }
        extra={
          <Fragment>
            {!type && <>
              <a onClick={this.showDownHistoryLog} style={{ marginRight: 10 }}>
                {/* 历史日志下载 */}
                <FormattedMessage id='componentOverview.body.tab.log.install' />
              </a>
              <a onClick={this.showDownHistory1000Log}>
                {/* 最近1000条日志 */}
                <FormattedMessage id='componentOverview.body.tab.log.lately' />
              </a>
            </>}
          </Fragment>
        }
      >
        <Form layout="inline" name="logFilter" style={{ marginBottom: '16px',display:type ?'flex':"block",justifyContent:"space-between" }}>
          <Form.Item
            name="filter"
            label={<FormattedMessage id='componentOverview.body.tab.log.text' />}
            style={{ marginRight: '10px' }}
          >
            <Input.Search
              style={{ width: '300px' }}
              // placeholder="请输入过滤文本"
              placeholder={formatMessage({ id: 'componentOverview.body.tab.log.filtertext' })}
              onSearch={this.onFinish}
            />
          </Form.Item>
          {!type &&
            <Form.Item
              name="container"
              label={formatMessage({id:'LogEnterprise.node'})}
              style={{ marginRight: '10px' }}
              className={styles.podCascader}
            >
              <Select placeholder={formatMessage({id:'LogEnterprise.find'})} style={{ width: 240 }} onChange={this.onChangeCascader}>
                {instances && instances.length > 0 && instances.map(item => {
                  const { node_name, pod_name } = item
                  return <Option value={pod_name}>{node_name}</Option>
                })}
                <Option value=''>{formatMessage({id:'LogEnterprise.all'})}</Option>
              </Select>
            </Form.Item>
          }
          {pod_name && (
            <Form.Item
              name="refresh"
              label={<FormattedMessage id='componentOverview.body.tab.log.refresh' />}
              style={{ marginRight: '0' }}
            >
              <Select
                value={refreshValue}
                onChange={this.handleChange}
                style={{ width: 130 }}
              >
                <Option value={5}>
                  {/* 5秒 */}
                  <FormattedMessage id='componentOverview.body.tab.log.five' />
                </Option>
                <Option value={10}>
                  {/* 10秒 */}
                  <FormattedMessage id='componentOverview.body.tab.log.ten' />
                </Option>
                <Option value={30}>
                  {/* 30秒 */}
                  <FormattedMessage id='componentOverview.body.tab.log.thirty' />
                </Option>
                <Option value={0}>
                  {/* 关闭 */}
                  <FormattedMessage id='componentOverview.body.tab.log.close' />
                </Option>
              </Select>
            </Form.Item>
          )}
        </Form>
        <div className={styles.logStyle} ref="box">
          {(containerLog &&
            containerLog.length > 0 &&
            containerLog.map((item, index) => {
              return (
                <div key={index}>
                  <span
                    style={{
                      color: '#666666'
                    }}
                  >
                    <span>{index + 1}</span>
                  </span>
                  <span
                    ref="texts"
                    style={{
                      width: '100%',
                      color: '#FFF'
                    }}
                  >
                    <Ansi>{item}</Ansi>
                  </span>
                </div>
              );
            })) ||
            (logs &&
              logs.length > 0 &&
              logs.map((log, index) => {
                return (
                  <div key={index}>
                    <span
                      style={{
                        color:
                          showHighlighted == log.substring(0, log.indexOf(':'))
                            ? (type ? '#FFF' : '#FFFF91')
                            : '#666666'
                      }}
                    >
                      <span>{log == '' ? '' : `${index + 1}`}</span>
                    </span>
                    <span
                      ref="texts"
                      style={{
                        color:
                          showHighlighted == log.substring(0, log.indexOf(':'))
                            ? (type ? '#FFF' : '#FFFF91')
                            : '#FFF'
                      }}
                    >
                      <Ansi>
                        {log.substring(log.indexOf(':') + 1, log.length)}
                      </Ansi>
                    </span>

                    {logs.length == 1 ? (
                      <span
                        style={{
                          color:
                            showHighlighted ==
                              log.substring(0, log.indexOf(':'))
                              ? '#FFFF91'
                              : '#bbb',
                          cursor: 'pointer',
                          backgroundColor: log.substring(0, log.indexOf(':'))
                            ? '#666'
                            : ''
                        }}
                        onClick={() => {
                          this.setState({
                            showHighlighted:
                              showHighlighted ==
                                log.substring(0, log.indexOf(':'))
                                ? ''
                                : log.substring(0, log.indexOf(':'))
                          });
                        }}
                      >
                        <Ansi>{log.substring(0, log.indexOf(':'))}</Ansi>
                      </span>
                    ) : logs.length > 1 &&
                      index >= 1 &&
                      log.substring(0, log.indexOf(':')) ==
                      logs[index <= 0 ? index + 1 : index - 1].substring(
                        0,
                        logs[index <= 0 ? index + 1 : index - 1].indexOf(':')
                      ) ? (
                      ''
                    ) : (type ? '' :
                      <span
                        style={{
                          color:
                            showHighlighted ==
                              log.substring(0, log.indexOf(':'))
                              ? '#FFFF91'
                              : '#bbb',
                          cursor: 'pointer',
                          backgroundColor:
                            index == 0 && log.substring(0, log.indexOf(':'))
                              ? '#666'
                              : log.substring(0, log.indexOf(':')) ==
                                logs[
                                  index <= 0 ? index + 1 : index - 1
                                ].substring(
                                  0,
                                  logs[
                                    index <= 0 ? index + 1 : index - 1
                                  ].indexOf(':')
                                )
                                ? ''
                                : '#666'
                        }}
                        onClick={() => {
                          this.setState({
                            showHighlighted:
                              showHighlighted ==
                                log.substring(0, log.indexOf(':'))
                                ? ''
                                : log.substring(0, log.indexOf(':'))
                          });
                        }}
                      >
                        <Ansi>{log.substring(0, log.indexOf(':'))}</Ansi>
                      </span>
                    )}
                  </div>
                );
              }))}
        </div>
        {showHistoryLog && (
          <HistoryLog onCancel={this.hideDownHistoryLog} RbdName={RbdName} region={region} />
        )}
        {showHistory1000Log && (
          <History1000Log
            onCancel={this.hideDownHistory1000Log}
            RbdName={RbdName}
            region={region}
          />
        )}
      </Card>
    );
  }
}