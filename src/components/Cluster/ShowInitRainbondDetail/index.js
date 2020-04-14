import { Alert, Button, Modal, Row, Timeline } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import modelstyles from '../../CreateTeam/index.less';
import styles from '../ShowKubernetesCreateDetail/index.less';

@connect()
class InitRainbondDetail extends PureComponent {
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
    const { dispatch, eid, clusterID, providerName } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID: clusterID,
        providerName: providerName,
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
          const { complete, steps } = cloud.showInitRainbondSteps(data.events);
          this.setState({
            complete: complete,
            loading: false,
            steps: steps,
          });
          if (this.interval == null) {
            this.interval = setInterval(() => this.loadTaskEvents(), 4000);
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
        title={title || 'Rainbond集群初始化进度查询'}
        visible
        maskClosable={false}
        width={600}
        onCancel={onCancel}
        className={modelstyles.TelescopicModal}
        footer={[
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>,
        ]}
      >
        <Row loading={loading} className={styles.box}>
          <Alert style={{marginBottom: "16px"}} message="初始化流程预计耗时20分钟，请耐心等待，若遇到错误请与客服联系" type="info" showIcon />
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

export default InitRainbondDetail;
