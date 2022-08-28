/* eslint-disable react/no-array-index-key */
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import ClusterProgressQuery from '../ClusterProgressQuery';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';


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
    const { title } = this.props;
    return (
      <ClusterProgressQuery
        title={title || <FormattedMessage id='enterpriseColony.ShowKubernetesCreateDetail.msg'/>}
        msg={formatMessage({id:'enterpriseColony.ShowKubernetesCreateDetail.msg'})}
        {...this.state}
        {...this.props}
      />
    );
  }
}

export default ShowKubernetesCreateDetail;
