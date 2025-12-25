/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
import {
  Button,
  Card,
  Form,
  Modal,
  notification,
  Popconfirm,
  Radio,
  Switch
} from 'antd';
import { connect } from 'dva';
import React, { Fragment } from 'react';
import { FormattedMessage } from 'umi';
import ConfirmModal from '../../components/ConfirmModal';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import NoPermTip from '../../components/NoPermTip';
import SetMemberAppAction from '../../components/SetMemberAppAction';
import appProbeUtil from '../../utils/appProbe-util';
import appStatusUtil from '../../utils/appStatus-util';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import role from '@/utils/newRole';
import styles from './resource.less';
import Kubernetes from './kubernets';
import AddTag from './setting/add-tag';
import EditHealthCheck from './setting/edit-health-check';
import EditRunHealthCheck from './setting/edit-run-health-check';
import AddVarModal from './setting/env';
import ViewHealthCheck from './setting/health-check';
import EditActions from './setting/perm';
import ViewRunHealthCheck from './setting/run-health-check';
import Strategy from './strategy';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@connect(
  ({ user, appControl, teamControl, global }) => ({
    currUser: user.currentUser,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    appDetail: appControl.appDetail,
    teamControl,
    rainbondInfo: global.rainbondInfo
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      isShow: false,
      showAddVar: false,
      showEditVar: null,
      deleteVar: null,
      transfer: null,
      viewStartHealth: null,
      editStartHealth: null,
      viewRunHealth: null,
      editRunHealth: null,
      addTag: false,
      tabData: [],
      showAddMember: false,
      toEditAction: null,
      memberslist: null,
      showMarketAppDetail: false,
      showApp: {},
      // appStatus: null,
      visibleAppSetting: false,
      tags: [],
      page: 1,
      page_size: 5,
      env_name: '',
      loading: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
    };
  }
  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.fetchInnerEnvs();
    this.fetchStartProbe();
    this.fetchRunningProbe();
    this.fetchPorts();
    this.fetchBaseInfo();
    this.fetchTags();
    this.loadMembers();
    // this.loadBuildSourceInfo();
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: 'appControl/clearTags' });
    dispatch({ type: 'appControl/clearPorts' });
    dispatch({ type: 'appControl/clearInnerEnvs' });
    dispatch({ type: 'appControl/clearStartProbe' });
    dispatch({ type: 'appControl/clearRunningProbe' });
    dispatch({ type: 'appControl/clearMembers' });
  }

  onTransfer = data => {
    this.setState({ transfer: data });
  };

  onDeleteVar = data => {
    this.setState({ deleteVar: data });
  };
  fetchBaseInfo = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  fetchPorts = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  fetchTags = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchTags',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ tags: data.used_labels });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  // 变量信息
  fetchInnerEnvs = () => {
    const { dispatch, appAlias } = this.props;
    const { page, page_size, env_name } = this.state;
    dispatch({
      type: 'appControl/fetchInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        page,
        page_size,
        env_name
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  fetchStartProbe() {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  }
  fetchRunningProbe() {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchRunningProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  }
  loadMembers = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'teamControl/fetchMember',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ memberslist: data.list });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };
  handleAddMember = values => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/setMemberAction',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ...values
      },
      callback: () => {
        this.loadMembers();
        this.hideAddMember();
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  handleSubmitAddVar = vals => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/addInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.handleCancelAddVar();
        this.fetchInnerEnvs();
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: {isOtherSetting }
    } = this.props;
    return isOtherSetting;
  }
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  cancelTransfer = () => {
    this.setState({ transfer: null });
  };

  handleDeleteVar = () => {
    const { dispatch, appAlias, onshowRestartTips } = this.props;
    const { deleteVar } = this.state;
    dispatch({
      type: 'appControl/deleteEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ID: deleteVar.ID
      },
      callback: () => {
        this.cancelDeleteVar();
        this.fetchInnerEnvs();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
        onshowRestartTips(true);
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  handleTransfer = () => {
    const { dispatch, appAlias } = this.props;
    const { transfer } = this.state;
    dispatch({
      type: 'appControl/putTransfer',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ID: transfer.ID,
        scope: transfer.scope == 'inner' ? 'outer' : 'inner'
      },
      callback: () => {
        this.cancelTransfer();
        this.fetchInnerEnvs();
        notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) });
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  onEditVar = data => {
    this.setState({ showEditVar: data });
  };
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleEditVar = vals => {
    const { dispatch, appAlias } = this.props;
    const { showEditVar } = this.state;
    dispatch({
      type: 'appControl/editEvns',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.cancelEditVar();
        this.fetchInnerEnvs();
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleStartProbeStart = isUsed => {
    const { dispatch, appAlias, startProbe } = this.props;
    dispatch({
      type: 'appControl/editStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ...startProbe,
        is_used: isUsed
      },
      callback: res => {
        if (res?.status_code === 200) {
          this.fetchStartProbe();
          if (isUsed) {
            notification.success({ message: formatMessage({ id: 'notification.success.assembly_start' }) });
          } else {
            notification.success({ message: formatMessage({ id: 'notification.success.assembly_disable' }) });
          }
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleRunProbeStart = isUsed => {
    const { dispatch, appAlias, runningProbe } = this.props;
    dispatch({
      type: 'appControl/editRunProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        ...runningProbe,
        is_used: isUsed
      },
      callback: () => {
        this.fetchRunningProbe();
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  handleEditHealth = vals => {
    const { dispatch, appAlias, startProbe } = this.props;
    const { editStartHealth } = this.state;
    this.setState({ loading: true });

    if (appProbeUtil.isStartProbeUsed(editStartHealth)) {
      dispatch({
        type: 'appControl/editStartProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          ...vals,
          old_mode: startProbe.mode
        },
        callback: res => {
          if (res?.status_code === 200) {
            this.onCancelEditStartProbe();
            this.fetchStartProbe();
            notification.success({ message: formatMessage({ id: 'notification.success.assembly_edit' }) });
          }
        },
        handleError: (err) => {
          this.setState({ loading: false });
          handleAPIError(err);
        }
      });
    } else {
      dispatch({
        type: 'appControl/addStartProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          ...vals
        },
        callback: res => {
          if (res?.status_code === 200) {
            this.onCancelEditStartProbe();
            this.fetchStartProbe();
            notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
            notification.info({ message: formatMessage({ id: 'notification.hint.need_updata' }) });
          }
        },
        handleError: (err) => {
          this.setState({ loading: false });
          handleAPIError(err);
        }
      });
    }
  };
  handleEditRunHealth = vals => {
    const { dispatch, appAlias } = this.props;
    const { editRunHealth } = this.state;

    if (appProbeUtil.isRunningProbeUsed(editRunHealth)) {
      dispatch({
        type: 'appControl/editRunProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        },
        handleError: (err) => {
          handleAPIError(err);
        }
      });
    } else {
      dispatch({
        type: 'appControl/addRunProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        },
        handleError: (err) => {
          handleAPIError(err);
        }
      });
    }
  };
  showViewStartHealth = data => {
    this.setState({ viewStartHealth: data });
  };
  hiddenViewStartHealth = () => {
    this.setState({ viewStartHealth: null });
  };
  showViewRunningHealth = data => {
    this.setState({ viewRunHealth: data });
  };
  hiddenViewRunningHealth = () => {
    this.setState({ viewRunHealth: null });
  };
  onCancelEditStartProbe = () => {
    this.setState({ editStartHealth: null, loading: false });
  };
  onCancelEditRunProbe = () => {
    this.setState({ editRunHealth: null });
  };
  handleRemoveTag = tag => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/deleteTag',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        label_id: tag.label_id
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
        this.fetchTags();
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  onAddTag = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/getTagInformation',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: data => {
        if (data) {
          this.setState({
            addTag: true,
            tabData: data.list
          });
        }
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  cancelAddTag = () => {
    this.setState({ addTag: false, tabData: [] });
  };
  handleAddTag = tags => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/addTag',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        label_ids: tags
      },
      callback: () => {
        this.cancelAddTag();
        notification.success({ message: formatMessage({ id: 'notification.success.assembly_add' }) });
        this.fetchTags();
        this.setState({ tabData: [] });
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  onEditAction = member => {
    this.setState({ toEditAction: member });
  };
  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };
  handleEditAction = value => {
    const { dispatch, appAlias } = this.props;
    const { toEditAction } = this.state;
    dispatch({
      type: 'appControl/editMemberAction',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        user_id: toEditAction.user_id,
        app_alias: appAlias,
        ...value
      },
      callback: () => {
        this.loadMembers();
        this.hideEditAction();
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };

  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  updateComponentDetail = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: appDetail => {
        this.setState({ currentComponent: appDetail.service });
      },
      handleError: (err) => {
        handleAPIError(err);
      }
    });
  };
  setupAttribute = () => {
    if (appStatusUtil.canVisit(this.props.status)) {
      notification.warning({ message: formatMessage({ id: 'notification.warn.assembly_close' }) });
      return;
    }
    this.setState({
      visibleAppSetting: true
    });
  };
  handleOk_AppSetting = () => {
    const { dispatch, appAlias, form } = this.props;

    form.validateFields((err, values) => {
      if (!err) {
        dispatch({
          type: 'appControl/updateComponentDeployType',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            app_alias: appAlias,
            extend_method: values.extend_method
          },
          callback: data => {
            if (data) {
              notification.success({ message: data.msg_show || formatMessage({ id: 'notification.success.modified' }) });
              this.setState(
                {
                  visibleAppSetting: false,
                  isShow: false
                },
                () => {
                  this.fetchBaseInfo();
                  this.updateComponentDetail();
                }
              );
            }
          },
          handleError: (err) => {
            handleAPIError(err);
          }
        });
      }
    });
  };
  handleChange = checked => {
    const { onChecked } = this.props;
    if (onChecked) {
      onChecked(checked);
      setTimeout(() => {
        this.fetchBaseInfo();
      }, 1000);
    }
  };
  handleCancel_AppSetting = () => {
    this.setState({
      visibleAppSetting: false,
      isShow: false
    });
  };

  onChange1 = e => {
    const show =
      e.target.value !=
      (this.props.baseInfo && this.props.baseInfo.extend_method || 'stateless_multiple');
    this.setState({
      isShow: show
    });
  };

  handleState = data => {
    if (appProbeUtil.isStartProbeUsed(data)) {
      if (appProbeUtil.isStartProbeStart(data)) {
        return `${formatMessage({ id: 'componentOverview.body.setting.Enabled' })}`;
      }
      return `${formatMessage({ id: 'componentOverview.body.setting.disabled' })}`;
    }
    return `${formatMessage({ id: 'componentOverview.body.setting.Not_set' })}`;
  };

  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  handleSearch = env_name => {
    this.setState(
      {
        page: 1,
        env_name
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  render() {
    if (!this.canView()) return <NoPermTip />;
    const {
      startProbe,
      ports,
      baseInfo,
      teamControl,
      form,
      componentPermissions: { isOtherSetting },
      appDetail,
      method,
      currUser,
      rainbondInfo
    } = this.props;
    if(!isOtherSetting){
      return role.noPermission()
    }
    const extend_methods = this.props && this.props.baseInfo && this.props.baseInfo.extend_method || 'stateless_multiple'
    const { viewStartHealth, tags, tabData, isShow, loading, language } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout
    const showSecurityRestrictions = !rainbondInfo?.security_restrictions?.enable
    const appsetting_formItemLayout = {
      wrapperCol: {
        span: 24
      }
    };
    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px'
    };

    if (typeof baseInfo.build_upgrade !== 'boolean') {
      return null;
    }
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24
          }}
          title={<FormattedMessage id='componentOverview.body.setting.information' />}
          className={styles.tabsCard}
            bodyStyle={{padding:12}}
        >
          {method != 'vm' ? (
            <Form>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...is_language}
                label={<FormattedMessage id='componentOverview.body.setting.time' />}
              >
                {baseInfo.create_time || ''}
              </FormItem>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...is_language}
                label={<FormattedMessage id='componentOverview.body.setting.type' />}
              >
                {extend_methods && globalUtil.getComponentType(extend_methods)}
                  <Button
                    onClick={this.setupAttribute}
                    size="small"
                    style={{ marginLeft: '10px' }}
                  >
                    <FormattedMessage id='componentOverview.body.setting.change' />
                  </Button>
              </FormItem>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...is_language}
                label={<FormattedMessage id='componentOverview.body.setting.upgrade' />}
              >
                <Switch
                  defaultChecked={baseInfo.build_upgrade}
                  onChange={this.handleChange}
                />
              </FormItem>
            </Form>
          ) : (
            <Form>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...is_language}
                label={<FormattedMessage id='componentOverview.body.setting.time' />}
              >
                {baseInfo.create_time || ''}
              </FormItem>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...is_language}
                label={<FormattedMessage id='componentOverview.body.setting.type' />}
              >
                {formatMessage({id:'Vm.createVm.vm'})}
              </FormItem>
            </Form>
          )}
        </Card>

          <Card
            style={{
              marginBottom: 24
            }}
            bodyStyle={{padding:12}}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormattedMessage id='componentOverview.body.setting.health' />
                {startProbe && (
                  <div>
                    <Button
                      onClick={() => {
                        this.setState({ editStartHealth: startProbe });
                      }}
                      style={{
                        marginRight: '5px',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                      icon='form'
                    >
                      {JSON.stringify(startProbe) != '{}' ? <FormattedMessage id='componentOverview.body.setting.edit' /> : <FormattedMessage id='componentOverview.body.setting.set' />}
                    </Button>

                    {JSON.stringify(startProbe) != '{}' &&
                      appProbeUtil.isStartProbeStart(startProbe) ? (
                      <Button
                        onClick={() => {
                          this.handleStartProbeStart(false);
                        }}
                        style={{ fontSize: '14px', fontWeight: 400 }}
                        icon='stop'
                      >
                        <FormattedMessage id='componentOverview.body.setting.Disable' />
                      </Button>
                    ) : (
                      JSON.stringify(startProbe) != '{}' && (
                        <Button
                          onClick={() => {
                            this.handleStartProbeStart(true);
                          }}
                          style={{ fontSize: '14px', fontWeight: 400 }}
                          icon='play-square'
                        >
                          <FormattedMessage id='componentOverview.body.setting.Enable' />
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            }
          >
            {startProbe && (
              <div style={{ display: 'flex' }} className={styles.healthy}>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  <FormattedMessage id='componentOverview.body.setting.state' />{this.handleState(startProbe)}
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  <FormattedMessage id='componentOverview.body.setting.method' />{startProbe.scheme ? startProbe.scheme : <FormattedMessage id='componentOverview.body.setting.Not_set' />}
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  <FormattedMessage id='componentOverview.body.setting.unhealth' />
                  {startProbe.mode === 'readiness'
                    ? <FormattedMessage id='componentOverview.body.setting.OfflineOffline' />
                    : startProbe.mode === 'liveness'
                      ? <FormattedMessage id='componentOverview.body.setting.restart' />
                      : <FormattedMessage id='componentOverview.body.setting.Not_set' />}
                </div>
              </div>
            )}
          </Card>
        {((appDetail && appDetail.service && appDetail.service.extend_method) === 'job' ||
          (appDetail && appDetail.service && appDetail.service.extend_method) === 'cronjob') && (
            <Strategy
              extend_method={appDetail.service.extend_method}
              service_alias={appDetail && appDetail.service && appDetail.service.service_alias}
            />
          )}
          {(currUser.is_enterprise_admin || showSecurityRestrictions) && (
            <Kubernetes
              service_alias={appDetail && appDetail.service && appDetail.service.service_alias}
              extend_method={appDetail.service.extend_method}
            />
          )}
        {this.state.addTag && (
          <AddTag
            tags={tabData || []}
            onCancel={this.cancelAddTag}
            onOk={this.handleAddTag}
          />
        )}
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}

        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title={<FormattedMessage id='confirmModal.deldete.env.title' />}
            desc={<FormattedMessage id='confirmModal.deldete.env.desc' />}
            subDesc={<FormattedMessage id='confirmModal.deldete.env.subDesc' />}
          />
        )}

        {this.state.transfer && (
          <ConfirmModal
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title={<FormattedMessage id='confirmModal.deldete.transfer.title' />}
            desc={<FormattedMessage id='confirmModal.deldete.transfer.determine' />}
            subDesc=""
          />
        )}

        {viewStartHealth && (
          <ViewHealthCheck
            title={<FormattedMessage id='componentOverview.body.setting.health_examination' />}
            data={viewStartHealth}
            onCancel={() => {
              this.setState({ viewStartHealth: null });
            }}
          />
        )}
        {this.state.editStartHealth && (
          <EditHealthCheck
            ports={ports}
            onOk={this.handleEditHealth}
            title={<FormattedMessage id='componentOverview.body.setting.health' />}
            data={this.state.editStartHealth}
            onCancel={this.onCancelEditStartProbe}
            loading={loading}
          />
        )}
        {this.state.toEditAction && (
          <EditActions
            onSubmit={this.handleEditAction}
            onCancel={this.hideEditAction}
            actions={teamControl.actions}
            value={this.state.toEditAction.service_perms.map(item => item.id)}
          />
        )}
        {this.state.viewRunHealth && (
          <ViewRunHealthCheck
            title={<FormattedMessage id='componentOverview.body.setting.see' />}
            data={this.state.viewRunHealth}
            onCancel={() => {
              this.setState({ viewRunHealth: null });
            }}
          />
        )}
        {this.state.editRunHealth && (
          <EditRunHealthCheck
            ports={ports}
            onOk={this.handleEditRunHealth}
            title={<FormattedMessage id='componentOverview.body.setting.inspect' />}
            data={this.state.editRunHealth}
            onCancel={this.onCancelEditRunProbe}
          />
        )}
        {this.state.showAddMember && (
          <SetMemberAppAction
            members={this.state.memberslist}
            actions={teamControl.actions}
            onOk={this.handleAddMember}
            onCancel={this.hideAddMember}
          />
        )}

        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
        {this.state.visibleAppSetting && (
          <Modal
            title={<FormattedMessage id='componentOverview.body.setting.deployment' />}
            visible={this.state.visibleAppSetting}
            // onOk={this.handleOk_AppSetting}
            width={600}
            onCancel={this.handleCancel_AppSetting}
            footer={
              isShow ? (
                [
                  <Popconfirm
                    title={<FormattedMessage id='componentOverview.body.setting.Modify' />}
                    onConfirm={this.handleOk_AppSetting}
                    onCancel={this.handleCancel_AppSetting}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="primary"><FormattedMessage id='componentOverview.body.setting.determine' /></Button>
                  </Popconfirm>,
                  <Button onClick={this.handleCancel_AppSetting}><FormattedMessage id='componentOverview.body.setting.cancel' /></Button>
                ]
              ) : (
                <div>
                  <Button type="primary" onClick={this.handleCancel_AppSetting}>
                    <FormattedMessage id='componentOverview.body.setting.determine' />
                  </Button>
                  <Button onClick={this.handleCancel_AppSetting}><FormattedMessage id='componentOverview.body.setting.cancel' /></Button>
                </div>
              )
            }
          >
            <Form.Item {...appsetting_formItemLayout}>
              {getFieldDecorator('extend_method', {
                initialValue: extend_methods || 'stateless_multiple',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'componentOverview.body.setting.select' }),
                  }
                ]
              })(
                <RadioGroup onChange={this.onChange1}>
                  {globalUtil.getSupportComponentTyps().map(item => {
                    return (
                      <div key={item.type}>
                        <Radio style={radioStyle} value={item.type}>
                          {item.name}
                        </Radio>
                        <p style={{ color: '#999999', paddingLeft: '26px' }}>
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            </Form.Item>
          </Modal>
        )}
      </Fragment>
    );
  }
}
