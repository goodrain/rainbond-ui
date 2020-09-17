/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ConfigurationTable from './Table';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
/* eslint react/no-array-index-key: 0 */

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
export default class Configuration extends PureComponent {
  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match
    } = this.props;
    const { teamName, regionName, appID } = match.params;
    const parameter = {
      regionName,
      teamName,
      appID
    };
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '应用列表' });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="应用配置组管理"
        content="配置组通过环境变量，文件挂载等方式注入到指定到组件运行环境中"
      >
        <ConfigurationTable {...parameter} />
      </PageHeaderLayout>
    );
  }
}
