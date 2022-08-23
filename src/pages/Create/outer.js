import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import OuterCustom from './outer-custom';

@connect(
  ({ enterprise, teamControl }) => ({
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
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
      match
    } = this.props;
    let { type } = match.params;

    const map = {
      outer: OuterCustom
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
        title={formatMessage({id: 'teamAdd.create.third.title'})}
        onTabChange={this.handleTabChange}
        content={
          <p>
            {formatMessage({id: 'teamAdd.create.third.desc'})}
          </p>
        }
      >
        {Com ? <Com {...this.props} /> : <>{formatMessage({id: 'teamAdd.create.error'})}</>}
      </PageHeaderLayout>
    );
  }
}
