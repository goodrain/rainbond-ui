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
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

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
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
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
            if (!item.resource_proxy_status) {
              notification.warning({
                message: formatMessage({id:'utils.request.warning'}),
                description:
                  `${item.region_alias}${formatMessage({id:'notification.warn.proxy'})}`,
              });
            }
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
            text: formatMessage({id:'enterpriseColony.button.edit'})
          });
        }
      }
    });
  };

  showRegions = item => {
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
                message: formatMessage({id:'notification.success.setting_successfully'})
              });
              this.setState({
                limitSummitLoading: false,
                setTenantLimitShow: false
              });
              this.loadRegionTenants();
            },
            handleError: () => {
              notification.warning({
                message: formatMessage({id:'notification.error.setting_failed'})
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
              message: formatMessage({id:'notification.warn.create_team'})
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
              message: formatMessage({id:'notification.warn.app'})
            });
          }
        }
      }
    });
  };
  // 添加shell
  terminalCallout = ()=>{
    const { dispatch } =this.props;
    dispatch({
      type: 'region/terminalCallout',
      payload: true,
    });
  }
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
    const paginationSwitch = clusters && clusters.length>10 ? true : false
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
        // title: '名称',
        title: formatMessage({ id: 'table.tr.name' }),
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
        // title: '安装方式',
        title: formatMessage({ id: 'table.tr.wayToInstall' }),
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
                  {/* 自建Kubernetes */}
                  <FormattedMessage id='enterpriseColony.table.custom'/>
                </span>
              );
            case 'rke':
              return (
                <Tooltip title={<FormattedMessage id='enterpriseColony.table.rke.tooltip'/>}>
                  <span style={{ marginRight: '8px' }} key={item}>
                    {/* 基于主机自建 */}
                    <FormattedMessage id='enterpriseColony.table.rke'/>
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
                  {/* Helm对接 */}
                  <FormattedMessage id='enterpriseColony.table.helm'/>
                </span>
              );
            default:
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  {/* 直接对接 */}
                  <FormattedMessage id='enterpriseColony.table.other'/>
                </span>
              );
          }
        }
      },
      {
        // title: '内存(GB)',
        title: formatMessage({ id: 'table.tr.memory' }),
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
        // title: '版本',
        title: formatMessage({ id: 'table.tr.versions' }),
        dataIndex: 'rbd_version',
        align: 'center',
        width: 180
      },
      {
        // title: '状态',
        title: formatMessage({ id: 'table.tr.status' }),
        dataIndex: 'status',
        align: 'center',
        width: 60,
        render: (val, data) => {
          if (data.health_status === 'failure') {
            return <span style={{ color: 'red' }}>
                      {/* 通信异常 */}
                      <FormattedMessage id='enterpriseColony.table.state.err'/>
                   </span>;
          }
          switch (val) {
            case '0':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  {/* 编辑中 */}
                  <FormattedMessage id='enterpriseColony.table.state.edit'/>
                </div>
              );
            case '1':
              return (
                <div style={colorbj('#52c41a', '#e9f8e2')}>
                  <Badge color="#52c41a" />
                  {/* 运行中 */}
                  <FormattedMessage id='enterpriseColony.table.state.run'/>
                </div>
              );
            case '2':
              return (
                <div style={colorbj('#b7b7b7', '#f5f5f5')}>
                  <Badge color="#b7b7b7" />
                  {/* 已下线 */}
                  <FormattedMessage id='enterpriseColony.table.state.down'/>
                </div>
              );

            case '3':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  {/* 维护中 */}
                  <FormattedMessage id='enterpriseColony.table.state.maintain'/>
                </div>
              );
            case '5':
              return (
                <div style={colorbj('#fff', '#f54545')}>
                  <Badge color="#fff" />
                  {/* 异常 */}
                  <FormattedMessage id='enterpriseColony.table.state.abnormal'/>
                </div>
              );
            default:
              return (
                <div style={colorbj('#fff', '#ffac38')}>
                  <Badge color="#fff" />
                  {/* 未知 */}
                  <FormattedMessage id='enterpriseColony.table.state.unknown'/>
                </div>
              );
          }
        }
      },
      {
        // title: '操作',
        title: formatMessage({ id: 'table.tr.handle' }),
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
              <FormattedMessage id='enterpriseColony.table.handle.delete'/>
              {/* 删除 */}
            </a>,
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              <FormattedMessage id='enterpriseColony.table.handle.edit'/>
              {/* 编辑 */}
            </a>,
            <a
              onClick={() => {
                this.showRegions(item);
              }}
            >
              <FormattedMessage id='enterpriseColony.table.handle.quota'/>
              {/* 资源限额 */}
            </a>,
            <Link
              to={`/enterprise/${eid}/importMessage?region_id=${item.region_id}`}
            >
              <FormattedMessage id='enterpriseColony.table.handle.import'/>
              {/* 导入 */}
            </Link> 
          ];
          if (item.provider === 'rke') {
            mlist.push(
              <Link
                to={`/enterprise/${eid}/provider/rke/kclusters?clusterID=${item.provider_cluster_id}&updateKubernetes=true`}
              >
              <FormattedMessage id='enterpriseColony.table.handle.deploy'/>
                {/* 节点配置 */}
              </Link>
            );
          }
          return mlist;
        }
      }
    ];

    const tenantColumns = [
      {
        title: formatMessage({id:'enterpriseColony.table.handle.quota.table.label.team_name'}),
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
        title: formatMessage({id:'enterpriseColony.table.handle.quota.table.label.memory_request'}),
        dataIndex: 'memory_request',
        align: 'center'
      },
      {
        title: formatMessage({id:'enterpriseColony.table.handle.quota.table.label.cpu_request'}),
        dataIndex: 'cpu_request',
        align: 'center'
      },
      {
        title: formatMessage({id:'enterpriseColony.table.handle.quota.table.label.set_limit_memory'}),
        dataIndex: 'set_limit_memory',
        align: 'center'
      },
      {
        title: formatMessage({id:'enterpriseColony.table.handle.quota.table.label.running_app_num'}),
        dataIndex: 'running_app_num',
        align: 'center'
      },
      {
        title: formatMessage({id:'enterpriseColony.table.handle.quota.table.label.method'}),
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
              {formatMessage({id:'enterpriseColony.table.handle.quota.table.label.method.btn'})}
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
        title={<FormattedMessage id='enterpriseColony.PageHeaderLayout.title'/>}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content'/>}
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
              <Button type="primary">
                {/* 添加集群 */}
              <FormattedMessage id='enterpriseColony.button.text'/>
              </Button>
            </Link>
            <Button onClick={this.terminalCallout} style={{marginLeft:15}}>
               {formatMessage({id:'otherEnterprise.shell.line'})}
            </Button>
            
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
                // tit: '去添加集群',
                tit: formatMessage({id:'enterpriseColony.guideStep.title'}),
                // desc: '支持添加多个计算集群，请按照向导进行第一个集群的添加',
                desc: formatMessage({id:'enterpriseColony.guideStep.desc'}),
                nextStep: 2,
                configName: 'addCluster',
                isSuccess: false,
                conPosition: { right: 0, bottom: '-180px' },
                svgPosition: { right: '50px', marginTop: '-11px' }
              })}
          </Col>
        </Row>
        <Card 
        style={{
          boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px',
          borderRadius: 5,
        }}>
          {delVisible && (
            <ConfirmModal
              loading={delclusterLongin}
              title={formatMessage({ id: 'confirmModal.cluster.delete.title' })}
              subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
              desc={formatMessage({ id: 'confirmModal.delete.cluster.desc' })}
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
            // message="注意！集群内存使用量是指当前集群的整体使用量，一般都大于租户内存使用量的总和"
            message={<FormattedMessage id='enterpriseColony.alert.message'/>}
          />
          <Table
            // scroll={{ x: window.innerWidth > 1500 ? false : 1500 }}
            pagination={ paginationSwitch }
            loading={clusterLoading}
            dataSource={clusters}
            columns={columns}
          />
        </Card>
        {showTenantList && (
          <Modal
            maskClosable={false}
            title=""
            width={800}
            visible={showTenantList}
            footer={null}
            onOk={this.hideTenantListShow}
            onCancel={this.hideTenantListShow}
          >
            {setTenantLimitShow && (
              <div>
                <Alert
                  style={{ margin: '20px 0 16px 0' }}
                  message={formatMessage({id:'enterpriseColony.table.handle.quota.alert'},{name:limitTeamName}) + formatMessage({id:'enterpriseColony.table.handle.quota.alert1'},{region:regionAlias})}
                />
                <Form onSubmit={this.submitLimit}>
                  <Form.Item
                    {...formItemLayout}
                    name="limit_memory"
                    label={formatMessage({id:'enterpriseColony.table.handle.quota.form.label.limit_memory'})}
                  >
                    {getFieldDecorator('limit_memory', {
                      initialValue: initLimitValue,
                      rules: [
                        {
                          required: true,
                          message: formatMessage({id:'placeholder.limit_memory'})
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
                      {formatMessage({id:'button.cancel'})}
                    </Button>
                    <Button
                      style={{ marginLeft: '16px' }}
                      type="primary"
                      loading={limitSummitLoading}
                      htmlType="submit"
                    >
                      {formatMessage({id:'button.confirm'})}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
            {!setTenantLimitShow && (
              <div>
                <Alert
                  style={{ margin: '20px 0 16px 0' }}
                  message={formatMessage({id:'enterpriseColony.table.handle.quota.form.label.alert'})}
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
