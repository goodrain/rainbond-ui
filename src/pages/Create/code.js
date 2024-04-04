/* eslint-disable camelcase */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import CodeGitRepostory from '../../components/GitRepostory';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import oauthUtil from '../../utils/oauth';
import rainbondUtil from '../../utils/rainbond';
import roleUtil from '../../utils/newRole';
import CodeCustom from './code-custom';
import CodeDemo from './code-demo';
import Jwar from './jwar';
import pageheaderSvg from '@/utils/pageHeaderSvg';

@connect(
  ({ teamControl, global, enterprise }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprises: global.enterprise,
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
      serversList: null,
      archInfo: [],
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create')
    }
  }

  componentWillMount() {

  }
  componentDidMount() {
    const enterprise_id = this.props.currentEnterprise && this.props.currentEnterprise.enterprise_id
    this.fetchEnterpriseInfo(enterprise_id)
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
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/${key}`
      )
    );
  };
  fetchEnterpriseInfo = eid => {
    if (!eid) {
      return null;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            serversList: res.bean
          })
        }
      }
    });
  };

  render() {
    const {
      rainbondInfo,
      enterprises,
      match,
      currentEnterprise,
      currentTeam,
      currentRegionName,
    } = this.props;
    const { serversList, archInfo, teamAppCreatePermission: { isAccess }  } = this.state
    if(!isAccess){
      return roleUtil.noPermission()
    }
    const map = {
      custom: CodeCustom,
      demo: CodeDemo,
      jwar: Jwar
    };

    const tabList = [
      {
        key: 'custom',
        tab: formatMessage({ id: 'teamAdd.create.code.customSource' })
      },
      {
        key: 'jwar',
        tab: formatMessage({ id: 'teamAdd.create.code.package' })
      }
    ];
    if (rainbondUtil.officialDemoEnable(rainbondInfo)) {
      tabList.push({ key: 'demo', tab: formatMessage({ id: 'teamAdd.create.code.demo' }) });
    }
    const servers = oauthUtil.getEnableGitOauthServer(serversList);
    if (servers && servers.length > 0) {
      servers.map(item => {
        const { name, service_id, oauth_type } = item;
        const typeMap = {
          github: 'Github',
          gitlab: 'Gitlab',
          gitee: 'Gitee'
        };
        const setName = typeMap[oauth_type] || '';
        const tabName = setName
          ? `${setName} ${name && `(${name})`}`
          : `${name}项目`;

        map[service_id] = CodeGitRepostory;
        tabList.push({
          key: service_id,
          types: oauth_type,
          tab: tabName
        });
        return tabList;
      });
    }

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
    breadcrumbList.push({ title: '创建组件' });

    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({ id: 'teamAdd.create.code.title' })}
        onTabChange={this.handleTabChange}
        content={<p><FormattedMessage id="teamAdd.create.code.desc" /></p>}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getSvg('addSvg', 18)}
      >
        {Com ? (
          <Com
            archInfo={archInfo}
            {...this.props}
            type={this.props.match.params.type}
            tabList={tabList}
          />
        ) : (
          <>
            {formatMessage({ id: 'teamAdd.create.error' })}
          </>
        )}
      </PageHeaderLayout>
    );
  }
}
