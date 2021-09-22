/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import NewbieGuiding from '@/components/NewbieGuiding';
import { Button, Card, Col, Form, Row, Steps, Tooltip } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import ACKBuyConfig from '../../../components/Cluster/ACKBuyConfig';
import CustomClusterAdd from '../../../components/Cluster/CustomClusterAdd';
import KubernetesTableShow from '../../../components/Cluster/KubernetesTableShow';
import RKEClusterConfig from '../../../components/Cluster/RKEClusterAdd';
import ShowKubernetesCreateDetail from '../../../components/Cluster/ShowKubernetesCreateDetail';
import PageHeaderLayout from '../../../layouts/PageHeaderLayout';
import cloud from '../../../utils/cloud';
import globalUtil from '../../../utils/global';
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
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      showBuyClusterConfig: false,
      k8sClusters: [],
      loading: true,
      rainbondInit: false,
      selectClusterID: '',
      showTaskDetail: false,
      linkedClusters: new Map(),
      lastTask: {},
      guideStep: 3,
      currentClusterID: ''
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }
  componentDidMount() {
    this.loadKubernetesCluster();
    this.loadLastTask();
  }

  startInit = () => {
    const {
      dispatch,
      match: {
        params: { eid, provider }
      }
    } = this.props;
    const { selectClusterID, rainbondInit } = this.state;
    dispatch(
      routerRedux.push(
        `/enterprise/${eid}/provider/${provider}/kclusters/${selectClusterID}/${
          rainbondInit ? 'link' : 'init'
        }`
      )
    );
  };
  selectCluster = row => {
    this.setState({
      selectClusterID: row.clusterID,
      rainbondInit: row.rainbond_init
    });
  };

  loadLastTask = () => {
    const {
      dispatch,
      match: {
        params: { eid, provider }
      }
    } = this.props;
    dispatch({
      type: 'cloud/loadLastTask',
      payload: {
        enterprise_id: eid,
        provider_name: provider
      },
      callback: data => {
        if (data) {
          this.setState({ lastTask: data, currentClusterID: data.clusterID });
          // to load create event
          if (data.status === 'start') {
            this.setState({ showTaskDetail: true });
          }
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
      }
    });
  };

  loadKubernetesCluster = () => {
    const {
      dispatch,
      match: {
        params: { eid, provider }
      }
    } = this.props;
    this.setState({ loading: true });
    dispatch({
      type: 'cloud/loadKubereneteClusters',
      payload: {
        enterprise_id: eid,
        provider_name: provider
      },
      callback: data => {
        if (data && data.clusters && data.clusters.length > 0) {
          const next = data.clusters[0].state === 'running';
          this.setState({
            k8sClusters: data.clusters,
            loading: false
          });
          if (next) {
            document.getElementById('initializeBtn').scrollIntoView();
          }
          this.loadRainbondClusters();
        } else {
          if (provider === 'custom' || provider === 'rke') {
            this.showBuyClusterConfig();
          }
          this.setState({ loading: false });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  handleStartLog = (taskID, status, isCustomClusterType) => {
    const {
      match: {
        params: { eid, provider }
      },
      rainbondInfo,
      enterprise
    } = this.props;
    globalUtil.putInstallClusterLog(enterprise, rainbondInfo, {
      eid,
      taskID,
      status: isCustomClusterType ? status : 'start',
      install_step: 'createK8s',
      provider
    });
  };
  loadRainbondClusters = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid,
        check_status: 'no'
      },
      callback: res => {
        if (res && res.list) {
          const linkedClusters = new Map();
          res.list.map(item => {
            if (item.provider_cluster_id !== '') {
              linkedClusters.set(item.provider_cluster_id, true);
            }
            return item;
          });
          this.setState({ linkedClusters });
        }
      }
    });
  };
  showBuyClusterConfig = () => {
    this.setState({ showBuyClusterConfig: true });
  };

  cancelAddCluster = () => {
    this.setState({ showBuyClusterConfig: false });
  };
  cancelShowCreateDetail = () => {
    this.setState({ showTaskDetail: false });
    this.loadKubernetesCluster();
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
        params: { eid }
      }
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/addCluster`));
  };
  loadSteps = () => {
    const steps = [
      {
        title: '选择供应商'
      },
      {
        title: '选择(创建)平台集群'
      },
      {
        title: '初始化平台集群'
      },
      {
        title: '完成对接'
      }
    ];
    return steps;
  };

  handleOk = (task, upDateInfo, isCustomClusterType) => {
    this.setState(upDateInfo);
    if (task && task.taskID) {
      this.handleStartLog(task.taskID, task.status, isCustomClusterType);
    }
    this.cancelAddCluster();
    this.loadKubernetesCluster();
  };
  handleGuideStep = guideStep => {
    this.setState({
      guideStep
    });
  };
  handleNewbieGuiding = info => {
    const { prevStep, nextStep, handleClick = () => {} } = info;
    return (
      <NewbieGuiding
        {...info}
        totals={14}
        handleClose={() => {
          this.handleGuideStep('close');
          this.selectCluster({
            clusterID: '',
            rainbond_init: false
          });
        }}
        handlePrev={() => {
          if (prevStep) {
            this.handleGuideStep(prevStep);
          }
        }}
        handleNext={() => {
          if (nextStep) {
            handleClick();
            this.handleGuideStep(nextStep);
          }
        }}
      />
    );
  };
  renderCreateClusterShow = () => {
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
    const { guideStep } = this.state;
    switch (provider) {
      case 'ack':
        return (
          <ACKBuyConfig
            eid={eid}
            selectProvider={provider}
            onCancel={() => {
              this.cancelAddCluster();
            }}
            onOK={task => {
              const upDateInfo = {
                lastTask: task,
                showTaskDetail: true,
                currentClusterID: task.clusterID
              };
              this.handleOk(task, upDateInfo);
            }}
          />
        );
      case 'tke':
        break;
      case 'custom':
        return (
          <CustomClusterAdd
            eid={eid}
            onCancel={() => {
              this.cancelAddCluster();
            }}
            onOK={task => {
              const upDateInfo = {
                currentClusterID: task.clusterID
              };
              this.handleOk(task, upDateInfo, true);
            }}
          />
        );
      case 'rke':
        return (
          <RKEClusterConfig
            eid={eid}
            guideStep={guideStep}
            handleNewbieGuiding={this.handleNewbieGuiding}
            onCancel={() => {
              this.cancelAddCluster();
            }}
            onOK={task => {
              const upDateInfo = {
                lastTask: task,
                showTaskDetail: true,
                currentClusterID: task.clusterID
              };
              this.handleOk(task, upDateInfo);
            }}
          />
        );
      default:
    }
  };
  render() {
    const {
      match: {
        params: { eid, provider }
      },
      location: {
        query: { clusterID, updateKubernetes }
      }
    } = this.props;
    const {
      k8sClusters,
      showBuyClusterConfig,
      loading,
      selectClusterID,
      showTaskDetail,
      lastTask,
      linkedClusters,
      currentClusterID,
      guideStep
    } = this.state;
    const nextDisable = selectClusterID === '';

    let title = '集群列表';
    switch (provider) {
      case 'ack':
        title += '(阿里云 ACK)';
        break;
      case 'tke':
        title += '(腾讯云 TKE)';
        break;
      case 'custom':
        title += '(自定义)';
        break;
      case 'rke':
        title += '(基于主机自建)';
        break;
      default:
        title += `(不支持的驱动类型: ${provider})`;
    }
    const nextStepBtn = (
      <Button
        style={{ marginLeft: '16px' }}
        type="primary"
        onClick={this.startInit}
        disabled={nextDisable}
        id="initializeBtn"
      >
        下一步
      </Button>
    );
    let next = false;
    let selectedClusterID = '';
    let rainbondInit = false;

    if (k8sClusters && k8sClusters.length) {
      k8sClusters.map(item => {
        const { state } = item;
        if (state === 'running') {
          rainbondInit = item.rainbond_init;
          selectedClusterID = item.cluster_id;
          next = true;
        }
      });
    }
    return (
      <PageHeaderLayout
        title="添加集群"
        content="集群是资源的集合，以集群为基础，部署平台Region服务即可成为平台集群资源。"
      >
        <Row style={{ marginBottom: '16px' }}>
          <Steps current={1}>
            {this.loadSteps().map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </Row>
        <Card title={title}>
          <KubernetesTableShow
            eid={eid}
            loading={loading}
            loadKubernetesCluster={this.loadKubernetesCluster}
            selectCluster={this.selectCluster}
            selectProvider={provider}
            data={k8sClusters}
            lastTask={lastTask}
            showLastTaskDetail={() => {
              this.setState({ showTaskDetail: true });
            }}
            guideStep={guideStep}
            handleNewbieGuiding={this.handleNewbieGuiding}
            loadLastTask={this.loadLastTask}
            linkedClusters={linkedClusters}
            showBuyClusterConfig={this.showBuyClusterConfig}
            updateKubernetes={updateKubernetes}
            updateKubernetesClusterID={clusterID}
          />
          {next && (guideStep === 3 || guideStep === 8)
            ? this.handleNewbieGuiding({
                tit: '请选择Kubernetes集群',
                desc: '可选择已经正常运行的集群',
                send: false,
                configName: 'kclustersInitializationCluster',
                nextStep: 9,
                svgPosition: { left: '44px', marginTop: '-35px' },
                handleClick: () => {
                  this.selectCluster({
                    clusterID: selectedClusterID,
                    rainbond_init: rainbondInit
                  });
                }
              })
            : ''}
          {showBuyClusterConfig && this.renderCreateClusterShow()}
          <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
            <Button onClick={this.preStep}>上一步</Button>
            {nextDisable ? (
              <Tooltip title="请选择需要初始化的集群">{nextStepBtn}</Tooltip>
            ) : (
              nextStepBtn
            )}
            {next && guideStep === 9
              ? this.handleNewbieGuiding({
                  tit: '开始Rainbond集群服务',
                  desc: '初始化安装',
                  send: true,
                  configName: 'kclustersInitializationCluster',
                  nextStep: 10,
                  conPosition: { left: '60%', bottom: '-24px' },
                  svgPosition: { left: '54%', marginTop: '-11px' },
                  handleClick: () => {
                    if (!nextDisable) {
                      this.startInit();
                    }
                  }
                })
              : ''}
          </Col>
          {showTaskDetail && lastTask && (
            <ShowKubernetesCreateDetail
              onCancel={this.cancelShowCreateDetail}
              eid={eid}
              selectProvider={provider}
              taskID={lastTask.taskID}
              clusterID={currentClusterID}
            />
          )}
        </Card>
      </PageHeaderLayout>
    );
  }
}
