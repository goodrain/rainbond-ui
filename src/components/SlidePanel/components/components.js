/* eslint-disable consistent-return */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-multi-comp */
import {
  Alert,
  Badge,
  Button,
  Divider,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Radio,
  Select,
  Tooltip,
  Tag,
  Menu,
  Dropdown,
  Spin,
  Skeleton
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import ConfirmModal from '../../ConfirmModal';
import styless from '../../CreateTeam/index.less';
import MarketAppDetailShow from '../../MarketAppDetailShow';
import VisitBtn from '../../VisitBtn';
import PageHeader from '../../ComponentPageHeader'
import { rollback } from '../../../services/app';
import appUtil from '../../../utils/app';
import AppPubSubSocket from '../../../utils/appPubSubSocket';
import appStatusUtil from '../../../utils/appStatus-util';
import dateUtil from '../../../utils/date-util';
import globalUtil from '../../../utils/global';
import regionUtil from '../../../utils/region';
import roleUtil from '../../../utils/newRole';
import teamUtil from '../../../utils/team';
import userUtil from '../../../utils/user';
import ConnectionInformation from '../../../pages/Component/connectionInformation';
import EnvironmentConfiguration from '../../../pages/Component/environmentConfiguration';
import Expansion from '../../../pages/Component/expansion';
import styles from './components.less';
import Log from '../../../pages/Component/log';
import Members from '../../../pages/Component/members';
import Mnt from '../../../pages/Component/mnt';
import Monitor from '../../../pages/Component/monitor';
import Overview from '../../../pages/Component/overview';
import advancedSettings from '../../../pages/Component/advancedSettings';
import port from '../../../pages/Component/port';
import relation from '../../../pages/Component/relation'
import ComponentPlugin from '../../../pages/Component/componentPlugin'
import ThirdPartyServices from '../../../pages/Component/ThirdPartyServices';
import PluginUtile from '../../../utils/pulginUtils'
import { ResumeContext } from "../../../pages/Component/funContext";
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import DatabaseOverview from '../../../pages/Component/databaseOverview';
import DatabaseExpansion from '../../../pages/Component/databaseExpansion';
import DatabaseBackup from '../../../pages/Component/databaseBackup';

const FormItem = Form.Item;
const { Option } = Select;
const RadioGroup = Radio.Group;

@Form.create()
@connect(null, null, null, { withRef: true })
class MoveGroup extends PureComponent {
  onCancel = () => {
    this.props.onCancel();
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, currGroup } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.group_id === currGroup) {
        notification.warning({ message: formatMessage({ id: 'notification.warn.cannot_select' }) });
        return;
      }
      this.props.onOk(fieldsValue);
    });
  };

  render() {
    const { groups = [], currGroup, form, loading = false } = this.props;
    const { getFieldDecorator } = form;
    const initValue = currGroup.toString();
    return (
      <Modal
        title={<FormattedMessage id="componentOverview.MoveGroup.edit" />}
        visible
        className={styless.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
        confirmLoading={loading}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator('group_id', {
              initialValue: initValue || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'componentOverview.MoveGroup.edit' })
                }
              ]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {groups &&
                  groups.length > 0 &&
                  groups.map(group => {
                    return (
                      <Option
                        key={group.group_id}
                        value={group.group_id.toString()}
                      >
                        {group.group_name}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

/* 修改组件名称 */
@Form.create()
@connect(null, null, null, { withRef: true })
class EditName extends PureComponent {
  onCancel = () => {
    this.props.onCancel();
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onOk(fieldsValue);
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(`${formatMessage({ id: 'componentOverview.EditName.input_en_name' })}`));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(
            `${formatMessage({ id: 'componentOverview.EditName.only' })}`
          )
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(`${formatMessage({ id: 'componentOverview.EditName.Cannot' })}`));
    }
  };
  render() {
    const {
      title,
      name,
      loading = false,
      form,
      k8sComponentName,
      isEditEnglishName
    } = this.props;
    const isDisabled =
      isEditEnglishName === 'closed' || isEditEnglishName === 'undeploy';
    const { getFieldDecorator } = form;
    return (
      <Modal
        title={title || <FormattedMessage id='componentOverview.EditName.edit' />}
        visible
        className={styless.TelescopicModal}
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label={<FormattedMessage id="componentOverview.EditName.name" />}>
            {getFieldDecorator('service_cname', {
              initialValue: name || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'componentOverview.EditName.not_null' })
                },
                {
                  max: 24,
                  message: formatMessage({ id: 'componentOverview.EditName.max' })
                }
              ]
            })(
              <Input
                placeholder={
                  title ? formatMessage({ id: 'componentOverview.EditName.input_new_name' }) : formatMessage({ id: 'componentOverview.EditName.input_new_app_name' })
                }
              />
            )}
          </FormItem>
          {/* 集群组件名称 */}
          <FormItem
            label={<FormattedMessage id="componentOverview.EditName.en_name" />}
            extra={formatMessage({ id: 'componentOverview.EditName.close' })}
          >
            {getFieldDecorator('k8s_component_name', {
              initialValue: k8sComponentName || '',
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'componentOverview.EditName.placeholder' })} disabled={!isDisabled} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

@Form.create()
@connect(
  ({ user, appControl, global, teamControl, enterprise, loading, kubeblocks }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    pods: appControl.pods,
    groups: global.groups,
    build_upgrade: appControl.build_upgrade,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    deleteAppLoading: loading.effects['appControl/deleteApp'],
    reStartLoading: loading.effects['appControl/putReStart'],
    startLoading: loading.effects['appControl/putStart'],
    stopLoading: loading.effects['appControl/putStop'],
    moveGroupLoading: loading.effects['appControl/moveGroup'],
    editNameLoading: loading.effects['appControl/editName'],
    updateRollingLoading: loading.effects['appControl/putUpdateRolling'],
    deployLoading:
      loading.effects[('appControl/putDeploy', 'appControl/putUpgrade')],
    buildInformationLoading: loading.effects['appControl/getBuildInformation'],
    pluginList: teamControl.pluginsList,
    clusterDetail: kubeblocks.clusterDetail
  }),
  null,
  null,
  { withRef: true }
)
class Main extends PureComponent {
  static childContextTypes = {
    isActionIng: PropTypes.func,
    appRolback: PropTypes.func
  };
  constructor(arg) {
    super(arg);
    this.state = {
      actionIng: false,
      groupDetail: {},
      loadingDetail: true,
      status: {},
      showDeleteApp: false,
      showEditName: false,
      showMoveGroup: false,
      visibleBuild: null,
      BuildText: '',
      BuildList: [],
      showMarketAppDetail: null,
      showApp: {},
      BuildState: null,
      isShowThirdParty: false,
      promptModal: null,
      websocketURL: '',
      componentTimer: true,
      tabsShow: false,
      routerSwitch: true,
      componentPermissions: this.props?.permissions || {},
      activeTab: '',
      isShowUpdate: false,
      isShowKubeBlocksComponent: false,
    };
    this.socket = null;
    this.destroy = false;
  }

  getChildContext() {
    return {
      isActionIng: res => {
        this.setState({ actionIng: res });
      },
      appRolback: data => {
        this.handleRollback(data);
      }
    };
  }
  componentDidMount() {
    this.loadDetail();
    setTimeout(() => {
      this.getStatus(true);
    }, 5000);
  }
  componentWillUnmount() {
    this.closeComponentTimer();
    this.props.dispatch({ type: 'appControl/clearPods' });
    this.props.dispatch({ type: 'appControl/clearDetail' });
    this.props.dispatch({ type: 'kubeblocks/clearClusterDetail' });
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.destroy = true;
  }

  onDeleteApp = () => {
    this.setState({ showDeleteApp: true });
  }

  getWebSocketUrl(service_id) {
    const currTeam = userUtil.getTeamByTeamName(
      this.props.currUser,
      globalUtil.getCurrTeamName()
    );
    const currRegionName = globalUtil.getCurrRegionName();
    if (currTeam) {
      const region = teamUtil.getRegionByName(currTeam, currRegionName);
      if (region) {
        const websocketURL = regionUtil.getNewWebSocketUrl(region, service_id);
        this.setState({ websocketURL }, () => {
          this.createSocket();
        });
      }
    }
  }

  getStatus = isCycle => {
    const { dispatch } = this.props;
    const { componentTimer, isShowKubeBlocksComponent } = this.state;
    const { team_name, app_alias } = this.fetchParameter();

    dispatch({
      type: 'appControl/fetchComponentState',
      payload: {
        team_name,
        app_alias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({ status: res.bean }, () => {
            // 如果是 KubeBlocks 组件，同时刷新 KubeBlocks 相关数据
            if (isShowKubeBlocksComponent) {
              this.getKubeBlocksStatus();
            }

            if (isCycle && componentTimer) {
              this.handleTimers(
                'timer',
                () => {
                  this.getStatus(true);
                },
                5000
              );
            }
          });
        }
      },
      handleError: err => {
        this.handleError(err);
        if (isCycle && componentTimer && err.status !== 404) {
          this.handleTimers(
            'timer',
            () => {
              this.getStatus(true);
            },
            10000
          );
        }
      }
    });
  };

  // 获取 KubeBlocks 组件状态信息
  getKubeBlocksStatus = () => {
    const { dispatch, appDetail } = this.props;
    const { team_name } = this.fetchParameter();

    if (!appDetail?.service?.service_alias) {
      return;
    }

    // 获取 KubeBlocks Cluster 详情
    dispatch({
      type: 'kubeblocks/getClusterDetail',
      payload: {
        team_name,
        service_alias: appDetail.service.service_alias
      }
    });
  };

  getChildCom = () => {
    if (this.ref) {
      return this.ref.getWrappedInstance({});
    }
    return null;
  };
  handleTeamPermissions = callback => {
    const { currUser } = this.props;
    const teamPermissions = userUtil.getTeamByTeamPermissions(
      currUser.teams,
      globalUtil.getCurrTeamName()
    );
    if (teamPermissions && teamPermissions.length !== 0) {
      callback();
    } else {
      this.closeComponentTimer();
    }
  };

  handleError = err => {
    const { componentTimer } = this.state;
    const { dispatch } = this.props;
    const { group_id } = this.fetchParameter();

    this.handleTeamPermissions(() => {
      if (!componentTimer) {
        return null;
      }
      if (err && err.status === 404) {
        this.closeComponentTimer();
        if (!this.destroy) {
          dispatch(
            routerRedux.push(`${this.fetchPrefixUrl()}apps/${group_id}`)
          );
        }
        return null;
      }
      if (err && err.data && err.data.msg_show) {
        notification.warning({
          message: formatMessage({ id: 'notification.warn.error' }),
          description: err.data.msg_show
        });
      }
    });
    return null;
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

  handleTabChange = key => {    
    const { dispatch } = this.props;
    const { app_alias } = this.fetchParameter();
    this.setState({
      activeTab: key
    }, () => {
      dispatch(
        routerRedux.push(`${this.fetchPrefixUrl()}apps/${globalUtil.getAppID()}/overview?type=components&componentID=${app_alias}&tab=${key}`)
      );
    })
  };

  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };

  loadBuildState = (appDetail, val) => {
    const { team_name, serviceAlias } = this.fetchParameter();
    const { dispatch } = this.props;
    if (val) {
      this.setState({
        BuildState: null
      });
    }
    if (
      appDetail &&
      appDetail.service &&
      appDetail.service.service_source === 'market' &&
      appDetail.service.service_alias
    ) {
      dispatch({
        type: 'appControl/getBuildInformation',
        payload: {
          team_name,
          app_alias: appDetail.service.service_alias
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState({
              BuildState:
                res.list && res.list.length > 0 ? res.list.length : null
            });
          }
        }
      });
    }
  };
  fetchPrefixUrl = () => {
    const { team_name, region_name } = this.fetchParameter();
    return `/team/${team_name}/region/${region_name}/`;
  };
  loadDetail = (val) => {    
    const { dispatch } = this.props;
    const {
      app_alias,
      team_name,
      group_id,
      serviceAlias
    } = this.fetchParameter();
    const prefixUrl = this.fetchPrefixUrl();
    dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name,
        app_alias
      },
      callback: appDetail => {
        this.fetchAppDetail();
        const haveTabKey = globalUtil.getSlidePanelTab();
        if (val) {
          this.loadBuildState(appDetail, val);
        } else {
          this.loadBuildState(appDetail);
        }
        if (appDetail.service.service_source) {
          const isKBComponent = appDetail?.service?.extend_method === 'kubeblocks_component';
          this.setState({
            isShowThirdParty: appDetail.is_third ? appDetail.is_third : false,
            tabsShow: true,
            isShowKubeBlocksComponent: isKBComponent
          }, () => {
            this.setState({
              routerSwitch: false,
              activeTab: (() => {
                const targetTab = haveTabKey ? haveTabKey :
                  this.state.isShowThirdParty ? 'thirdPartyServices' : 'overview';
                return (isKBComponent && targetTab === 'overview') ? 'databaseOverview' : targetTab;
              })()
            });

            if (isKBComponent) {
              dispatch({
                type: 'kubeblocks/getClusterDetail',
                payload: {
                  team_name,
                  service_alias: appDetail.service.service_alias
                }
              });
            }
          });
        }
        if (
          !appUtil.isCreateComplete(appDetail) &&
          !appUtil.isMarketApp(appDetail)
        ) {
          if (
            appDetail.service &&
            appDetail.service.create_status === 'complete'
          ) {
            this.getStatus(false);
            setTimeout(() => {
              this.setState({
                routerSwitch: false
              })
            }, 100)
          } else if (!appUtil.isCreateFromCompose(appDetail)) {
            this.setState({
              routerSwitch: false
            })
            serviceAlias &&
              dispatch(
                routerRedux.replace(
                  `${prefixUrl}create/create-check/${serviceAlias}`
                )
              );
          } else {
            dispatch(
              routerRedux.replace(
                `${prefixUrl}create/create-compose-check/${group_id}/${appDetail.service.compose_id}`
              )
            );
          }
        } else {
          this.getStatus(false);
        }
        // get websocket url and create client
        this.getWebSocketUrl(appDetail.service.service_id);
      },
      handleError: data => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        if (data.status === 404) {
          dispatch(routerRedux.push(`${prefixUrl}exception/404`));
        }
        return null;
      }
    });
  };
  fetchParameter = () => {
    const { appDetail, match } = this.props;
    const service = appDetail && appDetail.service;
    const componentID = globalUtil.getSlidePanelComponentID();

    return {
      app_alias: componentID,
      team_name: globalUtil.getCurrTeamName(),
      region_name: globalUtil.getCurrRegionName(),
      serviceAlias: service && service.service_alias,
      group_id: service && service.group_id,
      group_name: service && service.group_name,
      service_cname: service && service.service_cname,
      k8s_component_name: service && service.k8s_component_name
    };
  };
  // 应用详情
  fetchAppDetail = () => {
    const { dispatch, appDetail } = this.props;
    const { team_name, region_name } = this.fetchParameter();
    const group_id = appDetail && appDetail.service && appDetail.service.group_id;
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name,
        region_name,
        group_id: group_id || globalUtil.getAppID()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            groupDetail: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          dispatch(routerRedux.push(`${this.fetchPrefixUrl()}index`));
        }
      }
    });
  };


  handleshowDeployTips = showonoff => {
    this.setState({ showDeployTips: showonoff });
  };
  handleDeploy = groupVersion => {
    this.setState({
      showDeployTips: false,
      showreStartTips: false
    });
    const { build_upgrade, dispatch, appDetail } = this.props;
    if (this.state.actionIng) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.executing' }) });
      return;
    }
    const { team_name, app_alias } = this.fetchParameter();

    dispatch({
      type: groupVersion ? 'appControl/putUpgrade' : 'appControl/putDeploy',
      payload: {
        team_name,
        app_alias,
        group_version: groupVersion || '',
        is_upgrate: build_upgrade
      },
      callback: res => {
        if (res) {
          this.handleCancelBuild();
          this.loadBuildState(appDetail);
          notification.success({ message: formatMessage({ id: 'notification.success.deployment' }) });
          const child = this.getChildCom();

          if (child && child.onLogPush) {
            child.onLogPush(true);
          }
          if (child && child.onAction) {
            child.onAction(res.bean);
          }
        }
        this.handleOffHelpfulHints();
      }
    });
  };
  handleRollback = datas => {
    if (this.state.actionIng) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.executing' }) });
      return;
    }
    const { team_name, app_alias } = this.fetchParameter();

    rollback({
      team_name,
      app_alias,
      deploy_version: datas.build_version
        ? datas.build_version
        : datas.deploy_version
          ? datas.deploy_version
          : '',
      upgrade_or_rollback: datas.upgrade_or_rollback
        ? datas.upgrade_or_rollback
        : -1
    }).then(data => {
      if (data) {
        notification.success({
          message: datas.upgrade_or_rollback
            ? datas.upgrade_or_rollback == 1
              ? formatMessage({ id: 'notification.success.upgrade' })
              : formatMessage({ id: 'notification.success.rollback' })
            : formatMessage({ id: 'notification.success.rollback' })
        });
        const child = this.getChildCom();
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  handleshowRestartTips = showonoff => {
    this.setState({ showreStartTips: showonoff });
  };

  saveRef = ref => {
    this.ref = ref;
  };
  handleDropClick = item => {
    if (item === 'deleteApp') {
      this.closeComponentTimer();
      this.onDeleteApp();
    }

    if (item === 'moveGroup') {
      this.showMoveGroup();
    }
    if (item === 'restart') {
      this.setState({
        promptModal: 'restart'
      });
    }
  };
  closeComponentTimer = () => {
    this.setState({ componentTimer: false });
    this.closeTimer();
  };
  openComponentTimer = () => {
    this.setState({ componentTimer: true }, () => {
      this.getStatus(true);
    });
  };

  cancelDeleteApp = (isOpen = true) => {
    this.setState({ showDeleteApp: false });
    if (isOpen) {
      this.openComponentTimer();
    }
  };
  createSocket() {
    const { appDetail } = this.props;
    const { websocketURL } = this.state;
    if (websocketURL) {
      const isThrough = dateUtil.isWebSocketOpen(websocketURL);
      if (isThrough && isThrough === 'through') {
        this.socket = new AppPubSubSocket({
          url: websocketURL,
          serviceId: appDetail.service.service_id,
          isAutoConnect: true,
          destroyed: false
        });
      }
    }
  }
  handleDeleteApp = () => {
    const { dispatch } = this.props;
    const { team_name, app_alias, group_id } = this.fetchParameter();
    const timestamp = new Date().getTime();

    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name,
        app_alias
      },
      callback: () => {
        this.closeComponentTimer();
        this.cancelDeleteApp(false);
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name
          }
        });
        dispatch(
          routerRedux.replace(`${this.fetchPrefixUrl()}apps/${group_id}/overview?refresh=${timestamp}`)
        );
      }
    });
  };
  showEditName = () => {
    this.setState({ showEditName: true });
  };
  hideEditName = () => {
    this.setState({ showEditName: false });
  };
  handleEditName = data => {
    const { team_name, serviceAlias, group_id } = this.fetchParameter();
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/editName',
      payload: {
        team_name,
        app_alias: serviceAlias,
        ...data
      },
      callback: () => {
        dispatch({
          type: 'application/editGroups',
          payload: {
            team_name,
            group_id
          },
          callback: res => {
            notification.success({ message: formatMessage({ id: 'notification.success.takeEffect' }) });
          }
        });
        this.handleUpDataHeader();
        this.loadDetail();
        this.hideEditName();
        const timestamp = new Date().getTime();
        setTimeout(() => {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview` + `?type=components&componentID=${serviceAlias}&tab=${this.state.activeTab}&refresh=${timestamp}`
            ))
        }, 50);
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
  showMoveGroup = () => {
    this.setState({ showMoveGroup: true });
  };
  hideMoveGroup = () => {
    this.setState({ showMoveGroup: false });
  };
  handleMoveGroup = data => {
    const { team_name, serviceAlias } = this.fetchParameter();
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/moveGroup',
      payload: {
        team_name,
        app_alias: serviceAlias,
        ...data
      },
      callback: () => {
        this.hideMoveGroup();
        this.loadDetail();
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name
          }
        });
        notification.success({ message: formatMessage({ id: 'notification.warn.restart' }) });
      }
    });
  };
  handleOperation = (state, callback) => {
    const { dispatch } = this.props;
    const { actionIng } = this.state;
    if (state === 'putUpdateRolling') {
      this.setState({
        showDeployTips: false,
        showreStartTips: false
      });
    } else if (state === 'putReStart') {
      this.setState({ showreStartTips: false });
    }
    if (actionIng) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.executing' }) });
      return;
    }
    const operationMap = {
      putReStart: formatMessage({ id: 'notification.success.operationRestart' }),
      putStart: formatMessage({ id: 'notification.success.operationStart' }),
      putStop: formatMessage({ id: 'notification.success.operationClose' }),
      putUpdateRolling: formatMessage({ id: 'notification.success.operationUpdata' })
    };
    const { team_name, app_alias } = this.fetchParameter();

    dispatch({
      type: `appControl/${state}`,
      payload: {
        team_name,
        app_alias
      },
      callback: res => {
        if (res) {
          notification.success({
            message: operationMap[state]
          });
          const child = this.getChildCom();
          if (child && child.onAction) {
            child.onAction(res.bean);
          }
          if (callback) {
            callback();
          }
        }
        this.handleOffHelpfulHints();
      }
    });
  };

  handleChecked = value => {
    const { dispatch } = this.props;
    const { team_name, app_alias } = this.fetchParameter();
    dispatch({
      type: 'appControl/changeApplicationState',
      payload: {
        build_upgrade: value,
        team_name,
        app_alias
      },
      callback: data => {
        if (data) {
          notification.info({ message: formatMessage({ id: 'notification.success.modified' }) });
        }
      }
    });
  };
  handleOkBuild = (key) => {
    const { dispatch } = this.props
    const { group_id } = this.fetchParameter();
    this.props.form.validateFields((err, fieldsValue) => {
      if (!err) {
        if (key === 'build') {
          this.handleDeploy(fieldsValue.group_version);
        } else if (key === 'upgrade') {
          dispatch(
            routerRedux.push(`${this.fetchPrefixUrl()}apps/${group_id}/upgrade`)
          );
        }
      }
    });
  };
  handleVm = () => {
    const { appDetail, dispatch } = this.props;
    const { team_name, serviceAlias } = this.fetchParameter();
    const { status } = this.state;
    dispatch({
      type: 'appControl/vmPause',
      payload: {
        team_name,
        app_alias: serviceAlias,
        type: status.status == 'paused' ? 'unpause' : 'pause'
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'Vm.createVm.handleSuccess' }) });
        }
      },
      handleError: err => {
        notification.warning({
          message: formatMessage({ id: 'notification.warn.error' }),
        });
      }
    });
  }
  handleOpenBuild = () => {
    const { appDetail, dispatch } = this.props;
    const buildType = appDetail.service.service_source;
    const text = appDetail.rain_app_name;
    const { status } = this.state;
    const { team_name, serviceAlias } = this.fetchParameter();

    if (buildType === 'market' && status && status.status !== 'undeploy') {
      dispatch({
        type: 'appControl/getBuildInformation',
        payload: {
          team_name,
          app_alias: serviceAlias
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState({
              BuildList: res.list,
              visibleBuild: true,
              BuildText: text,
              BuildState:
                res.list && res.list.length > 0 ? res.list.length : null,
              showApp: {
                details: false,
                group_name: text
              }
            });
          }
        }
      });
    } else {
      this.handleOpenHelpfulHints('deploy');
    }
  };
  handleCancelBuild = () => {
    this.setState({
      visibleBuild: null,
      BuildText: ''
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showMarketAppDetail: null
    });
  };
  hideMarketOpenAppDetail = () => {
    this.setState({
      showMarketAppDetail: true
    });
  };
  handleOpenHelpfulHints = promptModal => {
    this.setState({
      promptModal
    });
  };
  handleOffHelpfulHints = () => {
    this.setState({
      promptModal: null
    });
  };
  handleJumpAgain = () => {
    const { promptModal } = this.state;
    if (promptModal === 'deploy') {
      this.handleDeploy();
      return null;
    }
    const parameter =
      promptModal === 'stop'
        ? 'putStop'
        : promptModal === 'start'
          ? 'putStart'
          : promptModal === 'restart'
            ? 'putReStart'
            : promptModal === 'rolling'
              ? 'putUpdateRolling'
              : '';
    this.handleOperation(parameter);
  };
  toWebConsole = () => {
    const { dispatch } = this.props;
    const { serviceAlias } = this.fetchParameter();
    dispatch(
      routerRedux.replace(
        `${this.fetchPrefixUrl()}components/${serviceAlias}/webconsole`
      )
    );
  };
  renderTitle(name) {
    const {
      appDetail,
    } = this.props;
    const { status, groupDetail, loadingDetail } = this.state;
    const {  isRestart, isStop, isDelete, isEdit } = this.props.permissions;
    const comName = JSON.parse(window.sessionStorage.getItem('name')) || '-';
    const isHelm =
      groupDetail && groupDetail.app_type && groupDetail.app_type === 'helm';
    const arch = appDetail.service && appDetail.service.arch
    return (
      <Fragment>
        <div>
          <div className={styles.contentTitle}>
            {comName || '-'}
            {isEdit && (
              <Icon
                style={{
                  cursor: 'pointer',
                  marginRight: '12px'
                }}
                onClick={this.showEditName}
                type="edit"
              />
            )}
            <Tag>{arch}</Tag>
          </div>
        </div>
      </Fragment>
    );
  }
  checkPermissions() {
    const {
      appDetail,
      buildInformationLoading,
      permissions:{
        isAccess,
        isStart,
        isVisitWebTerminal,
        isConstruct,
        isUpdate,
        isRestart,
        isStop,
        isDelete,
        isEdit
      }
    } = this.props;
    const {
      status,
      isShowThirdParty,
      loadingDetail,
      isShowKubeBlocksComponent
    } = this.state;

    const method = appDetail?.service?.extend_method;
    const isHelm = this.state.groupDetail?.app_type === 'helm';
    const upDataText = isShowThirdParty ?
      <FormattedMessage id='componentOverview.header.right.update' /> :
      <FormattedMessage id='componentOverview.header.right.update.roll' />;
    const visitBtns = (
      <VisitBtn
        timers={this.state.componentTimer}
        btntype="primary"
        app_alias={globalUtil.getSlidePanelComponentID()}
      />
    );
    const isShowUpdate = method !== 'vm' && isUpdate && !['undeploy', 'closed', 'stopping', 'succeeded'].includes(status?.status)
    this.setState({
      isShowUpdate
    })
    
    const allOperations = [
      {
        key: 'visit',
        show: (
          ((appDetail?.service?.service_source === 'market' ||
            appDetail?.service?.service_source !== 'market') &&
            appStatusUtil.canVisit(status) && !isShowThirdParty && isAccess) ||
          (isShowThirdParty && isAccess)
        ),
        type: 'component',
        component: visitBtns
      },
      {
        key: 'start',
        show: isStart && !appStatusUtil.canStop(status),
        type: 'button',
        text: <FormattedMessage id='componentOverview.header.right.start' />,
        disabled: !appStatusUtil.canStart(status),
        onClick: () => this.handleOpenHelpfulHints('start')
      },
      {
        key: 'build',
        show: method !== 'vm' && !isShowThirdParty && isConstruct && !isShowKubeBlocksComponent, // 数据库组件不显示构建按钮
        type: 'button',
        text: <FormattedMessage id='componentOverview.header.right.build' />,
        loading: buildInformationLoading,
        onClick: this.handleOpenBuild,
        badge: this.state.BuildState && {
          status: 'success',
          text: <FormattedMessage id='componentOverview.isShowThirdParty.updata' />,
          tooltip: <FormattedMessage id='componentOverview.isShowThirdParty.New_version' />
        }
      },
      {
        key: 'webTerminal',
        show: method !== 'vm' && isVisitWebTerminal && !isShowThirdParty && !isShowKubeBlocksComponent,
        type: 'link',
        text: <FormattedMessage id='componentOverview.header.right.web' />,
        path: `${this.fetchPrefixUrl()}components/${globalUtil.getSlidePanelComponentID()}/webconsole`,
        target: '_blank'
      },
      {
        key: 'vmWeb',
        show: method === 'vm' && appDetail.vm_url,
        type: 'link',
        text: <FormattedMessage id='componentOverview.header.right.web' />,
        path: appDetail.vm_url,
        target: '_blank'
      },
      {
        key: 'vm',
        show: method === 'vm' && status?.status,
        type: 'button',
        text: status?.status === 'paused' ? "恢复" : '挂起',
        onClick: () => this.handleVm()
      },
      {
        key: 'update',
        show: method !== 'vm' && isUpdate && !isShowKubeBlocksComponent &&
          !['undeploy', 'closed', 'stopping', 'succeeded'].includes(status?.status),
        type: 'button',
        text: upDataText,
        onClick: () => this.handleOpenHelpfulHints('rolling')
      },
      {
        key: 'restart',
        show: (status?.status && !appDetail.is_third && isRestart && !appStatusUtil.canStart(status)) ||
          (isStop && status?.status === 'succeeded'),
        type: 'button',
        text: <FormattedMessage id='componentOverview.header.left.reset' />,
        disabled: !appStatusUtil.canRestart(status),
        onClick: () => this.handleDropClick('restart')
      },
      {
        key: 'stop',
        show: (status?.status && isStop && !appStatusUtil.canStart(status)) ||
          (isStop && status?.status && (status.status === 'upgrade' || status.status === 'succeeded')),
        type: 'button',
        text: <FormattedMessage id='componentOverview.header.left.turnoff' />,
        disabled: !appStatusUtil.canStop(status),
        onClick: () => this.handleOpenHelpfulHints('stop')
      },
      {
        key: 'moveGroup',
        show: status?.status && isEdit && !loadingDetail && !isHelm,
        type: 'button',
        text: <FormattedMessage id='componentOverview.header.left.edit' />,
        onClick: () => this.handleDropClick('moveGroup')
      },
      {
        key: 'delete',
        show: status?.status && isDelete && !(status.status === 'running' && appDetail?.service?.extend_method === 'cronjob'),
        type: 'button',
        text: <FormattedMessage id='componentOverview.header.left.delete' />,
        onClick: () => this.handleDropClick('deleteApp')
      },
    ];

    const availableOperations = allOperations.filter(op => op.show);

    return this.renderOperations(availableOperations);
  }

  renderOperations(operations) {
    let content = [];
    // 处理按钮逻辑
    if (operations.length <= 3) {
      // 如果按钮数量小于等于3，直接渲染按钮
      content = operations.map((op, index) => (
        op.type === 'button' ? (
          <Button
            type={index === 0 ? "primary" : "default"}
            key={op.key}
            onClick={op.onClick}
            disabled={op.disabled}
            loading={op.loading}
            style={{ marginRight: 8 }}
          >
            {op.badge ? (
              <Tooltip title={op.badge.tooltip}>
                <Badge
                  className={styles.badge}
                  status={op.badge.status}
                  text=""
                  count={op.badge.text}
                  title={op.badge.text}
                />
              </Tooltip>
            ) : null}
            {op.text}
          </Button>
        ) : op.type === 'link' ? (
          <Button>
            <Link
              key={op.key}
              to={op.path}
              target={op.target}
              style={{ marginRight: 8 }}
              className="ant-btn"
            >
              {op.text}
            </Link>
          </Button>
        ) : (
          <span key={op.key} style={{ marginLeft: 8 }}>
            {op.component}
          </span>
        )
      ));
    } else {
      const mainButtons = operations.slice(0, 2);
      const dropdownButtons = operations.slice(2);
      const menu = (
        <Menu>
          {dropdownButtons.map(op => (
            op.type === 'link' ? (
              <Menu.Item key={op.key}>
                <Link to={op.path} target={op.target}>
                  {op.text}
                </Link>
              </Menu.Item>
            ) : (
              <Menu.Item
                key={op.key}
                onClick={op.onClick}
                disabled={op.disabled}
              >
                {op.text}
              </Menu.Item>
            )
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
              loading={op.loading}
              style={{ marginRight: 8 }}
            >
              {op.badge ? (
                <Tooltip title={op.badge.tooltip}>
                  <Badge
                    className={styles.badge}
                    status={op.badge.status}
                    text=""
                    count={op.badge.text}
                    title={op.badge.text}
                  />
                </Tooltip>
              ) : null}
              {op.text}
            </Button>
          ) : op.type === 'link' ? (
            <Button>
              <Link
                key={op.key}
                to={op.path}
                target={op.target}
              >
                {op.text}
              </Link>
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
    return content
  }

  render() {
    const {
      appDetail,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      groups = [],
      form,
      deleteAppLoading,
      reStartLoading,
      startLoading,
      stopLoading,
      moveGroupLoading,
      editNameLoading,
      updateRollingLoading,
      deployLoading,
      buildInformationLoading,
      pluginList,
      permissions,
      permissions: {
        isAccess,
        isStart,
        isVisitWebTerminal,
        isServiceMonitor,
        isConstruct,
        isUpdate,
        isTelescopic,
        isEnv,
        isRely,
        isStorage,
        isPort,
        isPlugin,
        isSource,
        isOtherSetting
      }
    } = this.props;
    const CompluginList = PluginUtile.segregatePluginsByHierarchy(pluginList, "Component")    
    const {
      BuildList,
      componentTimer,
      isShowThirdParty,
      status,
      promptModal,
      showDeleteApp,
      showEditName,
      showMoveGroup,
      groupDetail,
      tabsShow,
      routerSwitch,
      activeTab,
      isShowKubeBlocksComponent
    } = this.state;
    const { getFieldDecorator } = form;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    const upDataText = isShowThirdParty ? <FormattedMessage id='componentOverview.header.right.update' /> : <FormattedMessage id='componentOverview.header.right.update.roll' />;
    const codeObj = {
      start: formatMessage({ id: 'componentOverview.header.right.start' }),
      restart: formatMessage({ id: 'componentOverview.header.left.reset' }),
      stop: formatMessage({ id: 'componentOverview.header.left.turnoff' }),
      deploy: formatMessage({ id: 'componentOverview.header.right.build' }),
      rolling: upDataText
    };
    if (routerSwitch) {
      return <div style={{
        width: '100%',
        height: '100%'
      }}>
        <PageHeader
          action={<Spin />}
          {...this.props.pageHeader}
          title='-'
          content={formatMessage({ id: 'versionUpdata_6_2.componentSettings.desc' })}
        />
        <div style={{ marginTop: 40 }}>
          <Skeleton active />
        </div>
        <div style={{ marginTop: 40 }}>
          <Skeleton active />
        </div>
        <div style={{ marginTop: 40 }}>
          <Skeleton active />
        </div>
      </div>;
    }
    if (appDetail && appDetail.service && appDetail.service.service_cname) {
      window.sessionStorage.setItem("name", JSON.stringify(appDetail.service.service_cname))
    }
    const {
      serviceAlias,
      app_alias: appAlias,
      group_id,
      group_name: appName,
      service_cname: componentName,
      k8s_component_name: k8sComponentName
    } = this.fetchParameter();
    const visitBtns = (
      <VisitBtn
        timers={componentTimer}
        btntype="primary"
        app_alias={appAlias}
      />
    );
    const action = status && status.status && this.checkPermissions();

    // 定义基础tabs配置
    const getBaseTabs = () => [
      {
        key: 'overview',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.overview' }),
        auth: true 
      },
      {
        key: 'log',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.log' }),
        auth: true
      }
    ];

    // 定义扩展tabs配置 
    const getExtendTabs = (method) => [
      {
        key: 'expansion',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.expansion' }),
        auth: ['isTelescopic'],
        condition: (appDetail) =>
          appDetail?.service?.extend_method !== 'job' &&
          appDetail?.service?.extend_method !== 'cronjob' &&
          appDetail?.service?.extend_method !== 'kubeblocks_component'
      },
      {
        key: 'databaseExpansion',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.expansion' }),
        auth: ['isTelescopic'],
        condition: (appDetail) =>
          appDetail?.service?.extend_method === 'kubeblocks_component'
      },
      {
        key: 'databaseBackup',
        tab: formatMessage({ id: 'kubeblocks.database.backup.tab' }),
        auth: ['isStorage', 'isTelescopic'],
        condition: (appDetail) =>
          appDetail?.service?.extend_method === 'kubeblocks_component'
      },
      {
        key: 'monitor',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.monitor' }),
        auth: ['isServiceMonitor'],
      },
      {
        key: 'environmentConfiguration',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.environmentConfiguration' }),
        auth: ['isEnv'],
        condition: (appDetail) =>
          method !== 'vm' && appDetail?.service?.extend_method !== 'kubeblocks_component'
      },
      {
        key: 'relation',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.relation' }),
        auth: ['isRely']
      },
      {
        key: 'advancedSettings',
        tab: formatMessage({ id: 'versionUpdata_6_2.advancedSettings' }),
        auth: ['isStorage','isPort','isPlugin','isSource','isOtherSetting']
      }
    ];

    // 定义第三方服务tabs
    const getThirdPartyTabs = (formatMessage) => [
      {
        key: 'thirdPartyServices',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.overview' })
      },
      {
        key: 'port',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.port' })
      },
      {
        key: 'connectionInformation',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.connectionInformation' })
      },
      {
        key: 'members',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.members' })
      }
    ];

    const getKubeBlocksBaseTabs = () => [
      {
        key: 'databaseOverview',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.overview' })
      },
      {
        key: 'log',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.log' }),
        auth: true
      }
    ];

    // 获取基础tabs
    const tabs = appDetail?.service?.extend_method === 'kubeblocks_component'
      ? getKubeBlocksBaseTabs()
      : getBaseTabs();

    // 添加扩展tabs(根据权限)
    if (!isShowThirdParty) {
      const extendTabs = getExtendTabs(method);
      extendTabs.forEach(tab => {
        // 检查权限和条件
        const hasPermission = !tab.auth || tab.auth.some(perm => permissions[perm]);
        if (
          hasPermission &&
          (!tab.condition || tab.condition(appDetail))
        ) {
          tabs.push(tab);
        }
      });

      // 添加插件tabs
      if (CompluginList?.length > 0) {
        CompluginList.forEach(item => {
          tabs.push({
            key: item.name,
            tab: item.display_name
          });
        });
      }
    }

    // 最终的tabList
    const tabList = isShowThirdParty ? getThirdPartyTabs(formatMessage) : tabs;

    const overviewTabs = [
      {
        key: 'overview',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.overview' })
      },
      {
        key: 'port',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.port' })
      },
      {
        key: 'connectionInformation',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.connectionInformation' })
      },
      {
        key: 'members',
        tab: formatMessage({ id: 'componentOverview.body.tab.bar.members' })
      }
    ]
    const map = {
      thirdPartyServices: ThirdPartyServices,
      connectionInformation: ConnectionInformation,
      members: Members,
      overview: isShowThirdParty ? ThirdPartyServices : Overview,
      monitor: Monitor,
      log: Log,
      port: port,
      relation: relation,
      expansion: Expansion,
      environmentConfiguration: EnvironmentConfiguration,
      advancedSettings: advancedSettings,

      // KubeBlocks Component
      databaseOverview: DatabaseOverview,
      databaseExpansion: DatabaseExpansion,
      databaseBackup: DatabaseBackup,
    };
    if (CompluginList && CompluginList.length > 0) {
      CompluginList.forEach(item => {
        map[item.name] = ComponentPlugin
      })
    }
    const Com = map[activeTab];
    const formItemLayout = {
      labelCol: {
        span: 1
      },
      wrapperCol: {
        span: 23
      }
    };
    const data = {
      appAlias: globalUtil.getSlidePanelComponentID(),
      regionName: globalUtil.getCurrRegionName(),
      teamName: globalUtil.getCurrTeamName(),
      type: activeTab
    }
    
    return (
      <ResumeContext.Provider value={{ loadBuildState: this.loadDetail }}>
        <PageHeader
          action={action}
          {...this.props.pageHeader}
          title={this.renderTitle(componentName)}
          onTabChange={this.handleTabChange}
          tabActiveKey={activeTab}
          tabList={tabsShow ? tabList : overviewTabs}
          content={formatMessage({ id: 'versionUpdata_6_2.componentSettings.desc' })}
        />
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}

        {promptModal && (
          <Modal
            title={<FormattedMessage id="componentOverview.promptModal.tips" />}
            visible={promptModal}
            className={styless.TelescopicModal}
            onOk={this.handleJumpAgain}
            onCancel={this.handleOffHelpfulHints}
            confirmLoading={
              promptModal === 'restart'
                ? reStartLoading
                : promptModal === 'stop'
                  ? stopLoading
                  : promptModal === 'start'
                    ? startLoading
                    : promptModal === 'deploy'
                      ? deployLoading
                      : promptModal === 'rolling'
                        ? updateRollingLoading
                        : !promptModal
            }
          >
            <p style={{ textAlign: 'center' }}>
              <FormattedMessage id="componentOverview.promptModal.determine" />{codeObj[promptModal]}<FormattedMessage id="componentOverview.promptModal.Current" />
            </p>
          </Modal>
        )}
        <Modal
          title={[<span><FormattedMessage id="componentOverview.promptModal.Upgrade" /></span>]}
          className={styless.TelescopicModal}
          visible={this.state.visibleBuild}
          onOk={this.handleOkBuild}
          onCancel={this.handleCancelBuild}
          afterClose={() => {
            this.setState({ BuildList: [] });
          }}
          footer={
            BuildList && BuildList.length > 0 && isConstruct
              ? [
                <Button
                  onClick={() => {
                    this.handleCancelBuild();
                  }}
                >
                  <FormattedMessage id="componentOverview.promptModal.cancel" />
                </Button>,
                <Button
                  type="primary"
                  loading={deployLoading}
                  onClick={() => {
                    this.handleOkBuild('upgrade');
                  }}
                >
                  <FormattedMessage id="componentOverview.promptModal.build" />
                </Button>
              ]
              : isConstruct && [
                <Button
                  onClick={() => {
                    this.handleCancelBuild();
                  }}
                >
                  <FormattedMessage id="componentOverview.promptModal.cancel" />
                </Button>,
                <Button
                  type="primary"
                  loading={deployLoading}
                  onClick={() => {
                    this.handleOkBuild('build');
                  }}
                >
                  <FormattedMessage id="componentOverview.promptModal.Force_build" />
                </Button>
              ]
          }
        >
          <div>
            {BuildList && BuildList.length > 0 && isUpdate ? (
              <Form onSubmit={this.handleOkBuild}>
                <Alert
                  message={[
                    <span> <FormattedMessage id="componentOverview.promptModal.app" /></span>,
                    <a
                      onClick={() => {
                        this.hideMarketOpenAppDetail();
                      }}
                    >
                      {this.state.BuildText}
                    </a>,
                    <span><FormattedMessage id="componentOverview.promptModal.app_build" /></span>
                  ]}
                  type="success"
                  style={{ marginBottom: '5px' }}
                />
                <Form.Item {...formItemLayout} label="">
                  {getFieldDecorator('group_version', {
                    initialValue: BuildList[0],
                    rules: [{ required: true, message: formatMessage({ id: 'componentOverview.promptModal.choice' }) }]
                  })(
                    <RadioGroup>
                      {BuildList.map((item, index) => {
                        return (
                          <div>
                            <FormattedMessage id="componentOverview.promptModal.version" />&nbsp;
                            <Radio key={index} value={item}>
                              <a>{item}</a><FormattedMessage id="componentOverview.promptModal.updata" />
                            </Radio>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </Form.Item>
              </Form>
            ) : (
              <Alert
                message={<FormattedMessage id="componentOverview.promptModal.cloud" />}
                type="success"
                style={{ marginBottom: '5px' }}
              />
            )}
          </div>
        </Modal>
        <TransitionGroup
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100% - 150px)',
            overflow: 'hidden'
          }}
        >
          <CSSTransition
            key={activeTab}
            timeout={700}
            classNames="page-zoom"
            unmountOnExit
          >
            <div style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {Com ? (
                <Com
                  method={method}
                  groupDetail={groupDetail}
                  componentPermissions={permissions}
                  timers={componentTimer}
                  status={status}
                  ref={this.saveRef}
                  {...data}
                  {...this.props}
                  isShowKubeBlocksComponent={this.state.isShowKubeBlocksComponent}
                  onshowDeployTips={msg => {
                    this.handleshowDeployTips(msg);
                  }}
                  onshowRestartTips={msg => {
                    this.handleshowRestartTips(msg);
                  }}
                  handleOperation={(msg, callback) => {
                    this.handleOperation(msg, callback);
                  }}
                  socket={this.socket}
                  onChecked={this.handleChecked}
                  isShowUpdate={this.state.isShowUpdate}
                />
              ) : (
                <FormattedMessage id="componentOverview.promptModal.error" />
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>


        {showDeleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            onCancel={this.cancelDeleteApp}
            loading={deleteAppLoading}
            title={<FormattedMessage id='confirmModal.assembly.delete.title' />}
            desc={<FormattedMessage id='confirmModal.assembly.delete.desc' />}
            subDesc={<FormattedMessage id='confirmModal.assembly.delete.subDesc' />}
          />
        )}
        {showEditName && (
          <EditName
            loading={editNameLoading}
            name={componentName}
            onOk={this.handleEditName}
            onCancel={this.hideEditName}
            title={<FormattedMessage id="componentOverview.EditName.title" />}
            k8sComponentName={k8sComponentName}
            isEditEnglishName={status.status}
          />
        )}
        {showMoveGroup && (
          <MoveGroup
            loading={moveGroupLoading}
            currGroup={group_id}
            groups={groups}
            onOk={this.handleMoveGroup}
            onCancel={this.hideMoveGroup}
          />
        )}
      </ResumeContext.Provider>
    );
  }
}

@Form.create()
@connect(
  ({ teamControl, appControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    appDetail: appControl.appDetail,
  }),
  null,
  null,
  {
    pure: false,
    withRef: true
  }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.id = '';
    this.state = {
      show: true,
    };
  }
  render() {
    return (
      <Main {...this.props} {...this.state} />
    )
  }
}
