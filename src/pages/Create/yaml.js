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
import rainbondUtil from '../../utils/rainbond';
import roleUtil from '../../utils/role';
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
  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  handleTabChange = key => {
    const { dispatch } = this.props;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/yaml/${key}`
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
