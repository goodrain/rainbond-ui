import { Dropdown, Icon, Input, notification } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import roleUtil from '../../utils/role';
import EditGroupName from '../AddOrEditGroup';
import style from './index.less';

@connect(({ user, teamControl }) => ({
  currentUser: user.currentUser,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class SelectApp extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      teamApps: [],
      loading: true,
      currentApp: {},
      queryName: '',
      visible: false
    };
  }
  componentDidMount() {
    this.loadTeamApps();
  }
  queryApps = query => {
    this.setState({ queryName: query }, () => {
      this.loadTeamApps();
    });
  };
  loadTeamApps = () => {
    const { currentTeam, currentAppID } = this.props;
    const { queryName } = this.state;
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: currentTeam.team_name,
        query: queryName
      },
      callback: list => {
        if (list && list.length > 0) {
          const currentList = list.filter(
            item => item.group_id == currentAppID
          );
          if (currentList && currentList.length > 0) {
            this.setState({ currentApp: currentList[0] });
          }
          this.setState({ teamApps: list.reverse(), loading: false });
        } else {
          this.setState({ loading: false });
        }
      }
    });
  };
  showCreateApp = () => {
    this.handleOut();
    this.setState({ showCreateApp: true });
  };
  handleCreateApp = () => {
    notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
    this.cancelCreateApp();
    this.loadTeamApps();
  };
  cancelCreateApp = () => {
    this.handleOut();
    this.setState({ showCreateApp: false });
  };

  handleEnter = () => {
    this.setState({ visible: true });
  };
  handleOut = () => {
    this.setState({ visible: false });
  };
  handleClickApp = () =>{
    this.props.handleClick();
  }
  render() {
    const {
      className,
      currentTeam,
      currentRegion,
      currentAppID,
      currentComponent,
      active,
      currentTeamPermissionsInfo,
    } = this.props;
    const {
      teamApps,
      loading,
      showCreateApp,
      currentApp,
      visible
    } = this.state;
    const teamName = currentTeam?.team_name;
    const regionName = currentRegion?.team_region_name;
    const isCreateApp = true;
    const currentAPPLink = `/team/${teamName}/region/${regionName}/apps/${currentAppID}/overview`;
    const dropdown = (
      <div className={style.dropBox}>
        <div className={style.dropBoxSearch}>
          <Input.Search
            onSearch={this.queryApps}
            className={style.dropBoxSearchInputContrl}
            placeholder={formatMessage({ id: 'header.app.search' })}
            loading={loading}
            prefix={<Icon type="search" className={style.searchIcon} />}
            allowClear
          />
        </div>
        <div className={style.dropBoxContent}>
          {teamApps.length > 0 ? (
            <div className={style.dropBoxList}>
              <ul>
                {teamApps.map(item => {
                  const link = `/team/${teamName}/region/${regionName}/apps/${item.group_id}/overview`;
                  return (
                    <li key={item.group_id} onClick={this.handleClickApp}>
                      <Link to={link} title={item.group_name} className={style.appItem}>
                        <div className={style.appItemContent}>
                          <div className={style.appItemIcon}>
                            <Icon type="appstore" />
                          </div>
                          <div className={style.appItemInfo}>
                            <div className={style.appItemName}>{item.group_name}</div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            !loading && (
              <div className={style.emptyState}>
                <Icon type="inbox" className={style.emptyIcon} />
                <p><FormattedMessage id="header.app.empty" defaultMessage="No apps found" /></p>
              </div>
            )
          )}
          {isCreateApp && (
            <div
              className={style.dropBoxListCreate}
              onClick={this.showCreateApp}
            >
              <Icon type="plus" className={style.createIcon} />
              <FormattedMessage id="header.app.create" />
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
          visible={showCreateApp ? false : visible}
          trigger={['click', 'hover']}
          placement="bottomLeft"
        >
          <div>
            {active && (
              <div className={style.selectButton}>
                <div className={`${style.selectButtonName} ${visible ? style.selectButtonNameActive : ''}`}>
                  <div className={style.selectButtonContent}>
                    <div className={style.selectButtonApp}>
                      <Icon type="appstore" className={style.selectButtonAppIcon} />
                      <span className={style.selectButtonAppText}>{currentApp.group_name}</span>
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
              <Link to={currentAPPLink} className={style.selectButton}>
                <div className={style.selectButtonName}>
                  <div className={style.selectButtonContent}>
                    <div className={style.selectButtonApp}>
                      <Icon type="appstore" className={style.selectButtonAppIcon} />
                      <span className={style.selectButtonAppText}>{currentApp.group_name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </Dropdown>

        {showCreateApp && (
          <EditGroupName
            regionName={regionName}
            teamName={teamName}
            isGetGroups={false}
            title={formatMessage({ id: 'header.app.create' })}
            onCancel={this.cancelCreateApp}
            onOk={this.handleCreateApp}
          />
        )}
      </div>
    );
  }
}
