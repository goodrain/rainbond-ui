/* eslint-disable react/no-array-index-key */
import { Alert, Button, Modal, Popover, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import modelstyles from '../../CreateTeam/index.less';
import ClusterCreationLog from '../ClusterCreationLog';
import styles from './index.less';

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
class ShowKubernetesCreateDetail extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      loading: true,
      complete: false,
      steps: [],
      clusterID: '',
      showCreateLog: false
    };
  }
  componentDidMount() {
    this.loadTask();
    this.loadTaskEvents();
  }
  componentWillUnmount() {
    this.refresh = false;
  }
  refresh = true;

  loadTask = () => {
    const { dispatch, eid, taskID } = this.props;
    dispatch({
      type: 'cloud/loadTask',
      payload: {
        enterprise_id: eid,
        taskID
      },
      callback: data => {
        if (data) {
          this.setState({
            complete: data.status === 'complete'
          });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  loadTaskEvents = () => {
    const { dispatch, eid, taskID, rainbondInfo, enterprise } = this.props;
    dispatch({
      type: 'cloud/loadTaskEvents',
      payload: {
        enterprise_id: eid,
        taskID
      },
      callback: data => {
        if (data) {
          const { complete, steps } = cloud.showCreateKubernetesSteps(
            data.events
          );

          if (complete && steps && steps.length > 0) {
            globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
              eid,
              taskID,
              status: steps[steps.length - 1].Status,
              message: steps[steps.length - 1].Message,
              install_step: 'createK8s',
              provider: 'rke'
            });
          }
          this.setState({
            clusterID: data.clusterID,
            complete,
            loading: false,
            steps
          });
          if (this.refresh && !complete) {
            setTimeout(() => {
              this.loadTaskEvents();
            }, 4000);
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
        if (this.refresh) {
          setTimeout(() => {
            this.loadTaskEvents();
          }, 8000);
        }
      }
    });
  };
  queryCreateLog = () => {
    this.setState({ showCreateLog: true });
  };

  render() {
    const { onCancel, title, eid, selectProvider } = this.props;
    const { steps, loading, complete, showCreateLog, clusterID } = this.state;
    let pending = '进行中';
    if (complete) {
      pending = false;
    }
    return (
      <Modal
        title={title || '集群创建进度'}
        visible
        width={600}
        onCancel={onCancel}
        maskClosable={false}
        className={modelstyles.TelescopicModal}
        footer={[
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        ]}
      >
        {showCreateLog && (
          <ClusterCreationLog
            eid={eid}
            clusterID={clusterID}
            selectProvider={selectProvider}
            onCancel={() => {
              this.setState({ showCreateLog: false });
            }}
          />
        )}

        <Alert
          style={{ marginBottom: '16px' }}
          message={
            <span>
              集群安装过程预计10分钟，请耐心等待，若遇到错误请加入
              <Popover
                placement="bottom"
                content={
                  <img
                    alt="扫码加入社区钉钉群"
                    style={{ width: '200px' }}
                    title="扫码加入社区钉钉群"
                    src="https://www.rainbond.com/images/dingding-group.jpeg"
                  />
                }
                title={
                  <div style={{ textAlign: 'center' }}>钉钉群号31096419</div>
                }
              >
                <Button type="link" style={{ padding: 0 }}>
                  钉钉群
                </Button>
              </Popover>
              获取官方支持
            </span>
          }
          type="info"
          showIcon
        />
        <Row loading={loading} className={styles.box}>
          <Timeline loading={loading} pending={pending}>
            {steps.map((item, index) => {
              const { Status, Title, Description, Message } = item;
              return (
                <Timeline.Item color={item.Color} key={`step${index}`}>
                  <h4>{Title}</h4>
                  <p>{Description}</p>
                  <p>{Message}</p>
                  {Status === 'failure' && (
                    <div>
                      <Button
                        type="link"
                        style={{ padding: 0 }}
                        onClick={this.queryCreateLog}
                      >
                        查看日志
                      </Button>
                    </div>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>

          {complete && <span>已结束</span>}
        </Row>
      </Modal>
    );
  }
}

export default ShowKubernetesCreateDetail;
