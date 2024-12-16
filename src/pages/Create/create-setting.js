/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { setNodeLanguage } from '../../services/createApp';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CustomFooter from '../../layouts/CustomFooter';
import AppCreateSetting from '../../components/AppCreateSetting';
import ConfirmModal from '../../components/ConfirmModal';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
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
      // appPermissions: this.handlePermissions('queryAppInfo'),
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
  handleDebounce(fn, wait) {
    let timer = null
    return (e) => {
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
    if (val == false) {
      setNodeLanguage({
        team_name: team_name,
        app_alias: app_alias,
        lang: soundCodeLanguage,
        package_tool: packageNpmOrYarn,
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

    } else {
      notification.warning({ message: formatMessage({ id: 'notification.warn.save' }) });
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
    })
  }
  render() {
    const {
      buildAppsLoading,
      deleteAppLoading,
      match: {
        params: {
          appAlias,
        }
      },
    } = this.props
    const {
      showDelete,
      // appPermissions: { isDelete },
      handleBuildSwitch
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
          <AppCreateSetting
            updateDetail={this.loadDetail}
            appDetail={appDetail}
            handleBuildSwitch={this.handleBuildSwitch}
          />
          <div
            style={{
              background: '#fff',
              padding: '20px',
              textAlign: 'right',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2,
              borderTop: '1px solid #e8e8e8'
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
              loading={buildAppsLoading}
              onClick={() => this.handleJump(`create/create-configPort/${appAlias}`)}
              style={{
                marginRight: 8
              }}
            >
              上一步
            </Button>
            <Button
              loading={buildAppsLoading}
              onClick={() => this.handleDebounce(this.handleBuild(handleBuildSwitch), 1000)}
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
        <CustomFooter />
      </>

    );
  }
}
