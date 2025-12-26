import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import roleUtil from '../../utils/newRole';
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
  constructor(props) {
    super(props);
    this.state = {
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create')
    };
  }
  componentWillMount() {

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
    const { teamAppCreatePermission:{isAccess} } = this.state;
    if(!isAccess){
      return roleUtil.noPermission()
    }
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
        titleSvg={pageheaderSvg.getPageHeaderSvg("outer",18)}
      >
        {Com ? <Com {...this.props} /> : <>{formatMessage({id: 'teamAdd.create.error'})}</>}
      </PageHeaderLayout>
    );
  }
}
