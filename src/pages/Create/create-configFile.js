/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { setNodeLanguage } from '../../services/createApp';
import AppConfigFile from '../../components/AppCreateConfigFile';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import CustomFooter from "../../layouts/CustomFooter";
import roleUtil from '../../utils/role';

@connect(
  ({ loading, teamControl }) => ({
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
      appPermissions: this.handlePermissions('queryAppInfo'),
      appDetail: null,
      handleBuildSwitch: false
    };
  }
  componentDidMount() {
    this.loadDetail();
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
    dispatch(routerRedux.push(`/team/${teamName}/region/${regionName}/create/${link}/${appAlias}`))
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
      appPermissions: { isDelete },
      handleBuildSwitch
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
          环境配置
        </h2>
        <div>
          <AppConfigFile
            updateDetail={this.loadDetail}
            appDetail={appDetail}
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
              上一步
            </Button>
            <Button
              loading={buildAppsLoading}
              onClick={this.handleJumpNext}
              type="primary"
            >
              下一步
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
