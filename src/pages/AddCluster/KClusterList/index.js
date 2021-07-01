/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
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
      selectClusterID: '',
      showTaskDetail: false,
      linkedClusters: new Map(),
      lastTask: {}
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
    const { selectClusterID } = this.state;
    dispatch(
      routerRedux.push(
        `/enterprise/${eid}/provider/${provider}/kclusters/${selectClusterID}/init`
      )
    );
  };
  selectCluster = row => {
    this.setState({ selectClusterID: row.clusterID });
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
          this.setState({ lastTask: data });
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
    const { dispatch } = this.props;
    const {
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
          this.setState({
            k8sClusters: data.clusters,
            loading: false
          });
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
        title: '选择(创建)Kubernetes集群'
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

  renderCreateClusterShow = () => {
    const {
      match: {
        params: { eid, provider }
      }
    } = this.props;
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
              this.setState({ lastTask: task, showTaskDetail: true });
              this.cancelAddCluster();
              this.loadKubernetesCluster();
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
            onOK={() => {
              this.cancelAddCluster();
              this.loadKubernetesCluster();
            }}
          />
        );
      case 'rke':
        return (
          <RKEClusterConfig
            eid={eid}
            onCancel={() => {
              this.cancelAddCluster();
            }}
            onOK={task => {
              this.setState({ lastTask: task, showTaskDetail: true });
              this.cancelAddCluster();
              this.loadKubernetesCluster();
            }}
          />
        );
      default:
    }
  };
  render() {
    const {
      k8sClusters,
      showBuyClusterConfig,
      loading,
      selectClusterID,
      showTaskDetail,
      lastTask,
      linkedClusters
    } = this.state;
    const nextDisable = selectClusterID === '';
    const {
      match: {
        params: { eid, provider }
      },
      location: {
        query: { clusterID, updateKubernetes }
      }
    } = this.props;
    let title = 'Kubernetes 集群列表';
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
    return (
      <PageHeaderLayout
        title="添加集群"
        content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
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
            loadLastTask={this.loadLastTask}
            linkedClusters={linkedClusters}
            showBuyClusterConfig={this.showBuyClusterConfig}
            updateKubernetes={updateKubernetes}
            updateKubernetesClusterID={clusterID}
          />
          {showBuyClusterConfig && this.renderCreateClusterShow()}
          <Col style={{ textAlign: 'center', marginTop: '32px' }} span={24}>
            <Button onClick={this.preStep}>上一步</Button>
            {nextDisable ? (
              <Tooltip title="请选择需要初始化的集群">
                <Button
                  style={{ marginLeft: '16px' }}
                  type="primary"
                  onClick={this.startInit}
                  disabled={nextDisable}
                >
                  下一步
                </Button>
              </Tooltip>
            ) : (
              <Button
                style={{ marginLeft: '16px' }}
                type="primary"
                onClick={this.startInit}
                disabled={nextDisable}
              >
                下一步
              </Button>
            )}
          </Col>
          {showTaskDetail && lastTask && (
            <ShowKubernetesCreateDetail
              onCancel={this.cancelShowCreateDetail}
              eid={eid}
              taskID={lastTask.taskID}
            />
          )}
        </Card>
      </PageHeaderLayout>
    );
  }
}
