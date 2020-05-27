import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ImageName from './image-name';
import ImageCmd from './image-cmd';
import ImageCompose from './image-compose';
import roleUtil from '../../utils/role';
import globalUtil from '../../utils/global';

import { createEnterprise, createTeam } from '../../utils/breadcrumb';

@connect(
  ({ teamControl, enterprise }) => ({
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
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/${key}`
      )
    );
  };
  render() {
    const map = {
      custom: ImageName,
      dockerrun: ImageCmd,
      Dockercompose: ImageCompose,
    };

    const tabList = [
      {
        key: 'custom',
        tab: '指定镜像',
      },
      {
        key: 'dockerrun',
        tab: 'DockerRun命令',
      },
      {
        key: 'Dockercompose',
        tab: 'DockerCompose',
      },
    ];
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match,
    } = this.props;

    let { type } = match.params;
    if (!type) {
      type = 'custom';
    }
    const Com = map[type];
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '创建组件' });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="从Docker镜像创建组件"
        onTabChange={this.handleTabChange}
        content="支持从单一镜像、Docker命令、DockerCompose配置创建应用"
        tabActiveKey={type}
        tabList={tabList}
      >
        {Com ? <Com {...this.props} /> : '参数错误'}
      </PageHeaderLayout>
    );
  }
}
