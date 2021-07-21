/* eslint-disable react/no-array-index-key */
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import ClusterProgressQuery from '../ClusterProgressQuery';

@connect()
class UpdateClusterDetail extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      loading: true,
      complete: false,
      steps: []
    };
  }
  componentDidMount() {
    this.loadTaskEvents();
  }
  componentWillUnmount() {
    this.refresh = false;
  }
  refresh = true;
  loadTaskEvents = () => {
    const { dispatch, eid, task } = this.props;
    dispatch({
      type: 'cloud/loadTaskEvents',
      payload: {
        enterprise_id: eid,
        taskID: task.taskID
      },
      callback: data => {
        if (data) {
          const { complete, steps } = cloud.showUpdateClusterSteps(data.events);
          this.setState({
            complete,
            loading: false,
            steps
          });
          if (!complete && this.refresh) {
            setTimeout(() => this.loadTaskEvents(), 4000);
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };

  render() {
    const { title } = this.props;

    return (
      <ClusterProgressQuery
        title={title || 'Kubernetes 集群配置进度查询'}
        msg="配置流程预计耗时10分钟，请耐心等待，若遇到错误请反馈到社区"
        {...this.state}
        {...this.props}
      />
    );
  }
}

export default UpdateClusterDetail;
