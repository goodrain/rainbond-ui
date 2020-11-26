import React, { PureComponent } from 'react';
import {
  Button,
  Icon,
  Modal,
  Form,
  message,
  Tooltip,
  Card,
  Row,
  Col,
  Table,
} from 'antd';
import { connect } from 'dva';
import dateUtil from '../../../../utils/date-util';
import styles from '../../Index.less';
import moment from 'moment';
import globalUtil from '../../../../utils/global';

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      instanceInfo: null,
    };
  }
  componentDidMount() {}

  showModal = pod_name => {
    this.props.dispatch({
      type: 'appControl/fetchInstanceDetails',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        pod_name,
      },
      callback: res => {
        if (res) {
          this.setState({
            instanceInfo: res.bean,
            visible: JSON.stringify(res.bean) !== '{}',
          });
          message.destroy();
          JSON.stringify(res.bean) === '{}' && message.warning('暂无实例详情');
        }
      },
    });
  };

  handleOk = () => {
    this.setState({
      visible: false,
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };
  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(false);
  };

  containerState = state => {
    const states = state ? state.toLowerCase() : state;
    switch (states) {
      case 'running':
        return <span style={{ color: '#39aa56' }}>运行中</span>;
      case 'waiting':
        return <span style={{ color: '#39aa56' }}>等待中</span>;
      case 'terminated':
        return <span style={{ color: 'rgb(205, 2, 0)' }}>已终止</span>;
      default:
        return <span>{state}</span>;
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
              const { pod_status, pod_name } = item;
              return (
                <Col
                  xs={wd}
                  xm={wd}
                  md={wd}
                  lg={wd}
                  xl={wd}
                  key={pod_name}
                  className={styles.boxImg}
                >
                  <Tooltip title="点击查看详情">
                    <div
                      className={styles.nodeBox}
                      onClick={() => {
                        this.showModal(pod_name);
                      }}
                      style={{
                        cursor: 'pointer',
                        background: globalUtil.fetchStateColor(pod_status),
                      }}
                    />
                  </Tooltip>
                  <p>{globalUtil.fetchStateText(pod_status)}</p>
                </Col>
              );
            })}
        </Row>
      </div>
    );
  };
  render() {
    const { new_pods, old_pods, status, runLoading } = this.props;
    const { instanceInfo } = this.state;
    return (
      <Card
        bordered={0}
        loading={runLoading}
        title="运行实例"
        style={{ margin: '20px 0', minHeight: '170px' }}
        bodyStyle={{ padding: '0', background: '#F0F2F5' }}
      >
        <Modal
          title={instanceInfo && instanceInfo.name}
          width="1000px"
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          bodyStyle={{ height: '500px', overflow: 'auto' }}
          footer={null}
        >
          <div>
            {instanceInfo && JSON.stringify(instanceInfo) !== '{}' && (
              <div className={styles.instanceBox}>
                <div>
                  <ul className={styles.instanceInfo}>
                    <li>
                      <span>所在节点:</span>
                      <Tooltip title={instanceInfo.node_ip}>
                        <span>{instanceInfo.node_ip || ''}</span>
                      </Tooltip>
                    </li>
                    <li>
                      <span>创建时间:</span>
                      <span>
                        {moment(instanceInfo.start_time)
                          .locale('zh-cn')
                          .format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </li>

                    <li>
                      <span>实例IP地址:</span>
                      <Tooltip title={instanceInfo.ip}>
                        <span>{instanceInfo.ip}</span>
                      </Tooltip>
                    </li>

                    <li>
                      <span>{instanceInfo.version ? '版本:' : ''}</span>
                      <span>{instanceInfo.version || ''}</span>
                    </li>
                    <li>
                      <span>实例状态:</span>
                      <span
                        style={{
                          color: globalUtil.fetchStateColor(
                            instanceInfo.status.type_str
                          ),
                        }}
                      >
                        {globalUtil.fetchStateText(
                          instanceInfo.status.type_str
                        )}
                      </span>
                    </li>
                    {instanceInfo.status.reason && (
                      <li style={{ width: '100%' }}>
                        <span>原因:</span>
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
                        <span>说明:</span>
                        <Tooltip title={instanceInfo.status.message}>
                          <span>{instanceInfo.status.message}</span>
                        </Tooltip>
                      </li>
                    )}
                    {instanceInfo.status.advice && (
                      <li style={{ width: '100%' }}>
                        <span>建议:</span>
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
                      fontSize: '14px',
                    }}
                  >
                    实例中的容器
                  </div>

                  <div style={{ height: '15px', background: '#fff' }} />
                  <Table
                    dataSource={instanceInfo.containers}
                    columns={[
                      {
                        title: '镜像名',
                        dataIndex: 'image',
                        key: 'image',
                        width: '40%',
                        render: image => (
                          <Tooltip title={image}>
                            <span className={styles.wordText}>{image}</span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: '内存',
                        dataIndex: 'limit_memory',
                        key: 'limit_memory',
                        width: '10%',
                        render: limit_memory => (
                          <Tooltip title={limit_memory}>
                            <span className={styles.wordText}>
                              {limit_memory}
                            </span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: 'CPU',
                        dataIndex: 'request_cpu',
                        key: 'request_cpu',
                        width: '10%',
                        render: val => (
                          <span className={styles.wordText}>
                            {val || ''}
                          </span>
                        ),
                      },
                      {
                        title: '创建时间',
                        dataIndex: 'started',
                        key: 'started',
                        width: '20%',
                        render: started =>
                          moment(started)
                            .locale('zh-cn')
                            .format('YYYY-MM-DD HH:mm:ss'),
                      },
                      {
                        title: '状态',
                        dataIndex: 'state',
                        key: 'state',
                        width: '10%',

                        render: state => (
                          <span className={styles.wordText}>
                            {this.containerState(state)}
                          </span>
                        ),
                      },
                      {
                        title: '说明',
                        dataIndex: 'reason',
                        key: 'reason',
                        width: '10%',
                        render: reason => (
                          <span className={styles.wordText}>
                            {reason || ''}
                          </span>
                        ),
                      },
                    ]}
                    pagination={{
                      hideOnSinglePage: true,
                      pageSize: 999,
                      current: 1,
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
                      fontSize: '14px',
                    }}
                  >
                    事件
                  </div>
                  <div style={{ height: '15px', background: '#fff' }} />
                  <Table
                    dataSource={instanceInfo.events}
                    columns={[
                      {
                        title: '类型',
                        dataIndex: 'type',
                        key: 'type',
                        width: '10%',
                        render: type => (
                          <span className={styles.wordText}>{type}</span>
                        ),
                      },
                      {
                        title: '原因',
                        dataIndex: 'reason',
                        key: 'reason',
                        width: '15%',
                        render: reason => (
                          <Tooltip title={reason}>
                            <span className={styles.wordText}>{reason}</span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: '时间',
                        dataIndex: 'age',
                        key: 'age',
                        width: '25%',
                        render: age => (
                          <span className={styles.wordText}>{age}</span>
                        ),
                      },
                      {
                        title: '说明',
                        dataIndex: 'message',
                        key: 'message',
                        width: '50%',
                        render: message => (
                          <Tooltip title={message}>
                            <span className={styles.wordText}>{message}</span>
                          </Tooltip>
                        ),
                      },
                    ]}
                    pagination={{
                      hideOnSinglePage: true,
                      pageSize: 999,
                      current: 1,
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
            margin: old_pods && old_pods.length > 0 ? '10px 0' : '0',
            borderTop:
              old_pods && old_pods.length > 0 ? 'none' : '1px solid #e8e8e8',
          }}
        >
          {old_pods && old_pods.length > 0 && (
            <Col
              xs={10}
              xm={10}
              md={10}
              lg={10}
              xl={10}
              style={{ background: '#fff', padding: '15px 0' }}
            >
              {old_pods &&
                this.schedulingBox(old_pods, old_pods && old_pods.length)}
            </Col>
          )}

          {old_pods && old_pods.length > 0 && (
            <Col xs={4} xm={4} md={4} lg={4} xl={4}>
              <div>
                <p style={{ marginTop: '40px', textAlign: 'center' }}>
                  正在更新中&#8680;
                </p>
              </div>
            </Col>
          )}

          <Col
            xs={old_pods && old_pods.length > 0 ? 10 : 24}
            xm={old_pods && old_pods.length > 0 ? 10 : 24}
            md={old_pods && old_pods.length > 0 ? 10 : 24}
            lg={old_pods && old_pods.length > 0 ? 10 : 24}
            xl={old_pods && old_pods.length > 0 ? 10 : 24}
            style={{ background: '#fff', padding: '15px 0' }}
          >
            {new_pods &&
              this.schedulingBox(new_pods, old_pods && old_pods.length)}
          </Col>
        </Row>
        {!new_pods && !old_pods && (
          <div
            style={{
              background: '#fff',
              paddingBottom: '30px',
              textAlign: 'center',
            }}
          >
            暂无运行实例
          </div>
        )}
      </Card>
    );
  }
}

export default Index;
