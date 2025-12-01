/* eslint-disable camelcase */
import { Button, notification, Radio, Tooltip } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AppCreateMoreService from '../../components/AppCreateMoreService';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import { batchOperation } from '../../services/app';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import handleAPIError from '../../utils/error';

@connect(
  ({ teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
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
      data: null,
      JavaMavenData: [],
      is_deploy: true,
      deleteLoading: false,
      buildState: false
    };
  }
  componentDidMount() {
    this.getMultipleModulesInfo();
  }
  componentWillUnmount() {
    this.props.dispatch({ type: 'appControl/clearDetail' });
  }
  getCheck_uuid() {
    return this.props.match.params.check_uuid;
  }
  getAppAlias() {
    return this.props.match.params.appAlias;
  }

  getMultipleModulesInfo = () => {
    this.props.dispatch({
      type: 'appControl/getMultipleModulesInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        check_uuid: this.getCheck_uuid()
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            data: res.list
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  handleBuild = () => {
    this.setState({ buildState: true });
    const { JavaMavenData, is_deploy } = this.state;
    if (JavaMavenData.length > 0) {
      const { team_name, app_alias } = this.fetchParameter();
      this.props.dispatch({
        type: 'appControl/createService',
        payload: {
          team_name,
          app_alias,
          service_infos: JavaMavenData
        },
        callback: res => {
          if (res && res.status_code === 200) {
            const groupId = res.bean && res.bean.group_id;
            const serviceIds = res.bean && res.bean.service_ids;
            if (is_deploy) {
              this.BuildShape(groupId, serviceIds);
            } else {
              this.fetchGroups(groupId);
            }
          }
        },
        handleError: err => {
          this.setState({ buildState: false });
          handleAPIError(err);
        }
      });
    } else {
      this.setState({ buildState: false });
      notification.warning({ message: formatMessage({ id: 'notification.warn.need_build_module' }) });
    }
  };

  BuildShape = (groupId, serviceIds) => {
    batchOperation({
      action: 'deploy',
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: serviceIds && serviceIds.length > 0 && serviceIds.join(',')
    })
      .then(() => {
        this.fetchGroups(groupId);
      })
      .catch(err => {
        this.setState({ buildState: false });
        handleAPIError(err);
      });
  };

  fetchGroups = groupId => {
    const { team_name, region_name } = this.fetchParameter();
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name,
        region_name
      },
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'notification.success.success_create_components' }),
          duration: '3'
        });
        this.setState({ buildState: false });
        this.handleJump(`apps/${groupId}/overview`);
      },
      handleError: err => {
        this.setState({ buildState: false });
        handleAPIError(err);
      }
    });
  };

  handleDelete = () => {
    const { team_name, app_alias } = this.fetchParameter();
    const { dispatch } = this.props;
    this.handleDeleteLoading(true);
    dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name,
        app_alias,
        is_force: true
      },
      callback: () => {
        this.handleDeleteLoading(false);
        this.handleJump(`index`);
      },
      handleError: err => {
        this.handleDeleteLoading(false);
        handleAPIError(err);
      }
    });
  };

  handleDeleteLoading = deleteLoading => {
    this.setState({ deleteLoading });
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
  handleJump = targets => {
    const { dispatch } = this.props;
    const { team_name, region_name } = this.fetchParameter();
    dispatch(
      routerRedux.replace(`/team/${team_name}/region/${region_name}/${targets}`)
    );
  };
  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };
  render() {
    const {
      data,
      is_deploy,
      buildState,
      showDelete,
      deleteLoading
      // appPermissions: { isDelete }
    } = this.state;
    const isDelete = true;
    const arr = data;
    if (arr && arr.length > 0) {
      arr.map((item, index) => {
        arr[index].index = index;
      });
    }

    return (
      <>
        <PageHeaderLayout
          titleSvg={pageheaderSvg.getPageHeaderSvg("advanced", 18)}
          title={formatMessage({ id: 'JavaMaven.title' })}
          content={formatMessage({ id: 'versionUpdata_6_1.content' })}
        >
          <div
            style={{
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {data && data.length > 0 && (
              <AppCreateMoreService
                data={arr}
                onSubmit={JavaMavenData => {
                  this.setState({
                    JavaMavenData
                  });
                }}
              />
            )}
            <div
              style={{
                background: '#fff',
                padding: '20px',
                textAlign: 'right',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                }}
              >
                <Button
                  style={{
                    marginRight: 8
                  }}
                  onClick={this.handleBuild}
                  loading={buildState}
                  type="primary"
                >
                  {formatMessage({ id: 'button.confirm_create' })}
                </Button>
                <div>
                  <Tooltip
                    placement="topLeft"
                    title={formatMessage({ id: 'JavaMaven.Tooltip' })}
                  >
                    <Radio
                      size="small"
                      onClick={this.renderSuccessOnChange}
                      checked={is_deploy}
                    >
                      {formatMessage({ id: 'button.build_start' })}
                    </Radio>
                  </Tooltip>
                </div>
                {isDelete && (
                  <Button onClick={this.showDelete} type="default">
                    {formatMessage({ id: 'button.abandon_create' })}
                  </Button>
                )}
              </div>
            </div>
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
        </PageHeaderLayout>
      </>
    );
  }
}
