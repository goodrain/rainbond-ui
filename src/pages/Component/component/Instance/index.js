import { Col, Form, message, Modal, Row, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import globalUtil from '../../../../utils/global';
import cookie from '../../../../utils/cookie';
import styles from '../../Index.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      instanceInfo: null,
      language : cookie.get('language') === 'zh-CN' ? true : false,
    };
  }

  showModal = podName => {
    const { isHelm = false } = this.props;
    if (isHelm) {
      this.fetchHelmInstanceDetails(podName);
    } else {
      this.fetchInstanceDetails(podName);
    }
  };
  fetchHelmInstanceDetails = podName => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchHelmInstanceDetails',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        pod_name: podName
      },
      callback: res => {
        if (res) {
          const isVisible = JSON.stringify(res.bean) === '{}';
          this.setState({
            instanceInfo: res.bean,
            visible: !isVisible
          });
          message.destroy();
          if (isVisible) {
            message.warning(<FormattedMessage id='notification.warn.notYet'/>);
          }
        }
      }
    });
  };
  fetchInstanceDetails = podName => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchInstanceDetails',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        pod_name: podName
      },
      callback: res => {
        if (res) {
          const isVisible = JSON.stringify(res.bean) === '{}';
          this.setState({
            instanceInfo: res.bean,
            visible: !isVisible
          });
          message.destroy();
          if (isVisible) {
            message.warning(<FormattedMessage id='notification.warn.notYet'/>);
          }
        }
      }
    });
  };
  handleOk = () => {
    this.setState({
      visible: false
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };
  handleMore = () => {
    const { handleMore } = this.props;
    if (handleMore) {
      handleMore(false);
    }
  };

  containerState = state => {
    const { podType } = this.props
    const states = state ? state.toLowerCase() : state;
    if(podType == 'job' || podType == 'job'){
      switch (states) {
        case 'running':
          return <span style={{ color: '#39aa56' }}><FormattedMessage id='componentOverview.body.tab.overview.instance.operation'/></span>;
        case 'waiting':
          return <span style={{ color: '#39aa56' }}><FormattedMessage id='componentOverview.body.tab.overview.instance.waiting'/></span>;
        case 'terminated':
          return <span style={{ color: '#70b7fa' }}><FormattedMessage id='componentOverview.body.tab.overview.instance.completed'/></span>;
        default:
          return <span>{state}</span>;
      }
    }else{
      switch (states) {
        case 'running':
          return <span style={{ color: '#39aa56' }}><FormattedMessage id='componentOverview.body.tab.overview.instance.operation'/></span>;
        case 'waiting':
          return <span style={{ color: '#39aa56' }}><FormattedMessage id='componentOverview.body.tab.overview.instance.waiting'/></span>;
        case 'terminated':
          return <span style={{ color: 'rgb(205, 2, 0)' }}><FormattedMessage id='componentOverview.body.tab.overview.instance.terminated'/></span>;
        default:
          return <span>{state}</span>;
      }
    }
   
  };

  schedulingBox = (list, isupdate) => {
    const wd = isupdate ? 3 : 2;
    return (
      <div>
        <Row>
          {list &&
            list.length > 0 &&
            list.map(item => {
              const { pod_status: podStatus, pod_name: podName } = item;
              return (
                <Col
                  xs={wd}
                  xm={wd}
                  md={wd}
                  lg={wd}
                  xl={wd}
                  key={podName}
                  className={styles.boxImg}
                >
                  <Tooltip title={<FormattedMessage id='componentOverview.body.tab.overview.instance.tooltip'/>}>
                    <div
                      className={styles.nodeBox}
                      onClick={() => {
                        this.showModal(podName);
                      }}
                      style={{
                        cursor: 'pointer',
                        background: globalUtil.fetchStateColor(podStatus)
                      }}
                    />
                  </Tooltip>
                  <p>{globalUtil.fetchStateText(podStatus)}</p>
                </Col>
              );
            })}
        </Row>
      </div>
    );
  };
  render() {
    const { new_pods: newPods, old_pods: oldPods } = this.props;
    const { instanceInfo, visible, language } = this.state;
    const isOldPods = oldPods && oldPods.length > 0;
    return (
      <div>
        <Modal
          title={instanceInfo && instanceInfo.name}
          width="1000px"
          visible={visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          bodyStyle={{ height: '500px', overflow: 'auto' }}
          footer={null}
        >
          <div>
            {instanceInfo && JSON.stringify(instanceInfo) !== '{}' && (
              <div className={styles.instanceBox}>
                <div>
                  <ul className={language ? styles.instanceInfo : styles.en_instanceInfo }>
                    <li>
                      <span><FormattedMessage id='componentOverview.body.tab.overview.instance.node'/></span>
                      <Tooltip title={instanceInfo.node_ip}>
                        <span>{instanceInfo.node_ip || '-'}</span>
                      </Tooltip>
                    </li>
                    <li>
                      <span><FormattedMessage id='componentOverview.body.tab.overview.instance.time'/></span>
                      <span>
                        {moment(instanceInfo.start_time)
                          .locale('zh-cn')
                          .format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </li>

                    <li>
                      <span><FormattedMessage id='componentOverview.body.tab.overview.instance.ip'/></span>
                      <Tooltip title={instanceInfo.ip}>
                        <span>{instanceInfo.ip || '-'}</span>
                      </Tooltip>
                    </li>

                    <li>
                      <span>{instanceInfo.version ? <FormattedMessage id='componentOverview.body.tab.overview.instance.edition'/> : ''}</span>
                      <span>{instanceInfo.version || ''}</span>
                    </li>
                    <li>
                      <span><FormattedMessage id='componentOverview.body.tab.overview.instance.state'/></span>
                      <span
                        style={{
                          color: globalUtil.fetchStateColor(
                            instanceInfo.status.type_str
                          )
                        }}
                      >
                        {globalUtil.fetchStateText(
                          instanceInfo.status.type_str
                        )}
                      </span>
                    </li>
                    <li>
                      <span><FormattedMessage id='componentOverview.body.tab.overview.instance.namespace'/></span>
                      <span>{instanceInfo.namespace || ''}</span>
                    </li>
                    {instanceInfo.status.reason && (
                      <li style={{ width: '100%' }}>
                        <span><FormattedMessage id='componentOverview.body.tab.overview.instance.reason'/></span>
                        <Tooltip title={instanceInfo.status.reason}>
                          <span>
                            {globalUtil.fetchInstanceReasons(
                              instanceInfo.status.reason
                            )}
                          </span>
                        </Tooltip>
                      </li>
                    )}

                    {instanceInfo.status.message && (
                      <li style={{ width: '100%' }}>
                        <span><FormattedMessage id='componentOverview.body.tab.overview.instance.explain'/></span>
                        <Tooltip title={instanceInfo.status.message}>
                          <span>{instanceInfo.status.message}</span>
                        </Tooltip>
                      </li>
                    )}
                    {instanceInfo.status.advice && (
                      <li style={{ width: '100%' }}>
                        <span><FormattedMessage id='componentOverview.body.tab.overview.instance.proposal'/></span>
                        <Tooltip title={instanceInfo.status.advice}>
                          <span>
                            {globalUtil.fetchInstanceAdvice(
                              instanceInfo.status.advice
                            )}
                          </span>
                        </Tooltip>
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <div
                    className={styles.logpassed}
                    style={{
                      padding: '10px',
                      color: 'rgba(0, 0, 0, 0.85)',
                      fontSize: '14px'
                    }}
                  >
                    <FormattedMessage id='componentOverview.body.tab.overview.instance.container'/>
                  </div>

                  <div style={{ height: '15px', background: '#fff' }} />
                  <Table
                    rowKey={(record,index) => index}
                    dataSource={instanceInfo.containers}
                    columns={[
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.image'}),
                        dataIndex: 'image',
                        key: 'image',
                        width: '40%',
                        render: image => (
                          <Tooltip title={image}>
                            <span className={styles.wordText}>{image}</span>
                          </Tooltip>
                        )
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.memory'}),
                        dataIndex: 'request_memory',
                        key: 'request_memory',
                        width: '10%',
                        render: requestMemory => (
                          <Tooltip title={requestMemory || <FormattedMessage id='componentOverview.body.tab.overview.instance.Unlimited'/>}>
                            <span className={styles.wordText}>
                              {requestMemory || <FormattedMessage id='componentOverview.body.tab.overview.instance.Unlimited'/>}
                            </span>
                          </Tooltip>
                        )
                      },
                      {
                        title: 'CPU',
                        dataIndex: 'request_cpu',
                        key: 'request_cpu',
                        width: '10%',
                        render: val => (
                          <span className={styles.wordText}>
                            {val || <FormattedMessage id='componentOverview.body.tab.overview.instance.Unlimited'/>}
                          </span>
                        )
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.creation'}),
                        dataIndex: 'started',
                        key: 'started',
                        width: '20%',
                        render: started =>
                          moment(started)
                            .locale('zh-cn')
                            .format('YYYY-MM-DD HH:mm:ss')
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.Staue'}),
                        dataIndex: 'state',
                        key: 'state',
                        align: 'center',
                        width: '10%',

                        render: state => (
                          <span className={styles.wordText}>
                            {(state && this.containerState(state)) || '-'}
                          </span>
                        )
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.Explain'}),
                        dataIndex: 'reason',
                        key: 'reason',
                        width: '10%',
                        render: reason => (
                          <span className={styles.wordText}>
                            {reason || '-'}
                          </span>
                        )
                      }
                    ]}
                    pagination={{
                      hideOnSinglePage: true,
                      pageSize: 999,
                      current: 1
                    }}
                  />
                </div>

                <div>
                  <div style={{ height: '15px', background: '#fff' }} />
                  <div
                    className={styles.logpassed}
                    style={{
                      padding: '10px',
                      color: 'rgba(0, 0, 0, 0.85)',
                      fontSize: '14px'
                    }}
                  >
                    <FormattedMessage id='componentOverview.body.tab.overview.instance.event'/>
                  </div>
                  <div style={{ height: '15px', background: '#fff' }} />
                  <Table
                    dataSource={instanceInfo.events}
                    rowKey={(record,index) => index}
                    columns={[
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.type'}),
                        dataIndex: 'type',
                        key: 'type',
                        width: '10%',
                        render: type => (
                          <span className={styles.wordText}>{type}</span>
                        )
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.Reason'}),
                        dataIndex: 'reason',
                        key: 'reason',
                        width: '15%',
                        render: reason => (
                          <Tooltip title={reason}>
                            <span className={styles.wordText}>{reason}</span>
                          </Tooltip>
                        )
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.Time'}),
                        dataIndex: 'age',
                        key: 'age',
                        width: '25%',
                        render: age => (
                          <span className={styles.wordText}>{age}</span>
                        )
                      },
                      {
                        title:formatMessage({id:'componentOverview.body.tab.overview.instance.Explain'}),
                        dataIndex: 'message',
                        key: 'message',
                        width: '50%',
                        render: messages => (
                          <Tooltip title={messages}>
                            <span className={styles.wordText}>{messages}</span>
                          </Tooltip>
                        )
                      }
                    ]}
                    pagination={{
                      hideOnSinglePage: true,
                      pageSize: 999,
                      current: 1
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
        <Row
          gutter={24}
          style={{
            margin: isOldPods ? '10px 0' : '0'
            // borderTop:
            //   old_pods && old_pods.length > 0 ? 'none' : '1px solid #e8e8e8'
          }}
        >
          {isOldPods && (
            <Col
              xs={10}
              xm={10}
              md={10}
              lg={10}
              xl={10}
              style={{ background: '#fff', padding: '15px 0' }}
            >
              {oldPods &&
                this.schedulingBox(oldPods, oldPods && oldPods.length)}
            </Col>
          )}

          {isOldPods && (
            <Col xs={4} xm={4} md={4} lg={4} xl={4}>
              <div>
                <p style={{ marginTop: '40px', textAlign: 'center' }}>
                  <FormattedMessage id='componentOverview.body.tab.overview.instance.Updating'/>&#8680;
                </p>
              </div>
            </Col>
          )}

          <Col
            xs={isOldPods ? 10 : 24}
            xm={isOldPods ? 10 : 24}
            md={isOldPods ? 10 : 24}
            lg={isOldPods ? 10 : 24}
            xl={isOldPods ? 10 : 24}
            style={{ background: '#fff', padding: '15px 0' }}
          >
            {newPods && this.schedulingBox(newPods, oldPods && oldPods.length)}
          </Col>
        </Row>
        {!newPods && !oldPods && (
          <div
            style={{
              background: '#fff',
              paddingBottom: '30px',
              textAlign: 'center'
            }}
          >
            <FormattedMessage id='componentOverview.body.tab.overview.instance.noRun'/>
          </div>
        )}
      </div>
    );
  }
}

export default Index;
