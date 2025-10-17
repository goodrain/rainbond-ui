/* eslint-disable camelcase */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeGitRepostory from '../../components/GitRepostory';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import ImportCluster from '../AddCluster/ImportMessage/message';
import globalUtil from '../../utils/global';
import oauthUtil from '../../utils/oauth';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import { Icon, Button } from 'antd';
import rainbondUtil from '../../utils/rainbond';
import roleUtil from '../../utils/newRole';
import Yaml from './yaml-yaml';
import Helm from './helm-cmd';
import OuterCustom from './outer-custom';


@connect(
  ({ teamControl, global, enterprise, user }) => ({
    currentUser: user.currentUser,
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprise: global.enterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
  }),
  null,
  null,
  { pure: false }
)
export default class Main extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create'),
      region_id: this.props.currentTeam?.region[0]?.region_id,
      eid: this.props.currentUser?.enterprise_id
    }
  }
  componentWillMount() {
    
  }
  handleTabChange = key => {
    const { dispatch } = this.props;
    const group_id = globalUtil.getAppID()
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/yaml/${key}?group_id=${group_id}`
      )
    );
  };
  render() {
    const {
      rainbondInfo,
      enterprise,
      match,
      currentEnterprise,
      currentTeam,
      currentRegionName
    } = this.props;
    const { teamAppCreatePermission:{isAccess} } = this.state;
    const showSecurityRestrictions = !rainbondInfo?.security_restrictions?.enable
    if(!isAccess){
      return roleUtil.noPermission()
    }
    const map = {
      yaml: Yaml,
      importCluster: ImportCluster,
      helm: Helm,
      outerCustom: OuterCustom
    };

    const tabList = [
      {
        key: 'yaml',
        tab: formatMessage({id:'teamAdd.create.upload.uploadFiles.yaml'})
      },
      {
        key: 'outerCustom',
        tab: formatMessage({id:'appOverview.list.table.btn.third_party'})
      }
    ];
    if(showSecurityRestrictions){
      tabList.push(
        {
          key: 'importCluster',
          tab: formatMessage({id:'teamAdd.create.upload.uploadFiles.k8s'})
        },
        {
          key: 'helm',
          tab: formatMessage({id:'teamAdd.create.upload.uploadFiles.helm'})
        }
      )
    }
    let { type } = match.params;
    type = type.split('?')[0];
    if (!type) {
      type = 'yaml';
    }
    const Com = map[type];
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '创建组件' });
    const group_id = globalUtil.getAppID()
    const isAppOverview = this.props.location?.query?.type || '';
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={showSecurityRestrictions ? formatMessage({id: 'teamAdd.create.upload.title'}) : 'YAML'}
        onTabChange={this.handleTabChange}
        content={<p>{showSecurityRestrictions ? formatMessage({id: 'teamAdd.create.upload.desc'}) : '支持从 Kubernetes YAML创建组件'}</p>}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getPageHeaderSvg('yaml',18)}
        extraContent={
          <Button onClick={() => {
              const { dispatch } = this.props;
              dispatch(
                  routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${group_id}&type=${isAppOverview}`)
              );
          }} type="default">
            <Icon type="rollback" />{formatMessage({ id: 'button.return' })}
          </Button>
      }
      >
        {Com ? (
          <Com
            eid={this.state.eid}
            region_id={this.state.region_id}
            {...this.props}
            type={this.props.match.params.type}
            tabList={tabList}
            groupId={group_id}
          />
        ) : (
          <>
          {formatMessage({id: 'teamAdd.create.error'})}
          </>
        )}
      </PageHeaderLayout>
    );
  }
}
