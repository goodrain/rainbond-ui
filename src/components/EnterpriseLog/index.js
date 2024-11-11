/* eslint-disable react/sort-comp */
/* eslint-disable react/no-array-index-key */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-string-refs */
import { Button, Card, Cascader, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import moment from 'moment';
import Ansi from '../../components/Ansi/index';
import NoPermTip from '../../components/NoPermTip';
import { getContainerLog, getServiceLog } from '../../services/app';
import appUtil from '../../utils/app';
import download from '@/utils/download';
import apiConfig from '../../../config/api.config'
import History1000Log from './history1000';
import styles from './Log.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

const { Option } = Select;

@connect()
/*
该组件用于展示应用或集群的日志信息，并提供筛选、搜索、实时刷新等功能。

Props传参：
- type: 类型，用于区分是应用日志还是集群日志
- RbdName: 应用名称或集群名称
- region: 区域名称
- tcpUrl: TCP连接的URL

State状态：
- containerLog: 容器日志数组
- logs: 日志数组
- instances: 实例数组
- started: 是否开始推送日志
- showHistory1000Log: 是否显示最近1000条日志组件
- showHighlighted: 高亮显示的日志
- filter: 日志筛选条件
- pod_name: Pod名称
- container_name: 容器名称
- refreshValue: 刷新频率
- time: 定时器ID

功能：
1. componentDidMount生命周期方法中根据类型加载相应的日志信息。
2. componentDidUpdate生命周期方法中当日志更新时，滚动到底部。
3. componentWillUnmount生命周期方法中关闭Socket连接。
4. fetchConsoleLogs方法用于获取控制台日志信息。
5. setLogs方法用于设置日志并进行筛选和高亮显示。
6. hanleTimer方法用于处理定时器。
7. handleTimers方法用于处理定时器。
8. closeTimer方法用于关闭定时器。
9. fetchContainerLog方法用于获取容器日志信息。
10. canView方法用于判断用户是否有权限查看日志。
11. handleStop和handleStart方法用于暂停和开始推送日志。
12. showDownHistory1000Log和hideDownHistory1000Log方法用于显示和隐藏最近1000条日志组件。
13. onChangeCascader方法用于级联选择器的变化。
14. handleChange方法用于切换刷新频率。
15. downloadLogs方法用于下载日志。
16. 渲染页面布局和日志内容。

*/

export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { instances } = this.props
    this.state = {
      containerLog: [],
      logs: [],
      instances: [],
      started: true,
      showHistory1000Log: false,
      showHighlighted: '',
      filter: '',
      pod_name: instances && instances.length > 0 && instances[0].pod_name,
      container_name: '',
      refreshValue: 5,
    };
  }
  componentDidMount() {
    const { type } = this.props
    if (type) {
      this.fetchConsoleLogs()
    } else {
      this.fetchContainerLog()
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
    this.closeTimer();
    if (this.eventSourceLogs) {
      this.eventSourceLogs.close();
    }
  }
  /**
   * 获取控制台日志
   * 
   * 从服务器获取控制台日志信息，并更新组件状态。
   * 
   * @returns {void}
   */
  fetchConsoleLogs = () => {
    const { dispatch, region } = this.props;
    dispatch({
      type: 'region/fetchConsoleLogs',
      callback: res => {
        if (res) {
          this.setState({ logs: res.bean || [] }, () => {
            this.hanleConsoTimer()
          });
        }
      }
    });
  };
  /**
   * 设置日志显示
   * 
   * 根据过滤条件更新日志显示。
   * 
   * @param {Array} logs - 日志数组
   * @returns {void}
   */
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
  /**
   * 处理定时器
   * 
   * 根据刷新时间设置定时器，用于自动获取日志。
   * 
   * @returns {void}
   */

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
  /**
   * 处理控制台日志定时器
   * 
   * 设置定时器以定时获取控制台日志。
   * 
   * @returns {void}
   */
  hanleConsoTimer = () => {
    this.closeTimer();
    var ss = setTimeout(() => {
      this.fetchConsoleLogs();
    }, 2 * 1000);
    this.setState({
      time: ss
    })
  };
  /**
   * 处理定时器
   * 
   * 根据给定的定时器名称、回调函数和时间设置定时器。
   * 
   * @param {string} timerName - 定时器名称
   * @param {Function} callback - 定时器回调函数
   * @param {number} times - 定时器执行间隔时间
   * @returns {void}
   */
  handleTimers = (timerName, callback, times) => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };
  /**
   * 关闭定时器
   * 
   * 关闭当前组件的定时器。
   * 
   * @returns {void}
   */
  closeTimer = () => {
    const { time } = this.state
    if (time) {
      clearInterval(time);
    }
  };
  /**
   * 获取容器日志
   * 
   * 从服务器获取指定容器的日志信息，并更新组件状态。
   * 
   * @returns {void}
   */
  fetchContainerLog = () => {
    const { pod_name, container_name } = this.state;
    const { region, dispatch } = this.props;
    const url = `/console/sse/v2/proxy-pass/system/logs?region_name=${region}&ns=${'rbd-system'}&name=${pod_name}&lines=${100}`;
    this.eventSourceLogs = new EventSource(url, { withCredentials: true });
    const messages = [];
    this.eventSourceLogs.onmessage = (event) => {
      const newMessage = event.data;
      messages.push(newMessage);
      if (messages.length >= 10) {  // 每收到10条消息更新一次
        this.setState((prevState) => ({
          loading: false,
          containerLog: [...prevState.containerLog, ...messages],
        }));
        messages.length = 0;  // 清空数组
      }
    };
    this.eventSourceLogs.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSourceLogs.close();
    };
  };
  /**
   * 是否能查看日志
   * 
   * 检查当前用户是否有权限查看应用程序日志。
   * 
   * @returns {boolean} - 是否能查看日志
   */
  canView() {
    return appUtil.canManageAppLog(this.props.appDetail);
  }
  /**
   * 停止监听日志
   * 
   * 关闭 WebSocket 连接上的日志消息监听。
   * 
   * @returns {void}
   */
  handleStop = () => {
    this.setState({ started: false });
    if (this.eventSourceLogs) {
      this.eventSourceLogs.close();
    }
  };
  /**
   * 开始监听日志
   * 
   * 启动 WebSocket 连接上的日志消息监听。
   * 
   * @returns {void}
   */
  handleStart = () => {
    this.setState({ started: true });
    this.fetchContainerLog();
  };
  /**
   * 显示下载历史1000行日志模态框
   * 
   * 显示下载历史1000行日志的模态框。
   * 
   * @returns {void}
   */
  showDownHistory1000Log = () => {
    this.setState({ showHistory1000Log: true });
  };
  /**
   * 隐藏下载历史1000行日志模态框
   * 
   * 隐藏下载历史1000行日志的模态框。
   * 
   * @returns {void}
   */
  hideDownHistory1000Log = () => {
    this.setState({ showHistory1000Log: false });
  };
  /**
   * Cascader 变化事件处理函数
   * 
   * 处理 Cascader 组件值变化事件，更新容器名称并获取对应容器的日志。
   * 
   * @param {Array} value - Cascader 组件的值
   * @returns {void}
   */
  onChangeCascader = value => {
    this.setState(
      {
        pod_name: value,
        container_name: value[1].slice(3)
      },
      () => {
        this.fetchContainerLog();
      }
    );
  };
  /**
   * 刷新时间变化事件处理函数
   * 
   * 处理刷新时间变化事件，更新定时器的执行间隔。
   * 
   * @param {number} value - 刷新时间值
   * @returns {void}
   */
  handleChange = value => {
    this.setState({
      refreshValue: value
    }, () => {
      this.hanleTimer();
    });
    if (!value) {
      this.closeTimer();
    }
  };
  /**
   * 下载日志文件
   * 
   * 从服务器下载日志文件。
   * 
   * @returns {void}
   */
  downloadLogs = () => {
    const time = Date.parse(new Date());
    const timestamp = moment(time).locale('zh-cn').format('YYYY-MM-DD')
    download(`${apiConfig.baseUrl}/console/enterprise/download/goodrain_log`, `${timestamp}`)
  }

  render() {
    const {
      logs,
      pod_name,
      containerLog,
      showHighlighted,
      started,
      refreshValue,
      showHistory1000Log,
      time
    } = this.state;
    const { instances, type, RbdName, region } = this.props;
    return (
      <Card
        style={{ borderBottomLeftRadius: 5, borderBottomRightRadius: 5, marginTop: 24 }}
        title={
          !type &&(
          <Fragment>
            {started ? (
            <Button onClick={this.handleStop}>
              {/* 暂停推送 */}
              <FormattedMessage id='componentOverview.body.tab.log.push' />
            </Button>
            ) : (
            <Button onClick={this.handleStart}>
              {/* 开始推送 */}
              <FormattedMessage id='componentOverview.body.tab.log.startPushing' />
            </Button>
            )}
          </Fragment>
          )
        }
        extra={
          <Fragment>
            {!type ?
            <></>
            :
            <Button onClick={this.downloadLogs} icon='download' type='primary' >
              {formatMessage({ id: 'LogEnterprise.download' })}
            </Button>
            }
          </Fragment>
        }
        bodyStyle={{ borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}
      >
        <Form layout="inline" name="logFilter" style={{ marginBottom: '16px', display: type ? 'flex' : "block", justifyContent: "space-between" }}>
          {!type &&
            <Form.Item
              name="container"
              label={formatMessage({ id: 'LogEnterprise.node' })}
              style={{ marginRight: '10px' }}
              className={styles.podCascader}
            >
              <Select defaultValue={instances && instances.length > 0 && instances[0].pod_name} placeholder={formatMessage({ id: 'LogEnterprise.find' })} style={{ width: 340 }} onChange={this.onChangeCascader}>
                {instances && instances.length > 0 && instances.map(item => {
                  const { node_name, pod_name } = item
                  return <Option value={pod_name}>{pod_name}（{node_name}）</Option>
                })}
              </Select>
            </Form.Item>
          }
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
                      <Ansi>{log}</Ansi>
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
        {showHistory1000Log && (
          <History1000Log
            onCancel={this.hideDownHistory1000Log}
            podName={pod_name}
            region={region}
          />
        )}
      </Card>
    );
  }
}