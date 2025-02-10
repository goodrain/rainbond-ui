/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
      // appPermissions: this.handlePermissions('queryAppInfo'),
      appDetail: null,
      handleBuildSwitch: false,
      showEnterprisePlugin: false,
    };
  }
  componentDidMount() {
    this.isShowEnterprisePlugin()
  }
  componentWillUnmount() {
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
          this.setState({
            showEnterprisePlugin: showEnterprisePlugin,
          },()=>{
            this.loadDetail()
          })
        }
      },
      handleError: () => {
        this.setState({ showEnterprisePlugin: false, pluginLoading: false });
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
        this.setState({ appDetail: data });
      },
      handleError: data => {
        const code = httpResponseUtil.getCode(data);
        if (code && code === 404) {
          // 应用不存在
          this.handleJump(`exception/404`);
        }
      }
    });
  };
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleDebounce (fn, wait) {
    let timer = null
    return (e)=>{
      if (timer !== null) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        fn.call(e)
        timer = null
      }, wait)
    }
  }
  handleBuild = (val) => {
    const { dispatch, soundCodeLanguage, packageNpmOrYarn } = this.props;
    const { appDetail } = this.state
    const { team_name, app_alias } = this.fetchParameter();
    if( val == false ){
      setNodeLanguage({
        team_name: team_name,
        app_alias: app_alias,
        lang: soundCodeLanguage,
        package_tool: packageNpmOrYarn,
      }).then(res=>{
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
                }
              });
              window.sessionStorage.removeItem('codeLanguage');
              window.sessionStorage.removeItem('packageNpmOrYarn');
              window.sessionStorage.removeItem('advanced_setup');
              this.handleJump(`components/${app_alias}/overview`);
            }
          },
          handleError: err => {
            notification.error({ message: err.data.msg_show })
          }
        });
      })
      
    }else{
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
  handleJumpNext = () => {
      this.child.childFn()
      this.handleLinkConfigPort('create-configPort')
  }
  // cpu 内存 接口
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
    this.props.dispatch({
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
      }
    });
  };
  // 构建源信息
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
    this.props.dispatch({
      type: 'appControl/editRuntimeBuildInfo',
      payload: {
        team_name: teamName,
        app_alias: appAlias,
        build_env_dict
      },
      callback: res => {
        if (res && res.status_code === 200) {
        }
      }
    });
  };
  render() {
    const { buildAppsLoading, deleteAppLoading } = this.props;
    const {
      showDelete,
      // appPermissions: { isDelete },
      handleBuildSwitch,
      showEnterprisePlugin
    } = this.state;
    const isDelete = true;
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
            {isDelete && (
              <Button 
                onClick={this.showDelete} 
                type="default"
                style={{
                    marginRight: 8
                }}
              >
               {formatMessage({id:'button.abandon_create'})}
              </Button>
            )}
            <Button
              style={{
                marginRight: 8
              }}
              onClick={() => this.handleLinkConfigPort('create-check')}
            >
              {formatMessage({id:'button.previous'})}
            </Button>
            <Button
              loading={buildAppsLoading}
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
