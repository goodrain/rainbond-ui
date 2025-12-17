/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
import { Button, Col, Collapse, Icon, Modal, Row, Spin, Card, Table, Descriptions, Skeleton, notification, Tooltip, Form, Select } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import ConfirmModal from '../../ConfirmModal'
import Ansi from '../../Ansi/index';
import styles from './index.less'

const { Panel } = Collapse;
const { Option } = Select;

@connect(({ global, region }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  cluster_info_add_cluster: region.cluster_info_add_cluster
}))
class ClusterComponentsInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.timer = null;
    this.state = {
      componentInfo: false,
      componentsListLoading: true,
      componentList: [],
      showDetails: false,
      runningPodNum: 0,
      showUnInstallModal: false,
      unInstallLoading: false,
      // 日志相关状态
      containerLog: [],
      logStarted: false,
      logLoading: false,
      selectedContainer: null,
      clusterInfo: {}
    };
  }
  componentDidMount() {
    this.getCluterName()
  }
  getCluterName = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchClusterInfo',
      payload: {
        cluster_id: ''
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            clusterInfo: res.bean
          }, () => {
            this.fetchRainbondComponents(true);
          })
        }
      }
    });
  }
  componentWillUnmount() {
    this.closeTimer()
    if (this.eventSources) {
      this.eventSources.close();
    }
    if (this.logEventSource) {
      this.logEventSource.close();
    }
    // 清理日志相关的定时器和缓存
    if (this.logUpdateTimer) {
      clearTimeout(this.logUpdateTimer);
    }
    this.logMessages = null;
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  // 启动日志流
  startLogStream = (podName, containerName) => {
    if (this.logEventSource) {
      this.logEventSource.close();
    }

    // 清空之前的消息缓存和定时器
    this.logMessages = [];
    if (this.logUpdateTimer) {
      clearTimeout(this.logUpdateTimer);
    }
    const { clusterInfo: { cluster_id } } = this.state
    const url = `/console/rb_component_logs_sse?cluster_id=${cluster_id}&pod_name=${podName}&container_name=${containerName}&tail_lines=100`;

    this.setState({
      logLoading: true,
      logStarted: true,
      selectedContainer: { podName, containerName },
      containerLog: []
    });

    this.logEventSource = new EventSource(url, { withCredentials: true });
    const MAX_LOGS = 1000; // 最大日志条数限制

    this.logEventSource.onmessage = (event) => {

      const newMessage = event.data;
      if (newMessage && newMessage.trim()) {
        // 解析日志JSON格式
        let formattedLog;
        try {
          const logObj = JSON.parse(newMessage);
          formattedLog = {
            timestamp: logObj.timestamp,
            data: logObj.data,
            original: newMessage
          };
        } catch (e) {
          // 如果不是JSON格式，保持原样
          formattedLog = {
            timestamp: Date.now() / 1000,
            data: newMessage,
            original: newMessage
          };
        }

        // 确保logMessages数组存在
        if (!this.logMessages) {
          this.logMessages = [];
        }

        this.logMessages.push(formattedLog);

        // 降低批量更新阈值并添加定时器机制
        if (this.logMessages.length >= 1) {  // 从10改为3
          this.updateLogDisplay(MAX_LOGS);
        } else {
          // 如果没有达到阈值，设置一个短暂的定时器
          if (this.logUpdateTimer) {
            clearTimeout(this.logUpdateTimer);
          }
          this.logUpdateTimer = setTimeout(() => {
            if (this.logMessages && this.logMessages.length > 0) {
              this.updateLogDisplay(MAX_LOGS);
            }
          }, 1000); // 1秒后强制更新
        }
      }
    };

    this.logEventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.setState({ logLoading: false, logStarted: false });
      this.logEventSource.close();
    };
  };

  // 更新日志显示
  updateLogDisplay = (maxLogs) => {
    if (!this.logMessages || this.logMessages.length === 0) {
      return;
    }


    this.setState((prevState) => {
      const updatedLogs = [...prevState.containerLog, ...this.logMessages];
      // 限制日志数量，避免内存问题
      const finalLogs = updatedLogs.length > maxLogs
        ? updatedLogs.slice(-maxLogs)
        : updatedLogs;
      return {
        logLoading: false,
        containerLog: finalLogs,
      };
    }, () => {
      // 滚动到底部
      this.scrollLogToBottom();
    });

    // 清空消息缓存
    this.logMessages = [];

    // 清理定时器
    if (this.logUpdateTimer) {
      clearTimeout(this.logUpdateTimer);
      this.logUpdateTimer = null;
    }
  };

  // 滚动日志到底部
  scrollLogToBottom = () => {
    if (this.logContainerRef) {
      this.logContainerRef.scrollTop = this.logContainerRef.scrollHeight;
    }
  };

  // 格式化时间戳
  formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  };

  // 停止日志流
  stopLogStream = () => {
    if (this.logEventSource) {
      this.logEventSource.close();
      this.logEventSource = null;
    }
    this.setState({ logStarted: false, logLoading: false });
  };

  handleTimers = (timerName, callback, times) => {
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };
  handlePodeInfo = (obj) => {
    let runningNum = 0
    Object.keys(obj || {}).map(item => {
      let arr = obj[item] || []
      const bool = arr.every(obj => obj.status === 'Running')
      if (bool) {
        runningNum++
      }
    })
    return runningNum
  }
  fetchRainbondComponents = (bool) => {
    const { eid, dispatch } = this.props;
    if (bool) {
      this.setState({
        componentsListLoading: true
      })
    }
    dispatch({
      type: 'region/installClusterAllPodinfo',
      callback: res => {
        if (res && res.status_code === 200) {

          this.setState({
            componentList: res.response_data.data.bean,
            componentsListLoading: false,
            runningPodNum: this.handlePodeInfo(res.response_data.data.bean)
          }, () => {
            this.handleTimers(
              'timer',
              () => {
                this.fetchRainbondComponents();
              },
              2000
            );
          })
        }
      }
    })
  };
  back = () => {
    this.setState({
      showDetails: false
    })
  }
  handleStateName = str => {
    const phase = str && str.toLowerCase();
    const stateMap = {
      failed: styles.failedState,
      running: styles.successState,
      pending: styles.failedState,
      warning: styles.warningState,
      error: styles.failedState,
      crashloopbackoff: styles.failedState,
      imagepullbackoff: styles.failedState,
      containercreating: styles.warningState,
      terminating: styles.failedState,
      unexist: styles.failedState,
      unknown: styles.failedState,
    };
    return stateMap[phase] || styles.successState;
  };
  fetchPodDetails = (val) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/installClusterPodinfo',
      payload: {
        pod_name: val
      },
      callback: res => {
        if (res && res.status_code == 200) {
          this.setState({
            componentInfo: res.response_data.data.bean,
            showDetails: true
          }, () => {
            // 自动选择第一个容器并开始日志
            this.autoSelectFirstContainer();
          })
        }
      }
    })
  }

  // 自动选择第一个容器并开始日志
  autoSelectFirstContainer = () => {
    const { componentInfo } = this.state;
    const containers = componentInfo?.pod_status?.containers || [];

    if (containers.length > 0) {
      const firstContainer = containers[0];
      const podName = componentInfo?.pod_status?.pod_name;
      const containerName = firstContainer.container_name;

      // 自动开始第一个容器的日志流
      this.startLogStream(podName, containerName);
    }
  };
  unInstallCluster = () => {
    const { dispatch, preStep } = this.props;
    this.setState({
      unInstallLoading: true
    })
    dispatch({
      type: 'region/unInstallCluster',
      callback: res => {
        this.setState({
          unInstallLoading: false
        })
        notification.success({ message: formatMessage({ id: 'enterpriseColony.newHostInstall.node.unInstallSuccess' }) })
        preStep && preStep()
      }
    })
  }

  // 渲染日志内容
  renderLogContent = () => {
    const { componentInfo } = this.state;
    const {
      containerLog,
      logStarted,
      logLoading,
      selectedContainer
    } = this.state;

    // 获取容器列表
    const containers = componentInfo?.pod_status?.containers || [];

    return (
      <div>
        {/* 容器选择和控制 */}
        <Form layout="inline" className={styles.logControls}>
          <Form.Item label={formatMessage({ id: 'enterpriseColony.ClusterComponents.selectContainer' })}>
            <Select
              style={{ width: 200 }}
              placeholder={formatMessage({ id: 'enterpriseColony.ClusterComponents.selectContainerPlaceholder' })}
              onChange={(value) => {
                const [podName, containerName] = value.split('|');
                this.startLogStream(podName, containerName);
              }}
              value={selectedContainer ? `${selectedContainer.podName}|${selectedContainer.containerName}` :
                (containers.length > 0 ? `${componentInfo?.pod_status?.pod_name}|${containers[0].container_name}` : undefined)}
            >
              {containers.map((container, index) => (
                <Option
                  key={index}
                  value={`${componentInfo?.pod_status?.pod_name}|${container.container_name}`}
                >
                  {container.container_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            {logStarted ? (
              <Button onClick={this.stopLogStream} type="danger">
                {formatMessage({ id: 'enterpriseColony.ClusterComponents.stopLog' })}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (selectedContainer) {
                    this.startLogStream(selectedContainer.podName, selectedContainer.containerName);
                  } else if (containers.length > 0) {
                    this.startLogStream(
                      componentInfo?.pod_status?.pod_name,
                      containers[0].container_name
                    );
                  }
                }}
                type="primary"
                disabled={containers.length === 0}
              >
                {formatMessage({ id: 'enterpriseColony.ClusterComponents.restartLog' })}
              </Button>
            )}
          </Form.Item>
        </Form>

        {/* 日志统计 */}
        <div className={styles.logStats}>
          {formatMessage({ id: 'enterpriseColony.ClusterComponents.logTotal' })}: {containerLog.length} {formatMessage({ id: 'enterpriseColony.ClusterComponents.logCount' })}
          {(selectedContainer || containers.length > 0) && (
            <span style={{ marginLeft: 16 }}>
              {formatMessage({ id: 'enterpriseColony.ClusterComponents.currentContainer' })}: {selectedContainer?.containerName || containers[0]?.container_name || formatMessage({ id: 'enterpriseColony.ClusterComponents.unknown' })}
            </span>
          )}
        </div>

        {/* 日志显示区域 */}
        <div
          ref={(ref) => { this.logContainerRef = ref; }}
          className={styles.logContainer}
        >
          {logLoading && <div style={{ color: '#1890ff' }}>{formatMessage({ id: 'enterpriseColony.ClusterComponents.loadingLog' })}</div>}
          {!logStarted && !logLoading && containerLog.length === 0 && (
            <div style={{ color: '#666' }}>
              {formatMessage({ id: 'enterpriseColony.ClusterComponents.autoConnecting' })}
            </div>
          )}
          {containerLog.map((log, index) => (
            <div key={index} className={styles.logLine}>
              <span className={styles.lineNumber}>
                {index + 1}
              </span>
              <div className={styles.logContent}>
                <Ansi>{log.data || log.original || log}</Ansi>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  render() {
    const { completeInit } = this.props
    const {
      componentInfo,
      componentsLoading,
      componentList,
      showDetails,
      componentsListLoading,
      runningPodNum,
      showUnInstallModal,
      unInstallLoading
    } = this.state;
    return (
      <>
        {
          showDetails ?
            <Card title={formatMessage({ id: 'enterpriseColony.newHostInstall.node.comInfo' })} className={styles.podInfo}>
              <Row>
                <Button type="dashed" icon="arrow-left" onClick={this.back}>
                  {formatMessage({ id: 'enterpriseColony.newHostInstall.node.back' })}
                </Button>
              </Row>
              <div className={styles.podStatus}>
                <p>Pod: <span>{componentInfo?.pod_status?.pod_name || '-'}</span></p>
                <span className={this.handleStateName(
                  componentInfo?.pod_status?.status
                )}>{componentInfo?.pod_status?.status}</span>
              </div>
              <Descriptions bordered >
                <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.newHostInstall.node.namespace' })}>{componentInfo?.pod_status?.namespace} </Descriptions.Item>
                <Descriptions.Item label="PodIP">{componentInfo?.pod_status?.pod_ip}</Descriptions.Item>
                <Descriptions.Item label="Node">{componentInfo?.pod_status?.node_name}</Descriptions.Item>
                <Descriptions.Item label="HostIP">{componentInfo?.pod_status?.host_ip}</Descriptions.Item>
                <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.newHostInstall.node.greatTime' })}>
                  {moment(componentInfo?.pod_status?.start_time).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )}
                </Descriptions.Item>

              </Descriptions>
              <Collapse
                defaultActiveKey={['1', '2', '3']}
                className={styles.customCollapse}
              >
                {componentInfo?.pod_status?.containers && componentInfo?.pod_status?.containers.length > 0 &&
                  <Panel
                    header={
                      <div className={styles.panelBox}>
                        <div><FormattedMessage id='enterpriseColony.ClusterComponents.container' /></div>
                        <div><FormattedMessage id='enterpriseColony.ClusterComponents.Container_pod' /></div>
                      </div>
                    }
                    key="1"
                  >
                    <Row className={styles.customCollapseTable}>
                      <Col span={3}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.status' })}</Col>
                      <Col span={3}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.bame' })}</Col>
                      <Col span={14}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.img' })}</Col>
                      <Col span={4}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.RestartNum' })}</Col>
                    </Row>

                    {componentInfo?.pod_status?.containers.map((item, index) => {
                      return <Row className={styles.customCollapseDetails} key={index}>
                        <Col span={3}>
                          <span className={this.handleStateName(
                            item.status
                          )}>
                            {item.status}
                          </span>
                        </Col>
                        <Col span={3} className={styles.podname}>{item.container_name}</Col>
                        <Col span={14}>{item.image}</Col>
                        <Col span={4}>{item.restart_count}</Col>
                      </Row>
                    })}


                  </Panel>

                }
                <Panel
                  header={
                    <div className={styles.panelBox}>
                      <div>{formatMessage({ id: 'enterpriseColony.ClusterComponents.containerLog' })}</div>
                      <div>{formatMessage({ id: 'enterpriseColony.ClusterComponents.containerLogDesc' })}</div>
                    </div>
                  }
                  key="2"
                >
                  {this.renderLogContent()}
                </Panel>

                {componentInfo?.events && componentInfo?.events.length > 0 &&
                  <Panel
                    header={
                      <div className={styles.panelBox}>
                        <div><FormattedMessage id='enterpriseColony.ClusterComponents.event' /></div>
                        <div><FormattedMessage id='enterpriseColony.ClusterComponents.pod' /></div>
                      </div>
                    }
                    key="3"
                  >
                    <Row className={styles.customCollapseTable}>
                      <Col span={3}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.type' })}</Col>
                      <Col span={3}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.reason' })}</Col>
                      <Col span={14}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.info' })}</Col>
                      <Col span={4}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.lastUpdata' })}</Col>
                    </Row>
                    {componentInfo?.events.map((item, index) => {
                      return <Row className={styles.customCollapseDetails} key={index + 'events'}>
                        <Col span={3}>
                          <span className={this.handleStateName(
                            item?.event_type
                          )}>
                            {item?.event_type}
                          </span>
                        </Col>
                        <Col span={3}>{item?.reason}</Col>
                        <Col span={14}>{item?.message}</Col>
                        <Col span={4}>
                          {moment(item?.last_timestamp).format(
                            'YYYY-MM-DD HH:mm:ss'
                          )}
                        </Col>
                      </Row>
                    })}

                  </Panel>
                }

              </Collapse>
            </Card>
            :
            <Card title={`集群组件(${runningPodNum + "/" + Object.keys(componentList).length})`} className={styles.tableInfo}>
              <Row>
                <Col span={4}>
                  {formatMessage({ id: 'enterpriseColony.newHostInstall.node.status' })}
                </Col>
                <Col span={6}>
                  {formatMessage({ id: 'enterpriseColony.newHostInstall.node.bame' })}
                </Col>
                <Col span={14}>
                  {formatMessage({ id: 'enterpriseColony.newHostInstall.node.img' })}
                </Col>
              </Row>
              {componentsListLoading ?
                <Skeleton active rows={10} />
                :
                <>
                  {Object.keys(componentList).map((item, index) => {
                    return <div className={styles.pod_Info}>
                      <p>
                        {item}
                      </p>
                      {componentList[item] && componentList[item].length > 0 && componentList[item].map((val, inex) => {
                        return <Row
                          key={inex}
                          className={styles.details}
                          style={{ borderBottom: inex == componentList[item].length - 1 ? '0' : '1px solid #e8e8e8' }}
                          onClick={() => this.fetchPodDetails(val.pod_name)}
                        >
                          <Col span={4}>
                            <span className={this.handleStateName(
                              val.status
                            )}>
                              {val.status}
                            </span>
                          </Col>
                          <Col span={6}>
                            {val.pod_name || formatMessage({ id: 'enterpriseColony.newHostInstall.node.noName' })}
                          </Col>
                          <Col span={14}>
                            <div>
                              {val.image == '' ?
                                <p>{val.image_status || formatMessage({ id: 'enterpriseColony.newHostInstall.node.noImg' })}</p>
                                :
                                <p>{val.image}</p>
                              }
                              <p>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.greatTimeText' })}{moment(val?.start_time).format(
                                'YYYY-MM-DD HH:mm:ss'
                              ) || '-'} {formatMessage({ id: 'enterpriseColony.newHostInstall.node.RestartNumText' })}{val.restarts || 0}</p>
                            </div>
                          </Col>
                        </Row>
                      })}

                    </div>
                  })}
                </>
              }
              <div
                style={{
                  background: '#fff',
                  padding: '20px',
                  textAlign: 'right',
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2,
                  borderTop: '1px solid #e8e8e8'
                }}>
                <div className={styles.ButtonBox}>
                  <Button type="danger" onClick={() => { this.setState({ showUnInstallModal: true }) }} style={{ marginRight: 24 }}>{formatMessage({ id: 'enterpriseColony.newHostInstall.node.unInstall' })}</Button>
                  <Tooltip title={runningPodNum !== Object.keys(componentList).length && formatMessage({ id: 'enterpriseColony.newHostInstall.node.podRunning' })}>
                    <Button disabled={runningPodNum !== Object.keys(componentList).length} onClick={() => completeInit && completeInit()} type="primary">{formatMessage({ id: 'enterpriseColony.newHostInstall.node.next' })}</Button>
                  </Tooltip>
                  {showUnInstallModal && (
                    <ConfirmModal
                      onOk={this.unInstallCluster}
                      title={formatMessage({ id: 'enterpriseColony.newHostInstall.node.unInstallCluster' })}
                      desc={formatMessage({ id: 'enterpriseColony.newHostInstall.node.unInstallIng' })}
                      onCancel={() => { this.setState({ showUnInstallModal: false }) }}
                      loading={unInstallLoading}
                    />
                  )}
                </div>
              </div>

            </Card>
        }
      </>

    );
  }
}
export default ClusterComponentsInfo;
