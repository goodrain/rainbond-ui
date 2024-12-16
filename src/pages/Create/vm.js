import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import VirtualMachine from './virtual-machine'
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import { Icon, Button } from 'antd';
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
  constructor(props){
    super(props)
    this.state = {
      archInfo: [],
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create')
    }
  }
  componentWillMount() {
    this.handleArchCpuInfo()
  }
  handleArchCpuInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'index/fetchArchOverview',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            archInfo: res.list
          })
        }
      }
    });
  }
  handleTabChange = key => {
    const { dispatch } = this.props;
    const group_id = globalUtil.getGroupID()  
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/image/${key}?group_id=${group_id}`
      )
    );
  };
  render() {
    const map = {
      VirtualMachine: VirtualMachine
    };

    const tabList = [
      {
        key: 'VirtualMachine',
        tab: formatMessage({id:'Vm.createVm.VmImg'}),
      },
    ];
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match,
    } = this.props;
    const { archInfo, teamAppCreatePermission: { isAccess } } = this.state
    if(!isAccess){
      return roleUtil.noPermission()
    }
    let { type } = match.params;
    type = type.split('?')[0];
    if (!type) {
      type = 'VirtualMachine';
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
        title={formatMessage({id: 'Vm.createVm.creatCom'})}
        onTabChange={this.handleTabChange}
        content={formatMessage({id: 'Vm.createVm.creatApp'})}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getPageHeaderSvg('vm',18)}
        extraContent={
          <Button onClick={() => {
              const { dispatch } = this.props;
              dispatch(
                  routerRedux.push({
                      pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`,
                  })
              );
          }} type="default">
              <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.home' })}
          </Button>
      }
      >
        {Com ? <Com archInfo={archInfo} {...this.props} /> : <FormattedMessage id="teamAdd.create.error" />}
      </PageHeaderLayout>
    );
  }
}
