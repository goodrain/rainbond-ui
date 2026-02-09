/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { setNodeLanguage } from '../../services/createApp';
import AppConfigPort from '../../components/AppCreateConfigPort';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import roleUtil from '../../utils/role';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import handleAPIError from '../../utils/error';

@connect(
  ({ loading, teamControl, appControl }) => ({
    buildAppsLoading: loading.effects['createApp/buildApps'],
    deleteAppLoading: loading.effects['appControl/deleteApp'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    soundCodeLanguage: teamControl.codeLanguage,
    packageNpmOrYarn: teamControl.packageNpmOrYarn,
    ports: appControl.ports,
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // appPermissions: this.handlePermissions('queryAppInfo'),
      appDetail: null,
      handleBuildSwitch: false,
      isDeploy: true,
      runtimeInfo: null  // 添加 runtimeInfo 状态存储构建环境变量
    };
    this.loadingBuild = false;
  }
  componentDidMount() {
    this.loadDetail();
    this.getRuntimeInfo();  // 获取构建环境变量
  }
  componentWillUnmount() {
    this.props.dispatch({ type: 'appControl/clearDetail' });
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  loadDetail = () => {
    const { dispatch } = this.props;
    const { team_name, app_alias } = this.fetchParameter();
    dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name,
        app_alias
      },
      callback: data => {
        this.setState({ appDetail: data });
      },
      handleError: err => {
        if (err) {
          const code = httpResponseUtil.getCode(err);
          if (code && code === 404) {
            // 应用不存在
            this.handleJump(`exception/404`);
          }
        }
      }
    });
  };
  // 获取构建环境变量（包含 CNB 配置参数）
  getRuntimeInfo = () => {
    const { dispatch } = this.props;
    const { team_name, app_alias } = this.fetchParameter();
    dispatch({
      type: 'appControl/getRuntimeBuildInfo',
      payload: {
        team_name,
        app_alias
      },
      callback: data => {
        if (data) {
          this.setState({ runtimeInfo: data.bean ? data.bean : {} });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleDebounce(fn, wait) {
    let timer = null;
    return (e) => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn.call(e);
        timer = null;
      }, wait);
    };
  }

  handleBuild = () => {
    this.loadingBuild = true;
    const { team_name, app_alias } = this.fetchParameter();
    const { refreshCurrent, dispatch, soundCodeLanguage, packageNpmOrYarn } = this.props;
    const dist = JSON.parse(window.sessionStorage.getItem('dist')) || false;
    const { isDeploy, appDetail, runtimeInfo } = this.state;

    // 优先从 sessionStorage 读取 CNB 参数（由 create-check.js 保存）
    const cnbParamsStr = window.sessionStorage.getItem('cnb_params');
    const cnbParams = cnbParamsStr ? JSON.parse(cnbParamsStr) : null;

    // 判断是否为纯静态项目
    const isPureStatic = soundCodeLanguage === 'static' || cnbParams?.isPureStatic;

    this.setState({ buildAppLoading: true }, () => {
      if (soundCodeLanguage == 'Node.js' || soundCodeLanguage == 'NodeJSStatic' || isPureStatic) {
        // 优先使用 runtimeInfo（来自后端，可能在配置页面被用户修改过），其次使用 sessionStorage（来自检测阶段）
        // 如果都没有，使用默认值确保 CNB 构建被触发
        const defaultFramework = isPureStatic ? 'other-static' : (soundCodeLanguage == 'NodeJSStatic' ? 'vue' : 'express');
        const cnbFramework = runtimeInfo?.CNB_FRAMEWORK || cnbParams?.framework || defaultFramework;
        const cnbBuildScript = isPureStatic ? '' : (runtimeInfo?.CNB_BUILD_SCRIPT || cnbParams?.buildScript || (soundCodeLanguage == 'NodeJSStatic' ? 'build' : ''));
        const cnbOutputDir = isPureStatic ? (runtimeInfo?.CNB_OUTPUT_DIR || cnbParams?.outputDir || '.') : (runtimeInfo?.CNB_OUTPUT_DIR || cnbParams?.outputDir || (soundCodeLanguage == 'NodeJSStatic' ? 'dist' : ''));
        const cnbNodeVersion = isPureStatic ? '' : (runtimeInfo?.CNB_NODE_VERSION || cnbParams?.nodeVersion || '');

        // Mirror 配置：纯静态项目不需要包管理器镜像
        const configFiles = cnbParams?.configFiles || { hasNpmrc: false, hasYarnrc: false, hasPnpmrc: false };
        const hasMirrorConfig = configFiles.hasNpmrc || configFiles.hasYarnrc || configFiles.hasPnpmrc;
        const cnbMirrorSource = isPureStatic ? '' : (runtimeInfo?.CNB_MIRROR_SOURCE || (hasMirrorConfig ? 'project' : 'global'));

        const cnbMirrorNpmrc = isPureStatic ? '' : (runtimeInfo?.CNB_MIRROR_NPMRC || '');
        const cnbMirrorYarnrc = isPureStatic ? '' : (runtimeInfo?.CNB_MIRROR_YARNRC || '');
        const cnbMirrorPnpmrc = isPureStatic ? '' : (runtimeInfo?.CNB_MIRROR_PNPMRC || '');

        const obj = {
          team_name: team_name,
          app_alias: app_alias,
          lang: isPureStatic ? 'static' : soundCodeLanguage,
          package_tool: isPureStatic ? '' : packageNpmOrYarn,
          // CNB 构建参数
          cnb_framework: cnbFramework,
          cnb_build_script: cnbBuildScript,
          cnb_output_dir: cnbOutputDir,
          cnb_node_version: cnbNodeVersion,
          cnb_mirror_source: cnbMirrorSource,
          cnb_mirror_npmrc: cnbMirrorNpmrc,
          cnb_mirror_yarnrc: cnbMirrorYarnrc,
          cnb_mirror_pnpmrc: cnbMirrorPnpmrc
        };
        if (soundCodeLanguage == 'NodeJSStatic') {
          obj.dist = dist;
        }
        dispatch({
          type: 'createApp/setNodeLanguage',
          payload: obj,
          callback: res => {
            if (res) {
              dispatch({
                type: 'createApp/buildApps',
                payload: {
                  team_name: team_name,
                  app_alias: app_alias,
                  is_deploy: isDeploy,
                },
                callback: res => {
                  if (res) {
                    dispatch({
                      type: 'global/fetchGroups',
                      payload: {
                        team_name: team_name
                      },
                      callback: res => {
                        this.setState({ buildAppLoading: false });
                        this.loadingBuild = false;
                      }
                    });
                    window.sessionStorage.removeItem('codeLanguage');
                    window.sessionStorage.removeItem('packageNpmOrYarn');
                    window.sessionStorage.removeItem('advanced_setup');
                    window.sessionStorage.removeItem('cnb_params');  // 清理 CNB 参数
                    // this.handleJump(`components/${app_alias}/overview`);
                    this.handleJump(`apps/${appDetail?.service?.group_id}/overview?type=components&componentID=${app_alias}&tab=overview`);
                  }
                },
                handleError: err => {
                  this.setState({ buildAppLoading: false });
                  this.loadingBuild = false;
                  handleAPIError(err);
                }
              });
            }
          }
        });
      } else {
        dispatch({
          type: 'createApp/buildApps',
          payload: {
            team_name: team_name,
            app_alias: app_alias,
            is_deploy: isDeploy,
          },
          callback: res => {
            if (res) {
              this.setState({ buildAppLoading: false });
              this.loadingBuild = false;
              dispatch({
                type: 'global/fetchGroups',
                payload: {
                  team_name: team_name
                }
              });
              window.sessionStorage.removeItem('codeLanguage');
              window.sessionStorage.removeItem('packageNpmOrYarn');
              window.sessionStorage.removeItem('advanced_setup');
              // this.handleJump(`components/${app_alias}/overview`);
              this.handleJump(`apps/${appDetail?.service?.group_id}/overview?type=components&componentID=${app_alias}&tab=overview`);
            }
          },
          handleError: err => {
            this.setState({ buildAppLoading: false });
            this.loadingBuild = false;
            handleAPIError(err);
          }
        });
      }

    });

  };

  handlePreventClick = () => {
    if (!this.loadingBuild) {
      this.handleBuild();
    } else {
      notification.warning({ message: formatMessage({ id: 'notification.warn.creating' }) });
    }
  };

  handleDelete = () => {
    const { dispatch } = this.props;
    const { team_name, app_alias } = this.fetchParameter();
    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name,
        app_alias,
        is_force: true
      },
      callback: () => {
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name
          }
        });
        window.sessionStorage.removeItem('codeLanguage');
        window.sessionStorage.removeItem('packageNpmOrYarn');
        window.sessionStorage.removeItem('advanced_setup');
        this.handleJump('index');
      }
    });
  };
  handleJump = targets => {
    const { dispatch } = this.props;
    const { team_name, region_name } = this.fetchParameter();
    dispatch(
      routerRedux.replace(`/team/${team_name}/region/${region_name}/${targets}`)
    );
  };

  showDelete = () => {
    this.setState({ showDelete: true });
  };
  fetchParameter = () => {
    return {
      team_name: globalUtil.getCurrTeamName(),
      region_name: globalUtil.getCurrRegionName(),
      app_alias: this.getAppAlias()
    };
  };
  handleBuildSwitch = (val) => {
    this.setState({
      handleBuildSwitch: val
    });
  };
  handleLinkConfigFile = (link) => {
    const {
      match: {
        params: {
          appAlias,
          regionName,
          teamName
        }
      },
      dispatch
    } = this.props;
    dispatch(routerRedux.replace(`/team/${teamName}/region/${regionName}/create/${link}/${appAlias}`));
  };
  render() {
    const { buildAppsLoading, deleteAppLoading } = this.props;
    const {
      showDelete,
      // appPermissions: { isDelete },
      handleBuildSwitch,
      buildAppLoading
    } = this.state;
    const isDelete = true;
    const appDetail = this.state.appDetail || {};
    if (!appDetail.service) {
      return null;
    }
    return (
      <>
        <PageHeaderLayout
          titleSvg={pageheaderSvg.getPageHeaderSvg("advanced", 18)}
          title={formatMessage({ id: 'componentCheck.advanced.setup' })}
          content={formatMessage({ id: 'versionUpdata_6_1.content2' })}
        >

          <div
            style={{
              overflow: 'hidden'
            }}
          >
            <AppConfigPort
              updateDetail={this.loadDetail}
              appDetail={appDetail}
              handleBuildSwitch={this.handleBuildSwitch}
            />
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              {isDelete && (
                <Button
                  onClick={this.showDelete}
                  type="default"
                  style={{
                    marginRight: 8
                  }}
                >
                  {formatMessage({ id: 'button.abandon_create' })}
                </Button>
              )}
              <Button
                style={{
                  marginRight: 8
                }}
                onClick={() => this.handleLinkConfigFile('create-configFile')}
              >
                {formatMessage({ id: 'button.previous' })}
              </Button>
              <Button
                loading={buildAppLoading}
                style={{
                  marginRight: 8
                }}
                onClick={this.handlePreventClick}
                type="primary"
              >
                {formatMessage({ id: 'button.confirm_create' })}
              </Button>
            </div>
            {showDelete && (
              <ConfirmModal
                loading={deleteAppLoading}
                onOk={this.handleDelete}
                title={formatMessage({ id: 'confirmModal.abandon_create.create_check.title' })}
                subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
                desc={formatMessage({ id: 'confirmModal.delete.create_check.desc' })}
                onCancel={() => {
                  this.setState({ showDelete: false });
                }}
              />
            )}
          </div>
        </PageHeaderLayout>
      </>
    );
  }
}
