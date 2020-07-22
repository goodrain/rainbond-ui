import { Button, Modal, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import modelstyles from '../../CreateTeam/index.less';
import styles from './index.less';

@connect()
class ShowKubernetesCreateDetail extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      loading: true,
      complete: false,
      steps: [],
    };
  }
  componentDidMount() {
    this.loadTask();
    this.loadTaskEvents();
  }
  componentWillUnmount() {
    // 清除定时器
    clearInterval(this.interval);
    this.interval = null;
  }

  loadTask = () => {
    const { dispatch, eid, taskID } = this.props;
    dispatch({
      type: 'cloud/loadTask',
      payload: {
        enterprise_id: eid,
        taskID: taskID,
      },
      callback: data => {
        if (data) {
          this.setState({
            task: data,
            complete: data.status == 'complete',
          });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      },
    });
  };
  loadTaskEvents = () => {
    const { dispatch, eid, taskID } = this.props;
    dispatch({
      type: 'cloud/loadTaskEvents',
      payload: {
        enterprise_id: eid,
        taskID: taskID,
      },
      callback: data => {
        if (data) {
          const { complete, steps } = cloud.showCreateKubernetesSteps(
            data.events
          );
          this.setState({
            complete: complete,
            loading: false,
            steps: steps,
          });
          if (this.interval == null) {
            this.interval = setInterval(() => this.loadTaskEvents(), 2000);
          }
          if (complete && this.interval != null) {
            clearInterval(this.interval);
            this.interval = null;
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      },
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
        title={title || "集群购买进度"}
        visible
        width={600}
        onCancel={onCancel}
        maskClosable={false}
        className={modelstyles.TelescopicModal}
        footer={[
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>,
        ]}
      >
        <Row loading={loading} className={styles.box}>
          <Timeline loading={loading} pending={pending}>
            {steps.map((item,index) => {
              return (
                <Timeline.Item color={item.Color} key={`step${index}`}>
                  <h4>
                    {item.Title}
                  </h4>
                  <p>
                    {item.Description}
                  </p>
                  <p>
                    {item.Message}
                  </p>
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
