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
  Tooltip
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import styless from '../../components/CreateTeam/index.less';
import ManageAppGuide from '../../components/ManageAppGuide';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import VisitBtn from '../../components/VisitBtn';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { deploy, rollback, updateRolling } from '../../services/app';
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

const FormItem = Form.Item;
const { Option } = Select;
const RadioGroup = Radio.Group;

/* 转移到其他应用组 */
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
        notification.warning({ message: '不能选择当前所在组' });
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
        title="修改应用所属组"
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
                  message: '不能为空!'
                }
              ]
            })(
              <Select>
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

  render() {
    const { title, name, loading = false, form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        title={title || '修改组件名称'}
        visible
        className={styless.TelescopicModal}
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator('service_cname', {
              initialValue: name || '',
              rules: [
                {
                  required: true,
                  message: '不能为空!'
                }
              ]
            })(
              <Input
                placeholder={
                  title ? '请输入新的组件名称' : '请输入新的应用名称'
                }
              />
            )}
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
    deployLoading: loading.effects['appControl/putDeploy'],
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
      componentTimer: true
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

  getAppAlias() {
    return this.props.match.params.appAlias;
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
    const { componentTimer } = this.state;
    this.props.dispatch({
      type: 'appControl/fetchComponentState',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: res => {
        if (res && res._code === 200) {
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
  handleError = err => {
    const { componentTimer } = this.state;
    const { appDetail, dispatch } = this.props;
    if (!componentTimer) {
      return null;
    }
    if (err && err.status === 404) {
      this.closeComponentTimer();
      if (!this.destroy) {
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
              appDetail.service.group_id
            }`
          )
        );
      }
      return null;
    }
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: `请求错误`,
        description: err.data.msg_show
      });
    }
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
    const { dispatch, match } = this.props;
    const { appAlias } = match.params;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${appAlias}/${key}`
      )
    );
  };

  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };

  loadBuildState = appDetail => {
    if (
      appDetail &&
      appDetail.service &&
      appDetail.service.service_source === 'market'
    ) {
      const serviceAlias = appDetail.service.service_alias;
      this.props.dispatch({
        type: 'appControl/getBuildInformation',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: serviceAlias
        },
        callback: res => {
          if (res && res._code == 200) {
            this.setState({
              BuildState:
                res.list && res.list.length > 0 ? res.list.length : null
            });
          }
        }
      });
    }
  };
  loadDetail = () => {
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: appDetail => {
        this.loadBuildState(appDetail);
        if (appDetail.service.service_source) {
          this.setState({
            isShowThirdParty: appDetail.is_third ? appDetail.is_third : false
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
          } else if (!appUtil.isCreateFromCompose(appDetail)) {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${
                  appDetail.service.service_alias
                }`
              )
            );
          } else {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-compose-check/${
                  appDetail.service.group_id
                }/${appDetail.service.compose_id}`
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
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
            )
          );
        }
        return null;
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
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    dispatch({
      type: 'appControl/putDeploy',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias(),
        group_version: groupVersion || '',
        is_upgrate: build_upgrade
      },
      callback: res => {
        if (res) {
          this.handleCancelBuild();
          this.loadBuildState(appDetail);
          notification.success({ message: `操作成功，部署中` });
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
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    rollback({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias(),
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
              ? `操作成功，升级中`
              : `操作成功，回滚中`
            : `操作成功，回滚中`
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
    const teamName = globalUtil.getCurrTeamName();
    const { dispatch, appDetail } = this.props;
    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name: teamName,
        app_alias: this.getAppAlias()
      },
      callback: () => {
        this.closeComponentTimer();
        this.cancelDeleteApp(false);
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: teamName
          }
        });
        dispatch(
          routerRedux.replace(
            `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${
              appDetail.service.group_id
            }`
          )
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
    const team_name = globalUtil.getCurrTeamName();
    const { appDetail, dispatch } = this.props;
    const serviceAlias = appDetail.service.service_alias;
    dispatch({
      type: 'appControl/editName',
      payload: {
        team_name,
        app_alias: serviceAlias,
        ...data
      },
      callback: () => {
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
    const team_name = globalUtil.getCurrTeamName();
    const { appDetail, dispatch } = this.props;
    const serviceAlias = appDetail.service.service_alias;
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
        notification.success({ message: '操作成功' });
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
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    const operationMap = {
      putReStart: '操作成功，重启中',
      putStart: '操作成功，启动中',
      putStop: '操作成功，关闭中',
      putUpdateRolling: '操作成功，更新中'
    };
    dispatch({
      type: `appControl/${state}`,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
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
    this.props.dispatch({
      type: 'appControl/changeApplicationState',
      payload: {
        build_upgrade: value,
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: data => {
        if (data) {
          notification.info({ message: '修改成功' });
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
  handleOpenBuild = () => {
    const { appDetail, dispatch } = this.props;
    const serviceAlias = appDetail.service.service_alias;
    const buildType = appDetail.service.service_source;
    const text = appDetail.rain_app_name;
    const { status } = this.state;
    if (buildType == 'market' && status && status.status != 'undeploy') {
      dispatch({
        type: 'appControl/getBuildInformation',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: serviceAlias
        },
        callback: res => {
          if (res && res._code == 200) {
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
    const { appDetail } = this.props;
    this.props.dispatch(
      routerRedux.replace(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
          appDetail.service.service_alias
        }/webconsole`
      )
    );
  };
  renderTitle(name) {
    const {
      appDetail,
      componentPermissions: { isRestart, isStop, isDelete, isEdit },
      appPermissions: { isEdit: isAppEdit }
    } = this.props;
    const { status, isShowThirdParty } = this.state;

    return (
      <Fragment>
        <div style={{ display: 'flex' }}>
          <div style={{ marginTop: '3px' }}>
            {globalUtil.fetchSvg('component')}
          </div>
          <div style={{ marginLeft: '14px' }}>
            <div className={styles.contentTitle}>
              {name || '-'}
              {isEdit && (
                <Icon
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={this.showEditName}
                  type="edit"
                />
              )}
            </div>

            <div className={styles.content_Box}>
              {!appDetail.is_third && isRestart && (
                <a
                  onClick={() => {
                    if (appStatusUtil.canRestart(status)) {
                      this.handleDropClick('restart');
                    }
                  }}
                  style={{
                    cursor: !appStatusUtil.canRestart(status)
                      ? 'no-drop'
                      : 'pointer'
                  }}
                >
                  重启
                </a>
              )}
              {!appDetail.is_third && isRestart && <Divider type="vertical" />}

              {isStop &&
              !appStatusUtil.canStart(status) &&
              !isShowThirdParty ? (
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
                    关闭
                  </a>
                  <Divider type="vertical" />
                </span>
              ) : isStop &&
                status &&
                status.status &&
                status.status == 'upgrade' ? (
                <span>
                  <a
                    onClick={() => {
                      this.handleOpenHelpfulHints('stop');
                    }}
                  >
                    关闭
                  </a>
                  <Divider type="vertical" />
                </span>
              ) : null}

              {isAppEdit && (
                <a
                  onClick={() => {
                    this.handleDropClick('moveGroup');
                  }}
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  修改所属应用
                </a>
              )}
              {isEdit && <Divider type="vertical" />}
              {isDelete && (
                <a
                  onClick={() => {
                    this.handleDropClick('deleteApp');
                  }}
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  删除
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
      buildInformationLoading
    } = this.props;
    const {
      BuildList,
      componentTimer,
      isShowThirdParty,
      status,
      promptModal,
      showDeleteApp,
      showEditName,
      showMoveGroup
    } = this.state;
    const { getFieldDecorator } = form;
    const codeObj = {
      start: '启动',
      restart: '重启',
      stop: '关闭',
      deploy: '构建',
      rolling: '更新(滚动）'
    };
    if (!appDetail.service) {
      return null;
    }
    const appAlias = this.getAppAlias();
    const visitBtns = (
      <VisitBtn
        timers={componentTimer}
        btntype="primary"
        app_alias={appAlias}
      />
    );

    if (!status.status) {
      return null;
    }

    const action = (
      <div>
        {isStart && !isShowThirdParty && !appStatusUtil.canStop(status) && (
          <Button
            disabled={!appStatusUtil.canStart(status)}
            onClick={() => {
              this.handleOpenHelpfulHints('start');
            }}
          >
            启动
          </Button>
        )}

        {isVisitWebTerminal && !isShowThirdParty && (
          <Button>
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                appDetail.service.service_alias
              }/webconsole`}
              target="_blank"
            >
              Web终端
            </Link>
          </Button>
        )}

        {isShowThirdParty ? (
          ''
        ) : this.state.BuildState && isConstruct ? (
          <Tooltip title="有新版本">
            <Button
              onClick={this.handleOpenBuild}
              loading={buildInformationLoading}
            >
              <Badge
                className={styles.badge}
                status="success"
                text=""
                count="有更新版本"
                title="有更新版本"
              />
              构建
            </Button>
          </Tooltip>
        ) : status && status.status == 'undeploy' && isConstruct ? (
          <Button
            onClick={this.handleOpenBuild}
            loading={buildInformationLoading}
          >
            构建
          </Button>
        ) : (
          isConstruct && (
            <Button
              onClick={this.handleOpenBuild}
              loading={buildInformationLoading}
            >
              构建
            </Button>
          )
        )}

        {status.status == 'undeploy' ||
        status.status == 'closed' ||
        status.status == 'stopping' ||
        isShowThirdParty
          ? ''
          : isUpdate && (
              <Button
                onClick={() => {
                  this.handleOpenHelpfulHints('rolling');
                }}
              >
                更新(滚动)
              </Button>
            )}

        {appDetail.service.service_source == 'market' &&
          appStatusUtil.canVisit(status) &&
          !isShowThirdParty &&
          isAccess &&
          visitBtns}
        {appDetail.service.service_source != 'market' &&
          appStatusUtil.canVisit(status) &&
          !isShowThirdParty &&
          isAccess &&
          visitBtns}
        {isShowThirdParty && isAccess && visitBtns}

        {/* {(appDetail.service.service_source == "market" && appStatusUtil.canVisit(status)) && (<VisitBtn btntype="primary" app_alias={appAlias} />)} */}
      </div>
    );
    const tabs = [
      {
        key: 'overview',
        tab: '总览'
      },
      {
        key: 'monitor',
        tab: '监控'
      },
      {
        key: 'log',
        tab: '日志'
      }
    ];

    if (isTelescopic) {
      tabs.push({
        key: 'expansion',
        tab: '伸缩'
      });
    }

    if (isEnv) {
      tabs.push({
        key: 'environmentConfiguration',
        tab: '环境配置'
      });
    }

    if (isRely) {
      tabs.push({
        key: 'relation',
        tab: '依赖'
      });
    }

    if (isStorage) {
      tabs.push({
        key: 'mnt',
        tab: '存储'
      });
    }

    if (isPort) {
      tabs.push({
        key: 'port',
        tab: '端口'
      });
    }

    if (isPlugin) {
      tabs.push({
        key: 'plugin',
        tab: '插件'
      });
    }

    if (isSource) {
      tabs.push({
        key: 'resource',
        tab: '构建源'
      });
    }

    if (isDeploytype || isCharacteristic || isHealth) {
      tabs.push({
        key: 'setting',
        tab: '其他设置'
      });
    }

    const tabList = isShowThirdParty
      ? [
          {
            key: 'thirdPartyServices',
            tab: '总览'
          },
          {
            key: 'port',
            tab: '端口'
          },
          {
            key: 'connectionInformation',
            tab: '连接信息'
          },
          {
            key: 'members',
            tab: '更多设置'
          }
        ]
      : tabs;
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
          appName: appDetail.service.group_name,
          appID: appDetail.service.group_id
        }
      ),
      currentTeam,
      currentRegionName,
      {
        componentName: appDetail.service.service_cname,
        componentID: appDetail.service.service_alias
      }
    );
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        action={action}
        title={this.renderTitle(appDetail.service.service_cname)}
        onTabChange={this.handleTabChange}
        tabActiveKey={type}
        tabList={tabList}
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
            title="友情提示"
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
              确定{codeObj[promptModal]}当前组件？
            </p>
          </Modal>
        )}
        <Modal
          title={[<span>从云市应用构建</span>]}
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
                    取消
                  </Button>,
                  <Button
                    type="primary"
                    loading={deployLoading}
                    onClick={() => {
                      this.handleOkBuild();
                    }}
                  >
                    构建
                  </Button>
                ]
              : isConstruct && [
                  <Button
                    onClick={() => {
                      this.handleCancelBuild();
                    }}
                  >
                    取消
                  </Button>,
                  <Button
                    type="primary"
                    loading={deployLoading}
                    onClick={() => {
                      this.handleOkBuild();
                    }}
                  >
                    强制构建
                  </Button>
                ]
          }
        >
          <div>
            {BuildList && BuildList.length > 0 && isUpdate ? (
              <Form onSubmit={this.handleOkBuild}>
                <Alert
                  message={[
                    <span>从云市应用</span>,
                    <a
                      onClick={() => {
                        this.hideMarketOpenAppDetail();
                      }}
                    >
                      {this.state.BuildText}
                    </a>,
                    <span>构建而来,当前云市应用版本有更新!</span>
                  ]}
                  type="success"
                  style={{ marginBottom: '5px' }}
                />
                <Form.Item {...formItemLayout} label="">
                  {getFieldDecorator('group_version', {
                    initialValue: BuildList[0],
                    rules: [{ required: true, message: '选择版本' }]
                  })(
                    <RadioGroup>
                      {BuildList.map((item, index) => {
                        return (
                          <div>
                            版本:&nbsp;
                            <Radio key={index} value={item}>
                              <a>{item}</a>可更新
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
                message="云市应用暂未有新版本更新，您无需构建。"
                type="success"
                style={{ marginBottom: '5px' }}
              />
            )}
          </div>
        </Modal>

        {Com ? (
          <Com
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
          '参数错误'
        )}

        {showDeleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            onCancel={this.cancelDeleteApp}
            loading={deleteAppLoading}
            title="删除组件"
            desc="确定要删除此组件吗？"
            subDesc="此操作不可恢复"
          />
        )}
        {showEditName && (
          <EditName
            loading={editNameLoading}
            name={appDetail.service.service_cname}
            onOk={this.handleEditName}
            onCancel={this.hideEditName}
            title="修改组件名称"
          />
        )}
        {showMoveGroup && (
          <MoveGroup
            loading={moveGroupLoading}
            currGroup={appDetail.service.group_id}
            groups={groups}
            onOk={this.handleMoveGroup}
            onCancel={this.hideMoveGroup}
          />
        )}
        <ManageAppGuide />
      </PageHeaderLayout>
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
