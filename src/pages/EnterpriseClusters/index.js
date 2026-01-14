/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable react/sort-comp */
/* eslint-disable no-underscore-dangle */
import NewbieGuiding from '@/components/NewbieGuiding';
import {
  Alert,
  Badge,
  Button,
  Icon,
  Modal,
  notification,
  Table,
  Tooltip,
  Menu,
  Dropdown
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import ScrollerX from '@/components/ScrollerX';
import EditClusterInfo from '../../components/Cluster/EditClusterInfo';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import userUtil from '../../utils/user';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import cloud from '../../utils/cloud';
import styles from "./index.less"

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
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user, enterprise } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      clusters: null,
      editClusterShow: false,
      regionInfo: false,
      text: '',
      delVisible: false,
      guideStep: 1,
      jumpSwitch: true,
      handleType: '',
      isAddClusters: false,
      clusterLoadings: true,
      licenseInfo: null,
      isNeedAuthz: false,
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
    this.handleGetEnterpriseAuthorization();
  }
  // 获取企业授权信息
  handleGetEnterpriseAuthorization = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'region/getEnterpriseLicense',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            licenseInfo: res.bean,
          });
        }
      },
      handleError: error => {
        if (error?.response?.data?.code === 400) {
          this.setState({
            licenseInfo: null,
          });
        }
      }
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
  handleDelete = (force = false) => {
    const { regionInfo, handleType } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    if (handleType === 'delete') {
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
            notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
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
    } else {
      dispatch({
        type: 'cloud/deleteKubernetesCluster',
        payload: {
          enterprise_id: eid,
          clusterID: regionInfo.provider_cluster_id,
        },
        callback: (res) => {
          if (res && res.response_data && res.response_data.code && res.response_data.code === 200) {
            this.loadClusters();
            notification.success({ message: res.response_data.msg })
          }
          this.cancelClusters();
        },
        handleError: res => {
          cloud.handleCloudAPIError(res);
          this.cancelClusters();
        }
      });
    }
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
        if (res && res.list && res.list.length > 0) {
          const clusters = [];
          res.list.map((item, index) => {
            const { region_name, enterprise_id } = item
            item.key = `cluster${index}`;
            dispatch({
              type: 'teamControl/fetchPluginUrl',
              payload: {
                enterprise_id: enterprise_id,
                region_name: region_name
              },
              callback: data => {
                if (data && data.bean) {
                  this.setState({
                    isNeedAuthz: data.bean.need_authz
                  })
                }
              }
            })
            if (!item.resource_proxy_status) {
              notification.warning({
                message: formatMessage({ id: 'utils.request.warning' }),
                description:
                  `${item.region_alias}${formatMessage({ id: 'notification.warn.proxy' })}`,
              });
            }
            clusters.push(item);
            return item;
          });
          this.setState({ clusters, clusterLoadings: false });
          globalUtil.putClusterInfoLog(eid, res.list);
        } else {
          this.setState({ clusters: [], clusterLoadings: false });
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

  delUser = (regionInfo, type) => {
    this.setState({
      delVisible: true,
      regionInfo,
      handleType: type,
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
            text: formatMessage({ id: 'enterpriseColony.button.edit' })
          });
        }
      }
    });
  };

  handleIsAddClusters = isAddClusters => {
    this.setState({
      isAddClusters
    });
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
  // 行点击事件
  onClickRow = (record) => {
    return {
      onClick: () => {
        const { jumpSwitch } = this.state;
        const {
          dispatch,
          match: {
            params: { eid }
          }
        } = this.props;
        if (jumpSwitch) {
          dispatch(routerRedux.push(`/enterprise/${eid}/clusters/ClustersMGT/${record.region_id}`));
        }
      },
    };
  }
  menuMouseEnter = () => {
    this.setState({
      jumpSwitch: false
    })
  }
  menuMouseLeave = () => {
    this.setState({
      jumpSwitch: true
    })
  }
  render() {
    const {
      delclusterLongin,
      match: {
        params: { eid }
      },
      clusterLoading
    } = this.props;
    const {
      clusters,
      text,
      regionInfo,
      delVisible,
      guideStep,
      handleType,
      isAddClusters,
      licenseInfo,
      clusterLoadings,
      isNeedAuthz
    } = this.state;
    const region_nums = (licenseInfo && licenseInfo.expect_cluster) || 0;
    const isAdd = region_nums === -1 ? false : region_nums <= (clusters && clusters.length);
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );
    const colorbj = (color, bg) => {
      return {
        color,
        background: bg,
        borderRadius: '15px',
        padding: '2px 0'
      };
    };

    const columns = [
      {
        // title: '名称',
        title: <span>{formatMessage({ id: 'table.tr.name' })}{<Tooltip placement="top" title={formatMessage({ id: 'enterpriseColony.mgt.cluster.intomgt' })}><span className={styles.nameStyle}>{pageheaderSvg.getSvg('helpSvg', 18)}</span></Tooltip>}</span>,
        dataIndex: 'region_alias',
        align: 'center',
        width: 120,
        render: (val, row) => {
          return (
            <Link to={`/enterprise/${eid}/clusters/ClustersMGT/${row.region_id}`} className={styles.linkStyle}>
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
                  <FormattedMessage id='enterpriseColony.table.custom' />
                </span>
              );
            case 'rke':
              return (
                <Tooltip title={<FormattedMessage id='enterpriseColony.table.rke.tooltip' />}>
                  <span style={{ marginRight: '8px' }} key={item}>
                    {/* 基于主机自建 */}
                    <FormattedMessage id='enterpriseColony.table.rke' />
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
                  <FormattedMessage id='enterpriseColony.table.helm' />
                </span>
              );
            default:
              return (
                <span style={{ marginRight: '8px' }} key={item}>
                  {/* 直接对接 */}
                  <FormattedMessage id='enterpriseColony.table.other' />
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
            <span
            >
              {this.handlUnit(item.used_memory)}/
              {this.handlUnit(item.total_memory)}
            </span>
          );
        }
      },
      {
        // title: '内存(GB)',
        title: 'CPU(Core)',
        dataIndex: 'total_cpu',
        align: 'center',
        width: 80,
        render: (_, item) => {
          return (
            <span>{item.used_cpu}/{item.total_cpu}</span>
          );
        }
      },
      {
        // title: '版本',
        title: formatMessage({ id: 'table.tr.versions' }),
        dataIndex: 'rbd_version',
        align: 'center',
        width: 180,
        render: val => {
          if (val.length == 0) {
            return "-"
          } else {
            return val
          }
        }
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
              <FormattedMessage id='enterpriseColony.table.state.err' />
            </span>;
          }
          switch (val) {
            case '0':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  {/* 编辑中 */}
                  <FormattedMessage id='enterpriseColony.table.state.edit' />
                </div>
              );
            case '1':
              return (
                <div style={colorbj('#52c41a', '#e9f8e2')}>
                  <Badge color="#52c41a" />
                  {/* 运行中 */}
                  <FormattedMessage id='enterpriseColony.table.state.run' />
                </div>
              );
            case '2':
              return (
                <div style={colorbj('#b7b7b7', '#f5f5f5')}>
                  <Badge color="#b7b7b7" />
                  {/* 已下线 */}
                  <FormattedMessage id='enterpriseColony.table.state.down' />
                </div>
              );

            case '3':
              return (
                <div style={colorbj('#1890ff', '#e6f7ff')}>
                  <Badge color="#1890ff" />
                  {/* 维护中 */}
                  <FormattedMessage id='enterpriseColony.table.state.maintain' />
                </div>
              );
            case '5':
              return (
                <div style={colorbj('#fff', '#f54545')}>
                  <Badge color="#fff" />
                  {/* 异常 */}
                  <FormattedMessage id='enterpriseColony.table.state.abnormal' />
                </div>
              );
            default:
              return (
                <div style={colorbj('#fff', '#ffac38')}>
                  <Badge color="#fff" />
                  {/* 未知 */}
                  <FormattedMessage id='enterpriseColony.table.state.unknown' />
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
        width: 50,
        render: (_, item) => {
          const mlist = [
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              <FormattedMessage id='enterpriseColony.table.handle.edit' />
              {/* 编辑 */}
            </a>,
            <Link
              to={`/enterprise/${eid}/importMessage?region_id=${item.region_id}`}
            >
              <FormattedMessage id='enterpriseColony.table.handle.import' />
              {/* 导入 */}
            </Link>
          ];
          if (item.scope != 'default') {
            mlist.push(
              <a onClick={() => { this.delUser(item, 'delete'); }}>
                <FormattedMessage id='enterpriseColony.table.handle.delete' />
                {/* 删除 */}
              </a>
            );
          }
          const MenuList = (
            <Menu
              onMouseEnter={this.menuMouseEnter}
              onMouseLeave={this.menuMouseLeave}
            >
              {mlist.map(item => {
                return <Menu.Item>
                  {item}
                </Menu.Item>
              })}
            </Menu>
          )
          return <Dropdown
            overlay={MenuList}
            placement="bottomLeft"
          >
            <Icon component={moreSvg} style={{ width: '100%' }} />
          </Dropdown>;
        }
      }
    ];

    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseColony.PageHeaderLayout.title' />}
        content={<FormattedMessage id='enterpriseColony.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getPageHeaderSvg('clusters', 20)}
      >
        <ScrollerX sm={1150}>
          {/* 第一行：按钮区域靠右 */}
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <div
              style={{
                display: 'inline-block',
                height: '40px',
                width: '120px',
                textAlign: 'center'
              }}
              onMouseLeave={() => {
                this.handleIsAddClusters(false);
              }}
              onMouseEnter={() => {
                this.handleIsAddClusters(isNeedAuthz && isAdd);
              }}
            >
              <Tooltip
                title={`当前集群数量达到授权的最大值（授权最大集群数），请联系好雨商务获取更多授权`}
                visible={isAddClusters}
              >
                <Link to={`/enterprise/${eid}/addCluster`}>
                  <Button type="primary" disabled={isNeedAuthz && (isAdd || clusterLoadings)} icon="plus" >
                    <FormattedMessage id='enterpriseColony.button.text' />
                  </Button>
                </Link>
              </Tooltip>
            </div>
            <Button
              style={{ marginLeft: '22px' }}
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
                tit: formatMessage({ id: 'enterpriseColony.guideStep.title' }),
                desc: formatMessage({ id: 'enterpriseColony.guideStep.desc' }),
                nextStep: 2,
                configName: 'addCluster',
                isSuccess: false,
                conPosition: { right: '100px', bottom: '-180px' },
                svgPosition: { right: '170px', marginTop: '-11px' }
              })}
          </div>
          {/* 第二行：提示信息 */}
          <Alert
            style={{ marginBottom: '16px' }}
            message={<FormattedMessage id='enterpriseColony.alert.message' />}
          />
          {/* 第三行：表格 */}
          <Table
            rowKey={(record, index) => index}
            loading={clusterLoading}
            dataSource={clusters}
            columns={columns}
            pagination={false}
            onRow={this.onClickRow}
            rowClassName={styles.rowStyle}
          />
        </ScrollerX>
        {/* 模态框 */}
        {delVisible && (
          <ConfirmModal
            loading={delclusterLongin}
            title={handleType === 'delete' ? formatMessage({ id: 'confirmModal.cluster.delete.title' }) : formatMessage({ id: 'confirmModal.cluster.unload.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={handleType === 'delete' ? formatMessage({ id: 'confirmModal.delete.cluster.desc' }) : formatMessage({ id: 'confirmModal.unload.cluster.desc' })}
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
      </PageHeaderLayout>
    );
  }
}
