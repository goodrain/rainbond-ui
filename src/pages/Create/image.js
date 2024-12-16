import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import { Icon, Button } from 'antd';
import ImageName from './image-name';
import ImageCmd from './image-cmd';
import ImageCompose from './image-compose';
import ImageNameDemo from './ImageName-Demo'
import roleUtil from '../../utils/newRole';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';


import { createEnterprise, createTeam } from '../../utils/breadcrumb';

@connect(
  ({ teamControl, enterprise, global }) => ({
    rainbondInfo: global.rainbondInfo,
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
  constructor(props) {
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
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match,
      rainbondInfo
    } = this.props;
    const map = {
      custom: ImageName,
      Dockercompose: ImageCompose,
      ImageNameDemo: ImageNameDemo,
    };

    const tabList = [
      {
        key: 'custom',
        tab: formatMessage({ id: 'teamAdd.create.image.tabImage' }),
      },
      {
        key: 'Dockercompose',
        tab: 'Docker Compose',
      }
    ];
    if (rainbondUtil.officialDemoEnable(rainbondInfo)) {
      tabList.push({
        key: 'ImageNameDemo',
        tab: formatMessage({ id: 'teamAdd.create.code.demo' }),
      },)
    }
    const { archInfo, teamAppCreatePermission: { isAccess } } = this.state
    if (!isAccess) {
      return roleUtil.noPermission()
    }
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
    breadcrumbList.push({ title: formatMessage({ id: 'teamAdd.create.createComponentTitle' }) });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title='从容器创建组件'
        onTabChange={this.handleTabChange}
        content='支持从单一镜像、Docker命令、DockerCompose配置创建应用。'
        tabActiveKey={type}
        tabList={tabList}
        titleSvg={pageheaderSvg.getSvg('dockerSvg', 18)}
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
