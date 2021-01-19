import React, { PureComponent } from 'react';
import { Button, notification, Tooltip, Radio } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import { batchOperation } from '../../services/app';
import httpResponseUtil from '../../utils/httpResponse';
import ConfirmModal from '../../components/ConfirmModal';
import AppCreateMoreService from '../../components/AppCreateMoreService';

@connect(null, null, null, {
  withRef: true
})
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      //property、deploy
      type: 'property',
      appDetail: null,
      data: null,
      JavaMavenData: [],
      is_deploy: true,
      buildState: false
    };
  }
  componentDidMount() {
    // this.loadDetail();
    this.getMultipleModulesInfo();
  }
  componentWillUnmount() {
    this.props.dispatch({ type: 'appControl/clearDetail' });
  }

  getMultipleModulesInfo = () => {
    this.props.dispatch({
      type: 'appControl/getMultipleModulesInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        check_uuid: this.getCheck_uuid()
      },
      callback: (res) => {
        if (res && res._code == 200) {
          this.setState({
            data: res.list
          });
        }
      }
    });
  };
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  getCheck_uuid() {
    return this.props.match.params.check_uuid;
  }
  loadDetail = () => {
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: (data) => {
        this.setState({ appDetail: data });
      },
      handleError: (data) => {
        let code = httpResponseUtil.getCode(data);
        if (code) {
          //应用不存在
          if (code === 404) {
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
              )
            );
          }
        }
      }
    });
  };

  handleBuild = () => {
    this.setState({ buildState: true });
    const { JavaMavenData, is_deploy } = this.state;
    if (JavaMavenData.length > 0) {
      const teamName = globalUtil.getCurrTeamName();
      const appAlias = this.getAppAlias();
      this.props.dispatch({
        type: 'appControl/createService',
        payload: {
          team_name: teamName,
          app_alias: appAlias,
          service_infos: JavaMavenData
        },
        callback: (res) => {
          if (res && res._code == 200) {
            const groupId = res.bean && res.bean.group_id;
            const serviceIds = res.bean && res.bean.service_ids;
            if (is_deploy) {
              this.BuildShape(groupId, serviceIds);
            } else {
              this.fetchGroups(groupId);
            }
          }
        }
      });
    } else {
      this.setState({ buildState: false });
      notification.warning({ message: '请选择需要构建的模块' });
    }
  };

  BuildShape = (groupId, serviceIds) => {
    batchOperation({
      action: 'deploy',
      team_name: globalUtil.getCurrTeamName(),
      serviceIds: serviceIds && serviceIds.length > 0 && serviceIds.join(',')
    }).then(() => {
      this.fetchGroups(groupId);
    });
  };

  fetchGroups = (groupId) => {
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teamName,
        region_name: regionName
      },
      callback: () => {
        notification.success({
          message: '成功创建多组件',
          duration: '3'
        });
        this.setState({ buildState: false });
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${groupId}`
          )
        );
      }
    });
  };

  handleDelete = () => {
    const team_name = globalUtil.getCurrTeamName();
    const app_alias = this.getAppAlias();
    this.props.dispatch({
      type: 'appControl/deleteApp',
      payload: {
        team_name: team_name,
        app_alias: app_alias,
        is_force: true
      },
      callback: () => {
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
          )
        );
      }
    });
  };
  showDelete = () => {
    this.setState({ showDelete: true });
  };

  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };
  render() {
    const { data, is_deploy, buildState } = this.state;
    let arr = data;
    if (arr && arr.length > 0) {
      arr.map((item, index) => {
        arr[index].index = index;
      });
    }

    return (
      <div>
        <h2
          style={{
            textAlign: 'center'
          }}
        >
          JavaMaven多模块设置
        </h2>
        <div
          style={{
            overflow: 'hidden'
          }}
        >
          {data && data.length > 0 && (
            <AppCreateMoreService
              data={arr}
              onSubmit={(JavaMavenData) => {
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
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2,
              borderTop: '1px solid #e8e8e8'
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
                确认创建
              </Button>
              <div>
                <Tooltip
                  placement="topLeft"
                  title={<p>取消本选项,不构建启动。</p>}
                >
                  <Radio
                    size="small"
                    onClick={this.renderSuccessOnChange}
                    checked={is_deploy}
                  >
                    并构建启动
                  </Radio>
                </Tooltip>
              </div>
              <Button onClick={this.showDelete} type="default">
                放弃创建
              </Button>
            </div>
          </div>
          {this.state.showDelete && (
            <ConfirmModal
              onOk={this.handleDelete}
              title="放弃创建"
              subDesc="此操作不可恢复"
              desc="确定要放弃创建此组件吗？"
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
