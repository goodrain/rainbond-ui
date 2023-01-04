/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-danger */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { Button, Card, Icon, Modal, notification, Radio, Tooltip } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import LogProcress from '../../components/LogProcress';
import Result from '../../components/Result';
import ShowRegionKey from '../../components/ShowRegionKey';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  buildApp,
  getCheckuuid,
  getCreateCheckId,
  getCreateCheckResult,
} from '../../services/createApp';
import globalUtil from '../../utils/global';
import regionUtil from '../../utils/region';
import roleUtil from '../../utils/role';
import userUtil from '../../utils/user';
import ModifyImageCmd from './modify-image-cmd';
import ModifyImageName from './modify-image-name';
import ModifyUrl from './modify-url';

@connect(
  ({ user, appControl, teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    soundCodeLanguage: teamControl.codeLanguage,
  }),
  null,
  null,
  { withRef: true }
)
export default class CreateCheck extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // failure、checking、success
      appPermissions: this.handlePermissions('queryAppInfo'),
      status: '',
      checkUuid: '',
      errorInfo: [],
      serviceInfo: [],
      eventId: '',
      appDetail: {},
      deleteLoading: false,
      showDelete: false,
      modifyUrl: false,
      modifyUserpass: false,
      modifyImageName: false,
      modifyImageCmd: false,
      isDeploy: true,
      ServiceGetData: props.ServiceGetData ? props.ServiceGetData : null,
      buildAppLoading: false,
      isMulti: false,
      packageLange: 'npm',
      codeLanguage: '',
      source_from: '',
      ports: '',
    };
    this.mount = false;
    this.socketUrl = '';
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(
      this.props.currUser,
      teamName,
      regionName
    );
    if (region) {
      this.socketUrl = regionUtil.getEventWebSocketUrl(region);
    }
  }
  componentDidMount() {
    this.mount = true;
    this.getDetail();
    this.bindEvent();
  }
  componentWillUnmount() {
    this.mount = false;
    this.unbindEvent();
  }

  getParameter = () => {
    const { ServiceGetData } = this.state;
    return {
      appAlias: ServiceGetData || this.props.match.params.appAlias,
      teamName: globalUtil.getCurrTeamName(),
      regionName: globalUtil.getCurrRegionName()
    };
  };

  getDetail = () => {
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: appDetail => {
        if (appDetail) {
          this.setState({ appDetail: appDetail.service });
          this.getCheckuuid();
        }
      }
    });
  };
  getCheckuuid = () => {
    const appAlias = this.getAppAlias();
    const teamName = globalUtil.getCurrTeamName();
    getCheckuuid({ team_name: teamName, app_alias: appAlias }).then(data => {
      if (data) {
        if (!data.bean.check_uuid) {
          this.startCheck();
        } else {
          this.setState(
            {
              checkUuid: data.bean.check_uuid
            },
            () => {
              this.loopStatus();
            }
          );
        }
      }
    });
  };

  getAppAlias() {
    const { ServiceGetData } = this.state;
    return ServiceGetData || this.props.match.params.appAlias;
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  handleJump = targets => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.getParameter();
    dispatch(
      routerRedux.replace(`/team/${teamName}/region/${regionName}/${targets}`)
    );
  };
  loopStatus = () => {
    if (!this.mount) return;
    const eventId = this.props.location &&
      this.props.location.query &&
      this.props.location.query.event_id ||
      this.props.event_id
    const appAlias = this.getAppAlias();
    const teamName = globalUtil.getCurrTeamName();
    getCreateCheckResult({
      team_name: teamName,
      app_alias: appAlias,
      check_uuid: this.state.checkUuid,
      event_id: eventId
    })
      .then(data => {
        if (data && this.mount) {
          const status = data.bean.check_status;
          const errorInfos = data.bean.error_infos || [];
          const serviceInfo = data.bean.service_info || [];
          serviceInfo.map((item) => {
            if (item.type == 'language') {
              this.props.dispatch({
                type: 'teamControl/ChoosingLanguage',
                payload: item.value,
              });
              this.props.dispatch({
                type: 'teamControl/ChoosingPackage',
                payload: 'npm',
              });
              this.setState({
                codeLanguage: item.value
              })
            } else if (item.type == 'source_from') {
              this.setState({
                source_from: item.value
              })
            } else {
              this.setState({
                ports: item.value
              })
            }
          })
          this.setState({
            status,
            errorInfo: errorInfos,
            serviceInfo,
            isMulti: data.bean.is_multi
          });
        }
      })
      .finally(() => {
        if (this.mount && this.state.status === 'checking') {
          setTimeout(() => {
            this.loopStatus();
          }, 5000);
        }
      });
  };
  startCheck = loopStatus => {
    const { appAlias, teamName } = this.getParameter();
    const eventId = this.props.location &&
      this.props.location.query &&
      this.props.location.query.event_id ||
      this.props.event_id
    getCreateCheckId(
      {
        team_name: teamName,
        app_alias: appAlias,
        event_id: eventId
      },
      res => {
        if (res.status === 404) {
          this.handleJump('exception/404');
        }
      }
    ).then(data => {
      if (data) {
        this.setState({
          checkUuid: data.bean.check_uuid,
          eventId: data.bean.check_event_id,
          appDetail: data.bean
        });
        if (loopStatus !== false) {
          this.loopStatus();
        }
      }
    });
  };
  handleSetting = () => {
    const { appAlias } = this.getParameter();
    window.sessionStorage.setItem('advanced_setup', JSON.stringify('advanced'));
    this.handleJump(`create/create-setting/${appAlias}`);
  };
  // 进入多模块构建
  handleMoreService = () => {
    const { handleServiceDataState } = this.props;
    const { ServiceGetData, checkUuid, isMulti } = this.state;
    const { appAlias } = this.getParameter();
    if (ServiceGetData && !isMulti) {
      handleServiceDataState(true, null, null, null);
    } else {
      this.handleJump(`create/create-moreService/${appAlias}/${checkUuid}`);
    }
  };

  handleBuild = () => {
    const { appAlias, teamName } = this.getParameter();
    const { refreshCurrent, dispatch, soundCodeLanguage } = this.props;
    const { isDeploy, ServiceGetData, appDetail, codeLanguage, packageLange } = this.state;
    this.setState({ buildAppLoading: true });
    dispatch({
      type: 'createApp/setNodeLanguage',
      payload: {
        team_name: teamName,
        app_alias: appAlias,
        lang: codeLanguage,
        package_tool: packageLange,
      },
      callback: res => {
        if (res) {
          buildApp({
            team_name: teamName,
            app_alias: appAlias,
            is_deploy: isDeploy,
          }).then(data => {
            this.setState({ buildAppLoading: false });
            if (data) {
              dispatch({
                type: 'global/fetchGroups',
                payload: {
                  team_name: teamName
                }
              });
              window.sessionStorage.removeItem('codeLanguage');
              window.sessionStorage.removeItem('packageNpmOrYarn');
              if (ServiceGetData && isDeploy) {
                refreshCurrent();
              } else if (appDetail.service_source === 'third_party') {
                this.handleJump(`components/${appAlias}/thirdPartyServices`);
              } else {
                this.handleJump(`components/${appAlias}/overview`);
              }
            }
          });
        }
      }
    })

  };

  recheck = () => {
    this.setState(
      {
        status: 'checking'
      },
      () => {
        this.startCheck();
      }
    );
  };
  cancelModifyImageName = () => {
    this.setState({ modifyImageName: false });
  };
  cancelModifyImageCmd = () => {
    this.setState({ modifyImageCmd: false });
  };
  handleClick = e => {
    let parent = e.target;
    const { appDetail } = this.state;

    while (parent) {
      if (parent === document.body) {
        return;
      }
      const actionType = parent.getAttribute('action_type');
      if (actionType === 'modify_url' || actionType === 'modify_repo') {
        this.setState({ modifyUrl: actionType });
        return;
      }

      if (actionType === 'modify_userpass') {
        this.setState({ modifyUserpass: true });
        return;
      }

      if (actionType === 'get_publickey') {
        this.setState({ showKey: true });
        return;
      }

      if (actionType === 'open_repo') {
        if ((appDetail.git_url || '').indexOf('@') === -1) {
          window.open(appDetail.git_url);
        } else {
          Modal.info({ title: formatMessage({ id: 'componentCheck.warehouse_address' }), content: appDetail.git_url });
        }
      }

      // 修改镜像名称或dockerrun命令
      if (actionType === 'modify_image') {
        // 指定镜像
        if (appDetail.service_source === 'docker_image') {
          this.startCheck(false);
          this.setState({ modifyImageName: true });
          return;
        }
        // docker_run命令
        if (appDetail.service_source === 'docker_run') {
          this.startCheck(false);
          this.setState({ modifyImageCmd: true });
          return;
        }
      }

      parent = parent.parentNode;
    }
  };
  handleDelete = () => {
    const { appAlias, teamName } = this.getParameter();
    const { handleServiceDataState, dispatch } = this.props;
    const { ServiceGetData } = this.state;
    this.handleDeleteLoading(true);
    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name: teamName,
        app_alias: appAlias,
        is_force: true
      },
      callback: () => {
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: teamName
          }
        });
        if (ServiceGetData) {
          handleServiceDataState(true, null, null, null);
        } else {
          this.handleJump(`index`);
        }
        this.handleDeleteLoading(false);
        window.sessionStorage.removeItem('codeLanguage');
        window.sessionStorage.removeItem('packageNpmOrYarn');
      },
      handleError: err => {
        if (err && err.data) {
          if (err.data.code && err.data.code === 404) {
            this.handleJump(`index`);
          } else if (err.data.msg_show) {
            notification.warning({ message: err.data.msg_show });
          }
        }
        this.handleDeleteLoading(false);
      }
    });
  };
  handleDeleteLoading = deleteLoading => {
    this.setState({ deleteLoading });
  };
  cancelModifyUrl = () => {
    this.setState({ modifyUrl: false });
  };
  handleCancelEdit = () => {
    this.setState({ modifyUrl: false });
  };
  handleCancelShowKey = () => {
    this.setState({ showKey: false });
  };
  bindEvent = () => {
    document.addEventListener('click', this.handleClick, false);
  };
  unbindEvent = () => {
    document.removeEventListener('click', this.handleClick);
  };
  cancelModifyUserpass = () => {
    this.setState({ modifyUserpass: false });
  };
  handleModifyUserpass = values => {
    const { appDetail } = this.state;
    const { teamName } = this.getParameter();
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        service_cname: values.service_cname ? values.service_cname : '',
        git_url: values.git_url ? values.git_url : '',
        team_name: teamName,
        app_alias: appDetail.service_alias,
        user_name: values.user_name,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyUserpass();
        }
      }
    });
  };
  handleModifyUrl = values => {
    const { appDetail } = this.state;
    const { teamName } = this.getParameter();
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: teamName,
        app_alias: appDetail.service_alias,
        git_url: values.git_url
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.handleCancelEdit();
        }
      }
    });
  };
  handleModifyImageName = values => {
    const { appDetail } = this.state;
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
        user_name: values.username,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageName();
        }
      }
    });
  };
  handleModifyImageCmd = values => {
    const { appDetail } = this.state;
    this.props.dispatch({
      type: 'appControl/editAppCreateInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
        user_name: values.username,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageCmd();
        }
      }
    });
  };
  showDelete = () => {
    this.setState({ showDelete: true });
  };
  renderError = () => {
    const {
      errorInfo,
      appPermissions: { isDelete }
    } = this.state;
    const extra = (
      <div>
        {errorInfo.map((item, index) => (
          <div
            key={`error${index}`}
            style={{
              marginBottom: 16
            }}
          >
            <Icon
              style={{
                color: '#f5222d',
                marginRight: 8
              }}
              type="close-circle-o"
            />
            <span
              dangerouslySetInnerHTML={{
                __html: `<span>${item.error_info || ''} ${item.solve_advice ||
                  ''}</span>`
              }}
            />
          </div>
        ))}
      </div>
    );

    const { ServiceGetData } = this.state;

    const actions = (
      <div>
        <Button
          onClick={this.recheck}
          type="primary"
          style={{ marginRight: '8px' }}
        >
          {formatMessage({ id: 'button.retest_check' })}
        </Button>
        {isDelete && (
          <Button onClick={this.showDelete} type="default">
            {formatMessage({ id: 'button.abandon_create' })}
          </Button>
        )}
      </div>
    );

    if (
      ServiceGetData &&
      (!this.props.ButtonGroupState || !this.props.ErrState)
    ) {
      this.props.handleServiceBotton(actions, true, true);
    }
    return (
      <Result
        type="error"
        title={formatMessage({ id: 'confirmModal.component.check.title.error' })}
        description={formatMessage({ id: 'confirmModal.component.check.title.error.description' })}
        extra={extra}
        actions={ServiceGetData ? '' : actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };

  renderSuccessInfo = item => {
    if (typeof item.value === 'string') {
      return (
        <div>
          <span
            style={{
              verticalAlign: 'top',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            {item.key}：
          </span>
          {item.value}
        </div>
      );
    }
    return (
      <div>
        <span
          style={{
            verticalAlign: 'top',
            display: 'inline-block',
            fontWeight: 'bold'
          }}
        >
          {item.key}：
        </span>
        <div
          style={{
            display: 'inline-block'
          }}
        >
          {(item.value || []).map((items, index) => (
            <p
              key={`items${index}`}
              style={{
                marginBottom: 0
              }}
            >
              {items}
            </p>
          ))}
        </div>
      </div>
    );
  };

  renderSuccessOnChange = () => {
    this.setState({
      isDeploy: !this.state.isDeploy
    });
  };
  onChangeLange = e => {
    const { dispatch } = this.props
    this.setState({
      codeLanguage: e.target.value
    }, () => {
      const { codeLanguage } = this.state
      dispatch({
        type: 'teamControl/ChoosingLanguage',
        payload: codeLanguage,
      });
    });

  };
  onChange = e => {
    const { dispatch } = this.props
    this.setState({
      packageLange: e.target.value,
    }, () => {
      const { packageLange } = this.state
      dispatch({
        type: 'teamControl/ChoosingPackage',
        payload: packageLange,
      });
    });

  };
  renderSuccess = () => {
    const { ButtonGroupState, ErrState, handleServiceBotton, soundCodeLanguage } = this.props;
    const {
      ServiceGetData,
      isDeploy,
      appDetail,
      serviceInfo,
      appPermissions: { isDelete },
      codeLanguage,
      source_from,
      ports,
      packageLange,
    } = this.state;
    let extra = '';
    const arr = [];
    if (serviceInfo && serviceInfo.length > 0) {
      if (codeLanguage == 'Node.js' || codeLanguage == 'NodeJSStatic') {
        extra = (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  verticalAlign: 'top',
                  display: 'inline-block',
                  fontWeight: 'bold'
                }}
              >
                {formatMessage({ id: 'confirmModal.check.appShare.title.codeLang' })}：
              </span>
              <Radio.Group onChange={this.onChangeLange} value={codeLanguage}>
                <Radio value='Node.js'>Node.js（{formatMessage({ id: 'confirmModal.check.appShare.title.server' })}）</Radio>
                <Radio value='NodeJSStatic'>NodeJSStatic（Vue、React、Angular）</Radio>
              </Radio.Group>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  verticalAlign: 'top',
                  display: 'inline-block',
                  fontWeight: 'bold'
                }}
              >
                {formatMessage({ id: 'confirmModal.check.appShare.title.npmOryarn' })}：
              </span>
              <Radio.Group onChange={this.onChange} value={packageLange}>
                <Radio value='npm'>npm</Radio>
                <Radio value='yarn'>yarn</Radio>
              </Radio.Group>
            </div>
            {codeLanguage == 'NodeJSStatic' && (
              <div style={{ marginBottom: 16 }}>
                <span
                  style={{
                    verticalAlign: 'top',
                    display: 'inline-block',
                    fontWeight: 'bold'
                  }}
                >
                  {formatMessage({ id: 'confirmModal.check.appShare.title.port' })}：
                </span>
                {ports || formatMessage({ id: 'confirmModal.check.appShare.title.null' })}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  verticalAlign: 'top',
                  display: 'inline-block',
                  fontWeight: 'bold'
                }}
              >
                {formatMessage({ id: 'confirmModal.check.appShare.title.sourceCode' })}：
              </span>
              {source_from}
            </div>
          </div>)
      } else {
        extra = serviceInfo.map((item, index) => (
          <div
            key={`item${index}`}
            style={{
              marginBottom: 16
            }}
          >
            {this.renderSuccessInfo(item)}
          </div>
        ));
      }
    }

    let actions = [];
    if (ServiceGetData) {
      actions = [
        <div key="action" style={{ display: 'flex' }}>
          {isDelete && (
            <Button
              onClick={this.showDelete}
              type="default"
              style={{ marginRight: '8px' }}
            >
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button
            type="default"
            onClick={this.handleSetting}
            style={{ marginRight: '8px' }}
          >
            {formatMessage({ id: 'button.advanced_setup' })}
          </Button>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={{ marginRight: '8px' }}
              loading={this.state.buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
            <Tooltip
              placement="topLeft"
              title={
                <p>
                  {formatMessage({ id: 'componentCheck.tooltip.title.p1' })}
                  <br />
                  {formatMessage({ id: 'componentCheck.tooltip.title.p2' })}
                </p>
              }
            >
              <Radio
                size="small"
                onClick={this.renderSuccessOnChange}
                checked={isDeploy}
              >
                {formatMessage({ id: 'button.build_start' })}
              </Radio>
            </Tooltip>
          </div>
        </div>
      ];
    } else if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={{ marginRight: '8px' }}
              loading={this.state.buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
          </div>
        </div>
      ];
    } else {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default">
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button type="default" onClick={this.handleSetting}>
            {formatMessage({ id: 'button.advanced_setup' })}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={{ marginRight: '8px' }}
              loading={this.state.buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
            {appDetail.service_source === 'third_party'}
            <Tooltip
              placement="topLeft"
              title={
                <p>
                  {formatMessage({ id: 'componentCheck.tooltip.title.p1' })}
                  <br />
                  {formatMessage({ id: 'componentCheck.tooltip.title.p2' })}
                </p>
              }
            >
              <Radio
                size="small"
                onClick={this.renderSuccessOnChange}
                checked={isDeploy}
              >
                {formatMessage({ id: 'button.build_start' })}
              </Radio>
            </Tooltip>
          </div>
        </div>
      ];
    }

    if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={{ marginRight: '8px' }}
              loading={this.state.buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
            {isDelete && (
              <Button onClick={this.showDelete} type="default">
                {formatMessage({ id: 'button.abandon_create' })}
              </Button>
            )}
          </div>
        </div>
      ];
    }

    if (isDeploy) {
      if (ServiceGetData && (!ButtonGroupState || !ErrState)) {
        handleServiceBotton(actions, true, true);
      }
    } else if (ServiceGetData && (ButtonGroupState || ErrState)) {
      handleServiceBotton(actions, false, false);
    }

    return (
      <Result
        type="success"
        title={
          appDetail.service_source === 'third_party'
            ? formatMessage({ id: 'confirmModal.third_party.check.title.success' })
            : formatMessage({ id: 'confirmModal.component.check.title.success' })
        }
        description={
          appDetail.service_source === 'third_party' ? (
            ''
          ) : (
            <div>
              <div>
                {formatMessage({ id: 'componentCheck.tooltip.title.p3' })}
              </div>
              {formatMessage({ id: 'componentCheck.tooltip.title.p4' })}{' '}
              <a
                href="https://www.rainbond.com/en/docs/use-manual/component-create/language-support/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatMessage({ id: 'componentCheck.tooltip.title.p5' })}
              </a>{' '}
              {formatMessage({ id: 'componentCheck.tooltip.title.p6' })}
            </div>
          )
        }
        extra={extra}
        actions={ServiceGetData ? '' : actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };

  renderMoreService = () => {
    const {
      ServiceGetData,
      isDeploy,
      appDetail,
      isMulti,
      appPermissions: { isDelete }
    } = this.state;
    const mr8 = { marginRight: '8px' };
    let actions = [];
    if (ServiceGetData && isMulti) {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default" style={mr8}>
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button type="primary" onClick={this.handleMoreService}>

            {formatMessage({ id: 'button.components_build' })}
          </Button>
        </div>
      ];
    } else if (ServiceGetData) {
      actions = [
        <div style={{ display: 'flex' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default" style={mr8}>
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={mr8}
              loading={this.state.buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
            <div>
              <Tooltip
                placement="topLeft"
                title={
                  <p>
                    {formatMessage({ id: 'componentCheck.tooltip.title.p1' })}
                    <br />
                    {formatMessage({ id: 'componentCheck.tooltip.title.p2' })}
                  </p>
                }
              >
                <Radio
                  size="small"
                  onClick={this.renderSuccessOnChange}
                  checked={isDeploy}
                >
                  {formatMessage({ id: 'button.build_start' })}
                </Radio>
              </Tooltip>
            </div>
          </div>
        </div>
      ];
    } else if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isDelete && (
              <Button
                onClick={this.handleBuild}
                type="primary"
                style={mr8}
                loading={this.state.buildAppLoading}
              >
                {formatMessage({ id: 'button.abandon_create' })}
              </Button>
            )}
            <Button type="primary" onClick={this.handleMoreService}>
              {formatMessage({ id: 'button.components_build' })}
            </Button>
          </div>
        </div>
      ];
    } else {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isDelete && (
            <Button onClick={this.showDelete} type="default">
              {formatMessage({ id: 'button.abandon_create' })}
            </Button>
          )}
          <Button type="primary" onClick={this.handleMoreService}>

            {formatMessage({ id: 'button.service_build' })}
          </Button>
        </div>
      ];
    }

    if (appDetail.service_source === 'third_party') {
      actions = [
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={mr8}
              loading={this.state.buildAppLoading}
            >
              {formatMessage({ id: 'button.create' })}
            </Button>
          </div>
        </div>
      ];
    }

    const {
      ButtonGroupState = false,
      handleServiceBotton,
      ErrState
    } = this.props;

    if (isDeploy) {
      if (ServiceGetData && (!ButtonGroupState || !ErrState)) {
        handleServiceBotton(actions, true, true);
      }
    } else if (ServiceGetData && (ButtonGroupState || ErrState)) {
      handleServiceBotton(actions, false, false);
    }

    return (
      <Result
        type="success"
        title={
          appDetail.service_source === 'third_party'
            ? formatMessage({ id: 'confirmModal.third_party.check.title.success' })
            : formatMessage({ id: 'confirmModal.component_build.check.model.build' })
        }
        description={
          appDetail.service_source !== 'third_party' && (
            <div>
              <div>{formatMessage({ id: 'componentCheck.tooltip.title.p7' })}</div>
              {formatMessage({ id: 'componentCheck.tooltip.title.p4' })}{' '}
              <a
                href="https://www.rainbond.com/en/docs/use-manual/component-create/language-support/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatMessage({ id: 'componentCheck.tooltip.title.p5' })}
              </a>{' '}
              {formatMessage({ id: 'componentCheck.tooltip.title.p6' })}
            </div>
          )
        }
        extra=""
        actions={ServiceGetData ? '' : actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };

  renderChecking = () => {
    const { ButtonGroupState = false, handleServiceBotton } = this.props;
    const {
      ServiceGetData,
      appPermissions: { isDelete }
    } = this.state;
    const actions = isDelete && (
      <Button onClick={this.showDelete} type="default">
        {formatMessage({ id: 'button.abandon_create' })}
      </Button>
    );
    if (ServiceGetData && ButtonGroupState) {
      handleServiceBotton(actions, false);
    }

    const extra = (
      <div>
        {this.state.eventId && (
          <LogProcress
            opened
            socketUrl={this.socketUrl}
            eventId={this.state.eventId}
          />
        )}
      </div>
    );
    return (
      <Result
        type="ing"
        title={formatMessage({ id: 'confirmModal.component.check.title.loading' })}
        extra={extra}
        description={formatMessage({ id: 'confirmModal.component.check.appShare.desc' })}
        actions={ServiceGetData ? '' : actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };

  render() {
    const {
      status,
      isMulti,
      appDetail,
      ServiceGetData,
      modifyImageName,
      modifyImageCmd,
      modifyUrl,
      modifyUserpass,
      showKey,
      deleteLoading,
      showDelete
    } = this.state;
    const box = (
      <Card bordered={false}>
        <div
          style={{
            minHeight: 400
          }}
        >
          {status === 'checking' && this.renderChecking()}
          {status === 'success' && isMulti !== true && this.renderSuccess()}
          {status === 'success' && isMulti === true && this.renderMoreService()}
          {status === 'failure' && this.renderError()}
        </div>
      </Card>
    );
    return (
      <div>
        {ServiceGetData ? box : <PageHeaderLayout>{box}</PageHeaderLayout>}

        {modifyImageName && (
          <ModifyImageName
            data={appDetail}
            onSubmit={this.handleModifyImageName}
            onCancel={this.cancelModifyImageName}
          />
        )}
        {modifyImageCmd && (
          <ModifyImageCmd
            data={appDetail}
            onSubmit={this.handleModifyImageCmd}
            onCancel={this.cancelModifyImageCmd}
          />
        )}

        {modifyUrl && (
          <ModifyUrl
            data={appDetail}
            onSubmit={this.handleModifyUrl}
            onCancel={this.cancelModifyUrl}
          />
        )}

        {modifyUserpass && (
          <ModifyUrl
            showUsernameAndPass
            data={appDetail}
            onSubmit={this.handleModifyUserpass}
            onCancel={this.cancelModifyUserpass}
          />
        )}

        {showKey && <ShowRegionKey onCancel={this.handleCancelShowKey} />}

        {showDelete && (
          <ConfirmModal
            onOk={this.handleDelete}
            loading={deleteLoading}
            title={formatMessage({ id: 'confirmModal.abandon_create.create_check.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.create_check.desc' })}
            onCancel={() => {
              this.setState({ showDelete: false });
            }}
          />
        )}
      </div>
    );
  }
}
