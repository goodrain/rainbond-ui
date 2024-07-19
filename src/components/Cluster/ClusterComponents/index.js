/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
import { Button, Col, Collapse, Icon, Modal, Row, Spin, Card } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { getPodEvent, getRainbondComponents } from '../../../services/cloud';
import handleAPIError from '../../../utils/error';
import styles from '../../CreateTeam/index.less';
import styless from './index.less';

const { Panel } = Collapse;

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
class ClusterComponents extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      componentInfo: false,
      componentsLoading: true,
      eventLoading: true,
      evens: [],
      list: []
    };
  }
  componentDidMount() {
    this.refresh = true;
    this.fetchRainbondComponents();
  }
  componentWillUnmount() {
    this.refresh = false;
  }
  fetchRainbondComponents = () => {
    const { eid, clusterID, providerName, completeInit } = this.props;
    const { componentInfo } = this.state;
    getRainbondComponents({
      clusterID,
      providerName,
      enterprise_id: eid
    })
      .then(res => {
        const list = (res && res.response_data) || [];
        let info = false;
        let flag = true
        list.map(item => {
          if (
            componentInfo.app === item.app &&
            item.pods &&
            item.pods.length
          ) {
            info = Object.assign({}, item.pods[0], { app: item.app });
          }
        });
        for (let i = 0; i < list.length; i++) {
          let pods = list[i].pods;
          if (pods == null || pods.length === 0) {
            flag = false
            break;
          } else {
            for (let j = 0; j < pods.length; j++) {
              if (pods[j].status.phase !== "Running") {
                flag = false
                break;
              }
            }
          }
        }
        if (flag) {
          completeInit()
        }
        this.handleComponentDetails(info);

        if (this.refresh) {
          setTimeout(() => this.fetchRainbondComponents(), 4000);
        }
        this.setState({
          list
        });
      })
      .catch(err => {
        let data = null;
        if (err.response && err.response.data) {
          data = err.response.data;
        } else if (err.data) {
          data = err.data;
        }
        const code = data && data.code;
        if (code && code !== 7002) {
          handleAPIError(err);
        }
        this.fetchRainbondComponents()
      })
      .finally(() => {
        this.setState({
          componentsLoading: false
        });
      });
  };
  fetchPodEvent = podName => {
    const { eid, clusterID, providerName } = this.props;
    getPodEvent({
      clusterID,
      providerName,
      podName,
      enterprise_id: eid
    })
      .then(res => {
        this.setState({
          evens: (res && res.response_data) || []
        });
      })
      .catch(err => {
        handleAPIError(err);
      })
      .finally(() => {
        this.handleEventLoading();
      });
  };
  handleEventLoading = () => {
    this.setState({
      eventLoading: false
    });
  };
  handleComponentDetails = componentInfo => {
    if (
      componentInfo &&
      componentInfo.metadata &&
      componentInfo.metadata.name
    ) {
      this.fetchPodEvent(componentInfo.metadata.name);
    } else {
      this.handleEventLoading();
    }
    this.setState({
      componentInfo
    });
  };
  handleStateName = str => {
    const phase = str && str.toLowerCase();
    const stateMap = {
      failed: styless.failedState,
      running: styless.successState,
      pending: styless.warningState,
      warning: styless.warningState
    };
    return stateMap[phase] || styless.successState;
  };
  render() {
    const { onCancel, openInitInfo } = this.props;
    const {
      list,
      evens,
      componentInfo,
      componentsLoading,
      eventLoading
    } = this.state;
    // 展示的总的数量
    const toatlApp = list && list.length;
    // running的数量
    let runningApp = [];
    // 标识符数组
    let configArr = [];
    list.forEach(item => {
      if (item.pods && item.pods.length > 0) {
        item.pods.forEach(value => {
          if (value.status.phase === 'Running') {
            configArr.push(value);
          }
        });
        // 判断是否要计算进去
        if (configArr.length === item.pods.length) {
          runningApp.push(item);
          configArr = [];
        }
      }
    });
    const slash = (
      <span style={{ color: 'rgba(0, 0, 0, 0.35)' }}>&nbsp;/&nbsp;</span>
    );
    return (
      <div>
        <div className={styless.componentTitle}>
          {componentInfo
            ? `${formatMessage({ id: 'enterpriseColony.ClusterComponents.details' })}`
            : `${formatMessage({ id: 'enterpriseColony.ClusterComponents.Rainbond' })}` + `(${runningApp.length}/${toatlApp})`}
        </div>
        <Spin
          spinning={
            componentInfo
              ? componentsLoading || eventLoading
              : componentsLoading
          }
        >
          {componentInfo ? (
            <div className={styless.copmonentDetail}>
              <div style={{ marginBottom: '20px' }}>
                <Icon
                  type="arrow-left"
                  style={{ fontSize: '20px', color: '#4d73b1' }}
                  onClick={() => {
                    this.handleComponentDetails(false);
                  }}
                />
              </div>
              <div className={styless.componentHeader}>
                <div>
                  Pod:
                  {componentInfo.metadata && componentInfo.metadata.name}
                </div>
                <div
                  className={this.handleStateName(
                    componentInfo.status && componentInfo.status.phase
                  )}
                >
                  {componentInfo.status && componentInfo.status.phase}
                </div>
              </div>
              <div className={styless.componentBox}>
                <div>
                  <div>
                    <span><FormattedMessage id='enterpriseColony.ClusterComponents.Name' /></span>
                    <span>
                      {componentInfo.metadata &&
                        componentInfo.metadata.namespace}
                    </span>
                  </div>
                  <div style={{ width: '66.66%', border: 'none' }}>
                    <div className={styless.componentBoxs}>
                      <div><FormattedMessage id='enterpriseColony.ClusterComponents.Image' /></div>
                      <div>
                        {componentInfo.spec &&
                          componentInfo.spec.containers &&
                          componentInfo.spec.containers.length &&
                          componentInfo.spec.containers[0].image}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div>
                    <span>PodIP：</span>
                    <span>
                      {componentInfo.status && componentInfo.status.podIP}
                    </span>
                  </div>
                  <div>
                    <p>
                      <span>Node：</span>
                      {componentInfo.spec && componentInfo.spec.nodeName}
                    </p>
                    <p>
                      <span>HostIP：</span>
                      {componentInfo.status && componentInfo.status.hostIP}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span><FormattedMessage id='enterpriseColony.ClusterComponents.Time' /></span>
                      {componentInfo.metadata &&
                        componentInfo.metadata.creationTimestamp &&
                        moment(componentInfo.metadata.creationTimestamp).format(
                          'YYYY-MM-DD HH:mm:ss'
                        )}
                    </p>
                    <p>
                      <span><FormattedMessage id='enterpriseColony.ClusterComponents.Number' /></span>
                      {componentInfo.status &&
                        componentInfo.status.containerStatuses &&
                        componentInfo.status.containerStatuses.length &&
                        componentInfo.status.containerStatuses[0].restartCount}
                    </p>
                  </div>
                </div>
              </div>
              <Collapse
                defaultActiveKey={['1', '2']}
                onChange={this.handleChange}
                className={styless.customCollapse}
              >
                <Panel
                  header={
                    <div className={styless.panelBox}>
                      <div><FormattedMessage id='enterpriseColony.ClusterComponents.container' /></div>
                      <div><FormattedMessage id='enterpriseColony.ClusterComponents.Container_pod' /></div>
                    </div>
                  }
                  key="1"
                >
                  <div className={styless.customTables}>
                    <Row className={styless.customTablesTit}>
                      <Col span={4}><FormattedMessage id='enterpriseColony.ClusterComponents.state' /></Col>
                      <Col span={6}><FormattedMessage id='enterpriseColony.ClusterComponents.name' /></Col>
                      <Col span={10}><FormattedMessage id='enterpriseColony.ClusterComponents.image' /></Col>
                      <Col span={4} style={{ textAlign: 'center' }}>
                        <FormattedMessage id='enterpriseColony.ClusterComponents.number' />
                      </Col>
                    </Row>
                    {componentInfo.status &&
                      componentInfo.status.containerStatuses &&
                      componentInfo.status.containerStatuses.length &&
                      componentInfo.status.containerStatuses.map(item => {
                        const { image, state, name, restartCount } = item;
                        return (
                          <Row className={styless.customTableCon}>
                            <Col span={4}>
                              <div
                                className={this.handleStateName(
                                  state && Object.keys(state)[0]
                                )}
                              >
                                {state && Object.keys(state)[0]}
                              </div>
                            </Col>
                            <Col span={6}>
                              <a>{name}</a>
                            </Col>
                            <Col span={10}>
                              <span>{image}</span>
                            </Col>
                            <Col span={4} style={{ textAlign: 'center' }}>
                              {restartCount}
                            </Col>
                          </Row>
                        );
                      })}
                  </div>
                </Panel>
                <Panel
                  header={
                    <div className={styless.panelBox}>
                      <div><FormattedMessage id='enterpriseColony.ClusterComponents.event' /></div>
                      <div><FormattedMessage id='enterpriseColony.ClusterComponents.pod' /></div>
                    </div>
                  }
                  key="2"
                >
                  <div className={styless.customTables}>
                    <Row className={styless.customTablesTit}>
                      <Col span={4}><FormattedMessage id='enterpriseColony.ClusterComponents.type' /></Col>
                      <Col span={6}><FormattedMessage id='enterpriseColony.ClusterComponents.Cause' /></Col>
                      <Col span={10}><FormattedMessage id='enterpriseColony.ClusterComponents.information' /></Col>
                      <Col span={4}><FormattedMessage id='enterpriseColony.ClusterComponents.last' /></Col>
                    </Row>
                    {evens && evens.length ? (
                      evens.map(item => {
                        const { type, reason, message, eventTime } = item;
                        return (
                          <Row className={styless.customTableCon}>
                            <Col span={4}>
                              <div className={this.handleStateName(type)}>
                                {type}
                              </div>
                            </Col>
                            <Col span={6}>
                              <span>{reason}</span>
                            </Col>
                            <Col span={10}>
                              <span>{message}</span>
                            </Col>
                            <Col span={4}>
                              {eventTime &&
                                moment(eventTime).format('YYYY-MM-DD HH:mm:ss')}
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
                        <FormattedMessage id='enterpriseColony.ClusterComponents.null' />
                      </div>
                    )}
                  </div>
                </Panel>
              </Collapse>
            </div>
          ) : (
            <div className={styless.customTables}>
              <Row className={styless.customTablesTit}>
                <Col span={3}><FormattedMessage id='enterpriseColony.ClusterComponents.state' /></Col>
                <Col span={7}><FormattedMessage id='enterpriseColony.ClusterComponents.name' /></Col>
                <Col span={14}><FormattedMessage id='enterpriseColony.ClusterComponents.image' /></Col>
              </Row>
              <div className={styless.boxs}>
                {list && list.length ? (
                  list.map(item => {
                    const { app, pods } = item;
                    return (
                      <Row>
                        <Row className={styless.customTableMinTit}>{app}</Row>
                        {pods && pods.length > 0 ? (
                          pods.map(items => {
                            const { status, metadata, spec } = items;
                            return (
                              <Row className={styless.customTableCon}>
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
                                  <a
                                    onClick={() => {
                                      this.handleComponentDetails(
                                        Object.assign({}, items, { app })
                                      );
                                    }}
                                  >
                                    {metadata && metadata.name}
                                  </a>
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
                                      {spec && spec.nodeName}
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
                                        status.containerStatuses[0]
                                          .restartCount}
                                    </span>
                                  </div>
                                </Col>
                              </Row>
                            );
                          })
                        ) : (
                          <div
                            style={{ marginTop: '12px', textAlign: 'center ' }}
                          >
                            <FormattedMessage id='enterpriseColony.ClusterComponents.Pods' />
                          </div>
                        )}
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
          )}
        </Spin>
      </div>
    );
  }
}
export default ClusterComponents;
