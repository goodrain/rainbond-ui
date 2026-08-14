/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, Modal, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { Icon } from 'antd';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { setNodeLanguage } from '../../services/createApp';
import AppConfigFile from '../../components/AppCreateConfigFile';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import roleUtil from '../../utils/role';
import pluginUtile from '../../utils/pulginUtils';
import handleAPIError from '../../utils/error';
import resourceSnapshot from './resourceSnapshot';

const {
  evaluateResourceAvailability,
  normalizeAvailableResources,
  shouldCheckAvailableResources
} = resourceSnapshot;
const SOURCE_BUILD_CONFIG_KEY = 'source_build_config';
const readSourceBuildConfig = () => {
  const config = window.sessionStorage.getItem(SOURCE_BUILD_CONFIG_KEY);
  return config ? JSON.parse(config) : null;
};
const saveSourceBuildConfig = (config) => {
  window.sessionStorage.setItem(SOURCE_BUILD_CONFIG_KEY, JSON.stringify(config));
};

@connect(
  ({ loading, teamControl, user }) => ({
    currUser: user.currentUser,
    buildAppsLoading: loading.effects['createApp/buildApps'],
    deleteAppLoading: loading.effects['appControl/deleteApp'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    soundCodeLanguage: teamControl.codeLanguage,
    packageNpmOrYarn: teamControl.packageNpmOrYarn,
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appDetail: null,
      handleBuildSwitch: false,
      showEnterprisePlugin: false,
      availableResourcesStatus: 'idle',
      availableResources: null,
      nextLoading: false,
    };
    this.availableResourcesRequested = false;
    this.availableResourcesRequestToken = 0;
    this.nextSubmitting = false;
    this.unmounted = false;
  }
  componentDidMount() {
    this.isShowEnterprisePlugin()
  }
  componentWillUnmount() {
    this.unmounted = true;
    this.availableResourcesRequestToken += 1;
    this.props.dispatch({ type: 'appControl/clearDetail' });
  }
  onRef = (ref) => {
    this.child = ref
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  isShowEnterprisePlugin = () => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'global/getPluginList',
      payload: { enterprise_id: currUser.enterprise_id, region_name: globalUtil.getCurrRegionName() },
      callback: (res) => {
        if (res && res.list) {
          const showEnterprisePlugin = pluginUtile.isInstallPlugin(res.list, 'rainbond-bill');
          const showCodeScanPlugin = pluginUtile.isInstallPlugin(res.list, 'rainbond-sourcescan');
          window.sessionStorage.setItem('showCodeScanPlugin', showCodeScanPlugin)
          this.setState({
            showEnterprisePlugin
          }, () => {
            this.loadDetail()
          })
        }
      },
      handleError: () => {
        this.setState({ showEnterprisePlugin: false });
      },
    });
  }
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
        this.setState({ appDetail: data }, this.loadAvailableResources);
      },
      handleError: data => {
        const code = httpResponseUtil.getCode(data);
        if (code === 404) {
          this.handleJump(`exception/404`);
        } else {
          handleAPIError(data);
        }
      }
    });
  };
  loadAvailableResources = () => {
    if (
      !shouldCheckAvailableResources(this.state.appDetail) ||
      this.availableResourcesRequested
    ) {
      return;
    }
    this.availableResourcesRequested = true;
    const requestToken = this.availableResourcesRequestToken + 1;
    this.availableResourcesRequestToken = requestToken;
    const { dispatch } = this.props;
    const { team_name, region_name } = this.fetchParameter();
    this.setState({
      availableResourcesStatus: 'loading',
      availableResources: null
    });
    dispatch({
      type: 'createApp/fetchAvailableResources',
      payload: {
        team_name,
        region_name
      },
      callback: data => {
        if (
          this.unmounted ||
          requestToken !== this.availableResourcesRequestToken
        ) {
          return;
        }
        const availableResources = normalizeAvailableResources(data);
        this.setState({
          availableResourcesStatus: availableResources ? 'success' : 'error',
          availableResources
        });
      },
      handleError: () => {
        if (
          this.unmounted ||
          requestToken !== this.availableResourcesRequestToken
        ) {
          return;
        }
        this.setState({
          availableResourcesStatus: 'error',
          availableResources: null
        });
      }
    });
  };
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleBuild = (val) => {
    const { dispatch, soundCodeLanguage, packageNpmOrYarn } = this.props;
    const { appDetail } = this.state
    const { team_name, app_alias } = this.fetchParameter();
    const sourceBuildConfig = readSourceBuildConfig();
    if (val == false) {
      setNodeLanguage({
        team_name,
        app_alias,
        lang: sourceBuildConfig?.lang || soundCodeLanguage,
        package_tool: packageNpmOrYarn,
        build_strategy: sourceBuildConfig?.build_strategy,
        build_env_dict: sourceBuildConfig?.build_env_dict,
      }).then(res => {
        dispatch({
          type: 'createApp/buildApps',
          payload: {
            team_name,
            app_alias,
          },
          callback: data => {
            if (data) {
              dispatch({
                type: 'global/fetchGroups',
                payload: {
                  team_name
                },
                handleError: err => {
                  handleAPIError(err);
                }
              });
              window.sessionStorage.removeItem('codeLanguage');
              window.sessionStorage.removeItem('packageNpmOrYarn');
              window.sessionStorage.removeItem('advanced_setup');
              window.sessionStorage.removeItem(SOURCE_BUILD_CONFIG_KEY);
              this.handleJump(`apps/${appDetail?.service?.group_id}/overview?type=components&componentID=${app_alias}&tab=overview`);
            }
          },
          handleError: err => {
            handleAPIError(err);
          }
        });
      })
    } else {
      notification.warning({ message: formatMessage({id:'notification.warn.save'}) });
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
          },
          handleError: err => {
            handleAPIError(err);
          }
        });
        window.sessionStorage.removeItem('codeLanguage');
        window.sessionStorage.removeItem('packageNpmOrYarn');
        window.sessionStorage.removeItem('advanced_setup');
        window.sessionStorage.removeItem(SOURCE_BUILD_CONFIG_KEY);
        this.handleJump('index');
      },
      handleError: err => {
        handleAPIError(err);
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
  handleBuildSwitch = (val) =>{
    this.setState({
      handleBuildSwitch: val
    })
  }
  handleLinkConfigPort = (link) => {
    const { 
        match: {
            params:{
                appAlias,
                regionName,
                teamName
            }
        },
        dispatch 
    } = this.props 
    dispatch(routerRedux.replace(`/team/${teamName}/region/${regionName}/create/${link}/${appAlias}`))
  }
  validateAvailableResources = requirements => {
    const {
      appDetail,
      availableResourcesStatus,
      availableResources
    } = this.state;
    if (!shouldCheckAvailableResources(appDetail)) {
      return true;
    }
    if (availableResourcesStatus === 'loading') {
      notification.warning({ message: '资源信息加载中，请稍后再试' });
      return false;
    }
    if (availableResourcesStatus !== 'success') {
      notification.error({ message: '资源信息加载失败，请刷新或重新进入页面后重试' });
      return false;
    }

    const result = evaluateResourceAvailability(
      requirements,
      availableResources
    );
    if (result.status === 'invalid') {
      notification.error({ message: '资源信息加载失败，请刷新或重新进入页面后重试' });
      return false;
    }
    if (result.status === 'insufficient') {
      Modal.error({
        title: '资源不足',
        content: (
          <div>
            {result.shortages.map(item => (
              <p key={item.key}>
                {item.label}：需要 {item.required}{item.unit}，可用 {item.available}{item.unit}，缺少 {item.missing}{item.unit}
              </p>
            ))}
          </div>
        ),
        okText: '我知道了'
      });
      return false;
    }
    return true;
  };
  handleJumpNext = async () => {
    if (this.nextSubmitting) {
      return;
    }
    this.nextSubmitting = true;
    this.setState({ nextLoading: true });
    try {
      const validationResult = await this.child.childFn(
        this.validateAvailableResources
      );
      if (validationResult !== false) {
        this.handleLinkConfigPort('create-configPort');
      }
    } finally {
      this.nextSubmitting = false;
      if (!this.unmounted) {
        this.setState({ nextLoading: false });
      }
    }
  }
  handleEditInfo = (val = {}) => {
    const {
        match: {
            params:{
                appAlias,
                regionName,
                teamName
            }
        },
        dispatch
    } = this.props
    return new Promise(resolve => {
      let failed = false;
      dispatch({
        type: 'appControl/editAppCreateInfo',
        payload: {
          team_name: teamName,
          app_alias: appAlias,
          ...val
        },
        callback: data => {
          if (data) {
            this.loadDetail();
            this.handleBuildSwitch(false)
          }
        },
        handleError: err => {
          failed = true;
          handleAPIError(err);
        },
        complete: data => {
          resolve(!failed && !!data);
        }
      });
    });
  };
  handleEditRuntime = (build_env_dict = {}) => {
    const {
        match: {
            params:{
                appAlias,
                regionName,
                teamName
            }
        },
        dispatch
    } = this.props
    return new Promise((resolve) => {
      let failed = false;
      dispatch({
        type: 'appControl/editRuntimeBuildInfo',
        payload: {
          team_name: teamName,
          app_alias: appAlias,
          build_env_dict
        },
        callback: res => {
          if (res && res.status_code === 200) {
            const sourceBuildConfig = readSourceBuildConfig();
            if (sourceBuildConfig) {
              saveSourceBuildConfig({
                ...sourceBuildConfig,
                build_env_dict: {
                  ...(sourceBuildConfig.build_env_dict || {}),
                  ...(build_env_dict || {})
                }
              });
            }
            this.loadDetail();
          }
        },
        handleError: err => {
          failed = true;
          handleAPIError(err);
        },
        complete: res => {
          resolve(!failed && res && res.status_code === 200 ? res : false);
        }
      });
    });
  };
  render() {
    const { buildAppsLoading, deleteAppLoading } = this.props;
    const {
      showDelete,
      handleBuildSwitch,
      showEnterprisePlugin,
      nextLoading
    } = this.state;
    const appDetail = this.state.appDetail || {};
    if (!appDetail.service) {
      return null;
    }
    return (
      <>
        <PageHeaderLayout
          titleSvg={pageheaderSvg.getPageHeaderSvg("environment", 18)}
          title={formatMessage({id:'componentCheck.advanced.env'})}
          content={formatMessage({id:'versionUpdata_6_1.content3'})}
      >
        <div>
          <AppConfigFile
            updateDetail={this.loadDetail}
            appDetail={appDetail}
            showEnterprisePlugin={showEnterprisePlugin}
            handleBuildSwitch={this.handleBuildSwitch}
            handleEditInfo={this.handleEditInfo}
            handleEditRuntime={this.handleEditRuntime}
            onRef={this.onRef}
          />
          <div
            style={{
              width:'100%',
              display: 'flex',
              justifyContent:'center'
            }}
          >
            <Button
              onClick={this.showDelete}
              type="default"
              style={{
                  marginRight: 8
              }}
            >
             {formatMessage({id:'button.abandon_create'})}
            </Button>
            <Button
              style={{
                marginRight: 8
              }}
              onClick={() => this.handleLinkConfigPort('create-check')}
            >
              {formatMessage({id:'button.previous'})}
            </Button>
            <Button
              data-testid="rbd-build-wizard-confirm"
              loading={buildAppsLoading || nextLoading}
              onClick={this.handleJumpNext}
              type="primary"
            >
              {formatMessage({id:'button.next'})}
            </Button>
          </div>
          {showDelete && (
            <ConfirmModal
              loading={deleteAppLoading}
              onOk={this.handleDelete}
              title={formatMessage({id:'confirmModal.abandon_create.create_check.title'})}
              subDesc={formatMessage({id:'confirmModal.delete.strategy.subDesc'})}
              desc={formatMessage({id:'confirmModal.delete.create_check.desc'})}
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
