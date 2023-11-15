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
  Tag
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import styless from '../../components/CreateTeam/index.less';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import VisitBtn from '../../components/VisitBtn';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { rollback } from '../../services/app';
import appUtil from '../../utils/app';
import AppPubSubSocket from '../../utils/appPubSubSocket';
import appStatusUtil from '../../utils/appStatus-util';
import {
  createApp,
  createComponent,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import dateUtil from '../../utils/date-util';
import globalUtil from '../../utils/global';
import regionUtil from '../../utils/region';
import roleUtil from '../../utils/role';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import ConnectionInformation from './connectionInformation';
import EnvironmentConfiguration from './environmentConfiguration';
import Expansion from './expansion';
import styles from './Index.less';
import Log from './log';
import Members from './members';
import Mnt from './mnt';
import Monitor from './monitor';
import Overview from './overview';
import Plugin from './plugin';
import Port from './port';
import Relation from './relation';
import Resource from './resource';
import Setting from './setting';
import ThirdPartyServices from './ThirdPartyServices';
import { ResumeContext } from "./funContext";
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

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
        notification.warning({ message: formatMessage({id:'notification.warn.cannot_select'}) });
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
        title={<FormattedMessage id="componentOverview.MoveGroup.edit"/>}
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
                  message:formatMessage({id:'componentOverview.MoveGroup.edit'})
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
      return callback(new Error(`${formatMessage({id:'componentOverview.EditName.input_en_name'})}` ));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(
            `${formatMessage({id:'componentOverview.EditName.only'})}`
          )
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error( `${formatMessage({id:'componentOverview.EditName.Cannot'})}` ));
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
        title={title || <FormattedMessage id='componentOverview.EditName.edit'/>}
        visible
        className={styless.TelescopicModal}
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem  label={<FormattedMessage id="componentOverview.EditName.name"/>}>
            {getFieldDecorator('service_cname', {
              initialValue: name || '',
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'componentOverview.EditName.not_null'})
                },
                {
                  max: 24,
                  message:formatMessage({id:'componentOverview.EditName.max'})
                }
              ]
            })(
              <Input
                placeholder={
                  title ?  formatMessage({id:'componentOverview.EditName.input_new_name'}) : formatMessage({id:'componentOverview.EditName.input_new_app_name'})
                }
              />
            )}
          </FormItem>
          {/* 集群组件名称 */}
          <FormItem
            label={<FormattedMessage id="componentOverview.EditName.en_name"/>}
            extra={formatMessage({id:'componentOverview.EditName.close'})}
          >
            {getFieldDecorator('k8s_component_name', {
              initialValue: k8sComponentName || '',
              rules: [
                {
                  required: true,
                  validator: this.handleValiateNameSpace
                }
              ]
            })(<Input placeholder={formatMessage({id:'componentOverview.EditName.placeholder'})}disabled={!isDisabled} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

@Form.create()
@connect(
  ({ user, appControl, global, teamControl, enterprise, loading }) => ({
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
    buildInformationLoading: loading.effects['appControl/getBuildInformation']
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
      tabsShow:false,
      routerSwitch: true
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
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.destroy = true;
  }

  onDeleteApp = () => {
    this.setState({ showDeleteApp: true });
  };

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
    const { componentTimer } = this.state;
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
          message: formatMessage({id:'notification.warn.error'}),
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

    dispatch(
      routerRedux.push(`${this.fetchPrefixUrl()}components/${app_alias}/${key}`)
    );
  };

  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };

  loadBuildState = (appDetail, val) => {
    const { team_name, serviceAlias } = this.fetchParameter();
    const { dispatch } = this.props;
    if(val){
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
        if(val){
          this.loadBuildState(appDetail,val);
        }else{
          this.loadBuildState(appDetail);
        }
        if (appDetail.service.service_source) {
          this.setState({
            isShowThirdParty: appDetail.is_third ? appDetail.is_third : false,
            tabsShow: true,
          },()=>{
            this.setState({
              routerSwitch: false
            })
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
            setTimeout(()=>{
              this.setState({
                routerSwitch: false
              })
            },100)
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
    return {
      app_alias: match && match.params && match.params.appAlias,
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
        group_id: group_id
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
          dispatch(routerRedux.push(`${this.fetchPrefixUrl()}apps`));
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
      notification.warning({ message: formatMessage({id:'notification.warn.executing'}) });
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
          notification.success({ message: formatMessage({id:'notification.success.deployment'}) });
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
      notification.warning({ message: formatMessage({id:'notification.warn.executing'}) });
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
              ? formatMessage({id:'notification.success.upgrade'})
              : formatMessage({id:'notification.success.rollback'})
            : formatMessage({id:'notification.success.rollback'})
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
          routerRedux.replace(`${this.fetchPrefixUrl()}apps/${group_id}`)
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
            notification.success({ message: formatMessage({id:'notification.success.takeEffect'}) });
          }
        });
        this.handleUpDataHeader();
        this.loadDetail();
        this.hideEditName();
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
        notification.success({ message: formatMessage({id:'notification.success.succeeded'}) });
      }
    });
  };
  handleOperation = state => {
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
      notification.warning({ message: formatMessage({id:'notification.warn.executing'}) });
      return;
    }
    const operationMap = {
      putReStart: formatMessage({id:'notification.success.operationRestart'}),
      putStart: formatMessage({id:'notification.success.operationStart'}),
      putStop: formatMessage({id:'notification.success.operationClose'}),
      putUpdateRolling: formatMessage({id:'notification.success.operationUpdata'})
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
          notification.info({ message: formatMessage({id:'notification.success.modified'}) });
        }
      }
    });
  };
  handleOkBuild = () => {
    this.props.form.validateFields((err, fieldsValue) => {
      if (!err) {
        this.handleDeploy(fieldsValue.group_version);
      }
    });
  };
  handleVm = () =>{
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
          notification.success({ message: formatMessage({id:'Vm.createVm.handleSuccess'}) });
        }
      },
      handleError: err => {
          notification.warning({
            message: formatMessage({id:'notification.warn.error'}),
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
      componentPermissions: { isRestart, isStop, isDelete, isEdit },
      appPermissions: { isEdit: isAppEdit }
    } = this.props;
    const { status, groupDetail, loadingDetail } = this.state;
    const comName = JSON.parse(window.sessionStorage.getItem('name')) || '-';
    const isHelm =
      groupDetail && groupDetail.app_type && groupDetail.app_type === 'helm';
    const arch = appDetail.service && appDetail.service.arch
    return (
      <Fragment>
        <div style={{ display: 'flex' }}>
          <div style={{ marginTop: '3px' }}>
            {globalUtil.fetchSvg('component')}
          </div>
          <div style={{ marginLeft: '14px' }}>
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
            <div className={styles.content_Box}>
              {status && status.status && !appDetail.is_third && isRestart && !appStatusUtil.canStart(status) ? (
                <a
                  style={{
                    cursor: !appStatusUtil.canRestart(status)
                      ? 'no-drop'
                      : 'pointer'
                  }}
                  onClick={() => {
                    if (appStatusUtil.canRestart(status)) {
                      this.handleDropClick('restart');
                    }
                  }}
                >
                  {/* 重启 */}
                  <FormattedMessage id='componentOverview.header.left.reset'/>
                </a>
              ):isStop &&
              status &&
              status.status &&
              status.status === 'succeeded' ? (
                <a
                  onClick={() => {
                    this.handleDropClick('restart');
                  }}
                >
                  {/* 重启 */}
                  <FormattedMessage id='componentOverview.header.left.reset'/>
                </a>
              ) : null}
              {status && status.status && !appDetail.is_third && isRestart && <Divider type="vertical" />}
                  
              {status && status.status && isStop && !appStatusUtil.canStart(status) ? (
                <span>
                  <a
                    style={{
                      cursor: !appStatusUtil.canStop(status)
                        ? 'no-drop'
                        : 'pointer'
                    }}
                    onClick={() => {
                      if (appStatusUtil.canStop(status)) {
                        this.handleOpenHelpfulHints('stop');
                      }
                    }}
                  >
                    {/* 关闭 */}
                    <FormattedMessage id='componentOverview.header.left.turnoff'/>
                  </a>
                  <Divider type="vertical" />
                </span>
              ) : isStop &&
                status &&
                status.status &&
                status.status === 'upgrade' ||
                status.status === 'succeeded' ? (
                <span>
                  <a
                    onClick={() => {
                      this.handleOpenHelpfulHints('stop');
                    }}
                  >
                    {/* 关闭 */}
                    <FormattedMessage id='componentOverview.header.left.turnoff'/>
                  </a>
                  <Divider type="vertical" />
                </span>
              ) : null}

              {status && status.status && isAppEdit && !loadingDetail && !isHelm && (
                <a
                  onClick={() => {
                    this.handleDropClick('moveGroup');
                  }}
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  {/* 修改所属应用 */}
                  <FormattedMessage id='componentOverview.header.left.edit'/>
                </a>
              )}
              {status && status.status && isEdit && !loadingDetail && !isHelm && (
                <Divider type="vertical" />
              )}
              {status && status.status && isDelete && (
                <a
                  onClick={() => {
                    this.handleDropClick('deleteApp');
                  }}
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  {/* 删除 */}
                  <FormattedMessage id='componentOverview.header.left.delete'/>
                </a>
              )}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  render() {
    const {
      appDetail,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      componentPermissions: {
        isAccess,
        isStart,
        isVisitWebTerminal,
        isConstruct,
        isUpdate,
        isTelescopic,
        isEnv,
        isRely,
        isStorage,
        isPort,
        isPlugin,
        isSource,
        isDeploytype,
        isCharacteristic,
        isHealth
      },
      appPermissions,
      componentPermissions,
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
    } = this.props;
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
      routerSwitch
    } = this.state;
    const { getFieldDecorator } = form;
    const method = appDetail && appDetail.service && appDetail.service.extend_method
    const upDataText = isShowThirdParty ? <FormattedMessage id='componentOverview.header.right.update'/> : <FormattedMessage id='componentOverview.header.right.update.roll'/>;
    const codeObj = {
      start:  formatMessage({id:'componentOverview.header.right.start'}),
      restart: formatMessage({id:'componentOverview.header.left.reset'}),
      stop: formatMessage({id:'componentOverview.header.left.turnoff'}),
      deploy: formatMessage({id:'componentOverview.header.right.build'}),
      rolling: upDataText
    };
    if (routerSwitch) {
      return null;
    }
    if(appDetail && appDetail.service && appDetail.service.service_cname){
      window.sessionStorage.setItem("name",JSON.stringify(appDetail.service.service_cname))
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

    const action = (
      status && status.status &&
      <div>
        {isStart && !appStatusUtil.canStop(status) && (
          <Button
            disabled={!appStatusUtil.canStart(status)}
            onClick={() => {
              this.handleOpenHelpfulHints('start');
            }}
          >
            {/* 启动 */}
            <FormattedMessage id='componentOverview.header.right.start'/>
          </Button>
        )}
        {
          method == 'vm' && <Button onClick={this.handleVm}>{status.status == 'paused' ? "恢复":'挂起'}</Button>
        }
        {isVisitWebTerminal && !isShowThirdParty && (
          <Button>
            <Link
              to={`${this.fetchPrefixUrl()}components/${serviceAlias}/webconsole`}
              target="_blank"
            >
              {/* Web终端 */}
              <FormattedMessage id='componentOverview.header.right.web'/>
            </Link>
          </Button>
        )}
        {method != 'vm' ? (
          isShowThirdParty ? (
            ''
          ) : this.state.BuildState && isConstruct ? (
            <Tooltip title={<FormattedMessage id='componentOverview.isShowThirdParty.New_version'/>}>
              <Button
                onClick={this.handleOpenBuild}
                loading={buildInformationLoading}
              >
                <Badge
                  className={styles.badge}
                  status="success"
                  text=""
                  count={<FormattedMessage id='componentOverview.isShowThirdParty.updata'/>}
                  title={<FormattedMessage id='componentOverview.isShowThirdParty.updata'/>}
                />
                {/* 构建 */}
                <FormattedMessage id='componentOverview.header.right.build'/>
              </Button>
            </Tooltip>
          ) : status && status.status === 'undeploy' && isConstruct ? (
            <Button
              onClick={this.handleOpenBuild}
              loading={buildInformationLoading}
            >
              {/* 构建 */}
              <FormattedMessage id='componentOverview.header.right.build'/>
            </Button>
          ) : (
            isConstruct && (
              <Button
                onClick={this.handleOpenBuild}
                loading={buildInformationLoading}
              >
                {/* 构建 */}
                <FormattedMessage id='componentOverview.header.right.build'/>
              </Button>
            )
          )
        ):(
          ""
        )}
        {method != 'vm' ? ( 
        status.status === 'undeploy' ||
        status.status === 'closed' ||
        status.status === 'stopping' ||
        status.status === 'succeeded'
          ? ''
          : isUpdate && (
              <Button
                onClick={() => {
                  this.handleOpenHelpfulHints('rolling');
                }}
              >
                {upDataText}
              </Button>
            )
        ):(
          ""
        )}
        {appDetail && appDetail.service && appDetail.service.service_source === 'market' &&
          appStatusUtil.canVisit(status) &&
          !isShowThirdParty &&
          isAccess &&
          visitBtns}
        {appDetail && appDetail.service && appDetail.service.service_source !== 'market' &&
          appStatusUtil.canVisit(status) &&
          !isShowThirdParty &&
          isAccess &&
          visitBtns}
        {isShowThirdParty && isAccess && visitBtns}
      </div>
    );
    const tabs = [
      {
        key: 'overview',
        // tab: '总览',
        tab: formatMessage({id:'componentOverview.body.tab.bar.overview'})

      },
      {
        key: 'monitor',
        // tab: '监控',
        tab: formatMessage({id:'componentOverview.body.tab.bar.monitor'})
      },
      {
        key: 'log',
        // tab: '日志',
        tab: formatMessage({id:'componentOverview.body.tab.bar.log'})
      }
    ];

    if (isTelescopic && appDetail && appDetail.service && appDetail.service.extend_method !== 'job' && appDetail.service.extend_method !== 'cronjob') {
      tabs.push({
        key: 'expansion',
        // tab: '伸缩',
        tab: formatMessage({id:'componentOverview.body.tab.bar.expansion'})
      });
    }

    if (isEnv && method != 'vm') {
      tabs.push({
        key: 'environmentConfiguration',
        // tab: '环境配置',
        tab: formatMessage({id:'componentOverview.body.tab.bar.environmentConfiguration'})
      });
    }

    if (isRely) {
      tabs.push({
        key: 'relation',
        // tab: '依赖',
        tab: formatMessage({id:'componentOverview.body.tab.bar.relation'})
      });
    }

    if (isStorage) {
      tabs.push({
        key: 'mnt',
        // tab: '存储',
        tab: formatMessage({id:'componentOverview.body.tab.bar.mnt'})
      });
    }

    if (isPort) {
      tabs.push({
        key: 'port',
        // tab: '端口',
        tab: formatMessage({id:'componentOverview.body.tab.bar.port'})
      });
    }

    if (isPlugin && method != 'vm') {
      tabs.push({
        key: 'plugin',
        // tab: '插件',
        tab: formatMessage({id:'componentOverview.body.tab.bar.plugin'})
      });
    }

    if (isSource && method != 'vm') {
      tabs.push({
        key: 'resource',
        // tab: '构建源',
        tab: formatMessage({id:'componentOverview.body.tab.bar.resource'})
      });
    }

    if (isDeploytype || isCharacteristic || isHealth) {
      tabs.push({
        key: 'setting',
        // tab: '其他设置',
        tab: formatMessage({id:'componentOverview.body.tab.bar.setting'})
      });
    }
    const tabList = isShowThirdParty
      ? [
          {
            key: 'thirdPartyServices',
            // tab: '总览',
            tab: formatMessage({id:'componentOverview.body.tab.bar.overview'})
          },
          {
            key: 'port',
            // tab: '端口',
            tab: formatMessage({id:'componentOverview.body.tab.bar.port'})
          },
          {
            key: 'connectionInformation',
            // tab: '连接信息',
            tab: formatMessage({id:'componentOverview.body.tab.bar.connectionInformation'})
          },
          {
            key: 'members',
            // tab: '更多设置',
            tab: formatMessage({id:'componentOverview.body.tab.bar.members'})
          }
        ]
      : tabs;
    const  overviewTabs=[
      {
      key: 'overview',
      // tab: '总览',
      tab: formatMessage({id:'componentOverview.body.tab.bar.overview'})
      },
      {
        key: 'port',
        // tab: '端口',
        tab: formatMessage({id:'componentOverview.body.tab.bar.port'})
      },
      {
        key: 'connectionInformation',
        // tab: '连接信息',
        tab: formatMessage({id:'componentOverview.body.tab.bar.connectionInformation'})
      },
      {
        key: 'members',
        // tab: '更多设置',
        tab: formatMessage({id:'componentOverview.body.tab.bar.members'})
      }
  ]
    // const { service_source, language } = this.state;
    const map = {
      thirdPartyServices: ThirdPartyServices,
      connectionInformation: ConnectionInformation,
      members: Members,
      overview: isShowThirdParty ? ThirdPartyServices : Overview,
      monitor: Monitor,
      log: Log,
      expansion: Expansion,
      environmentConfiguration: EnvironmentConfiguration,
      relation: Relation,
      mnt: Mnt,
      port: Port,
      plugin: Plugin,
      resource: Resource,
      setting: Setting
    };
    let { type } = this.props.match.params;

    if (!type) {
      type = isShowThirdParty ? 'thirdPartyServices' : 'overview';
    }
    const Com = map[type];
    const formItemLayout = {
      labelCol: {
        span: 1
      },
      wrapperCol: {
        span: 23
      }
    };
    let breadcrumbList = [];
    breadcrumbList = createComponent(
      createApp(
        createTeam(
          createEnterprise(breadcrumbList, currentEnterprise),
          currentTeam,
          currentRegionName
        ),
        currentTeam,
        currentRegionName,
        {
          appName,
          appID: group_id
        }
      ),
      currentTeam,
      currentRegionName,
      {
        componentName,
        componentID: serviceAlias
      }
    );
    return (
      <ResumeContext.Provider value = {{loadBuildState: this.loadDetail }}>
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        action={action}
        title={this.renderTitle(componentName)}
        onTabChange={this.handleTabChange}
        tabActiveKey={type}
        tabList={tabsShow ? tabList : overviewTabs}
      >
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}

        {promptModal && (
          <Modal
            title={<FormattedMessage id="componentOverview.promptModal.tips"/>}
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
            <FormattedMessage id="componentOverview.promptModal.determine"/>{codeObj[promptModal]}<FormattedMessage id="componentOverview.promptModal.Current"/>
            </p>
          </Modal>
        )}
        <Modal
          title={[<span><FormattedMessage id="componentOverview.promptModal.Upgrade"/></span>]}
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
                    <FormattedMessage id="componentOverview.promptModal.cancel"/>
                  </Button>,
                  <Button
                    type="primary"
                    loading={deployLoading}
                    onClick={() => {
                      this.handleOkBuild();
                    }}
                  >
                    <FormattedMessage id="componentOverview.promptModal.build"/>
                  </Button>
                ]
              : isConstruct && [
                  <Button
                    onClick={() => {
                      this.handleCancelBuild();
                    }}
                  >
                    <FormattedMessage id="componentOverview.promptModal.cancel"/>
                  </Button>,
                  <Button
                    type="primary"
                    loading={deployLoading}
                    onClick={() => {
                      this.handleOkBuild();
                    }}
                  >
                    <FormattedMessage id="componentOverview.promptModal.Force_build"/>
                  </Button>
                ]
          }
        >
          <div>
            {BuildList && BuildList.length > 0 && isUpdate ? (
              <Form onSubmit={this.handleOkBuild}>
                <Alert
                  message={[
                    <span> <FormattedMessage id="componentOverview.promptModal.app"/></span>,
                    <a
                      onClick={() => {
                        this.hideMarketOpenAppDetail();
                      }}
                    >
                      {this.state.BuildText}
                    </a>,
                    <span><FormattedMessage id="componentOverview.promptModal.app_build"/></span>
                  ]}
                  type="success"
                  style={{ marginBottom: '5px' }}
                />
                <Form.Item {...formItemLayout} label="">
                  {getFieldDecorator('group_version', {
                    initialValue: BuildList[0],
                    rules: [{ required: true,  message:formatMessage({id:'componentOverview.promptModal.choice'})}]
                  })(
                    <RadioGroup>
                      {BuildList.map((item, index) => {
                        return (
                          <div>
                            <FormattedMessage id="componentOverview.promptModal.version"/>&nbsp;
                            <Radio key={index} value={item}>
                              <a>{item}</a><FormattedMessage id="componentOverview.promptModal.updata"/>
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
                message={<FormattedMessage id="componentOverview.promptModal.cloud"/>}
                type="success"
                style={{ marginBottom: '5px' }}
              />
            )}
          </div>
        </Modal>

        {Com ? (
          <Com
            method={method}
            groupDetail={groupDetail}
            appPermissions={appPermissions}
            componentPermissions={componentPermissions}
            timers={componentTimer}
            status={status}
            ref={this.saveRef}
            {...this.props.match.params}
            {...this.props}
            onshowDeployTips={msg => {
              this.handleshowDeployTips(msg);
            }}
            onshowRestartTips={msg => {
              this.handleshowRestartTips(msg);
            }}
            socket={this.socket}
            onChecked={this.handleChecked}
          />
        ) : (
          <FormattedMessage id="componentOverview.promptModal.error"/>
        )}

        {showDeleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            onCancel={this.cancelDeleteApp}
            loading={deleteAppLoading}
            title={<FormattedMessage id='confirmModal.assembly.delete.title'/>}
            desc={<FormattedMessage id='confirmModal.assembly.delete.desc'/>}
            subDesc={<FormattedMessage id='confirmModal.assembly.delete.subDesc'/>}
          />
        )}
        {showEditName && (
          <EditName
            loading={editNameLoading}
            name={componentName}
            onOk={this.handleEditName}
            onCancel={this.hideEditName}
            title={<FormattedMessage id="componentOverview.EditName.title"/>}
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
      </PageHeaderLayout>
      </ResumeContext.Provider>
    );
  }
}

@Form.create()
@connect(
  ({ teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
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
      componentPermissions: this.handlePermissions('queryComponentInfo'),
      appPermissions: this.handlePermissions('queryAppInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      componentPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  getAlias = () => {
    return this.props.match.params.appAlias;
  };
  componentDidMount() {}
  flash = () => {
    this.setState(
      {
        show: false
      },
      () => {
        this.setState({ show: true });
      }
    );
  };
  render() {
    // Switching applications show
    if (this.id !== this.getAlias()) {
      this.id = this.getAlias();
      this.flash();
    }
    if (!this.state.show) {
      return null;
    }
    return <Main {...this.props} {...this.state} />;
  }
}
