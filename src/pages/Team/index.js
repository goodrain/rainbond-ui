import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import { Avatar, Button, Icon } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import MoveTeam from './move_team';
import ConfirmModal from '../../components/ConfirmModal';
import TeamDataCenterList from '../../components/Team/TeamDataCenterList';
import TeamMemberList from '../../components/Team/TeamMemberList';
import TeamRoleList from '../../components/Team/TeamRoleList';
import TeamEventList from '../../components/Team/TeamEventList';
import globalUtil from '../../utils/global';
import teamUtil from '../../utils/team';
import roleUtil from '../../utils/role';

import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import TeamImg from '../../../public/images/team-icon.png';
import styles from './index.less';

@connect(({ user, teamControl, loading, enterprise }) => ({
  currUser: user.currentUser,
  teamControl,
  projectLoading: loading.effects['project/fetchNotice'],
  activitiesLoading: loading.effects['activities/fetchList'],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    const params = this.getParam();
    this.state = {
      showEditName: false,
      showDelTeam: false,
      showExitTeam: false,
      scope: '',
      teamsUrl: this.props.currentEnterprise
        ? `/enterprise/${this.props.currentEnterprise.enterprise_id}/teams`
        : '/',
      eventPermissions: this.handleEventPermissions('dynamic_describe'),
      memberPermissions: this.handlePermissions('queryTeamMemberInfo'),
      datecenterPermissions: this.handlePermissions('queryTeamRegionInfo'),
      rolePermissions: this.handlePermissions('queryTeamRolesInfo'),
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;
    const {
      eventPermissions,
      memberPermissions: { isAccess: memberAccess },
      datecenterPermissions: { isAccess: datecenterAccess },
      rolePermissions: { isAccess: roleAccess },
    } = this.state;
    if (
      !eventPermissions &&
      !memberAccess &&
      !datecenterAccess &&
      !roleAccess
    ) {
      globalUtil.withoutPermission(dispatch);
    }

    let scopes = '';
    if (eventPermissions) {
      scopes = 'event';
    } else if (memberAccess) {
      scopes = 'member';
    } else if (datecenterAccess) {
      scopes = 'datecenter';
    } else {
      scopes = 'role';
    }
    this.setState({ scope: scopes });
  }

  componentDidMount() {
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
  }
  getParam() {
    return this.props.match.params;
  }
  handleEventPermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.queryTeamBasicInfo(currentTeamPermissionsInfo, type);
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  showEditName = () => {
    this.setState({ showEditName: true });
  };
  hideEditName = () => {
    this.setState({ showEditName: false });
  };
  showExitTeam = () => {
    this.setState({ showExitTeam: true });
  };
  hideExitTeam = () => {
    this.setState({ showExitTeam: false });
  };
  handleExitTeam = () => {
    const { dispatch } = this.props;
    const { teamsUrl } = this.state;
    dispatch({
      type: 'teamControl/exitTeam',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
      callback: res => {
        if (res && res._code === 200) {
          dispatch(routerRedux.push(teamsUrl));
        }
      },
    });
  };
  showDelTeam = () => {
    this.setState({ showDelTeam: true });
  };
  hideDelTeam = () => {
    this.setState({ showDelTeam: false });
  };
  handleEditName = data => {
    this.props.dispatch({
      type: 'teamControl/editTeamAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...data,
      },
      callback: () => {
        this.props.dispatch({ type: 'user/fetchCurrent' });
        this.hideEditName();
        this.handleUpDataHeader();
      },
    });
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true },
    });
  };
  handleDelTeam = () => {
    const { teamsUrl } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/delTeam',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
      callback: res => {
        if (res && res._code === 200) {
          dispatch(routerRedux.push(teamsUrl));
        }
      },
    });
  };
  handleTabChange = key => {
    this.setState({ scope: key });
  };
  render() {
    const {
      currUser,
      currentEnterprise,
      currentTeam,
      currentRegionName,
    } = this.props;
    const {
      scope,
      showEditName,
      showDelTeam,
      showExitTeam,
      eventPermissions,
      memberPermissions,
      datecenterPermissions,
      rolePermissions,
    } = this.state;

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar size="large" src={TeamImg} />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>
            {currentTeam.team_alias}{' '}
            {teamUtil.canEditTeamName(currentTeam) && (
              <Icon onClick={this.showEditName} type="edit" />
            )}
          </div>
          <div>
            创建于
            {moment(currentTeam.create_time)
              .locale('zh-cn')
              .format('YYYY-MM-DD')}
          </div>
        </div>
      </div>
    );
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.extraBtns}>
          <Button onClick={this.showExitTeam} type="dashed">
            退出团队
          </Button>
          <Button
            disabled={!teamUtil.canDeleteTeam(currUser)}
            onClick={this.showDelTeam}
            type="dashed"
          >
            删除团队
          </Button>
        </div>
      </div>
    );

    const tabList = [];
    if (eventPermissions) {
      tabList.push({
        key: 'event',
        tab: '动态',
      });
    }
    if (memberPermissions) {
      tabList.push({
        key: 'member',
        tab: '成员',
      });
    }
    if (datecenterPermissions) {
      tabList.push({
        key: 'datecenter',
        tab: '集群',
      });
    }
    if (rolePermissions) {
      tabList.push({
        key: 'role',
        tab: '角色',
      });
    }

    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '团队设置' });
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        tabList={tabList}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        {scope === 'datecenter' && (
          <TeamDataCenterList datecenterPermissions={datecenterPermissions} />
        )}
        {scope === 'member' && (
          <TeamMemberList memberPermissions={memberPermissions} />
        )}
        {scope === 'role' && <TeamRoleList rolePermissions={rolePermissions} />}
        {scope === 'event' && eventPermissions && (
          <TeamEventList memberPermissions={memberPermissions} />
        )}

        {showEditName && (
          <MoveTeam
            teamAlias={currentTeam.team_alias}
            onSubmit={this.handleEditName}
            onCancel={this.hideEditName}
          />
        )}
        {showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelTeam}
            title="删除团队"
            subDesc="此操作不可恢复"
            desc="确定要删除此团队吗？"
            onCancel={this.hideDelTeam}
          />
        )}
        {showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title="退出团队"
            subDesc="此操作不可恢复"
            desc="确定要退出此团队吗?"
            onCancel={this.hideExitTeam}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
