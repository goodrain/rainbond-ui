import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Steps,
  Table,
  Typography
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ACKBuyConfig from '../../components/Cluster/ACKBuyConfig';
import BaseAddCluster from '../../components/Cluster/BaseAddCluster';
import KubernetesTableShow from '../../components/Cluster/KubernetesTableShow';
import RainbondClusterInit from '../../components/Cluster/RainbondClusterInit';
import SetRegionConfig from '../../components/Cluster/SetRegionConfig';
import ShowInitRainbondDetail from '../../components/Cluster/ShowInitRainbondDetail';
import cloud from '../../utils/cloud';
import userUtil from '../../utils/user';
import rainbondUtil from '../../utils/rainbond';
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
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      addClusterShow: false,
      showBuyClusterConfig: false,
      selectProvider: 'ack',
      currentStep: 0,
      k8sClusters: [],
      providerAccess: {},
      loading: false,
      initTask: {},
      initShow: false,
      runningInitTasks: []
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    const {
      location: {
        query: { init }
      }
    } = this.props;
    if (init) {
      this.setState({ initShow: true });
    }
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }
  componentDidMount() {
    // this.getAccessKey();
    // this.loadRunningInitTasks();
  }

  // getAccessKey get enterprise accesskey
  getAccessKey = () => {
    const { dispatch } = this.props;
    const { selectProvider } = this.state;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'cloud/getAccessKey',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider
      },
      callback: (access) => {
        this.setState({ providerAccess: access });
      }
    });
  };
  setProvider = (value) => {
    this.setState({ selectProvider: value });
  };
  setAccessKey = () => {
    const { form, dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
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
          secret_key: fieldsValue.secret_key
        },
        callback: (access) => {
          if (access) {
            // load clusters
            this.loadKubernetesCluster();
          }
        }
      });
    });
  };
  startInit = (clusterID) => {
    this.setState({ selectClusterID: clusterID, currentStep: 2 });
  };
  loadRunningInitTasks = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'cloud/loadRunningInitRainbondTasks',
      payload: {
        enterprise_id: eid
      },
      callback: (data) => {
        if (data) {
          this.setState({
            runningInitTasks: data.tasks
          });
        }
      },
      handleError: (res) => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  loadKubernetesCluster = () => {
    const { dispatch } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;
    const { selectProvider } = this.state;
    dispatch({
      type: 'cloud/loadKubereneteClusters',
      payload: {
        enterprise_id: eid,
        provider_name: selectProvider
      },
      callback: (data) => {
        if (data) {
          this.setState({
            k8sClusters: data.clusters,
            currentStep: 1,
            loading: false,
            showBuyClusterConfig: false
          });
        } else {
          this.setState({ loading: false });
        }
      },
      handleError: (res) => {
        cloud.handleCloudAPIError(res);
        this.setState({ loading: false });
      }
    });
  };
  showBuyClusterConfig = () => {
    this.setState({ showBuyClusterConfig: true });
  };
  cancelAddCluster = () => {
    this.setState({ addClusterShow: false });
  };
  // add Cluster
  addClusterShow = () => {
    this.setState({
      addClusterShow: true,
      text: '添加集群'
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
    const { currentStep } = this.state;
    this.setState({ currentStep: currentStep - 1 });
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
        title: '初始化Rainbond集群'
      },
      {
        title: '完成对接'
      }
    ];
    return steps;
  };
  showInitTaskDetail = (selectTask) => {
    this.setState({ showInitTaskDetail: true, initTask: selectTask });
  };
  completeInit = (task) => {
    this.setState({
      currentStep: 3,
      selectProvider: task.providerName,
      selectClusterID: task.clusterID
    });
  };
  cancelShowInitDetail = () => {
    this.loadRunningInitTasks();
    this.setState({ showInitTaskDetail: false });
  };
  hideInitShow = () => {
    this.setState({ initShow: false });
  };
  renderRunningInitTask = () => {
    const { runningInitTasks } = this.state;
    if (!runningInitTasks || runningInitTasks.length == 0) {
      return;
    }
    const tasks = [];
    runningInitTasks.map((item, index) => {
      item.key = `task${index}`;
      tasks.push(item);
    });
    const columns = [
      {
        title: '提供商',
        dataIndex: 'providerName',
        render: (text) => {
          return cloud.getProviderShowName(text);
        }
      },
      {
        title: '集群ID',
        dataIndex: 'clusterID'
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: (text) => {
          return cloud.getTaskStatus(text);
        }
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
        }
      }
    ];
    return <Table pagination={false} columns={columns} dataSource={tasks} />;
  };
  renderAliyunAcountSetting = () => {
    const { providerAccess } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      labelAlign: 'left'
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
                  {cloud.getAliyunCountDescribe().map((item) => {
                    return (
                      <a
                        style={{ marginRight: '8px' }}
                        href={item.href}
                        target="_blank"
                      >
                        {item.title}
                      </a>
                    );
                  })}
                </span>
              </li>
              <li>
                <span>
                  推荐在阿里云控制台企业RAM访问控制页面中创建独立的RAM用户，并创建用户AccessKey
                </span>
              </li>
              <li>
                <span>
                  请为RAM用户赋予:<b>AliyunCSFullAccess</b>、
                  <b>AliyunECSFullAccess</b>、<b>AliyunVPCFullAccess</b>、
                  <b>AliyunRDSFullAccess</b>、<b>AliyunNASFullAccess</b>、
                  <b>AliyunSLBFullAccess</b>权限
                </span>
              </li>
              <li>
                <span>
                  我们将严格保护AccessKey安全，若你有安全顾虑，可以在集群对接完成后删除账号收回权限
                </span>
              </li>
              <li>
                <span>
                  如果对接已存在的Kubernetes集群，对集群已有业务不影响，另外会按需购买RDS(1个)，NAS(1个)，SLB(1个)，预计每小时费用
                  <b>0.5</b>元
                </span>
              </li>
              <li>
                <span>
                  如果新购买Kubernetes集群，我们会按需创建购买Kubernetes托管集群(1个)，RDS(1个)，NAS(1个)，SLB(1个)，预计每小时费用
                  <b>2.5</b>元
                </span>
              </li>
            </ul>
          </Paragraph>
        </Col>
        <Col span={8} style={{ padding: '16px' }}>
          <Form.Item name="access_key" label="Access Key">
            {getFieldDecorator('access_key', {
              initialValue: providerAccess.access_key || '',
              rules: [
                {
                  required: true,
                  message: '请提供具有足够权限的Access Key'
                }
              ]
            })(<Input placeholder="Access Key" />)}
          </Form.Item>
        </Col>
        <Col span={8} style={{ padding: '16px' }}>
          <Form.Item name="secret_key" label="Secret Key">
            {getFieldDecorator('secret_key', {
              initialValue: providerAccess.secret_key || '',
              rules: [
                {
                  required: true,
                  message: '请提供具有足够权限的Secret Key'
                }
              ]
            })(<Input type="password" placeholder="Secret Key" />)}
          </Form.Item>
        </Col>
      </Form>
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
      initShow
    } = this.state;

    const {
      match: {
        params: { eid }
      }
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
    const K8sCluster = rainbondUtil.isEnableK8sCluster() || false;
    return (
      <PageHeaderLayout
        title="添加集群"
        content="集群是资源的集合，以Kubernetes集群为基础，部署Rainbond Region服务即可成为Rainbond集群资源。"
      >
        {K8sCluster && (
          <Alert
            style={{ marginBottom: '16px' }}
            message="欢迎您成为Rainbond Cloud用户，在开始您的云应用管理之旅之前，您首先需要完成资源的对接准备，我们为你提供了以下两种方式作为选择，如有任何疑问，请与我们联系（直接联系电话: 18501030060）"
            type="info"
            showIcon
          />
        )}
        <Card>
          <Row>
            <h3>添加已安装的集群</h3>
            <Divider />
            <Col span={12}>
              <div onClick={this.addClusterShow} className={styles.import}>
                <div className={styles.importicon}>{icon}</div>
                <div className={styles.importDesc}>
                  <h3>导入</h3>
                  <p>导入现有的集群，集群的配置和维护由用户负责。</p>
                </div>
              </div>
            </Col>
            <Col span={12} />
          </Row>
        </Card>

        {K8sCluster && (
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
                {this.loadSteps().map((item) => (
                  <Step key={item.title} title={item.title} />
                ))}
              </Steps>
            </Row>
            {currentStep == 0 && (
              <Row>
                {/* provider list */}
                <Row style={{ marginTop: '32px' }}>
                  {providers.map((item) => {
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
                            selectProvider === item.id && styles.providerActive
                          ]}
                        >
                          <Col flex="100px" className={styles.providericon}>
                            {item.icon}
                          </Col>
                          <Col flex="auto" className={styles.providerDesc}>
                            <h4>{item.name}</h4>
                            <p>{item.describe}</p>
                          </Col>
                          {selectProvider === item.id && (
                            <div className={styles.providerChecked}>
                              {selectIcon}
                            </div>
                          )}
                          {item.disable && (
                            <div className={styles.disable}>
                              即将支持（需要请联系我们）
                            </div>
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
              />
            )}
          </Card>
        )}
        {addClusterShow && (
          <BaseAddCluster
            eid={eid}
            onOk={this.addClusterOK}
            onCancel={this.cancelAddCluster}
          />
        )}
        {K8sCluster && showInitTaskDetail && (
          <ShowInitRainbondDetail
            onCancel={this.cancelShowInitDetail}
            eid={eid}
            providerName={selectProvider}
            taskID={initTask.taskID}
            clusterID={initTask.clusterID}
          />
        )}
        {K8sCluster && initShow && (
          <Modal
            width={600}
            centered
            maskClosable={false}
            footer={false}
            wrapClassName={styles.initModal}
            onCancel={this.hideInitShow}
            visible
          >
            <h2 className={styles.initTitle}>欢迎您Rainbond Cloud用户！</h2>
            <p>
              在线Cloud可以对接和管理您已有的计算资源并提供云原生应用管理面板
            </p>
            <div className={styles.initDescribe}>
              <div className={styles.initDescribeItem}>
                <span>
                  <svg
                    t="1588068572145"
                    className="icon"
                    viewBox="0 0 1318 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="4912"
                  >
                    <path
                      d="M558.913829 880.274286H285.871543a209.700571 209.700571 0 0 1 0-419.401143h3.291428l33.28 0.512c1.901714 0.146286 13.604571 1.097143 25.6-11.995429 12.068571-13.165714 7.68-24.649143 7.68-39.424a317.001143 317.001143 0 0 1 316.854858-317.147428A315.245714 315.245714 0 0 1 885.935543 175.542857c6.363429 5.851429 5.12 5.558857 11.044571 11.995429a38.692571 38.692571 0 0 0 31.158857 16.822857 34.962286 34.962286 0 0 0 34.962286-35.108572c0-11.922286-6.582857-21.942857-14.774857-30.134857-5.851429-6.436571-4.900571-4.827429-11.190857-10.752A382.390857 382.390857 0 0 0 672.577829 22.674286a386.925714 386.925714 0 0 0-386.194286 368.201143 279.698286 279.698286 0 1 0-0.512 559.250285h273.042286a35.035429 35.035429 0 0 0 35.035428-35.035428 35.108571 35.108571 0 0 0-35.108571-34.889143z m146.285714-76.653715V366.08a17.481143 17.481143 0 0 0-17.481143-17.408H582.904686a17.481143 17.481143 0 0 0-17.481143 17.408v437.540571c0 9.654857 7.826286 17.481143 17.554286 17.481143h104.740571c9.728 0 17.554286-7.826286 17.554286-17.554285zM600.458971 716.214857a34.962286 34.962286 0 1 1 69.851429-0.073143 34.962286 34.962286 0 0 1-69.851429 0.073143z m314.514286 87.405714V366.08a17.481143 17.481143 0 0 0-17.408-17.408h-104.96a17.481143 17.481143 0 0 0-17.481143 17.408v437.540571c0 9.654857 7.826286 17.481143 17.554286 17.481143h104.886857a17.481143 17.481143 0 0 0 17.408-17.554285z m-104.813714-87.405714a34.962286 34.962286 0 1 1 69.924571 0 34.962286 34.962286 0 0 1-69.924571 0z m454.070857 26.404572L1093.076114 340.114286a17.408 17.408 0 0 0-22.893714-9.216l-96.548571 40.96a17.481143 17.481143 0 0 0-9.216 22.893714l171.154285 402.651429a17.554286 17.554286 0 0 0 22.893715 9.216l96.548571-40.96a17.334857 17.334857 0 0 0 9.216-22.966858z m-130.633143-39.350858a34.889143 34.889143 0 1 1 64.219429-27.428571 34.889143 34.889143 0 0 1-64.219429 27.428571z"
                      fill="#326CE5"
                      p-id="4913"
                    />
                  </svg>{' '}
                  管理您的公有云资源，实现自动化云原生运维
                </span>
                <Paragraph className={styles.describe}>
                  <ul>
                    <li>可使用您已经购买的虚拟机</li>
                    <li>自动化集群按需创建，每天仅需50元资源费用</li>
                    <li>30分钟即可完成对接</li>
                  </ul>
                </Paragraph>
              </div>
              <div className={styles.initDescribeItem}>
                <span>
                  <svg
                    t="1588069176883"
                    className="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="5980"
                  >
                    <path
                      d="M501.418667 30.72c-8.874667 0.682667-17.408 2.730667-25.258667 6.826667L135.168 199.338667c-17.749333 8.533333-30.72 24.576-35.157333 43.690666L17.066667 608.256c-4.096 17.066667-0.682667 35.157333 9.216 49.834667 1.024 1.706667 2.389333 3.413333 3.754666 5.12l235.52 292.522666c12.288 15.36 31.061333 24.234667 50.858667 23.893334h377.514667c19.797333 0 38.570667-9.216 50.858666-24.234667l235.178667-292.864c12.288-15.36 16.725333-35.498667 12.288-54.613333L907.946667 243.029333c-4.437333-19.114667-17.408-35.157333-35.157334-43.690666L532.48 37.205333c-9.557333-4.778667-20.48-7.168-31.061333-6.485333z"
                      fill="#326CE5"
                      p-id="5981"
                    />
                    <path
                      d="M504.490667 154.965333c-11.605333 0.682667-20.48 10.922667-20.138667 22.528v5.802667c0.682667 6.485333 1.365333 12.970667 2.730667 19.456 2.048 12.288 2.389333 24.576 2.048 36.864-1.024 4.096-3.413333 7.850667-6.826667 10.581333l-0.341333 8.533334c-12.288 1.024-24.576 3.072-36.864 5.802666-50.858667 11.605333-97.28 37.888-133.12 76.117334l-7.168-5.12c-4.096 1.365333-8.533333 0.682667-12.288-1.365334-9.898667-7.509333-19.114667-15.701333-27.306667-24.917333-4.096-5.12-8.533333-9.898667-13.312-14.336l-4.437333-3.754667c-4.096-3.072-8.874667-5.12-13.994667-5.461333-6.144-0.341333-12.288 2.389333-16.384 7.168-6.826667 9.557333-4.778667 23.210667 5.12 30.037333l4.096 3.072c5.461333 3.754667 10.922667 6.826667 16.725333 9.898667 10.922667 6.144 21.162667 13.312 30.378667 21.504 2.389333 3.413333 3.754667 7.509333 4.096 11.605333l6.826667 6.144c-35.84 53.930667-50.517333 119.466667-41.301334 183.637334l-8.533333 2.389333c-2.048 3.413333-5.12 6.485333-8.874667 8.874667-11.946667 3.072-24.234667 5.12-36.522666 6.144-6.485333 0-12.970667 0.682667-19.456 1.365333l-5.461334 1.365333h-0.682666c-11.264 1.706667-19.114667 11.946667-17.408 23.210667 0.682667 4.437333 2.730667 8.533333 5.802666 11.605333 5.461333 5.461333 13.653333 7.509333 20.821334 5.12h0.341333l5.461333-0.682666c6.144-1.706667 12.288-4.096 18.432-6.826667 11.605333-4.437333 23.210667-8.192 35.498667-10.24 4.096 0.341333 8.192 1.706667 11.605333 4.096l9.216-1.365333c19.797333 61.781333 61.781333 114.005333 117.418667 146.773333l-3.754667 7.509333c1.706667 3.413333 2.389333 7.509333 1.706667 11.605334-5.12 11.605333-11.264 22.869333-18.432 33.450666-4.096 5.12-7.509333 10.581333-10.922667 16.384l-2.730666 5.461334c-5.802667 9.898667-2.389333 22.186667 7.509333 27.989333 3.754667 2.048 8.192 3.072 12.288 2.730667 7.509333-1.024 14.336-5.802667 17.066667-13.312l2.389333-5.12c2.389333-6.144 4.437333-12.288 5.802667-18.432 5.461333-13.312 8.192-27.648 15.701333-36.522667 2.389333-2.389333 5.461333-3.754667 8.874667-4.437333l4.437333-8.192c60.416 23.210667 127.317333 23.552 187.733333 0.341333l4.096 7.509333c4.096 0.682667 7.850667 2.730667 10.24 6.144 5.802667 10.922667 10.24 22.528 13.994667 34.133334 1.706667 6.485333 3.754667 12.629333 5.802667 18.773333l2.389333 5.12c4.096 10.581333 15.701333 16.042667 26.282667 11.946667 4.096-1.365333 7.509333-4.437333 9.898666-7.850667 4.096-6.485333 4.437333-14.677333 0.341334-21.504l-2.730667-5.461333c-3.413333-5.461333-6.826667-10.922667-10.922667-16.384-7.168-10.24-13.312-21.162667-18.432-32.426667-1.024-4.096-0.341333-8.533333 2.048-12.288-1.365333-2.730667-2.389333-5.461333-3.413333-8.192 55.637333-33.109333 97.28-85.674667 116.736-147.456l8.533333 1.365333c3.072-2.730667 7.168-4.437333 11.264-4.096 11.946667 2.389333 23.893333 5.802667 35.498667 10.24 6.144 3.072 12.288 5.12 18.432 7.168 1.365333 0.341333 3.754667 0.682667 5.12 1.024h0.341333c10.922667 3.413333 22.186667-2.389333 25.941334-13.312 1.365333-4.096 1.365333-8.533333 0-12.970666-2.389333-7.168-8.874667-12.629333-16.725334-13.653334l-5.802666-1.365333c-6.485333-1.024-12.970667-1.365333-19.456-1.365333-12.288-0.682667-24.576-2.730667-36.522667-6.144-3.754667-2.048-6.826667-5.12-8.874667-8.874667l-8.192-2.389333c8.874667-64.170667-6.144-129.365333-42.325333-183.296l7.168-6.826667c-0.341333-4.096 1.024-8.192 3.754667-11.605333 9.216-8.192 19.456-15.018667 30.378666-21.162667 5.802667-3.072 11.605333-6.144 16.725334-9.898667l4.437333-3.754666c9.557333-5.802667 12.629333-18.432 6.485333-28.330667-2.389333-4.096-6.144-7.168-10.581333-8.533333-7.509333-2.730667-15.701333-0.682667-21.162667 4.778666l-4.437333 3.754667c-4.778667 4.437333-9.216 9.216-13.312 14.336-8.192 9.216-17.066667 17.749333-26.624 25.258667-3.754667 1.706667-8.192 2.048-12.288 1.365333l-7.850667 5.461333a267.308373 267.308373 0 0 0-169.301333-81.578666c0-3.072-0.341333-7.509333-0.341333-9.216-3.413333-2.389333-5.802667-6.144-6.826667-10.24-0.341333-12.288 0.341333-24.576 2.389333-36.864 1.365333-6.144 2.389333-12.970667 2.730667-19.456V177.493333c2.048-11.946667-6.826667-21.845333-18.773333-22.528z m-25.6 157.696l-6.144 106.837334h-0.341334c-0.341333 6.485333-4.096 12.288-10.24 15.36-5.802667 3.072-12.970667 2.389333-18.432-1.706667l-87.722666-62.122667c27.989333-27.306667 62.805333-46.421333 101.034666-54.954666 7.509333-1.365333 14.677333-2.389333 21.845334-3.413334z m51.2 0c45.738667 5.802667 88.746667 26.282667 122.197333 58.709334l-86.698667 61.781333a17.954133 17.954133 0 0 1-25.258666-3.072c-2.389333-3.072-3.754667-6.826667-3.754667-10.922667l-6.485333-106.496z m-205.482667 98.645334l80.213333 71.338666v0.341334c7.509333 6.485333 8.192 18.090667 1.365334 25.6-2.389333 2.730667-5.12 4.437333-8.533334 5.461333v0.341333l-102.741333 29.696c-5.12-46.421333 5.12-92.842667 29.696-132.778666z m359.082667 0c24.234667 39.594667 35.157333 86.016 30.72 132.096l-103.082667-29.696v-0.341334c-6.485333-1.706667-11.264-6.826667-12.629333-13.312-1.365333-6.485333 0.682667-13.312 5.802666-17.408l79.189334-71.338666zM488.106667 488.448h32.768l19.797333 25.6-7.168 31.744-29.354667 13.994667-29.354666-13.994667-6.826667-31.744 20.138667-25.6z m104.789333 86.698667h4.096l105.813333 17.749333c-15.36 44.032-45.397333 81.578667-84.992 106.837333l-40.96-99.328c-3.754667-9.216 0.341333-19.797333 9.557334-23.552 2.048-0.682667 3.754667-1.365333 6.144-1.365333l0.341333-0.341333z m-177.834667 0.682666c6.144 0 11.605333 3.072 14.677334 8.192 3.413333 5.12 3.754667 11.264 1.365333 16.725334v0.341333l-40.618667 98.304a209.988267 209.988267 0 0 1-84.309333-105.813333l105.130667-17.749334h3.754666z m88.746667 42.666667c6.826667-0.341333 13.312 3.413333 16.384 9.557333h0.341333l51.882667 93.525334-20.821333 6.144c-38.229333 8.874667-77.824 6.826667-115.029334-5.802667l51.882667-93.525333c3.072-5.461333 8.874667-8.874667 15.36-8.874667v-1.024z"
                      fill="#FFFFFF"
                      p-id="5982"
                    />
                  </svg>
                  管理您的kubernetes集群，简化kubernetes的管理
                </span>
                <Paragraph className={styles.describe}>
                  <ul>
                    <li>云上Kubernetes集群自动化对接</li>
                    <li>私有化自建Kubernetes集群对接请联系我们</li>
                  </ul>
                </Paragraph>
              </div>
            </div>
            <p style={{ marginTop: '16px' }}>
              我们有专业工程师协助您对接您的计算资源，并辅助您实现DevOps流程、企业中台、企业客户交付、多云管理等体验流程。
            </p>
            <p>
              更多关于 Cloud信息请查看
              <a
                href="https://www.rainbond.com/docs/quick-start/rainbond-cloud/"
                target="_blank"
              >
                Cloud产品说明
              </a>
            </p>
            <p style={{ textAlign: 'center' }}>
              <Button onClick={this.hideInitShow} type="primary">
                我已知晓，开始体验
              </Button>
            </p>
          </Modal>
        )}
      </PageHeaderLayout>
    );
  }
}
