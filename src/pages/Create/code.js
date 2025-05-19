/* eslint-disable camelcase */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { Icon, Button, notification } from 'antd';
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
import OauthForm from '../../components/OauthForm';
import pageheaderSvg from '@/utils/pageHeaderSvg';

@connect(
  ({ teamControl, global, enterprise, user }) => ({
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprises: global.enterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser
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
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create'),
      oauthTable: [],
      visible: false,
      loading: false
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
    if (key === 'add') {
      this.setState({
        visible: true
      })
    }else{
      const { dispatch } = this.props;
      const group_id = globalUtil.getGroupID()
      dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/code/${key}?group_id=${group_id}`
        )
      );
    }

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
  handelClone = () => {
    this.setState({
      visible: false
    })
  };
  fetchOauthInfo = () => {
    const { dispatch, currUser } = this.props;
    this.setState({ loading: true });
    
    dispatch({
      type: 'global/getOauthInfo',
      payload: {
        enterprise_id: currUser.enterprise_id,
        system: false
      },
      callback: res => {
        if (res?.status_code === 200) {
          this.setState({
            oauthTable: res.list || [],
            loading: false
          });
        }
      }
    });
  };

  handleCreatOauth = values => {
    const { oauth_type, redirect_domain, ...rest } = values;
    const homeUrls = {
      github: 'https://github.com',
      aliyun: 'https://oauth.aliyun.com',
      dingtalk: 'https://oapi.dingtalk.com'
    };

    const oauthData = {
      ...rest,
      oauth_type: oauth_type.toLowerCase(),
      home_url: homeUrls[oauth_type.toLowerCase()] || '',
      redirect_uri: `${redirect_domain}/console/oauth/redirect`,
      is_auto_login: false,
      is_console: true
    };

    this.handleOauthRequest(oauthData);
  };

  handleOauthRequest = (data, isClone = false) => {
    const { dispatch, currUser } = this.props;
    const { oauthInfo, oauthTable } = this.state;
    
    const updatedData = {
      ...data,
      eid: currUser.enterprise_id,
      service_id: oauthInfo?.service_id || null,
      enable: !isClone,
      system: false
    };

    const updatedTable = [...oauthTable];
    if (oauthInfo) {
      const index = updatedTable.findIndex(item => item.service_id === updatedData.service_id);
      if (index > -1) {
        updatedTable[index] = { ...updatedTable[index], ...updatedData, is_console: true };
      }
    } else {
      updatedTable.push(updatedData);
    }
    dispatch({
      type: 'global/creatOauth',
      payload: {
        enterprise_id: currUser.enterprise_id,
        arr: updatedTable
      },
      callback: data => {
        if (data && data.status_code === 200) {
          notification.success({
            message: isClone
              ? formatMessage({ id: 'notification.success.close' })
              : oauthInfo
                ? formatMessage({ id: 'notification.success.edit' })
                : formatMessage({ id: 'notification.success.add' })
          });
          this.setState({
            visible: false
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
    const { serversList, archInfo, teamAppCreatePermission: { isAccess } } = this.state
    if (!isAccess) {
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
      },
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
    tabList.push({
      key: 'add',
      tab: <Icon type="plus" style={{
        display: 'flex',
        padding: '12px 0px 5px',
        marginRight: '0 !important'
      }} />
    });

    let { type } = match.params;
    type = type.split('?')[0];
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
    const group_id = globalUtil.getGroupID() || '';
    const isAppOverview = this.props.location?.query?.type || '';
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({ id: 'teamAdd.create.code.title' })}
        onTabChange={this.handleTabChange}
        content={<p><FormattedMessage id="teamAdd.create.code.desc" /></p>}
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getPageHeaderSvg('code', 18)}
        isContent
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard?group_id=${group_id}&type=${isAppOverview}`,)
            );
          }} type="default">
            <Icon type="rollback" />{formatMessage({ id: 'button.return' })}
          </Button>
        }
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
        {this.state.visible && (
          <OauthForm
            title={formatMessage({ id: 'versionUpdata_6_1.addPrivateGit' })}
            type="private"
            oauthInfo={false}
            onOk={this.handleCreatOauth}
            onCancel={this.handelClone}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
