/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { setNodeLanguage } from '../../services/createApp';
import AppConfigPort from '../../components/AppCreateConfigPort';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import CustomFooter from "../../layouts/CustomFooter";
import roleUtil from '../../utils/role';

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
      appPermissions: this.handlePermissions('queryAppInfo'),
      appDetail: null,
      handleBuildSwitch: false,
      isDeploy: true
    };
    this.loadingBuild = false
  }
  componentDidMount() {
    this.loadDetail();
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
  
  handleBuild = () => {
    this.loadingBuild = true
    const { team_name, app_alias } = this.fetchParameter();
    const { refreshCurrent, dispatch, soundCodeLanguage, packageNpmOrYarn } = this.props;
    const dist = JSON.parse(window.sessionStorage.getItem('dist')) || false
    const { isDeploy } = this.state;
    this.setState({ buildAppLoading: true },()=>{
      if (soundCodeLanguage == 'Node.js' || soundCodeLanguage == 'NodeJSStatic') {
      const obj = {
        team_name: team_name,
        app_alias: app_alias,
        lang: soundCodeLanguage,
        package_tool: packageNpmOrYarn,
      }
      if(soundCodeLanguage == 'NodeJSStatic'){
        obj.dist = dist
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
                        this.loadingBuild = false
                      }
                    });
                    window.sessionStorage.removeItem('codeLanguage');
                    window.sessionStorage.removeItem('packageNpmOrYarn');
                    window.sessionStorage.removeItem('advanced_setup');
                    this.handleJump(`components/${app_alias}/overview`);
                  }
                }
              })
            }
          }
        }) 
      }else{
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
              this.loadingBuild = false
              dispatch({
                type: 'global/fetchGroups',
                payload: {
                  team_name: team_name
                }
              });
              window.sessionStorage.removeItem('codeLanguage');
              window.sessionStorage.removeItem('packageNpmOrYarn');
              window.sessionStorage.removeItem('advanced_setup');
              this.handleJump(`components/${app_alias}/overview`);
            }
          }
        })
      }
       
    });
    
  };

  handlePreventClick = () => {
    if(!this.loadingBuild){
      this.handleBuild()
    }else{
      notification.warning({ message: '正在创建，请勿频繁操作！' });
    }
  }

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
  handleLinkConfigFile = (link) => {
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
  render() {
    const { buildAppsLoading, deleteAppLoading } = this.props;
    const {
      showDelete,
      appPermissions: { isDelete },
      handleBuildSwitch,
      buildAppLoading
    } = this.state;
    const appDetail = this.state.appDetail || {};
    if (!appDetail.service) {
      return null;
    }
    return (
      <div>
        <h2
          style={{
            textAlign: 'center'
          }}
        >
          {formatMessage({id:'componentCheck.advanced.setup'})}
        </h2>
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
              onClick={() => this.handleLinkConfigFile('create-configFile')}
            >
              {formatMessage({id:'button.previous'})}
            </Button>
            <Button
              loading={buildAppLoading}
              style={{
                marginRight: 8
              }}
              onClick={()=>this.handleDebounce(this.handleBuild(handleBuildSwitch),1000)}
              type="primary"
            >
              {formatMessage({id:'button.confirm_create'})}
            </Button>
          </div>
          <CustomFooter />
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
      </div>
    );
  }
}
