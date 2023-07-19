import React, { Component } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Descriptions,
  Tooltip,
  Icon,
  Form,
  InputNumber,
  Modal,
  notification,
  Table,
  Dropdown,
  Alert,
  Skeleton,
  Tag
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import ConfirmModal from '../../components/ConfirmModal';
import EditClusterInfo from '../../components/Cluster/EditClusterInfo';
import Rke from '../../../public/images/rke.svg'
import globalUtil from '@/utils/global';
import styles from "./index.less";

@connect()
@Form.create()

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonSwitch: false,
      delVisible: false,
      editClusterShow: false,
      editClusterInfo: {},
      text: '',
      showTenantList: false,
      showTenantListRegion: '',
      loadTenants: true,
      tenants: [],
      tenantPage: 1,
      tenantPageSize: 5,
      tenantTotal: 0,
      loadTenants: false,
    }
  }
  //安装方式
  clusterInstallType = (type) => {
    if (type) {
      switch (type) {
        case 'ack':
          return (
            <span style={{ marginRight: '8px' }} key={type}>
              ACK
            </span>
          );
        case 'custom':
          return (
            <span style={{ marginRight: '8px' }} key={type}>
              {/* 自建Kubernetes */}
              <FormattedMessage id='enterpriseColony.table.custom' />
            </span>
          );
        case 'rke':
          return (
            <Tooltip title={<FormattedMessage id='enterpriseColony.table.rke.tooltip' />}>
              <span style={{ marginRight: '8px' }} key={type}>
                {/* 基于主机自建 */}
                <FormattedMessage id='enterpriseColony.table.rke' />
              </span>
            </Tooltip>
          );
        case 'tke':
          return (
            <span style={{ marginRight: '8px' }} key={type}>
              TKE
            </span>
          );
        case 'helm':
          return (
            <span style={{ marginRight: '8px' }} key={type}>
              {/* Helm对接 */}
              <FormattedMessage id='enterpriseColony.table.helm' />
            </span>
          );
        default:
          return (
            <span style={{ marginRight: '8px' }} key={type}>
              {/* 直接对接 */}
              <FormattedMessage id='enterpriseColony.table.other' />
            </span>
          );
      }
    } else {
      return false
    }

  }
  //集群状态
  clusterStatus = (status, health_status) => {
    if (health_status === 'failure') {
      return <span style={{ color: 'red' }}>
        {/* 通信异常 */}
        <FormattedMessage id='enterpriseColony.table.state.err' />
      </span>;
    }
    switch (status) {
      case '0':
        return (
          <div style={{ color: '#1890ff' }}>
            <Badge color="#1890ff" />
            {/* 编辑中 */}
            <FormattedMessage id='enterpriseColony.table.state.edit' />
          </div>
        );
      case '1':
        return (
          <div style={{ color: '#52c41a' }}>
            <Badge color="#52c41a" />
            {/* 运行中 */}
            <FormattedMessage id='enterpriseColony.table.state.run' />
          </div>
        );
      case '2':
        return (
          <div style={{ color: '#b7b7b7' }}>
            <Badge color="#b7b7b7" />
            {/* 已下线 */}
            <FormattedMessage id='enterpriseColony.table.state.down' />
          </div>
        );

      case '3':
        return (
          <div style={{ color: '#1890ff' }}>
            <Badge color="#1890ff" />
            {/* 维护中 */}
            <FormattedMessage id='enterpriseColony.table.state.maintain' />
          </div>
        );
      case '5':
        return (
          <div style={{ color: 'red' }}>
            <Badge color="red" />
            {/* 异常 */}
            <FormattedMessage id='enterpriseColony.table.state.abnormal' />
          </div>
        );
      default:
        return (
          <div style={{ color: '#fff' }}>
            <Badge color="#fff" />
            {/* 未知 */}
            <FormattedMessage id='enterpriseColony.table.state.unknown' />
          </div>
        );
    }
  }
  // 集群展示图标
  clusterIcon = (provider, region_type) => {
    const styleK8s = {
      marginRight: '8px',
      display: 'inline-block',
    }
    const stylesCustom = (region_type == 'custom') ? styleK8s : ''
    switch (provider) {
      case 'ack':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={styles.icons}>
              {globalUtil.fetchSvg('Ack')}
            </div>
          </span>
        );
      case 'rke':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={styles.icons}>
              <img src={Rke} alt=""></img>
            </div>
          </span>
        );
      case 'tke':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={styles.icons}>
              {globalUtil.fetchSvg('Tke')}
            </div>
          </span>
        );
      case 'K3s':
        return (
          <span style={{ marginRight: '8px' }} key={provider}>
            <div className={styles.icons}>
              <img style={{ height: '120px' }} src={K3s} alt=""></img>
            </div>
          </span>
        );
      case 'helm':
        return (
          <span style={stylesCustom} key={provider}>
            <div className={styles.icons}>
              {globalUtil.fetchSvg(
                region_type == 'aliyun'
                  ? globalUtil.fetchSvg('Ack')
                  : region_type == 'huawei'
                    ? globalUtil.fetchSvg('Tke')
                    : region_type == 'tencent'
                      ? globalUtil.fetchSvg('Cce')
                      : globalUtil.fetchSvg('K8s')
              )}
            </div>
            <p>
              {globalUtil.fetchSvg(
                region_type == 'aliyun'
                  ? 'Aliyun   ACK'
                  : region_type == 'huawei'
                    ? 'Huawei   CCE'
                    : region_type == 'tencent'
                      ? 'Tencent   TKE'
                      : ''
              )}
            </p>

          </span>
        );
      default:
        return (
          <span style={{ marginRight: '8px', display: 'inline-block', marginTop: '20px' }} key={provider}>
            {/* 直接对接 */}
            {globalUtil.fetchSvg('K8s')}
          </span>
        );
    }
  }
  // 按钮显示隐藏
  buttonShow = () => {
    this.setState({
      buttonSwitch: true
    })
  }
  // 删除
  handleDelete = (force = false) => {
    const {
      dispatch,
      rowClusterInfo
    } = this.props;
    const eid = globalUtil.getCurrEnterpriseId()
    dispatch({
      type: 'region/deleteEnterpriseCluster',
      payload: {
        region_id: rowClusterInfo.region_id,
        enterprise_id: eid,
        force
      },
      callback: res => {
        if (res && res._condition === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
          dispatch(
            routerRedux.replace(`/enterprise/${eid}/clusters`)
          )
        }
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
  cancelClusters = () => {
    this.setState({
      delVisible: false,
    });
  };
  handleMandatoryDelete = () => {
    const th = this;
    confirm({
      title: formatMessage({ id: 'enterpriseColony.mgt.cluster.delect' }),
      content: formatMessage({ id: 'enterpriseColony.mgt.cluster.restore' }),
      okText: formatMessage({ id: 'button.determine' }),
      cancelText: formatMessage({ id: 'button.cancel' }),
      onOk() {
        th.handleDelete(true);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 1000);
        }).catch(err => console.log(err));
      }
    });
  };
  delEven = () => {
    this.setState({
      delVisible: true
    })
  }
  // 导入
  importEven = () => {
    const {
      dispatch,
      rowClusterInfo
    } = this.props;
    const eid = globalUtil.getCurrEnterpriseId()
    dispatch(
      routerRedux.push(`/enterprise/${eid}/importMessage?region_id=${rowClusterInfo.region_id}`)
    )
  }
  // 编辑
  handleEdit = item => {
    const { rowClusterInfo } = this.props;
    this.loadPutCluster(rowClusterInfo.region_id);
  };

  loadPutCluster = regionID => {
    const {
      dispatch,
      rowClusterInfo
    } = this.props;
    const eid = globalUtil.getCurrEnterpriseId()
    dispatch({
      type: 'region/fetchEnterpriseCluster',
      payload: {
        enterprise_id: eid,
        region_id: rowClusterInfo.region_id
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            editClusterInfo: res.bean,
            editClusterShow: true,
            text: formatMessage({ id: 'enterpriseColony.button.edit' })
          });
        }
      }
    });
  };
  cancelEditClusters = () => {
    this.props.loadClusters();
    this.setState({
      editClusterShow: false,
      text: '',
      editClusterInfo: false
    });
  };
  // 资源限额
  showRegions = () => {
    const {
      rowClusterInfo
    } = this.props;
    this.setState(
      {
        showTenantList: true,
        regionAlias: rowClusterInfo.region_alias,
        regionName: rowClusterInfo.region_name,
        showTenantListRegion: rowClusterInfo.region_id,
        loadTenants: true
      },
      this.loadRegionTenants
    );
  };
  loadRegionTenants = () => {
    const { tenantPage, tenantPageSize, showTenantListRegion } = this.state;
    const eid = globalUtil.getCurrEnterpriseId()

    const {
      dispatch,
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
  submitLimit = e => {
    e.preventDefault();
    const {
      form
    } = this.props;
    const eid = globalUtil.getCurrEnterpriseId()

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
                message: formatMessage({ id: 'notification.success.setting_successfully' })
              });
              this.setState({
                limitSummitLoading: false,
                setTenantLimitShow: false
              });
              this.loadRegionTenants();
            },
            handleError: () => {
              notification.warning({
                message: formatMessage({ id: 'notification.error.setting_failed' })
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
  setTenantLimit = item => {
    this.setState({
      setTenantLimitShow: true,
      limitTenantName: item.tenant_name,
      limitTeamName: item.team_name,
      initLimitValue: item.set_limit_memory
    });
  };
  handleTenantPageChange = page => {
    this.setState({ tenantPage: page }, this.loadRegionTenants);
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
  render() {
    const {
      buttonSwitch,
      delVisible,
      editClusterShow,
      editClusterInfo,
      text,
      tenants,
      loadTenants,
      showTenantList,
      limitSummitLoading,
      initLimitValue,
      setTenantLimitShow,
      tenantTotal,
      tenantPageSize,
      tenantPage,
      limitTeamName,
      regionAlias
    } = this.state;
    const {
      rowClusterInfo,
      form,
      showInfo = false,
      nodeType
    } = this.props;
    const {
      region_alias,
      status,
      rbd_version,
      provider,
      k8s_version,
      create_time,
      all_nodes,
      health_status,
      region_type,
      region_id,
      provider_cluster_id,
      arch
    } = rowClusterInfo
    const eid = globalUtil.getCurrEnterpriseId()
    const pagination = {
      onChange: this.handleTenantPageChange,
      total: tenantTotal,
      pageSize: tenantPageSize,
      current: tenantPage
    };
    const { getFieldDecorator } = form;
    const tenantColumns = [
      {
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.team_name' }),
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
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.memory_request' }),
        dataIndex: 'memory_request',
        align: 'center'
      },
      {
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.cpu_request' }),
        dataIndex: 'cpu_request',
        align: 'center'
      },
      {
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.set_limit_memory' }),
        dataIndex: 'set_limit_memory',
        align: 'center'
      },
      {
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.running_app_num' }),
        dataIndex: 'running_app_num',
        align: 'center'
      },
      {
        title: formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.method' }),
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
              {formatMessage({ id: 'enterpriseColony.table.handle.quota.table.label.method.btn' })}
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
      <>
        <Card
          style={
            { boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px' }
          }
        >
          {!showInfo && <Skeleton active />}
          {showInfo &&
            <>
              <Row className={styles.InfoStyle}>
                {/* logo */}
                <Col span={3}>
                  {this.clusterIcon(provider, region_type && region_type.length > 0 && region_type[0])}
                </Col>
                {/* 名称 */}
                <Col span={3}>
                  <p>{region_alias}</p>
                  <p>{formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterName' })}</p>
                </Col>
                {/* 状态 */}
                <Col span={3}>
                  <p>{this.clusterStatus(status, health_status)}</p>
                  <p>{formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterStatus' })}</p>
                </Col>
                {/* 按钮 */}
                <Col span={15}>
                  <Button
                    onClick={this.handleEdit}
                  >
                    <FormattedMessage id='enterpriseColony.table.handle.edit' />
                  </Button>
                  <Button
                    onClick={this.importEven}
                  >
                    <FormattedMessage id='enterpriseColony.table.handle.import' />
                  </Button>
                  <Button
                    onClick={this.delEven}
                  >
                    <FormattedMessage id='enterpriseColony.table.handle.delete' />
                  </Button>
                  {!buttonSwitch &&
                    <Tooltip title={formatMessage({ id: 'enterpriseColony.mgt.cluster.click' })}>
                      <Icon type="ellipsis" onClick={this.buttonShow} style={{ fontSize: 30 }} />
                    </Tooltip>
                  }
                  {buttonSwitch &&
                    <>
                      <Button
                        onClick={() => {
                          this.props.dispatch(
                            routerRedux.push(`/enterprise/${eid}/clusters/${region_id}/dashboard`)
                          )
                        }}
                      >
                        {formatMessage({ id: 'enterpriseSetting.basicsSetting.monitoring.form.label.cluster_monitor_suffix' })}
                      </Button>
                    </>
                  }
                </Col>
              </Row>
              {/* 基本信息 */}
              {health_status !== 'failure' &&
                <Row className={styles.ClusterInfo}>
                  <Descriptions >
                    <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterVs' })} span={2}>{rbd_version || "-"}</Descriptions.Item>
                    <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.mgt.cluster.clusterNum' })}>
                      <span className={styles.nodeType}>
                        {
                          nodeType &&
                            Object.keys(nodeType).length > 0 ?
                            Object.keys(nodeType).map(item => {
                              return <span>{nodeType[item]} {item} </span>
                            })
                            :
                            "-"
                        }
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.mgt.cluster.installType' })}>{(this.clusterInstallType(provider)) || "-"}</Descriptions.Item>
                    <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.mgt.cluster.kubernetesVs' })} span={2}>{k8s_version == {} ? "-" : k8s_version || "-"}</Descriptions.Item>
                    <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
                      {arch.length > 0 && arch.map((item) => {
                        return <Tag color="blue">{item}</Tag>
                      })}
                    </Descriptions.Item>
                    <Descriptions.Item label={formatMessage({ id: 'enterpriseColony.mgt.cluster.time' })}>{create_time && create_time.substr(0, 10) || "-"}</Descriptions.Item>
                  </Descriptions>
                </Row>
              }
            </>
          }
        </Card>
        {/* 删除弹框 */}
        {delVisible && (
          <ConfirmModal
            // loading={delclusterLongin}
            title={formatMessage({ id: 'confirmModal.cluster.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.cluster.desc' })}
            onOk={() => this.handleDelete(false)}
            onCancel={this.cancelClusters}
          />
        )}
        {/* 修改弹框 */}
        {editClusterShow && (
          <EditClusterInfo
            regionInfo={editClusterInfo}
            title={text}
            eid={eid}
            onOk={this.cancelEditClusters}
            onCancel={this.cancelEditClusters}
          />
        )}
      </>
    );
  }
}

export default Index;
