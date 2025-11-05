/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { Dropdown, Icon, Input, notification } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
  }
  componentDidMount() {
    this.loadUserTeams('');
  }
  queryTeams = queryName => {
    this.setState({ queryName }, () => {
      this.loadUserTeams();
    });
  };
  loadUserTeams = () => {
    this.setState({ loading: true });
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
    const items = [];
    userTeamList.map(team => {
      const teamInfo = userUtil.getTeamByTeamName(currentUser, team.team_name);
      if (teamInfo) {
        teamInfo.region.map(region => {
          const link = `/team/${team?.team_name}/region/${region?.team_region_name}/index`;
          const item = {
            name: `${team?.team_alias} | ${region?.team_region_alias}`,
            link
          };
          items.push(item);
        });
      }
    });
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
                    const [teamName, regionName] = item.name.split(' | ');
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.link}
                          title={item.name}
                          onClick={()=>{changeTeam && changeTeam()}}
                          className={style.teamItem}
                        >
                          <div className={style.teamItemContent}>
                            <div className={style.teamItemIcon}>
                              <Icon type="team" />
                            </div>
                            <div className={style.teamItemInfo}>
                              <div className={style.teamItemName}>{teamName}</div>
                              <div className={style.teamItemRegion}>
                                <Icon type="cluster" className={style.clusterIcon} />
                                {regionName}
                              </div>
                            </div>
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
          <Link className={style.dropBoxAll} to={currentEnterpriseTeamPageLink}>
            <span>
              <FormattedMessage id="header.team.getall" />
            </span>
            <Icon type="right" />
          </Link>
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
                      <span className={style.selectButtonTeamText}>{currentTeam?.team_alias}</span>
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
                      <span className={style.selectButtonTeamText}>{currentTeam?.team_alias}</span>
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
