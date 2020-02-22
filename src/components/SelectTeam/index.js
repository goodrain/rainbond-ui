import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Icon, Dropdown, Input, notification } from 'antd';
import style from './index.less';
import { Link } from 'dva/router';
import CreateTeam from '../CreateTeam';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';

@connect(({ user }) => ({
  currentUser: user.currentUser,
}))
export default class SelectTeam extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      queryName: '',
      page: 1,
      page_size: 5,
      userTeamList: [],
      userTeamsLoading: true,
      showCreateTeam: false,
      loading: true,
      visible: false,
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
    const { dispatch, currentUser, currentEnterprise } = this.props;
    const { page, page_size, queryName } = this.state;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        user_id: currentUser.user_id,
        name: queryName,
        page,
        page_size,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            userTeamList: res.list,
            userTeamsLoading: false,
            loading: false,
          });
        }
      },
    });
  };
  showCreateTeam = () => {
    this.setState({ showCreateTeam: true });
  };

  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: () => {
        notification.success({ message: formatMessage({ id: 'add.success' }) });
        this.cancelCreateTeam();
        this.loadUserTeams();
      },
    });
  };

  cancelCreateTeam = () => {
    this.setState({ showCreateTeam: false });
  };

  handleEnter = () => {
    this.setState({ visible: true });
  };
  handleOut = () => {
    this.setState({ visible: false });
  };

  render() {
    const {
      className,
      currentTeam,
      currentEnterprise,
      currentRegion,
      currentUser,
    } = this.props;
    const { userTeamList, loading, showCreateTeam, visible } = this.state;
    const currentTeamLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/index`;
    const currentEnterpriseTeamPageLink = `/enterprise/${currentEnterprise.enterprise_id}/teams`;
    const dropdown = (
      <div className={style.dropBox}>
        <div>
          <div className={style.dropBoxSearch}>
            <div className={style.dropBoxSearchInput}>
              <Icon
                className={style.dropBoxSearchInputIcon}
                onChange={this.queryTeams}
                loading={loading+""}
                type="search"
              />
              <Input
                className={style.dropBoxSearchInputContrl}
                placeholder={formatMessage({ id: 'header.team.search' })}
              />
            </div>
          </div>
        </div>
        <div>
          <div className={style.dropBoxList}>
            <ul>
              {userTeamList.map(item => {
                const link = `/team/${item.team_name}/region/${currentRegion.team_region_name}/index`;
                return (
                  <li key={item.team_name}>
                    <Link to={link} title={item.team_alias}>
                      <span>{item.team_alias}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {currentUser.is_user_enter_amdin && (
              <div
                className={style.dropBoxListCreate}
                onClick={this.showCreateTeam}
              >
                <Icon type="plus" />
                <FormattedMessage id="header.team.create" />
              </div>
            )}
          </div>
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
          visible={visible}
        >
          <div className={style.selectButton}>
            <Link className={style.selectButtonLink} to={currentTeamLink}>
              <div className={style.selectButtonName}>
                {currentTeam.team_alias}
              </div>
              <Icon className={style.selectButtonArray} type="caret-down" />
            </Link>
          </div>
        </Dropdown>
        {showCreateTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
      </div>
    );
  }
}
