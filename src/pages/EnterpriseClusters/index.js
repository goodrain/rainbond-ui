/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable react/sort-comp */
/* eslint-disable no-underscore-dangle */
import NewbieGuiding from '@/components/NewbieGuiding';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Icon,
  InputNumber,
  Modal,
  notification,
  Row,
  Table,
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import EditClusterInfo from '../../components/Cluster/EditClusterInfo';
import ConfirmModal from '../../components/ConfirmModal';
import InstallStep from '../../components/Introduced/InstallStep';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import userUtil from '../../utils/user';

const { confirm } = Modal;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  clusterLoading: loading.effects['region/fetchEnterpriseClusters'],
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  delclusterLongin: loading.effects['region/deleteEnterpriseCluster'],
  overviewInfo: index.overviewInfo,
  novices: global.novices
}))
@Form.create()
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user, rainbondInfo, novices, enterprise } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      isNewbieGuide: rainbondUtil.isEnableNewbieGuide(enterprise),
      adminer,
      clusters: null,
      editClusterShow: false,
      regionInfo: false,
      text: '',
      delVisible: false,
      showTenantList: false,
      loadTenants: false,
      tenantTotal: 0,
      tenants: [],
      tenantPage: 1,
      tenantPageSize: 5,
      showTenantListRegion: '',
      showClusterIntroduced: rainbondUtil.handleNewbie(
        novices,
        'successInstallClusters'
      ),
      setTenantLimitShow: false,
      guideStep: 1
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
    this.loadClusters();
  }
  handleMandatoryDelete = () => {
    const th = this;
    confirm({
      title: '当前集群中还存在组件、是否强制删除',
      content: '删除后可通过相同的集群ID重新添加恢复已有租户和应用的管理',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        th.handleDelete(true);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
        }).catch(err => console.log(err));
      }
    });
  };
  handleDelete = (force = false) => {
    const { regionInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/deleteEnterpriseCluster',
      payload: {
        region_id: regionInfo.region_id,
        enterprise_id: eid,
        force
      },
      callback: res => {
        if (res && res._condition === 200) {
          this.loadClusters();
          notification.success({ message: '删除成功' });
        }
        this.cancelClusters();
      },
      handleError: res => {
        if (res && res.data && res.data.code === 10050) {
          this.setState({
            delVisible: false
          });
          this.handleMandatoryDelete();
        }
      }
    });
  };

  loadClusters = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.list) {
          const clusters = [];
          res.list.map((item, index) => {
            item.key = `cluster${index}`;
            clusters.push(item);
            return item;
          });
          this.setState({ clusters });
          globalUtil.putClusterInfoLog(eid, res.list);
        } else {
          this.setState({ clusters: [] });
        }
      }
    });
  };

  cancelEditClusters = () => {
    this.loadClusters();
    this.setState({
      editClusterShow: false,
      text: '',
      regionInfo: false
    });
  };

  handleEdit = item => {
    this.loadPutCluster(item.region_id);
  };

  delUser = regionInfo => {
    this.setState({
      delVisible: true,
      regionInfo
    });
  };
  cancelClusters = () => {
    this.setState({
      delVisible: false,
      regionInfo: false
    });
  };

  handlUnit = num => {
    if (num) {
      return (num / 1024).toFixed(2) / 1;
    }
    return 0;
  };

  loadPutCluster = regionID => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseCluster',
      payload: {
        enterprise_id: eid,
        region_id: regionID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            regionInfo: res.bean,
            editClusterShow: true,
            text: '编辑集群'
          });
        }
      }
    });
  };

  showRegions = item => {
    console.log(item,'item')
    this.setState(
      {
        showTenantList: true,
        regionAlias: item.region_alias,
        regionName: item.region_name,
        showTenantListRegion: item.region_id,
        loadTenants: true
      },
      this.loadRegionTenants
    );
  };

  loadRegionTenants = () => {
    const { tenantPage, tenantPageSize, showTenantListRegion } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusterTenants',
      payload: {
        enterprise_id: eid,
        page: tenantPage,
        pageSize: tenantPageSize,
        region_id: showTenantListRegion
      },
      callback: data => {
        if (data && data.bean) {
          this.setState({
            tenants: data.bean.tenants,
            tenantTotal: data.bean.total,
            loadTenants: false
          });
        } else {
          this.setState({ loadTenants: false });
        }
      },
      handleError: () => {
        this.setState({ loadTenants: false });
      }
    });
  };

  setTenantLimit = item => {
    this.setState({
      setTenantLimitShow: true,
      limitTenantName: item.tenant_name,
      limitTeamName: item.team_name,
      initLimitValue: item.set_limit_memory
    });
  };

  submitLimit = e => {
    e.preventDefault();
    const {
      match: {
        params: { eid }
      },
      form
    } = this.props;
    const { limitTenantName, showTenantListRegion } = this.state;
    form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          this.setState({ limitSummitLoading: true });
          this.props.dispatch({
            type: 'region/setEnterpriseTenantLimit',
            payload: {
              enterprise_id: eid,
              region_id: showTenantListRegion,
              tenant_name: limitTenantName,
              limit_memory: values.limit_memory
            },
            callback: () => {
              notification.success({
                message: '设置成功'
              });
              this.setState({
                limitSummitLoading: false,
                setTenantLimitShow: false
              });
              this.loadRegionTenants();
            },
            handleError: () => {
              notification.warning({
                message: '设置失败咯，请稍后重试'
              });
              this.setState({ limitSummitLoading: false });
            }
          });
        }
      }
    );
  };

  hideTenantListShow = () => {
    this.setState({
      showTenantList: false,
      showTenantListRegion: '',
      tenants: []
    });
  };
  handleTenantPageChange = page => {
    this.setState({ tenantPage: page }, this.loadRegionTenants);
  };
  handleNewbieGuiding = info => {
    const { nextStep } = info;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    return (
      <NewbieGuiding
        {...info}
        totals={14}
        handleClose={() => {
          this.handleGuideStep('close');
        }}
        handleNext={() => {
          if (nextStep) {
            this.handleGuideStep(nextStep);
            dispatch(routerRedux.push(`/enterprise/${eid}/addCluster`));
          }
        }}
      />
    );
  };
  handleGuideStep = guideStep => {
    this.setState({
      guideStep
    });
  };
  handleJoinTeams = teamName => {
    const { regionName } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/joinTeam',
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.onJumpTeam(teamName, regionName);
        }
      }
    });
  };
  onJumpTeam = (team_name, region) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`/team/${team_name}/region/${region}/index`));
  };
  handleClusterIntroduced = () => {
    this.putNewbieGuideConfig('successInstallClusters');
    this.setState({
      showClusterIntroduced: false
    });
  };
  putNewbieGuideConfig = configName => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/putNewbieGuideConfig',
      payload: {
        arr: [{ key: configName, value: true }]
      }
    });
  };

  // 开始应用安装回调
  onStartInstall = type => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    this.handleClusterIntroduced();
    // 从应用商店安装应用
    if (type === '2') {
      dispatch(routerRedux.push(`/enterprise/${eid}/shared/local?init=true`));
    } else {
      // 自定义安装
      this.fetchMyTeams();
    }
  };

  // 查看应用实例
  onViewInstance = () => {
    this.fetchMyTeams(true);
  };

  fetchMyTeams = (isNext = false) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { clusters } = this.state;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 1
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res && res.list.length > 0) {
            const teamName = res.list[0].team_name;
            if (isNext && teamName) {
              this.fetchApps(teamName, true);
            } else if (teamName && clusters) {
              dispatch(
                routerRedux.push(
                  `/team/${teamName}/region/${clusters[0].region_name}/create/code`
                )
              );
            }
          } else {
            return notification.warn({
              message: '请先创建团队！'
            });
          }
        }
      }
    });
  };

  fetchApps = (teamName = '', isNext = false) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { clusters } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseApps',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 1
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res && res.list.length > 0) {
            const groupId = res.list[0].ID;
            if (isNext && groupId && teamName && clusters) {
              dispatch(
                routerRedux.push(
                  `/team/${teamName}/region/${clusters[0].region_name}/apps/${groupId}`
                )
              );
            }
          } else {
            return notification.warn({
              message: '请先创建应用！'
            });
          }
        }
      }
    });
  };
  render() {
    const {
      delclusterLongin,
      match: {
        params: { eid }
      },
      clusterLoading,
      form
    } = this.props;
    const {
      clusters,
      text,
      regionInfo,
      delVisible,
      showTenantList,
      tenants,
      loadTenants,
      regionAlias,
      tenantTotal,
      tenantPage,
      tenantPageSize,
      setTenantLimitShow,
      limitTeamName,
      limitSummitLoading,
      initLimitValue,
      guideStep,
      isNewbieGuide,
      showClusterIntroduced
    } = this.state;
    const { getFieldDecorator } = form;
    const pagination = {
      onChange: this.handleTenantPageChange,
      total: tenantTotal,
      pageSize: tenantPageSize,
      current: tenantPage
    };

    const colorbj = (color, bg) => {
      return {
        // width: '100px',
        color,
        background: bg,
        borderRadius: '15px',
        padding: '2px 0'
      };
    };
    const columns = [
      {
        title: '名称',
        dataIndex: 'region_alias',
        align: 'center',
        width: 120,
        render: (val, row) => {
          return (
            <Link to={`/enterprise/${eid}/clusters/${row.region_id}/dashboard`}>
              {val}
            </Link>
          );
        }
      },
      {
        title: '安装方式',
        dataIndex: 'provider',
        align: 'center',
        width: 80,
        render: item => {
          switch (item) {
            case 'ack':
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  ACK
                </span>
              );
            case 'custom':
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  自建Kubernetes
                </span>
              );
            case 'rke':
              return (
                <Tooltip title="支持节点配置">
                  <span style={{ marginRight: '8px' }} key={item}>
                    基于主机自建
                  </span>
                </Tooltip>
              );
            case 'tke':
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  TKE
                </span>
              );
            case 'helm':
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  Helm对接
                </span>
              );
            default:
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  直接对接
                </span>
              );
          }
        }
      },
      {
        title: '内存(GB)',
        dataIndex: 'total_memory',
        align: 'center',
        width: 80,
        render: (_, item) => {
          return (
            <a
              onClick={() => {
                this.showRegions(item);
              }}
            >
              {this.handlUnit(item.used_memory)}/
              {this.handlUnit(item.total_memory)}
            </a>
          );
        }
      },
      {
        title: '版本',
        dataIndex: 'rbd_version',
        align: 'center',
        width: 180
      },
      {
        title: '状态',
        dataIndex: 'status',
        align: 'center',
        width: 60,
        render: (val, data) => {
          if (data.health_status === 'failure') {
            return <span style={{ color: 'red' }}>通信异常</span>;
          }
          switch (val) {
            case '0':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  编辑中
                </div>
              );
            case '1':
              return (
                <div style={colorbj('#52c41a', '#e9f8e2')}>
                  <Badge color="#52c41a" />
                  运行中
                </div>
              );
            case '2':
              return (
                <div style={colorbj('#b7b7b7', '#f5f5f5')}>
                  <Badge color="#b7b7b7" />
                  已下线
                </div>
              );

            case '3':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  维护中
                </div>
              );
            case '5':
              return (
                <div style={colorbj('#fff', '#f54545')}>
                  <Badge color="#fff" />
                  异常
                </div>
              );
            default:
              return (
                <div style={colorbj('#fff', '#ffac38')}>
                  <Badge color="#fff" />
                  未知
                </div>
              );
          }
        }
      },
      {
        title: '操作',
        dataIndex: 'method',
        align: 'center',
        width: 150,
        render: (_, item) => {
          const mlist = [
            <a
              onClick={() => {
                this.delUser(item);
              }}
            >
              删除
            </a>,
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              编辑
            </a>,
            <a
              onClick={() => {
                this.showRegions(item);
              }}
            >
              资源限额
            </a>,
            <Link
              to={`/enterprise/${eid}/importMessage?region_id=${item.region_id}`}
            >
              导入
            </Link> 
          ];
          if (item.provider === 'rke') {
            mlist.push(
              <Link
                to={`/enterprise/${eid}/provider/rke/kclusters?clusterID=${item.provider_cluster_id}&updateKubernetes=true`}
              >
                节点配置
              </Link>
            );
          }
          return mlist;
        }
      }
    ];

    const tenantColumns = [
      {
        title: '所属团队',
        dataIndex: 'team_name',
        align: 'center',
        render: (_, item) => {
          return (
            <a
              onClick={() => {
                this.handleJoinTeams(item.tenant_name);
              }}
            >
              {item.team_name}
            </a>
          );
        }
      },
      {
        title: '内存使用量(MB)',
        dataIndex: 'memory_request',
        align: 'center'
      },
      {
        title: 'CPU使用量',
        dataIndex: 'cpu_request',
        align: 'center'
      },
      {
        title: '租户限额(MB)',
        dataIndex: 'set_limit_memory',
        align: 'center'
      },
      {
        title: '运行组件数',
        dataIndex: 'running_app_num',
        align: 'center'
      },
      {
        title: '操作',
        dataIndex: 'method',
        align: 'center',
        width: '100px',
        render: (_, item) => {
          return [
            <a
              onClick={() => {
                this.setTenantLimit(item);
              }}
            >
              设置限额
            </a>
          ];
        }
      }
    ];

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 20 },
        sm: { span: 12 }
      }
    };
    return (
      <PageHeaderLayout
        title="集群管理"
        content="集群是资源的集合，以Kubernetes集群为基础，部署平台Region服务即可成为平台集群资源。"
      >
        {isNewbieGuide &&
        showClusterIntroduced &&
        !clusterLoading &&
        clusters &&
        clusters.length &&
        clusters[0].status === '1' ? (
          <InstallStep
            onCancel={this.handleClusterIntroduced}
            isCluster
            eid={eid}
            onStartInstall={this.onStartInstall}
            onViewInstance={this.onViewInstance}
          />
        ) : (
          ''
        )}
        <Row style={{ marginBottom: '20px' }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Link to={`/enterprise/${eid}/addCluster`}>
              <Button type="primary">添加集群</Button>
            </Link>
            <Button
              style={{ marginLeft: '16px' }}
              onClick={() => {
                this.loadClusters();
              }}
            >
              <Icon type="reload" />
            </Button>
            {guideStep === 1 &&
              this.props.novices &&
              rainbondUtil.handleNewbie(this.props.novices, 'addCluster') &&
              clusters &&
              clusters.length === 0 &&
              this.handleNewbieGuiding({
                tit: '去添加集群',
                desc: '支持添加多个计算集群，请按照向导进行第一个集群的添加',
                nextStep: 2,
                configName: 'addCluster',
                isSuccess: false,
                conPosition: { right: 0, bottom: '-180px' },
                svgPosition: { right: '50px', marginTop: '-11px' }
              })}
          </Col>
        </Row>
        <Card>
          {delVisible && (
            <ConfirmModal
              loading={delclusterLongin}
              title="删除集群"
              subDesc="此操作不可恢复"
              desc="确定要删除此集群吗？"
              onOk={() => this.handleDelete(false)}
              onCancel={this.cancelClusters}
            />
          )}

          {this.state.editClusterShow && (
            <EditClusterInfo
              regionInfo={regionInfo}
              title={text}
              eid={eid}
              onOk={this.cancelEditClusters}
              onCancel={this.cancelEditClusters}
            />
          )}
          <Alert
            style={{ marginBottom: '16px' }}
            message="注意！集群内存使用量是指当前集群的整体使用量，一般都大于租户内存使用量的总和"
          />
          <Table
            // scroll={{ x: window.innerWidth > 1500 ? false : 1500 }}
            loading={clusterLoading}
            dataSource={clusters}
            columns={columns}
          />
        </Card>
        {showTenantList && (
          <Modal
            maskClosable={false}
            title="租户资源占用排行"
            width={800}
            visible={showTenantList}
            footer={null}
            onOk={this.hideTenantListShow}
            onCancel={this.hideTenantListShow}
          >
            {setTenantLimitShow && (
              <div>
                <Alert
                  style={{ marginBottom: '16px' }}
                  message={`正在设置 ${limitTeamName} 在 ${regionAlias} 集群的内存限额`}
                />
                <Form onSubmit={this.submitLimit}>
                  <Form.Item
                    {...formItemLayout}
                    name="limit_memory"
                    label="内存限额(MB)"
                  >
                    {getFieldDecorator('limit_memory', {
                      initialValue: initLimitValue,
                      rules: [
                        {
                          required: true,
                          message: '内存限制值必填'
                        }
                      ]
                    })(
                      <InputNumber
                        style={{ width: '200px' }}
                        min={0}
                        precision={0}
                        max={2147483647}
                      />
                    )}
                  </Form.Item>
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      onClick={() => {
                        this.setState({
                          setTenantLimitShow: false,
                          limitSummitLoading: false
                        });
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      style={{ marginLeft: '16px' }}
                      type="primary"
                      loading={limitSummitLoading}
                      htmlType="submit"
                    >
                      确认
                    </Button>
                  </div>
                </Form>
              </div>
            )}
            {!setTenantLimitShow && (
              <div>
                <Alert
                  style={{ marginBottom: '16px' }}
                  message="CPU 使用量 1000 相当于分配1核 CPU"
                />
                <Table
                  pagination={pagination}
                  dataSource={tenants}
                  columns={tenantColumns}
                  loading={loadTenants}
                />
              </div>
            )}
          </Modal>
        )}
      </PageHeaderLayout>
    );
  }
}
