import { Alert, Button, Card, Col, Divider, Empty, Form, Input, Row, Steps, Table, Typography } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import ACKBuyConfig from '../../components/Cluster/ACKBuyConfig';
import BaseAddCluster from '../../components/Cluster/BaseAddCluster';
import KubernetesTableShow from '../../components/Cluster/KubernetesTableShow';
import RainbondClusterInit from '../../components/Cluster/RainbondClusterInit';
import SetRegionConfig from '../../components/Cluster/SetRegionConfig';
import ShowInitRainbondDetail from '../../components/Cluster/ShowInitRainbondDetail';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import cloud from '../../utils/cloud';
import userUtil from '../../utils/user';
import styles from './index.less';

const { Step } = Steps;
const { Paragraph } = Typography;

@Form.create()
@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      addClusterShow: false,
      regionInfo: false,
      showBuyClusterConfig: false,
      selectProvider: 'ack',
      currentStep: 0,
      k8sClusters: [],
      providerAccess: {},
      delVisible: false,
      loading: false,
      runningInitLoading: true,
      initTask: {},
      runningInitTasks: [],
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
    this.getAccessKey();
    this.loadRunningInitTasks();
  }


  addClusterOK = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
  };

  // 添加集群
  addClusterShow = () => {
    this.setState({
      addClusterShow: true,
      text: '添加集群',
    });
  };

  //getAccessKey get enterprise accesskey
  getAccessKey = () => {
    const { dispatch } = this.props;
    const { selectProvider } = this.state;
    const {
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'cloud/getAccessKey',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider,
      },
      callback: access => {
        this.setState({ providerAccess: access });
      },
    });
  };

  cancelAddCluster = () => {
    this.setState({ addClusterShow: false });
  };

  setProvider = value => {
    this.setState({ selectProvider: value });
  };

  showBuyClusterConfig = () => {
    this.setState({ showBuyClusterConfig: true });
  };

  loadKubernetesCluster = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid },
      },
    } = this.props;
    const { selectProvider } = this.state;
    dispatch({
      type: 'cloud/loadKubereneteClusters',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider,
      },
      callback: data => {
        if (data) {
          this.setState({
            k8sClusters: data.clusters,
            currentStep: 1,
            loading: false,
            showBuyClusterConfig: false,
          });
        } else {
          this.setState({ loading: false });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      },
    });
  };
  loadRunningInitTasks = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'cloud/loadRunningInitRainbondTasks',
      payload: {
        enterprise_id: eid,
      },
      callback: data => {
        if (data) {
          this.setState({
            runningInitTasks: data.tasks,
            runningInitLoading: false,
          });
        }
      },
      handleError: res => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      },
    });
  };
  startInit = clusterID => {
    this.setState({ selectClusterID: clusterID, currentStep: 2 });
  };

  setAccessKey = () => {
    const { form, dispatch } = this.props;
    const {
      match: {
        params: { eid },
      },
    } = this.props;
    const { selectProvider } = this.state;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      this.setState({ loading: true });
      dispatch({
        type: 'cloud/setAccessKey',
        payload: {
          enterprise_id: eid,
          provider_name: selectProvider,
          access_key: fieldsValue.access_key,
          secret_key: fieldsValue.secret_key,
        },
        callback: access => {
          if (access) {
            //load clusters
            this.loadKubernetesCluster();
          }
        },
      });
    });
  };

  preStep = () => {
    const { currentStep } = this.state;
    this.setState({ currentStep: currentStep - 1 });
  };

  loadSteps = () => {
    const steps = [
      {
        title: '选择供应商',
      },
      {
        title: '选择(创建)Kubernetes集群',
      },
      {
        title: '初始化Rainbond集群',
      },
      {
        title: '完成对接',
      },
    ];
    return steps;
  };
  showInitTaskDetail = selectTask => {
    this.setState({ showInitTaskDetail: true, initTask: selectTask });
  };
  completeInit = task => {
    this.setState({
      currentStep: 3,
      selectProvider: task.providerName,
      selectClusterID: task.clusterID,
    });
  };
  cancelShowInitDetail = () => {
    this.loadRunningInitTasks();
    this.setState({ showInitTaskDetail: false });
  };

  renderAliyunAcountSetting = () => {
    const { providerAccess } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 },
      },
      labelAlign: 'left',
    };
    return (
      <Form {...formItemLayout}>
        <Col span={24}>
          <Paragraph className={styles.describe}>
            <h5>账号说明：</h5>
            <ul>
              <li>
                <span>
                  开始此流程之前你必须确定你的阿里云账户是否支持按需购买资源，比如账户余额大于100元并通过实名认证
                </span>
              </li>
              <li>
                <span>
                  确保以下服务已开通或授权已授予：
                  {cloud.getAliyunCountDescribe().map(item=>{
                    return <a style={{marginRight: "8px"}} href={item.href} target="_blank">{item.title}</a>
                  })}
                </span>
              </li>
              <li><span>推荐在阿里云控制台企业RAM访问控制页面中创建独立的RAM用户，并创建用户AccessKey</span></li>
              <li>
                <span>
                  请为RAM用户赋予:<b>AliyunCSFullAccess</b>、<b>AliyunECSFullAccess</b>、<b>AliyunVPCFullAccess</b>、<b>AliyunRDSFullAccess</b>、<b>AliyunNASFullAccess</b>、<b>AliyunSLBFullAccess</b>权限
                </span>
              </li>
              <li><span>我们将严格保护AccessKey安全，若你有安全顾虑，可以在集群对接完成后删除账号收回权限</span></li>
              <li>
                <span>
                  如果对接已存在的Kubernetes集群，对集群已有业务不影响，另外会按需购买RDS(1个)，NAS(1个)，SLB(1个)，预计每小时费用<b>0.5</b>元
                </span>
              </li>
              <li>
                <span>
                  如果新购买Kubernetes集群，我们会按需创建购买Kubernetes托管集群(1个)，RDS(1个)，NAS(1个)，SLB(1个)，预计每小时费用<b>2.5</b>元
                </span>
              </li>
            </ul>
          </Paragraph>
        </Col>
        <Col span={8} style={{ padding: '16px' }}>
          <Form.Item name={'access_key'} label={'Access Key'}>
            {getFieldDecorator('access_key', {
              initialValue: providerAccess.access_key || '',
              rules: [
                {
                  required: true,
                  message: '请提供具有足够权限的Access Key',
                },
              ],
            })(<Input placeholder="Access Key" />)}
          </Form.Item>
        </Col>
        <Col span={8} style={{ padding: '16px' }}>
          <Form.Item name={'secret_key'} label={'Secret Key'}>
            {getFieldDecorator('secret_key', {
              initialValue: providerAccess.secret_key || '',
              rules: [
                {
                  required: true,
                  message: '请提供具有足够权限的Secret Key',
                },
              ],
            })(<Input type="password" placeholder="Secret Key" />)}
          </Form.Item>
        </Col>
      </Form>
    );
  };

  renderRunningInitTask = () => {
    const { runningInitTasks } = this.state;
    if (!runningInitTasks || runningInitTasks.length == 0) {
      return;
    }
    let tasks = [];
    runningInitTasks.map((item, index) => {
      item.key = `task${index}`;
      tasks.push(item);
    });
    const columns = [
      {
        title: '提供商',
        dataIndex: 'providerName',
        render: text => {
          return cloud.getProviderShowName(text);
        },
      },
      {
        title: '集群ID',
        dataIndex: 'clusterID',
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: text => {
          return cloud.getTaskStatus(text);
        },
      },
      {
        title: '操作',
        key: 'method',
        dataIndex: '',
        render: (text, row) => {
          return (
            <div>
              <Button
                type="link"
                onClick={() => {
                  this.showInitTaskDetail(row);
                }}
              >
                查看进度
              </Button>
              {row.status == 'inited' && (
                <Button
                  type="link"
                  onClick={() => {
                    this.completeInit(row);
                  }}
                >
                  完成对接
                </Button>
              )}
            </div>
          );
        },
      },
    ];
    return (
      <Table pagination={false} columns={columns} dataSource={tasks}></Table>
    );
  };

  render() {
    const {
      addClusterShow,
      selectProvider,
      selectClusterID,
      k8sClusters,
      currentStep,
      showBuyClusterConfig,
      loading,
      showInitTaskDetail,
      initTask,
      runningInitTasks,
    } = this.state;

    const {
      match: {
        params: { eid },
      },
      location: {
        query: { init },
      },
    } = this.props;

    const aliyunAcountSetting = this.renderAliyunAcountSetting();
    const runningTasks = this.renderRunningInitTask();
    const icon = (
      <svg
        t="1586145935607"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1861"
        width="100"
        height="100"
      >
        <path
          d="M911.36 589.824h-52.736c-14.336 0-26.624 12.288-26.624 26.624v176.128c0 14.336-12.288 26.624-26.624 26.624h-580.608c-14.336 0-26.624-12.288-26.624-26.624v-176.128c0-14.336-12.288-26.624-26.624-26.624h-52.736c-14.336 0-26.624 12.288-26.624 26.624v237.568c0 38.912 31.744 70.656 70.656 70.656h704c38.912 0 70.656-31.744 70.656-70.656v-237.568c0-14.336-12.288-26.624-26.112-26.624z m-413.696 116.224c10.752 10.752 26.624 10.752 36.864 0l237.568-237.568c10.752-10.752 10.752-26.624 0-36.864l-36.864-36.864c-10.752-10.752-26.624-10.752-36.864 0l-98.304 98.304c-10.752 10.752-29.696 3.584-29.696-12.288v-374.784c-1.536-14.336-15.872-26.624-28.16-26.624h-52.736c-14.336 0-26.624 12.288-26.624 26.624v373.248c0 15.872-19.456 23.04-29.696 12.288l-98.304-98.304c-10.752-10.752-26.624-10.752-36.864 0l-36.864 38.912c-10.752 10.752-10.752 26.624 0 36.864l236.544 237.056z"
          fill="#1296db"
          p-id="1862"
        />
      </svg>
    );
    const selectIcon = (
      <svg
        t="1586161102258"
        viewBox="0 0 1293 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5713"
        width="32"
        height="32"
      >
        <path
          d="M503.376842 1024a79.764211 79.764211 0 0 1-55.080421-22.096842L24.576 595.698526A79.764211 79.764211 0 0 1 22.096842 483.004632c30.342737-31.797895 80.842105-32.929684 112.478316-2.425264l361.849263 346.812632L1152.431158 29.049263a79.494737 79.494737 0 0 1 112.101053-10.832842c33.953684 27.917474 38.696421 78.201263 10.778947 112.101053L564.816842 994.950737c-14.012632 17.084632-34.708211 27.648-56.697263 28.887579C506.394947 1024 504.778105 1024 503.376842 1024z"
          fill="#ffffff"
          p-id="5714"
        />
      </svg>
    );
    const providers = cloud.getProviders();
    return (
      <PageHeaderLayout
        title="添加集群"
        content="集群是资源的集合，以Kubernetes集群为基础，部署Rainbond Region服务即可成为Rainbond集群资源。"
      >
        <Alert
          style={{ marginBottom: '16px' }}
          message="欢迎您成为Rainbond Cloud用户，在开始您的云应用管理之旅之前，您首先需要完成资源的对接准备，我们为你提供了以下两种方式作为选择，如有任何疑问，请与我们联系（直接联系电话: 18501030060）"
          type="info"
          showIcon
        />
        <Card>
          <Row>
            <h3>添加已安装的Rainbond集群</h3>
            <Divider />
            <Col span={12}>
              <div onClick={this.addClusterShow} className={styles.import}>
                <div className={styles.importicon}>{icon}</div>
                <div className={styles.importDesc}>
                  <h3>导入</h3>
                  <p>
                    导入现有的 Rainbond 集群，你可以参考
                    <a
                      target="_black"
                      href="https://www.rainbond.com/docs/quick-start/rainbond_install/"
                    >
                      安装文档
                    </a>
                    ，集群的配置和维护由用户负责。
                  </p>
                </div>
              </div>
            </Col>
            <Col span={12} />
          </Row>
        </Card>

        <Card style={{ marginTop: '16px' }}>
          <Row>
            <h3>从云服务商托管Kubernetes集群开始添加</h3>
            <Divider />

            {runningInitTasks &&
              runningInitTasks.length > 0 &&
              currentStep == 0 && (
                <Row style={{ marginBottom: '32px', padding: '0 16px' }}>
                  <h4>正在初始化的集群</h4>
                  {runningTasks}
                </Row>
              )}

            <Steps current={currentStep}>
              {this.loadSteps().map(item => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
          </Row>
          {currentStep == 0 && (
            <Row>
              {/* provider list */}
              <Row style={{ marginTop: '32px' }}>
                {providers.map(item => {
                  return (
                    <Col
                      key={item.id}
                      onClick={() => {
                        if (!item.disable) {
                          this.setProvider(item.id);
                        }
                      }}
                      span={8}
                      style={{ padding: '16px' }}
                    >
                      <Row
                        className={[
                          styles.provider,
                          selectProvider === item.id && styles.providerActive,
                        ]}
                      >
                        <Col flex={'100px'} className={styles.providericon}>
                          {item.icon}
                        </Col>
                        <Col flex={'auto'} className={styles.providerDesc}>
                          <h4>{item.name}</h4>
                          <p>{item.describe}</p>
                        </Col>
                        {selectProvider === item.id && (
                          <div className={styles.providerChecked}>
                            {selectIcon}
                          </div>
                        )}
                        {item.disable && (
                          <div className={styles.disable}>即将支持</div>
                        )}
                      </Row>
                    </Col>
                  );
                })}
              </Row>
              {/* user key info */}
              <Row style={{ marginTop: '32px', padding: '0 16px' }}>
                <h4>账户设置</h4>
                {aliyunAcountSetting}
              </Row>
              <Row justify="center">
                <Col style={{ textAlign: 'center' }} span={24}>
                  <Button
                    loading={loading}
                    onClick={this.setAccessKey}
                    type="primary"
                  >
                    下一步
                  </Button>
                </Col>
              </Row>
            </Row>
          )}
          {currentStep == 1 && !showBuyClusterConfig && (
            <Row style={{ marginTop: '32px' }}>
              {k8sClusters && k8sClusters.length > 0 && <h4>选择已有集群</h4>}
              {k8sClusters && k8sClusters.length > 0 ? (
                <KubernetesTableShow
                  eid={eid}
                  loadKubernetesCluster={this.loadKubernetesCluster}
                  selectProvider={selectProvider}
                  preStep={this.preStep}
                  data={k8sClusters}
                  startInit={this.startInit}
                  showBuyClusterConfig={this.showBuyClusterConfig}
                />
              ) : (
                <Empty description="暂无可用集群,如果集群确实存在，请确认AccessKey是否赋予集群管理权限">
                  <Button
                    onClick={this.preStep}
                    style={{ marginRight: '16px' }}
                  >
                    上一步
                  </Button>
                  <Button type="primary" onClick={this.showBuyClusterConfig}>
                    帮你购买一个
                  </Button>
                </Empty>
              )}
            </Row>
          )}
          {currentStep == 1 && showBuyClusterConfig && (
            <Row style={{ marginTop: '32px' }}>
              <h4>购买集群配置</h4>
              <ACKBuyConfig
                eid={eid}
                selectProvider={selectProvider}
                showClusters={this.loadKubernetesCluster}
              />
            </Row>
          )}
          {currentStep == 2 && selectClusterID && (
            <Row style={{ marginTop: '32px' }}>
              <RainbondClusterInit
                eid={eid}
                loadRuningTasks={this.loadRunningInitTasks}
                completeInit={this.completeInit}
                selectProvider={selectProvider}
                selectClusterID={selectClusterID}
                preStep={this.preStep}
              />
            </Row>
          )}
          {currentStep == 3 && (
            <SetRegionConfig
              eid={eid}
              selectProvider={selectProvider}
              selectClusterID={selectClusterID}
            ></SetRegionConfig>
          )}
        </Card>
        {addClusterShow && (
          <BaseAddCluster
            eid={eid}
            onOk={this.addClusterOK}
            onCancel={this.cancelAddCluster}
          />
        )}
        {showInitTaskDetail && (
          <ShowInitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            providerName={selectProvider}
            taskID={initTask.taskID}
            clusterID={initTask.clusterID}
          ></ShowInitRainbondDetail>
        )}
      </PageHeaderLayout>
    );
  }
}
