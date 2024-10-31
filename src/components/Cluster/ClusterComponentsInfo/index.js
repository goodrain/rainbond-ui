/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
import { Button, Col, Collapse, Icon, Modal, Row, Spin, Card, Table, Descriptions, Skeleton, notification, Tooltip } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../ConfirmModal'
import styles from './index.less'

const { Panel } = Collapse;

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
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
      unInstallLoading: false
    };
  }
  componentDidMount() {
    this.fetchRainbondComponents(true);
  }
  componentWillUnmount() {
    this.closeTimer()
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
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
          })
        }
      }
    })
  }
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
                defaultActiveKey={['1', '2']}
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
                {componentInfo?.events && componentInfo?.events.length > 0 &&
                  <Panel
                    header={
                      <div className={styles.panelBox}>
                        <div><FormattedMessage id='enterpriseColony.ClusterComponents.event' /></div>
                        <div><FormattedMessage id='enterpriseColony.ClusterComponents.pod' /></div>
                      </div>
                    }
                    key="2"
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
                  <div style={{paddingBottom: 60}}>
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
                  </div>
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
