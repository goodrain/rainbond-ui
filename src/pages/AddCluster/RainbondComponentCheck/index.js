/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Card, Form, Row, Steps, Button } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import React, { PureComponent } from 'react';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
import ClusterComponents from '../../../components/Cluster/ClusterComponents';
import InitRainbondDetail from '../../../components/Cluster/ShowInitRainbondDetail';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import userUtil from '../../../utils/user';

const { Step } = Steps;

@Form.create()
@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo
}))
export default class RainbondInit extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      showInitDetail: false,
      guideStep: 10,
      task: null
    };
    this.refresh = true;
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }

  componentWillUnmount() {
    this.refresh = false;
  }

  componentDidMount() {
    this.loadTask();
  }

  loadTaskEvents = () => {
    const {
      dispatch,
      rainbondInfo,
      enterprise,
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const { task } = this.state;
    dispatch({
      type: 'cloud/loadTaskEvents',
      payload: {
        enterprise_id: eid,
        taskID: task.taskID
      },
      callback: data => {
        if (data.events) {
          const { complete, steps } = cloud.showInitRainbondSteps(data.events);
          if (complete && steps.length > 0) {
            globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
              eid,
              taskID: task.taskID,
              status: steps[steps.length - 1].Status,
              message: steps[steps.length - 1].Message,
              install_step: 'createRainbond',
              provider: provider
            });
            this.refresh = false
            this.completeInit();
          }
          if (!complete && this.refresh) {
            setTimeout(() => this.loadTaskEvents(), 4000);
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      }
    });
  };

  loadTask = noopen => {
    const {
      dispatch,
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    const {

    } = this.props;
    dispatch({
      type: 'cloud/loadInitRainbondTask',
      payload: {
        enterprise_id: eid,
        clusterID,
        providerName: provider
      },
      callback: res => {
        if (
          res &&
          res.status_code === 200 &&
          res.response_data &&
          res.response_data.data
        ) {
          const { data } = res.response_data;
          this.setState({ task: data },()=>{
            this.loadTaskEvents();
          });
          
        }
      },
      handleError: res => {

      }
    });
  };
  addClusterOK = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
  };
  preStep = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
    dispatch(
      routerRedux.push(`/enterprise/${eid}/provider/${provider}/kclusters`)
    );
  };
  loadSteps = () => {
    const steps = [
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.supplier' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.cluster' })
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.Initialize' })
      },
      {
        title: '集群初始化'
      },
      {
        title: formatMessage({ id: 'enterpriseColony.addCluster.docking' })
      }
    ];
    return steps;
  };
  completeInit = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid, provider, clusterID }
      }
    } = this.props;
    dispatch(
      routerRedux.push(
        `/enterprise/${eid}/provider/${provider}/kclusters/${clusterID}/link`
      )
    );
  };

  cancelShowInitDetail = () => {
    this.setState({ showInitDetail: false });
  }
  
  render() {
    const {
      match: {
        params: { eid, provider, clusterID, taskID }
      }
    } = this.props;
    const { showInitDetail, guideStep, task } = this.state;
    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.button.text' />}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getSvg('clusterSvg', 18)}
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={3}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card styles={{height: '80vh'}}>
          <ClusterComponents
            eid={eid}
            clusterID={clusterID}
            providerName={provider}
          />
          <Row style={{display:'flex',justifyContent:'center',marginTop: '24px'}}>
            <Button
              onClick={() => {
                this.setState({ showInitDetail: true });
              }}
              type="primary"
            >
              查看进度
            </Button>
          </Row>
        </Card>
        {showInitDetail && task && (
          <InitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            guideStep={guideStep}
            providerName={provider}
            clusterID={clusterID}
            taskID={task.taskID}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
