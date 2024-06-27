/* eslint-disable react/no-array-index-key */
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import ClusterProgressQuery from '../ClusterProgressQuery';

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
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
    const {
      dispatch,
      eid,
      task,
      selectProvider,
      enterprise,
      rainbondInfo
    } = this.props;
    dispatch({
      type: 'cloud/loadTaskEvents',
      payload: {
        enterprise_id: eid,
        taskID: task.taskID
      },
      callback: data => {
        if (data) {
          const { complete, steps } = cloud.showUpdateClusterSteps(data.events);
          if (complete && steps.length > 0) {
            globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
              eid,
              taskID: task.taskID,
              status: steps[steps.length - 1].Status,
              message: steps[steps.length - 1].Message,
              install_step: 'createK8s',
              provider: selectProvider
            });
          }
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
        isK8sProgress={true}
        title={title || <FormattedMessage id="enterpriseColony.ShowUpdateClusterDetail.title"/>}
        msg={<FormattedMessage id="enterpriseColony.ShowUpdateClusterDetail.msg"/>}
        {...this.state}
        {...this.props}
      />
    );
  }
}

export default UpdateClusterDetail;
