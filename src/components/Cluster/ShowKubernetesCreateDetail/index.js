/* eslint-disable react/no-array-index-key */
import { Alert, Button, Modal, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import modelstyles from '../../CreateTeam/index.less';
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
      steps: []
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

  render() {
    const { onCancel, title } = this.props;
    const { steps, loading, complete } = this.state;
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
        <Alert
          style={{ marginBottom: '16px' }}
          message="集群安装过程预计10分钟，请耐心等待，若遇到错误请反馈到社区"
          type="info"
          showIcon
        />
        <Row loading={loading} className={styles.box}>
          <Timeline loading={loading} pending={pending}>
            {steps.map((item, index) => {
              return (
                <Timeline.Item color={item.Color} key={`step${index}`}>
                  <h4>{item.Title}</h4>
                  <p>{item.Description}</p>
                  <p>{item.Message}</p>
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
