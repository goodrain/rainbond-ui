import {
  Row,
  Col,
  Collapse,
  Button,
  Icon,
  Spin,
} from 'antd'
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import moment from 'moment';
import globalUtil from '../../../utils/global';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from '../ClusterComponents/index.less'

const { Panel } = Collapse;

@connect(({ global }) => ({
  enterprise: global.enterprise
}))
export default class ShowNodeComponent extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isShowContainer: true,
      nodeList: [],
      podsList: [],
      clusterStateEle: null,
    };
  }
  componentDidMount () {
    this.fetchClusterStatus()
  }
  // 获取集群组件和node节点
  fetchClusterStatus = () => {
    const { dispatch, cluster_id, enterprise: { enterprise_id }} = this.props
    dispatch({
      type: 'region/fetchClusterStatus',
      payload: {
        enterprise_id,
        clusterID: cluster_id,
      },
      callback: res => {
        if (res && res.response_data && res.response_data.code === 200) {
          this.setState({
            clusterStateEle: this.handleClusterState(),
            isShowContainer: false,
            nodeList: res.response_data.nodes,
            podsList: res.response_data.pods,
          })
        } 
      }
    })
  }
  // 点击刷新
  handleReload = () => {
    this.setState({
      isShowContainer: true,
    }, () => {
      this.fetchClusterStatus()
    })
  }
  handleStateName = str => {
    const phase = str && str.toLowerCase();
    const stateMap = {
      failed: styles.failedState,
      running: styles.successState,
      pending: styles.warningState,
      warning: styles.warningState
    };
    return stateMap[phase] || styles.successState;
  };
  // 集群状态
  handleClusterState = () => {
    const { clusterList, cluster_id } = this.props
    let clusterStateEle

    const clusterState = clusterList.filter(item => {
      return item.cluster_id === cluster_id
    })
    switch(clusterState.length > 0 && clusterState[0].state) {
      case 'running':
        clusterStateEle = <><Icon style={{ margin: '0 5px',color: globalUtil.getPublicColor('rbd-success-status') }} type="check-circle" /><span style={{color: globalUtil.getPublicColor('rbd-success-status')}}>{clusterState[0].state}</span></>
        break;
      case 'offline':
        clusterStateEle = <><Icon style={{ margin: '0 5px',color: globalUtil.getPublicColor('rbd-down-status') }} type="warning" /><span style={{color: globalUtil.getPublicColor('rbd-down-status') }}>{clusterState[0].state}</span></>
        break;
      case 'installing':
        clusterStateEle = <><Icon style={{ margin: '0 5px',color: globalUtil.getPublicColor('rbd-processing-status') }} type="sync" spin/><span style={{color: globalUtil.getPublicColor('rbd-processing-status')}}>{clusterState[0].state}</span></>
        break;
      case 'initial':
        clusterStateEle = <><Icon style={{ margin: '0 5px',color: globalUtil.getPublicColor('rbd-processing-status') }} type="sync" spin/><span style={{color: globalUtil.getPublicColor('rbd-processing-status')}}>{clusterState[0].state}</span></>
        break;
      case 'failed':
        clusterStateEle = <><Icon style={{ margin: '0 5px',color: globalUtil.getPublicColor('rbd-error-status') }} type="close-circle" /><span style={{color: globalUtil.getPublicColor('rbd-error-status')}}>{clusterState[0].state}</span></>
        break;
      default:
        break;
    }
    return clusterStateEle
  }

  render() {
    const { isShowContainer, clusterStateEle, nodeList, podsList } = this.state;
    const { cluster_id } = this.props
    // 刷新按钮
    const reloadBtn = (
      <Button style={{ float: 'right' }} onClick={this.handleReload}>
        <Icon type="reload" />
      </Button>
    );
    const slash = (
      <span style={{ color: 'rgba(0, 0, 0, 0.35)' }}>&nbsp;/&nbsp;</span>
    );
    // 成功的节点总数
    const nodesReady = nodeList.length > 0 && nodeList.filter(item => {
      return item.status.conditions.some(ele => {
        return ele.type === 'Ready' && ele.status === 'True'
      })
    });
    // 成功的集群组件总数
    const podsReady = podsList.length > 0 && podsList.filter(item => {
        return item.status.phase === 'Running' || item.status.phase === 'Succeeded'
    });

    return (
      <div className={styles.container_style}>
        <Spin spinning={isShowContainer}>
          <Row>
            <Row className={styles.componentState_style}>
              <Col span={8}><FormattedMessage id='enterpriseColony.ShowNodeComponent.node_com' />(<span style={{ color: globalUtil.getPublicColor('rbd-success-status') }}>{nodesReady.length || 0}</span>/{nodeList.length || 0})</Col>
              <Col span={8}
                style={{
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {clusterStateEle}
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}><FormattedMessage id='enterpriseColony.ShowNodeComponent.cluter_com' />(<span style={{ color: globalUtil.getPublicColor('rbd-success-status') }}>{podsReady.length || 0}</span>/{podsList.length || 0})</Col>
            </Row>
            <Col style={{ paddingBottom: 16 }}>
              <Collapse expandIconPosition='right'>
                <Panel header={formatMessage({ id: 'enterpriseColony.ShowNodeComponent.node_com' })} key="1">
                  <div className={styles.customTables}>
                    <Row className={styles.customTablesTit}>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ClusterComponents.state' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ClusterComponents.name' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ShowNodeComponent.role' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ShowNodeComponent.version' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ShowNodeComponent.external_iP' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ShowNodeComponent.internal_iP' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ShowNodeComponent.arch' /></Col>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ShowNodeComponent.container_version' />{reloadBtn}</Col>
                    </Row>
                    <div className={styles.boxs}>
                      {nodeList && nodeList.length ? (
                        nodeList.map(item => {
                          const { metadata, spec, status } = item
                          return (
                            <Row className={styles.customTableCon}>
                              <Col span={3}>
                                <div>
                                  {
                                    status.conditions && status.conditions.length > 0 &&
                                      status.conditions.some(ele => {
                                        return ele.type === 'Ready' && ele.status === 'True'
                                      }) ? 'Ready' : 'Not Ready'
                                  }
                                </div>
                              </Col>
                              <Col span={3}>
                                <span>{metadata && metadata.name}</span>
                              </Col>
                              <Col span={3}>
                                <span>{metadata && metadata.labels && metadata.labels['beta.kubernetes.io/arch']}</span>
                              </Col>
                              <Col span={3}>
                                <span>{status && status.nodeInfo && status.nodeInfo.kubeletVersion}</span>
                              </Col>
                              <Col span={3}>
                                <span>{
                                  status && status.addresses && status.addresses.filter(ele => {
                                    return ele.type === 'ExternalIP'
                                  })[0].address
                                }</span>
                              </Col>
                              <Col span={3}>
                                <span>{
                                  status && status.addresses && status.addresses.filter(ele => {
                                    return ele.type === 'InternalIP'
                                  })[0].address
                                }</span>
                              </Col>
                              <Col span={3}>
                                <span>{metadata && metadata.labels && metadata.labels['beta.kubernetes.io/arch']}</span>
                              </Col>
                              <Col span={3}>
                                <span>{status && status.nodeInfo && status.nodeInfo.containerRuntimeVersion}</span>
                              </Col>
                            </Row>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            color: 'rgba(0,0,0,0.35)',
                            marginTop: '15px'
                          }}
                        >
                          <FormattedMessage id='enterpriseColony.ClusterComponents.created' />
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </Col>
            <Col>
              <Collapse expandIconPosition='right'>
                <Panel header={formatMessage({ id: 'enterpriseColony.ShowNodeComponent.cluter_com' })} key="1">
                  <div className={styles.customTables}>
                    <Row className={styles.customTablesTit}>
                      <Col span={3}><FormattedMessage id='enterpriseColony.ClusterComponents.state' /></Col>
                      <Col span={7}><FormattedMessage id='enterpriseColony.ClusterComponents.name' /></Col>
                      <Col span={14}><FormattedMessage id='enterpriseColony.ClusterComponents.image' />{reloadBtn}</Col>
                    </Row>
                    <div className={styles.boxs}>
                      {podsList && podsList.length ? (
                        podsList.map(item => {
                          const { metadata, spec, status } = item
                          return (
                            <Row>
                              <Row className={styles.customTableMinTit}>{metadata && metadata.namespace}</Row>
                              <Row className={styles.customTableCon}>
                                <Col span={3}>
                                  <div
                                    className={this.handleStateName(
                                      status && status.phase
                                    )}
                                  >
                                    {status && status.phase}
                                  </div>
                                </Col>
                                <Col span={7}>
                                  <span>
                                    {metadata && metadata.name}
                                  </span>
                                </Col>
                                <Col span={14}>
                                  <div>
                                    {spec &&
                                      spec.containers &&
                                      spec.containers.length > 0 &&
                                      spec.containers[0].image}
                                  </div>
                                  <div>
                                    <span style={{ color: '#4d73b1' }}>
                                      {status && status.hostIP}
                                      {slash}
                                    </span>

                                    <span style={{ color: '#4d73b1' }}>
                                      {status && status.podIP}
                                      {slash}
                                    </span>
                                    <span
                                      style={{ color: 'rgba(0, 0, 0, 0.35)' }}
                                    >
                                      <FormattedMessage id='enterpriseColony.ClusterComponents.Time' />
                                      {metadata &&
                                        metadata.creationTimestamp &&
                                        moment(
                                          metadata.creationTimestamp
                                        ).format('YYYY-MM-DD HH:mm:ss')}
                                    </span>
                                    <span
                                      style={{ color: 'rgba(0, 0, 0, 0.35)' }}
                                    >
                                      &nbsp;/&nbsp; <FormattedMessage id='enterpriseColony.ClusterComponents.number' />
                                      {status &&
                                        status.containerStatuses &&
                                        status.containerStatuses.length &&
                                        status.containerStatuses[0].restartCount
                                      }
                                    </span>
                                  </div>
                                </Col>
                              </Row>
                            </Row>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            color: 'rgba(0,0,0,0.35)',
                            marginTop: '15px'
                          }}
                        >
                          <FormattedMessage id='enterpriseColony.ClusterComponents.created' />
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </Col>
          </Row>
        </Spin>
      </div>
    )
  }
}
