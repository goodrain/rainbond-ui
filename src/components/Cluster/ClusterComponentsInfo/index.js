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
        notification.success({ message: '卸载成功' })
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
            <Card title='组件详情' className={styles.podInfo}>
              <Row>
                <Button type="dashed" icon="arrow-left" onClick={this.back}>
                  返回
                </Button>
              </Row>
              <div className={styles.podStatus}>
                <p>Pod: <span>{componentInfo?.pod_status?.pod_name || '-'}</span></p>
                <span className={this.handleStateName(
                  componentInfo?.pod_status?.status
                )}>{componentInfo?.pod_status?.status}</span>
              </div>
              <Descriptions bordered >
                <Descriptions.Item label="命名空间">{componentInfo?.pod_status?.namespace} </Descriptions.Item>
                <Descriptions.Item label="PodIP">{componentInfo?.pod_status?.pod_ip}</Descriptions.Item>
                <Descriptions.Item label="Node">{componentInfo?.pod_status?.node_name}</Descriptions.Item>
                <Descriptions.Item label="HostIP">{componentInfo?.pod_status?.host_ip}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
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
                      <Col span={3}>状态</Col>
                      <Col span={3}>名称</Col>
                      <Col span={14}>镜像</Col>
                      <Col span={4}>容器重启次数 </Col>
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
                      <Col span={3}>类型</Col>
                      <Col span={3}>事件原因</Col>
                      <Col span={14}>事件信息</Col>
                      <Col span={4}>最后更新</Col>
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
            <Card title={`Rainbond集群组件(${runningPodNum + "/" + Object.keys(componentList).length})`} className={styles.tableInfo}>
              <Row>
                <Col span={4}>
                  状态
                </Col>
                <Col span={6}>
                  名称
                </Col>
                <Col span={14}>
                  镜像
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
                            {val.pod_name || '暂无名称'}
                          </Col>
                          <Col span={14}>
                            <div>
                              {val.image == '' ?
                                <p>{val.image_status || '暂无镜像信息'}</p>
                                :
                                <p>{val.image}</p>
                              }
                              <p>创建时间：{moment(val?.start_time).format(
                                'YYYY-MM-DD HH:mm:ss'
                              ) || '-'} 重启次数：{val.restarts || 0}</p>
                            </div>
                          </Col>
                        </Row>
                      })}

                    </div>
                  })}
                </>
              }
              <div className={styles.ButtonBox}>
                <Button type="danger" onClick={() => { this.setState({ showUnInstallModal: true }) }} style={{ marginRight: 24 }}>卸载</Button>
                <Tooltip title={runningPodNum !== Object.keys(componentList).length && '需要所有的pod节点都为Running状态下才可进行下一步，请耐心等待...'}>
                  <Button disabled={runningPodNum !== Object.keys(componentList).length} onClick={() => completeInit && completeInit()} type="primary">下一步</Button>
                </Tooltip>
                {showUnInstallModal && (
                  <ConfirmModal
                    onOk={this.unInstallCluster}
                    title={'卸载集群'}
                    desc={'您正在卸载集群，一旦确定卸载就无法阻止卸载进程，并且卸载集群内的所有配置信息都将丢失，您确定要卸载吗？'}
                    onCancel={() => { this.setState({ showUnInstallModal: false }) }}
                    loading={unInstallLoading}
                  />
                )}
              </div>
            </Card>
        }
      </>

    );
  }
}
export default ClusterComponentsInfo;
