import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import CodeCustom from './code-custom';
import CodeDemo from './code-demo';
import CodeGitRepostory from '../../components/GitRepostory';
import rainbondUtil from '../../utils/rainbond';
import oauthUtil from '../../utils/oauth';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';

@connect(
  ({ teamControl, global, enterprise }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprise: global.enterprise,
  }),
  null,
  null,
  { pure: false }
)
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {};
  }
  componentDidMount() {}
  componentWillUnmount() {}
  handleTabChange = key => {
    const { dispatch, match } = this.props;
    const { appAlias } = this.props.match.params;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/${key}`
      )
    );
  };
  render() {
    const { rainbondInfo, enterprise } = this.props;
    const map = {
      custom: CodeCustom,
      demo: CodeDemo,
    };

    const tabList = [
      {
        key: 'custom',
        tab: '自定义源码',
      },
    ];
    if (rainbondUtil.officialDemoEnable(rainbondInfo)) {
      tabList.push({ key: 'demo', tab: '官方DEMO' });
    }
    const servers = oauthUtil.getEnableGitOauthServer(rainbondInfo, enterprise);
    if (servers && servers.length > 0) {
      servers.map(item => {
        const { name, service_id, oauth_type } = item;
        map[service_id] = CodeGitRepostory;
        tabList.push({
          key: service_id,
          types: oauth_type,
          tab:
            oauth_type === 'github'
              ? 'Github项目'
              : oauth_type === 'gitlab'
              ? 'Gitlab项目'
              : oauth_type === 'gitee'
              ? 'Gitee项目'
              : `${name}项目`,
        });
        return tabList;
      });
    }
    let type = this.props.match.params.type;
    if (!type) {
      type = 'custom';
    }
    const Com = map[type];
    let breadcrumbList = [];
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '创建组件' });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="由源码创建组件"
        onTabChange={this.handleTabChange}
        content={<p> 从指定源码仓库中获取源码，基于源码信息创建新组件 </p>}
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
          '参数错误'
        )}
      </PageHeaderLayout>
    );
  }
}
