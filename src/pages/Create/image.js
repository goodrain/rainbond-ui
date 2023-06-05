import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ImageName from './image-name';
import ImageCmd from './image-cmd';
import ImageCompose from './image-compose';
import ImageNameDemo from './ImageName-Demo'
import roleUtil from '../../utils/role';
import pageheaderSvg from '@/utils/pageHeaderSvg';
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
      ImageNameDemo: ImageNameDemo
    };

    const tabList = [
      {
        key: 'custom',
        tab: formatMessage({id: 'teamAdd.create.image.tabImage'}),
      },
      {
        key: 'dockerrun',
        tab: formatMessage({id: 'teamAdd.create.image.DockerRun'}),
      },
      {
        key: 'Dockercompose',
        tab: 'Docker Compose',
      },
      {
        key: 'ImageNameDemo',
        tab: formatMessage({ id: 'teamAdd.create.code.demo' }),
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
    breadcrumbList.push({ title: formatMessage({id: 'teamAdd.create.createComponentTitle'}) });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'teamAdd.create.image.title'})}
        onTabChange={this.handleTabChange}
        content={formatMessage({id: 'teamAdd.create.image.desc'})}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getSvg('dockerSvg',18)}
      >
        {Com ? <Com {...this.props} /> : <FormattedMessage id="teamAdd.create.error" />}
      </PageHeaderLayout>
    );
  }
}
