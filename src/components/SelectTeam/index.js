/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { Dropdown, Icon, Input, notification } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import userUtil from '../../utils/user';
import CreateTeam from '../CreateTeam';
import style from './index.less';

@connect(({ user }) => ({
  currentUser: user.currentUser
}))
export default class SelectTeam extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      queryName: '',
      page: 1,
      page_size: 5,
      userTeamList: [],
      showCreateTeam: false,
      loading: true,
      visible: false
    };
    // 标记组件是否已挂载
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
    this.loadUserTeams('');
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  queryTeams = queryName => {
    this.setState({ queryName }, () => {
      this.loadUserTeams();
    });
  };
  loadUserTeams = () => {
    if (this._isMounted) {
      this.setState({ loading: true });
    }
    const { dispatch, currentEnterprise } = this.props;
    const { page, page_size, queryName } = this.state;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        name: queryName,
        page,
        page_size
      },
      callback: res => {
        if (!this._isMounted) return;
        if (res && res.status_code === 200) {
          this.setState({
            userTeamList: res.list,
            loading: false
          });
        }
      }
    });
  };
  showCreateTeam = () => {
    this.handleOut();
    this.setState({ showCreateTeam: true });
  };

  cancelCreateTeam = () => {
    this.handleOut();
    this.setState({ showCreateTeam: false });
  };

  handleEnter = () => {
    this.setState({ visible: true });
  };
  handleOut = () => {
    this.setState({ visible: false });
  };
  getLoginRole = (currUser) => {
    const { dispatch } = this.props;
    const { teams } = currUser
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0]
      const { team_region_name } = region[0]
      if (team_name && team_region_name) {
        return`/team/${team_name}/region/${team_region_name}/index`
      }
    } else {
      if (currUser?.is_enterprise_admin) {
        return `/enterprise/${currUser?.enterprise_id}/index`
      }
    }
  }
  getTeamRegionItems = teams => {
    const { currentUser, currentTeam, currentRegion } = this.props;
    const { queryName } = this.state;
    const currentTeamName = currentTeam && currentTeam.team_name;
    const currentRegionName = currentRegion && currentRegion.team_region_name;
    const items = [];

    const addTeamRegions = team => {
      if (!team || !team.team_name) {
        return;
      }
      const teamInfo = userUtil.getTeamByTeamName(currentUser, team.team_name) || team;
      const regions = teamInfo.region || team.region || [];
      regions.forEach(region => {
        if (!region || !region.team_region_name) {
          return;
        }
        const item = {
          key: `${team.team_name}-${region.team_region_name}`,
          teamName: team.team_name,
          teamAlias: team.team_alias || teamInfo.team_alias || team.team_name,
          regionName: region.team_region_name,
          regionAlias: region.team_region_alias || region.team_region_name,
          link: `/team/${team.team_name}/region/${region.team_region_name}/index`
        };
        items.push({
          ...item,
          isCurrent:
            item.teamName === currentTeamName &&
            item.regionName === currentRegionName
        });
      });
    };

    teams.forEach(addTeamRegions);

    const hasCurrent = items.some(item => item.isCurrent);
    if (!queryName && currentTeamName && currentRegionName && !hasCurrent) {
      const currentUserTeam =
        userUtil.getTeamByTeamName(currentUser, currentTeamName) || currentTeam;
      const currentRegionInfo =
        ((currentUserTeam && currentUserTeam.region) || []).find(
          region => region.team_region_name === currentRegionName
        ) || currentRegion;

      items.unshift({
        key: `${currentTeamName}-${currentRegionName}`,
        teamName: currentTeamName,
        teamAlias:
          (currentUserTeam && currentUserTeam.team_alias) ||
          (currentTeam && currentTeam.team_alias) ||
          currentTeamName,
        regionName: currentRegionName,
        regionAlias:
          (currentRegionInfo && currentRegionInfo.team_region_alias) ||
          currentRegionName,
        link: `/team/${currentTeamName}/region/${currentRegionName}/index`,
        isCurrent: true
      });
    }

    return items;
  }
  render() {
    const {
      className,
      currentTeam,
      currentEnterprise,
      currentRegion,
      currentUser,
      active,
      changeTeam
    } = this.props;
    const { userTeamList, loading, showCreateTeam, visible } = this.state;
    const currentTeamLink = `/team/${currentTeam?.team_name}/region/${currentRegion?.team_region_name}/index`;
    const currentEnterpriseTeamPageLink = this.getLoginRole(currentUser)
    // 从最新的 userTeamList 中获取当前团队的最新名称
    const updatedCurrentTeam = userTeamList.find(team => team.team_name === currentTeam?.team_name);
    const currentUserTeam = userUtil.getTeamByTeamName(currentUser, currentTeam?.team_name);
    const displayTeamAlias = updatedCurrentTeam?.team_alias || currentUserTeam?.team_alias || currentTeam?.team_alias;
    const items = this.getTeamRegionItems(userTeamList || []);
    const dropdown = (
      <div className={style.dropBox}>
        <div className={style.dropBoxSearch}>
          <Input.Search
            onSearch={this.queryTeams}
            className={style.dropBoxSearchInputContrl}
            placeholder={formatMessage({ id: 'header.team.search' })}
            loading={loading}
            prefix={<Icon type="search" className={style.searchIcon} />}
            allowClear
          />
        </div>
        <div className={style.dropBoxContent}>
          {items.length > 0 ? (
            <div className={style.dropBoxList}>
              <ul>
                {items.map(item => {
                  if (item.link) {
                    return (
                      <li key={item.key}>
                        <Link
                          to={item.link}
                          title={`${item.teamAlias} | ${item.regionAlias}`}
                          aria-current={item.isCurrent ? 'page' : undefined}
                          onClick={()=>{changeTeam && changeTeam()}}
                          className={`${style.teamItem} ${item.isCurrent ? style.teamItemCurrent : ''}`}
                        >
                          <div className={style.teamItemContent}>
                            <div className={style.teamItemIcon}>
                              <Icon type="team" />
                            </div>
                            <div className={style.teamItemInfo}>
                              <div className={style.teamItemName}>{item.teamAlias}</div>
                              <div className={style.teamItemRegion}>
                                <Icon type="cluster" className={style.clusterIcon} />
                                {item.regionAlias}
                              </div>
                            </div>
                            {item.isCurrent && <Icon type="check" className={style.currentIcon} />}
                          </div>
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          ) : (
            !loading && (
              <div className={style.emptyState}>
                <Icon type="inbox" className={style.emptyIcon} />
                <p><FormattedMessage id="header.team.empty" defaultMessage="No teams found" /></p>
              </div>
            )
          )}
          {currentUser.is_user_enter_amdin && (
            <div
              className={style.dropBoxListCreate}
              onClick={this.showCreateTeam}
            >
              <Icon type="plus" className={style.createIcon} />
              <FormattedMessage id="header.team.create" />
            </div>
          )}
        </div>
      </div>
    );
    return (
      <div
        className={className}
        onMouseLeave={this.handleOut}
        onMouseEnter={this.handleEnter}
      >
        <Dropdown
          overlay={dropdown}
          visible={showCreateTeam ? false : visible}
          trigger={['click', 'hover']}
          placement="bottomLeft"
        >
          <div>
            {active && (
              <div className={style.selectButton}>
                <div className={`${style.selectButtonName} ${visible ? style.selectButtonNameActive : ''}`}>
                  <div className={style.selectButtonContent}>
                    <div className={style.selectButtonTeam}>
                      <Icon type="team" className={style.selectButtonTeamIcon} />
                      <span className={style.selectButtonTeamText}>{displayTeamAlias}</span>
                    </div>
                  </div>
                  <Icon
                    className={`${style.selectButtonArray} ${visible ? style.selectButtonArrayActive : ''}`}
                    type="caret-down"
                  />
                </div>
              </div>
            )}
            {!active && (
              <Link to={currentTeamLink} className={style.selectButton}>
                <div className={style.selectButtonName}>
                  <div className={style.selectButtonContent}>
                    <div className={style.selectButtonTeam}>
                      <Icon type="team" className={style.selectButtonTeamIcon} />
                      <span className={style.selectButtonTeamText}>{displayTeamAlias}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </Dropdown>
        {showCreateTeam && (
          <CreateTeam
            onOk={() => {
              this.cancelCreateTeam();
              this.loadUserTeams();
            }}
            onCancel={this.cancelCreateTeam}
          />
        )}
      </div>
    );
  }
}
