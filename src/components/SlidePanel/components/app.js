import React, { Component } from 'react'
import PageHeader from '../../ComponentPageHeader'
import EditGroupName from '@/components/AddOrEditGroup';
import ApplicationGovernance from '@/components/ApplicationGovernance';
import AppDirector from '@/components/AppDirector';
import globalUtil from '@/utils/global';
import { notification, Button, Dropdown, Menu, Icon, Tag, Modal, Divider, Row, Col, Tooltip } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { buildApp } from '../../../services/createApp';
import VisterBtn from '../../../components/visitBtnForAlllink';
import AppDeteleResource from '../../../components/AppDeteleResource'
import RapidCopy from '../../../components/RapidCopy';
import cookie from '../../../utils/cookie';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AppState from '../../../components/ApplicationState';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import AddServiceComponent from '../../../pages/Group/AddServiceComponent';
import sourceUtil from '../../../utils/source-unit';
import moment from 'moment';
import styles from './app.less';
@connect(({ user, application, teamControl, enterprise, loading, global }) => ({
  buildShapeLoading: loading.effects['global/buildShape'],
  editGroupLoading: loading.effects['application/editGroup'],
  deleteLoading: loading.effects['application/deleteGroupAllResource'],
  currUser: user.currentUser,
  apps: application.apps,
  groupDetail: application.groupDetail || {},
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  novices: global.novices
}))
export default class app extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permissions: props.permissions,
      componentTimer: true,
      archInfo: [],
      upgradableNumLoading: true,
      upgradableNum: 0,
      resourceList: [],
      resources: [],
      appStatusConfig: false,
      currApp: {},
      linkList: [],
      jsonDataLength: 0,
      serviceIds: [],
      service_alias: [],
      promptModal: false,
      code: '',
      rapidCopy: false,
      toDelete: false,
      toDeleteResource: false,
      addComponentOrAppDetail: props.addComponentOrAppDetail,
      isExiting: false,
      customSwitch: false,
      toEditAppDirector: false
    };
  }
  componentDidMount() {
    this.loading();
    this.handleArchCpuInfo();
    this.handleWaitLevel();
    this.handleGroupAllResource()
  }
  loading = () => {
    this.fetchAppDetail();
    this.loadTopology(true);
    this.fetchAppDetailState();
    this.getOperator();
  };
  componentWillUnmount() {
    this.closeTimer();
  }
  // 获取集群架构信息
  handleArchCpuInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchArchOverview',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            archInfo: res.list
          })
        }
      }
    });
  }
  handleWaitLevel = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchToupgrade',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: globalUtil.getAppID()
      },
      callback: res => {
        const info = (res && res.bean) || {};
        this.setState({
          upgradableNumLoading: false,
          upgradableNum: (info && info.upgradable_num) || 0
        });
      }
    });
  };
  handleGroupAllResource = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'application/fetchGroupAllResource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: globalUtil.getAppID()
      },
      callback: res => {
        this.setState({
          resourceList: res.bean
        })
      }
    })
  }
  fetchAppDetail = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: globalUtil.getAppID()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            currApp: res.bean
          });
        }
      },
      handleError: res => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        if (res && res.code === 404) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };
  fetchAppDetailState = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchAppDetailState',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: globalUtil.getAppID()
      },
      callback: res => {
        this.setState({
          resources: res.list,
          appStatusConfig: true
        });
      }
    });
  };
  getOperator = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/getOperator',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: globalUtil.getAppID(),
      },
      callback: data => {
        if (data && data.status_code == 200) {
          const arr = data.list.service
          if (arr && arr.length > 0) {
            arr.map((item) => {
              if (item.static) {
                dispatch({
                  type: 'createApp/createThirdPartyServices',
                  payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    group_id: globalUtil.getAppID(),
                    service_cname: item.name,
                    endpoints_type: "static",
                    k8s_component_name: item.name,
                    static: item.address
                  },
                  callback: res => {
                    if (res && res.status_code == 200) {
                      const appAlias = res.bean.service_alias;
                      if (appAlias.length > 0) {
                        buildApp({
                          team_name: globalUtil.getCurrTeamName(),
                          app_alias: appAlias,
                          is_deploy: true,
                        })
                      }
                    }
                  }
                })
              } else {
                dispatch({
                  type: 'createApp/createThirdPartyServices',
                  payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    group_id: globalUtil.getAppID(),
                    service_cname: item.name,
                    endpoints_type: "kubernetes",
                    k8s_component_name: item.name,
                    namespace: item.namespace,
                    serviceName: item.service,
                  },
                  callback: res => {
                    if (res && res.status_code == 200) {
                      const appAlias = res.bean.service_alias;
                      if (appAlias) {
                        buildApp({
                          team_name: globalUtil.getCurrTeamName(),
                          app_alias: appAlias,
                          is_deploy: true,
                        })
                      }
                    }
                  }
                })
              }
            })
          }
        }
      }
    });
  };
  loadTopology(isCycle) {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);

    dispatch({
      type: 'global/fetAllTopology',
      payload: {
        region_name: regionName,
        team_name: teamName,
        groupId: globalUtil.getAppID()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const data = res.bean;
          if (JSON.stringify(data) === '{}') {
            return;
          }
          const serviceIds = [];
          const service_alias = [];
          const { json_data } = data;
          Object.keys(json_data).map(key => {
            serviceIds.push(key);
            if (
              json_data[key].cur_status == 'running' &&
              json_data[key].is_internet == true
            ) {
              service_alias.push(json_data[key].service_alias);
            }
          });

          this.setState(
            {
              jsonDataLength: Object.keys(json_data).length,
              service_alias,
              serviceIds
            },
            () => {
              this.loadLinks(service_alias.join('-'), isCycle);
            }
          );
        }
      }
    });
  }
  loadLinks(serviceAlias, isCycle) {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/queryLinks',
      payload: {
        service_alias: serviceAlias,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              linkList: res.list || []
            },
            () => {
              if (isCycle) {
                this.handleTimers(
                  'timer',
                  () => {
                    this.fetchAppDetailState();
                    this.fetchAppDetail();
                    this.loadTopology(true);
                    this.getOperator();
                  },
                  10000
                );
                setTimeout(() => {
                  this.checkPermissions();
                }, 100)
              }
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          'timer',
          () => {
            this.fetchAppDetailState();
            this.fetchAppDetail();
            this.loadTopology(true);
            this.getOperator();
          },
          20000
        );
      }
    });
  }
  handleError = err => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: formatMessage({ id: 'notification.warn.error' }),
        description: err.data.msg_show
      });
    }
  };
  handleTimers = (timerName, callback, times) => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  // 根据权限判断是否显示
  checkPermissions() {
    const {
      jsonDataLength,
      resources,
      linkList,
      serviceIds,
      resourceList
    } = this.state;
    const {
      isSlidePanel,
      permissions: {
        componentPermissions: {
          isAccess,
          isCreate,
          isDelete,
          isStart,
          isStop,
          isUpdate,
          isEdit,
          isConstruct,
          isCopy
        },
        appPermissions: {
          isAppOverview,
          isAppRelease,
          isAppUpgrade,
          isAppGatewayMonitor,
          isAppRouteManage,
          isAppTargetServices,
          isAppCertificate,
          isAppResources,
          isAppConfigGroup,
        }
      },
    } = this.props;
    const BtnDisabled = !(jsonDataLength > 0);
    const allOperations = [
      {
        key: 'addComponent',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.addComponent" defaultMessage="添加组件" />,
        show: isCreate && !isSlidePanel,
        disabled: false,
        onClick: () => this.handleOpenAddComponentOrAppDetail('addComponent')
      },
      {
        key: 'appDetail',
        type: 'button',
        text: <FormattedMessage id="appOverview.app_detail" defaultMessage="应用详情" />,
        show: !isSlidePanel,
        disabled: false,
        onClick: () => this.handleOpenAddComponentOrAppDetail('appDetail')
      },
      {
        key: 'visitor',
        show: linkList && linkList.length > 0,
        type: 'component', // 特殊标识组件类型
        component: <VisterBtn linkList={linkList} type={!isSlidePanel ? 'default' : 'primary'} /> // 直接传入组件
      },
      {
        key: 'update',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.update" defaultMessage="更新" />,
        show: isUpdate && resources.status !== 'CLOSED',
        onClick: () => this.handleTopology('upgrade'),
        disabled: BtnDisabled
      },
      {
        key: 'build',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.build" defaultMessage="构建" />,
        show: isConstruct,
        onClick: () => this.handleTopology('deploy'),
        disabled: BtnDisabled
      },
      {
        key: 'copy',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.copy" defaultMessage="复制" />,
        show: isCopy,
        disabled: BtnDisabled,
        onClick: () => this.handleOpenRapidCopy()
      },
      {
        key: 'start',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.start" defaultMessage="启动" />,
        show: resources.status && resources.status !== 'STARTING' && resources.status !== 'RUNNING' && serviceIds && serviceIds.length > 0 && isStart,
        disabled: BtnDisabled,
        onClick: () => this.handleTopology('start')
      },
      {
        key: 'restart',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.restart" defaultMessage="重启" />,
        show: resources.status && (resources.status === 'ABNORMAL' || resources.status === 'PARTIAL_ABNORMAL') && serviceIds && serviceIds.length > 0 && isUpdate,
        disabled: BtnDisabled,
        onClick: () => this.handleTopology('restart')
      },
      // stop
      {
        key: 'stop',
        type: 'button',
        text: <FormattedMessage id="appOverview.btn.stop" defaultMessage="停止" />,
        show: resources.status && resources.status !== 'CLOSED' && resources.status !== 'STOPPING' && isStop,
        disabled: BtnDisabled,
        onClick: () => this.handleTopology('stop')
      },
      {
        key: 'delete',
        type: 'button',
        text: <FormattedMessage id="appOverview.list.table.delete" defaultMessage="删除" />,
        show: isDelete,
        disabled: BtnDisabled,
        onClick: () => this.toDelete()
      }
    ]
    const availableOperations = allOperations.filter(op => op.show);
    return this.renderOperations(availableOperations);
  }
  // 渲染操作按钮
  renderOperations(operations) {
    let content = [];
    // 处理按钮逻辑
    if (operations.length <= 4) {
      content = operations.map((op, index) => (
        op.type === 'button' ? (
          <Button
            type={index === 0 ? "primary" : "default"}
            key={op.key}
            onClick={op.onClick}
            disabled={op.disabled}
            style={{ marginRight: 8 }}
          >
            {op.text}
          </Button>
        ) : (
          <span key={op.key} style={{ marginLeft: 8 }}>
            {op.component}
          </span>
        )
      ));
    } else {
      const mainButtons = operations.slice(0, 3);
      const dropdownButtons = operations.slice(3);
      const menu = (
        <Menu>
          {dropdownButtons.map(op => (
            <Menu.Item
              key={op.key}
              onClick={op.onClick}
              disabled={op.disabled}
            >
              {op.text}
            </Menu.Item>
          ))}
        </Menu>
      );

      content = [
        ...mainButtons.map((op, index) => (
          op.type === 'button' ? (
            <Button
              type={index === 0 ? "primary" : "default"}
              key={op.key}
              onClick={op.onClick}
              disabled={op.disabled}
              style={{ marginRight: 8 }}
            >
              {op.text}
            </Button>
          ) : (
            <span key={op.key} style={{ marginRight: 8 }}>
              {op.component}
            </span>
          )
        )),
        <Dropdown key="more" overlay={menu}>
          <Button>
            {formatMessage({ id: 'versionUpdata_6_2.more' })} <Icon type="down" />
          </Button>
        </Dropdown>
      ];
    }
    return content;
  }
  toEdit = () => {
    this.setState({ toEdit: true });
  };

  cancelEdit = () => {
    this.setState({ toEdit: false });
  };
  handleEdit = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/editGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: globalUtil.getAppID(),
        group_name: vals.group_name,
        note: vals.note,
        username: vals.username,
        logo: vals.logo,
        k8s_app: vals.k8s_app
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.change' }) });
          dispatch({
            type: 'application/editGroups',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              group_id: globalUtil.getAppID()
            },
            callback: res => {
              notification.success({ message: formatMessage({ id: 'notification.success.takeEffect' }) });
            }
          });
        }
        this.handleUpDataHeader();
        this.cancelEdit();
        this.cancelEditAppDirector();
        this.fetchAppDetail();
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });
      }
    });
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
    });
  };
  /** 构建拓扑图 */
  handleTopology = code => {
    this.setState({
      promptModal: true,
      code
    });
  };
  handlePromptModalClose = () => {
    this.setState({
      promptModal: false,
      code: ''
    });
  };
  handlePromptModalOpen = () => {
    const { code, serviceIds } = this.state;
    const { dispatch } = this.props;
    if (code === 'restart') {
      batchOperation({
        action: code,
        team_name: globalUtil.getCurrTeamName(),
        serviceIds: serviceIds && serviceIds.join(',')
      }).then(res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: formatMessage({ id: 'notification.success.reboot_success' })
          });
          this.handlePromptModalClose();
        }
        this.loadTopology(false);
      });
    } else {
      dispatch({
        type: 'global/buildShape',
        payload: {
          tenantName: globalUtil.getCurrTeamName(),
          group_id: globalUtil.getAppID(),
          action: code
        },
        callback: res => {
          if (res && res.status_code === 200) {
            notification.success({
              message: res.msg_show || formatMessage({ id: 'notification.success.build_success' }),
              duration: '3'
            });
            this.handlePromptModalClose();
          }
          this.loadTopology(false);
        }
      });
    }
  };
  handleOpenRapidCopy = () => {
    this.setState({
      rapidCopy: true
    });
  };

  handleCloseRapidCopy = () => {
    this.setState({
      rapidCopy: false
    });
  };
  toDelete = () => {
    this.closeComponentTimer();
    this.setState({ toDelete: true });
  };
  toDeleteResource = () => {
    this.setState({ toDeleteResource: true });
  };

  cancelDelete = (isOpen = true) => {
    this.setState({ toDelete: false, toDeleteResource: false });
  };
  closeComponentTimer = () => {
    this.setState({ componentTimer: false });
    this.closeTimer();
  };
  handleDelete = () => {
    this.setState({ toDeleteResource: true });
  };
  cancelDeleteResource = () => {
    this.setState({ toDeleteResource: false });
  };
  handleOpenAddComponentOrAppDetail = (type) => {
    if (type === 'addComponent') {
      const { dispatch } = this.props;
      dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${globalUtil.getAppID()}&type=app`
        )
      );
    } else {
      this.props?.handleAddComponentOrAppDetail(type);
      this.setState({
        addComponentOrAppDetail: type
      });
    }
  };

  handleClose = () => {
    this.setState({ isExiting: true });
    this.props?.handleAddComponentOrAppDetail('');
    setTimeout(() => {
      this.setState({
        isExiting: false,
        addComponentOrAppDetail: ''
      });
    }, 400);
  }
  onCancel = () => {
    this.setState({
      customSwitch: false
    });
  };
  handleSwitch = () => {
    this.setState({
      customSwitch: true
    });
  };
  handleToEditAppDirector = () => {
    this.setState({ toEditAppDirector: true });
  };
  cancelEditAppDirector = () => {
    this.setState({ toEditAppDirector: false });
  };
  handleJump = target => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/${target}`
      )
    );
  };
  // 高级设置按钮
  handleAdvancedSettings = () => {
    const {
      permissions: {
        appPermissions: {
          isAppOverview,
          isAppRelease,
          isAppUpgrade,
          isAppGatewayMonitor,
          isAppRouteManage,
          isAppTargetServices,
          isAppCertificate,
          isAppResources,
          isAppConfigGroup,
        },
      }
    } = this.props;
    const allOperations = [
      {
        type: 'button',
        key: 'isAppRelease',
        text: formatMessage({ id: 'menu.app.publish' }),
        onClick: () => this.handleJump('publish'),
        disabled: !isAppRelease
      },
      {
        type: 'button',
        key: 'isAppGatewayMonitor',
        text: formatMessage({ id: 'menu.app.gateway' }),
        onClick: () => this.handleJump('gateway'),
        disabled: !(isAppGatewayMonitor || isAppRouteManage || isAppTargetServices || isAppCertificate)
      },
      {
        type: 'button',
        key: 'isAppUpgrade',
        text: formatMessage({ id: 'menu.app.upgrade' }),
        onClick: () => this.handleJump('upgrade'),
        disabled: !isAppUpgrade
      },
      {
        type: 'button',
        key: 'isAppResources',
        text: formatMessage({ id: 'menu.app.k8s' }),
        onClick: () => this.handleJump('asset'),
        disabled: !isAppResources
      },
      {
        type: 'button',
        key: 'isAppConfigGroup',
        text: formatMessage({ id: 'menu.app.configgroups' }),
        onClick: () => this.handleJump('configgroups'),
        disabled: !isAppConfigGroup
      }
    ]
    // 根据权限过滤按钮
    const filteredOperations = allOperations.filter(op => {
      if (op.disabled) {
        return this.props[op.key];
      }
      return true;
    });
    // 如果按钮数量大于1，则显示下拉菜单
    if (filteredOperations.length > 1) {
      return (
        <Dropdown overlay={<Menu>
          {filteredOperations.map(op => (
            <Menu.Item key={op.key} onClick={op.onClick}>{op.text}</Menu.Item>  
          ))}
        </Menu>}
        >
          <Button style={{ marginLeft: 10 }}>
            {formatMessage({ id: 'teamNewGateway.NewGateway.RouteDrawer.senior' })}
            <Icon type="down" />
          </Button>
        </Dropdown>
      );
    }
    return (
      <>
        {filteredOperations.map(op => (
          <Button key={op.key} onClick={op.onClick} style={{ marginLeft: 10 }}>{op.text}</Button>
        ))} 
      </>
    );
  };
  render() {
    const {
      currApp,
      resources,
      promptModal,
      toEdit,
      rapidCopy,
      toDelete,
      toDeleteResource,
      resourceList,
      code,
      addComponentOrAppDetail,
      isExiting,
      customSwitch,
      toEditAppDirector,
      upgradableNumLoading,
      upgradableNum
    } = this.state;
    const {
      deleteLoading,
      buildShapeLoading,
      editGroupLoading,
      groupDetail,
      permissions: {
        componentPermissions: {
          isEdit
        },
        appPermissions: {
          isAppOverview,
          isAppRelease,
          isAppUpgrade,
          isAppGatewayMonitor,
          isAppRouteManage,
          isAppTargetServices,
          isAppCertificate,
          isAppResources,
          isAppConfigGroup,
        },
      }
    } = this.props;
    const codeObj = {
      start: formatMessage({ id: 'appOverview.btn.start' }),
      restart: formatMessage({ id: 'appOverview.list.table.restart' }),
      stop: formatMessage({ id: 'appOverview.btn.stop' }),
      deploy: formatMessage({ id: 'appOverview.btn.build' }),
      upgrade: formatMessage({ id: 'appOverview.btn.update' }),
    };
    return (
      <div className={styles.container}>
        <div className={styles.header_container}>
          <div className={styles.header_left}>
            <div className={styles.header_left_title}>
              <div className={styles.header_left_title_icon}>
                {pageheaderSvg.getSvg('apphome', 22)}
              </div>
              <div className={styles.header_left_title_name}>
                {currApp.group_name || '-'}
              </div>
              {isEdit &&
                <Icon
                  style={{
                    cursor: 'pointer',
                    marginLeft: '5px',
                    marginRight: '12px'
                  }}
                  onClick={this.toEdit}
                  type="edit"
                />
              }
              <AppState AppStatus={resources.status} />
              {currApp.app_arch &&
                currApp.app_arch.length > 0 &&
                currApp.app_arch.map((item) => {
                  return <Tag>{item}</Tag>
                })}
            </div>
          </div>
          <div className={styles.header_right}>
            {this.checkPermissions()}
            {this.handleAdvancedSettings()}
          </div>
        </div>
        {addComponentOrAppDetail && (
          <div
            className={`${styles.content_container} ${styles.animatedContainer} ${isExiting ? styles.exit : ''}`}
            style={{ width: '100%', height: 'calc(100vh - 60px)' }}
          >
            <Button onClick={this.handleClose} style={{ position: 'absolute', top: 12, right: 6, zIndex: 9999 }} type='link'>
              <Icon type="close" style={{ fontSize: 20 }} />
            </Button>

            {addComponentOrAppDetail === 'appDetail' && (
              <div className={styles.app_detail_container}>
                <Row>
                  <Col span={6}>
                    <span>{formatMessage({ id: 'appOverview.createTime' })}:</span>
                    <span>
                      {currApp.create_time
                        ? moment(currApp.create_time)
                          .locale('zh-cn')
                          .format('YYYY-MM-DD HH:mm:ss')
                        : '-'}
                    </span>
                  </Col>
                  <Col span={6}>
                    <span>{formatMessage({ id: 'appOverview.updateTime' })}:</span>
                    <span>
                      {currApp.update_time
                        ? moment(currApp.update_time)
                          .locale('zh-cn')
                          .format('YYYY-MM-DD HH:mm:ss')
                        : '-'}
                    </span>
                  </Col>
                  <Col span={6}>
                    <span>{formatMessage({ id: 'appOverview.govern' })}:</span>
                    <span>
                      {currApp.governance_mode && (currApp.governance_mode === 'BUILD_IN_SERVICE_MESH' || currApp.governance_mode === 'KUBERNETES_NATIVE_SERVICE')
                        ? globalUtil.fetchGovernanceMode(currApp.governance_mode)
                        : currApp.governance_mode}
                    </span>
                    {currApp.governance_mode && isEdit && (
                      <a style={{ marginLeft: '5px' }} onClick={this.handleSwitch}>
                        {formatMessage({ id: 'appOverview.btn.change' })}
                      </a>
                    )}
                  </Col>
                  <Col span={6}>
                    <span>{formatMessage({ id: 'appOverview.principal' })}:</span>
                    <span>
                      {currApp.principal ? (
                        <Tooltip
                          placement="top"
                          title={
                            <div>
                              <div>{formatMessage({ id: 'appOverview.principal.username' })}{currApp.username}</div>
                              <div>{formatMessage({ id: 'appOverview.principal.principal' })}{currApp.principal}</div>
                              <div>{formatMessage({ id: 'appOverview.principal.email' })}{currApp.email}</div>
                            </div>
                          }
                        >
                          <span style={{ color: globalUtil.getPublicColor('rbd-sub-title-color') }}>
                            {currApp.principal}
                          </span>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                      {isEdit && (
                        <Icon
                          style={{
                            cursor: 'pointer',
                            marginLeft: '5px',
                            color: globalUtil.getPublicColor()
                          }}
                          onClick={this.handleToEditAppDirector}
                          type="edit"
                        />
                      )}
                    </span>
                  </Col>
                </Row>
                <Divider orientation="left"></Divider>
                <div className={styles.app_detail_container_row}>
                  <div>
                    <div>{formatMessage({ id: 'appOverview.memory' })}</div>
                    <div>
                      <p>
                        {`${resources.memory < 1024 ? resources.memory : resources.memory / 1024}`}
                        <span>{resources.memory < 1024 ? 'MB' : 'GB'}</span>
                      </p>
                      <div className={styles.app_detail_container_row_memory_progress_img}>
                        <svg t="1743404046621" class="icon" viewBox="0 0 1152 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="25308" width="50" height="50">
                          <path d="M1152.007931 191.991447V64.070516A60.464968 60.464968 0 0 0 1088.046966 0.10755H64.069516A60.464968 60.464968 0 0 0 0.10755 64.070516V191.990447H64.070516v63.961966H0.10755v703.914621a60.464968 60.464968 0 0 0 63.961966 63.960966h191.883897V895.907069h63.960965v127.921931h768.089588a60.464968 60.464968 0 0 0 63.960965-63.959966V255.952413h-63.960965V191.990447zM512.054275 959.996034h-63.961966V832.073103h63.961966v127.922931z m127.921931 0h-63.960965V832.073103h63.960965z m127.922932 0h-63.960966V832.073103h63.960966z m127.922931 0H831.860103V832.073103h63.961966z m0-255.844862h-639.869656a60.464968 60.464968 0 0 1-63.959966-63.960966V256.422412a60.464968 60.464968 0 0 1 63.959966-63.961965h640.039656a60.464968 60.464968 0 0 1 63.960965 63.961965V640.190206a60.464968 60.464968 0 0 1-63.959965 63.832966z m127.921931 255.844862h-63.960966V832.073103h63.960966z" p-id="25309" fill={globalUtil.getPublicColor()}>
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>{formatMessage({ id: 'appOverview.cpu' })}</div>
                    <div>
                      <p>
                        {(resources.cpu && resources.cpu / 1000) || 0}
                        <span>Core</span>
                      </p>
                      <div className={styles.app_detail_container_row_cpu_progress_img}>
                        <svg t="1743403966601" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="22400" width="50" height="50">
                          <path d="M1024 339.2V256h-83.2V172.8c0-44.8-38.4-83.2-83.2-83.2H768V0h-83.2v83.2h-128V0H467.2v83.2h-128V0H256v83.2H172.8c-44.8 0-83.2 38.4-83.2 83.2V256H0v83.2h83.2v128H0v83.2h83.2v128H0V768h83.2v83.2c0 44.8 38.4 83.2 83.2 83.2H256V1024h83.2v-83.2h128V1024h83.2v-83.2h128V1024H768v-83.2h83.2c44.8 0 83.2-38.4 83.2-83.2V768H1024v-83.2h-83.2v-128H1024V467.2h-83.2v-128H1024z m-172.8 512H172.8V172.8h684.8v678.4h-6.4zM300.8 768h428.8c25.6 0 44.8-19.2 44.8-44.8V300.8c-6.4-25.6-25.6-44.8-51.2-44.8H300.8c-25.6 0-44.8 19.2-44.8 44.8v428.8c0 19.2 19.2 38.4 44.8 38.4z" fill={globalUtil.getPublicColor()} p-id="22401">
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>{formatMessage({ id: 'appOverview.disk' })}</div>
                    <div>
                      <p>
                        {`${resources.disk < 1024 ? resources.disk : resources.disk / 1024}`}
                        <span>{resources.disk < 1024 ? 'MB' : 'GB'}</span>
                      </p>
                      <div className={styles.app_detail_container_row_disk_progress_img}>
                        <svg t="1743403446443" class="icon" viewBox="0 0 1335 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8371" width="50" height="50">
                          <path d="M250.434783 1024h834.782608C1223.546435 1024 1335.652174 909.401043 1335.652174 768H0C0 909.401043 112.105739 1024 250.434783 1024z m834.782608-170.651826h83.478261v85.303652h-83.478261v-85.303652zM1252.173913 0H83.478261L0 682.651826h1335.652174L1252.173913 0z" fill={globalUtil.getPublicColor()} p-id="8372">
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>{formatMessage({ id: 'appOverview.componentNum' })}</div>
                    <div>
                      <p>
                        {currApp.service_num || 0}
                        <span>个</span>
                      </p>
                      <div className={styles.app_detail_container_row_component_num_progress_img}>
                        <svg t="1743403832764" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20375" width="50" height="50">
                          <path d="M914.5 653.5c-5.5 0-11 1.1-16 3.3l-0.2 0.1h-0.2L510.2 822.2 122.2 657h-0.2l-0.2-0.1c-5-2.1-10.3-3.3-16-3.3-23.1 0-41.8 19.3-41.8 43.1 0 18 10.7 33.3 25.8 39.8l403.9 172.1 0.4 0.1c10.2 4.4 21.8 4.4 32 0l0.2-0.1c0.1 0 0.1-0.1 0.2-0.1l403.9-172.1c15.1-6.5 25.8-21.8 25.8-39.8 0.1-23.8-18.6-43.1-41.7-43.1z m0-186.5c-7.9-0.2-16 3.2-16 3.2L510.2 635.6 121.8 470.2s-10.3-3.2-16-3.2C82.7 467 64 486.2 64 510c0 17.9 10.7 33.3 25.8 39.7l403.9 172c0.1 0 0.1 0.1 0.2 0.1l0.1 0.1c5 2.1 10.3 3.3 16 3.3 5.7 0 11.1-1.2 16-3.3l0.2-0.1c0.1 0 0.1 0 0.2-0.1l403.9-172c15.1-6.4 25.8-21.8 25.9-39.7 0.1-23.8-18.6-43-41.7-43zM89.8 363.2l403.9 172.1c0.1 0 0.1 0 0.2 0.1l0.1 0.1c5 2.1 10.3 3.2 16 3.2 5.5 0 10.9-1.1 16-3.2l0.2-0.1 0.2-0.1 403.9-172c15.1-6.5 25.8-21.8 25.9-39.7 0-18-10.7-33.3-25.8-39.8L526.5 111.6c-0.1 0-0.1 0-0.2-0.1l-0.2-0.1c-10.2-4.4-21.8-4.4-32 0l-0.1 0.1L89.8 283.7C74.7 290.1 64 305.5 64 323.5c0 17.9 10.7 33.2 25.8 39.7z" fill={globalUtil.getPublicColor()} p-id="20376">
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <Divider orientation="left"></Divider>
                <div className={styles.app_resource_container}>
                  <div
                    onClick={() => {
                      isAppResources && this.handleJump('asset');
                    }}>
                    <p>{formatMessage({ id: 'appOverview.k8s' })}</p>
                    <h6>{currApp.resources_num || 0}</h6>
                  </div>
                  <div
                    onClick={() => {
                      isAppRelease && this.handleJump('publish');
                    }}>
                    <p>{formatMessage({ id: 'appOverview.modelRelease' })}</p>
                    <h6>{currApp.share_num || 0}</h6>
                  </div>
                  <div
                    onClick={() => {
                      (isAppGatewayMonitor || isAppRouteManage || isAppTargetServices || isAppCertificate) && this.handleJump('gateway');
                    }}>
                    <p>{formatMessage({ id: 'appOverview.gateway' })}</p>
                    <h6>{currApp.ingress_num || 0}</h6>
                  </div>
                  <div
                    onClick={() => {
                      !upgradableNumLoading &&
                        isAppUpgrade &&
                        this.handleJump('upgrade');
                    }}>
                    <p>{formatMessage({ id: 'appOverview.upgrade' })}</p>
                    <h6>{upgradableNumLoading ? <Spin /> : upgradableNum}</h6>
                  </div>
                  <div
                    onClick={() => {
                      isAppConfigGroup && this.handleJump('configgroups');
                    }}>
                    <p>{formatMessage({ id: 'appOverview.config' })}</p>
                    <h6>{currApp.config_group_num || 0}</h6>
                  </div>
                </div>
              </div>
            )}
            {addComponentOrAppDetail === 'addComponent' && (
              <div className={styles.add_component_container}>
                <AddServiceComponent
                  groupId={globalUtil.getAppID()}
                  archInfo={currApp.app_arch}
                  refreshCurrent={() => {
                    this.loading();
                  }}
                  handleClose={this.handleClose}
                  // onload={() => {
                  //   // this.setState({ type: 'spin' }, () => {
                  //   //   this.setState({
                  //   //     type: this.state.size == 'large' ? 'shape' : 'list'
                  //   //   });
                  //   // });
                  // }}
                />
              </div>
            )}
          </div>
        )}
        {toEdit && (
          <EditGroupName
            isAddGroup={false}
            group_name={groupDetail.group_name}
            logo={groupDetail.logo}
            note={groupDetail.note}
            loading={editGroupLoading}
            k8s_app={groupDetail.k8s_app}
            title={formatMessage({ id: 'confirmModal.app.title.edit' })}
            onCancel={this.cancelEdit}
            onOk={this.handleEdit}
            isEditEnglishName={currApp.can_edit}
          />
        )}
        {promptModal && (
          <Modal
            title={formatMessage({ id: 'confirmModal.friendly_reminder.title' })}
            confirmLoading={buildShapeLoading}
            visible={promptModal}
            onOk={this.handlePromptModalOpen}
            onCancel={this.handlePromptModalClose}
          >
            <p>{formatMessage({ id: 'confirmModal.friendly_reminder.pages.desc' }, { codeObj: codeObj[code] })}</p>
          </Modal>
        )}
        {rapidCopy && (
          <RapidCopy
            copyFlag={true}
            on={this.handleCloseRapidCopy}
            onCancel={this.handleCloseRapidCopy}
            title={formatMessage({ id: 'confirmModal.app.title.copy' })}
          />
        )}
        {toDelete && (
          <AppDeteleResource
            onDelete={this.handleDelete}
            onCancel={this.cancelDelete}
            goBack={this.cancelDeleteResource}
            infoList={resourceList}
            team_name={globalUtil.getCurrTeamName()}
            group_id={globalUtil.getAppID()}
            regionName={globalUtil.getCurrRegionName()}
            loading={deleteLoading}
            isflag={toDeleteResource}
            desc={formatMessage({ id: 'confirmModal.app.delete.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
          />
        )}
        {customSwitch && (
          <ApplicationGovernance
            mode={currApp && currApp.governance_mode}
            appID={globalUtil.getAppID()}
            onCancel={this.onCancel}
            onOk={this.fetchAppDetail}
          />
        )}
        {toEditAppDirector && (
          <AppDirector
            teamName={globalUtil.getCurrTeamName()}
            regionName={globalUtil.getCurrRegionName()}
            group_name={groupDetail.group_name}
            note={groupDetail.note}
            loading={editGroupLoading}
            principal={currApp.username}
            onCancel={this.cancelEditAppDirector}
            onOk={this.handleEdit}
          />
        )}
      </div>
    )
  }
}
