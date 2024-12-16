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


@connect(
  ({ teamControl, global, enterprise }) => ({
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
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create')
    }
  }
  componentWillMount() {

  }
  handleTabChange = key => {
    const { dispatch } = this.props;
    const group_id = globalUtil.getGroupID()
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
    if(!isAccess){
      return roleUtil.noPermission()
    }
    const map = {
      yaml: Yaml,
      importCluster: ImportCluster,
      helm: Helm
    };

    const tabList = [
      {
        key: 'yaml',
        tab: formatMessage({id:'teamAdd.create.upload.uploadFiles.yaml'})
      },
      {
        key: 'importCluster',
        tab: formatMessage({id:'teamAdd.create.upload.uploadFiles.k8s'})
      },
      {
        key: 'helm',
        tab: formatMessage({id:'teamAdd.create.upload.uploadFiles.helm'})
      }
    ];
    
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
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'teamAdd.create.upload.title'})}
        onTabChange={this.handleTabChange}
        content={<p>{formatMessage({id: 'teamAdd.create.upload.desc'})}</p>}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getPageHeaderSvg('yaml',18)}
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
        {Com ? (
          <Com
            {...this.props}
            type={this.props.match.params.type}
            tabList={tabList}
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
