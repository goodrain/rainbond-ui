/* eslint-disable react/no-array-index-key */
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import ClusterProgressQuery from '../ClusterProgressQuery';

@connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise
}))
class InitRainbondDetail extends PureComponent {
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
    const { dispatch, eid, clusterID, providerName } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID,
        providerName
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
    const {
      dispatch,
      eid,
      taskID,
      rainbondInfo,
      enterprise,
      providerName,
      completeEvents
    } = this.props;
    dispatch({
      type: 'cloud/loadTaskEvents',
      payload: {
        enterprise_id: eid,
        taskID
      },
      callback: data => {
        if (data) {
          const { complete, steps } = cloud.showInitRainbondSteps(data.events);

          if (complete && steps.length > 0) {
            globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
              eid,
              taskID,
              status: steps[steps.length - 1].Status,
              message: steps[steps.length - 1].Message,
              install_step: 'createRainbond',
              provider: providerName
            });
            completeEvents && completeEvents(true)
          }
          this.setState({
            clusterID: data.clusterID,
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
  queryCreateLog = () => {
    this.setState({ showCreateLog: true });
  };
  render() {
    const { title } = this.props;

    return (
      <ClusterProgressQuery
        title={title || <FormattedMessage id='enterpriseColony.ShowInitRainbondDetail.title'/>}
        msg={<FormattedMessage id='enterpriseColony.ShowInitRainbondDetail.msg'/>}
        isLog={false}
        {...this.state}
        {...this.props}
      />
    );
  }
}

export default InitRainbondDetail;
