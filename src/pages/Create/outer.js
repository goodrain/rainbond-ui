import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import OuterCustom from './outer-custom';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';

@connect(
  ({ enterprise, teamControl }) => ({
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  }),
  null,
  null,
  { pure: false }
)
export default class Main extends PureComponent {
  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  handleTabChange = key => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/outer/${key}`
      )
    );
  };
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match,
    } = this.props;
    let { type } = match.params;

    const map = {
      outer: OuterCustom,
    };

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '创建组件' });
    if (!type) {
      type = 'outer';
    }
    const Com = map[type];

    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="添加第三方组件"
        onTabChange={this.handleTabChange}
        content={
          <p>
            第三方组件，即运行于平台集群外的组件，在平台中创建组件即可以将其与平台网关无缝对接，同时也可以被平台内服务访问。满足用户通过平台可以对
            各类组件进行统一的监控和管理的需要
          </p>
        }
      >
        {Com ? <Com {...this.props} /> : '参数错误'}
      </PageHeaderLayout>
    );
  }
}
