import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import { routerRedux } from 'dva/router';
import { Icon, Button } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import VirtualMachine from './virtual-machine';
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '../../utils/global';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import { requestedVmTargetGroup, vmCreationEntryPermissions } from './vmCreationEntry';

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}), null, null, { pure: false })
export default class Main extends PureComponent {
  render() {
    const { currentEnterprise, currentTeam, currentRegionName, match = {} } = this.props;
    const groupId = requestedVmTargetGroup(this.props, globalUtil.getAppID());
    const permission = vmCreationEntryPermissions(roleUtil, this.props.currentTeamPermissionsInfo?.team, groupId);
    if (!(groupId ? permission.canCreateInApplication : permission.canCreateApplication)) return roleUtil.noPermission();
    const type = (match.params?.type || 'VirtualMachine').split('?')[0];
    const breadcrumbList = createTeam(createEnterprise([], currentEnterprise), currentTeam, currentRegionName);
    breadcrumbList.push({ title: formatMessage({ id: 'teamAdd.create.createComponentTitle' }) });
    return <PageHeaderLayout breadcrumbList={breadcrumbList}
      title={formatMessage({ id: 'Vm.createVm.creatCom' })}
      titleSvg={pageheaderSvg.getPageHeaderSvg('vm', 18)}
      extraContent={<Button onClick={() => this.props.dispatch(routerRedux.push({
        pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard`,
        query: groupId ? { group_id: groupId } : {}
      }))}>
        <Icon type="rollback" />{formatMessage({ id: 'button.return' })}
      </Button>}>
      {type === 'VirtualMachine' ? <VirtualMachine {...this.props} /> : <FormattedMessage id="teamAdd.create.error" />}
    </PageHeaderLayout>;
  }
}
