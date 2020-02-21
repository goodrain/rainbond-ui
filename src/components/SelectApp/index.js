import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Icon, Dropdown, notification, Input } from "antd";
import style from "../SelectTeam/index.less";
import EditGroupName from "../AddOrEditGroup";
import { Link } from "dva/router";
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';


@connect(({ user }) => ({
  currentUser: user.currentUser
}))
export default class SelectTeam extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      teamApps: [],
      showOpenRegion: false,
      loading: true,
      currentApp: {},
      queryName: "",
    };
  }
  componentDidMount() {
    this.loadTeamApps();
  }
  queryApps = (query) => {
    this.setState({queryName: query},()=>{
        this.loadTeamApps()
    })
  }
  loadTeamApps = () => {
    const { currentTeam, currentAppID } = this.props;
    const { queryName } = this.state
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: currentTeam.team_name,
        query: queryName,
      },
      callback: re => {
        this.setState({ teamApps: re, loading:false });
        re.map(item => {
          if (item.group_id == currentAppID) {
            this.setState({ teamApps: re, loading:false, currentApp: item});
            return
          }
        })
      }
    });
  };
  showCreateApp = () => {
    this.setState({ showCreateApp: true });
  };
  handleCreateApp = vals => {
    const { dispatch, currentTeam } = this.props;
    dispatch({
      type: 'groupControl/addGroup',
      payload: {
        team_name: currentTeam.team_name,
        group_name: vals.group_name,
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'add.success'}) });
        this.cancelCreateApp();
        this.loadTeamApps()
      },
    });
  };
  cancelCreateApp = () => {
    this.setState({ showCreateApp: false });
  };
  render() {
    const {
      className,
      currentTeam,
      currentEnterprise,
      currentRegion,
      currentAppID,
      currentUser
    } = this.props;
    const currentTeamAppsPageLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/apps`
    const { teamApps, loading, showCreateApp, currentApp } = this.state;
    const currentTeamRegionLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/index`;
    const dropdown = (
      <div className={style.dropBox}>
        <div>
          <div className={style.dropBoxSearch}>
            <div className={style.dropBoxSearchInput}>
              <Icon
                className={style.dropBoxSearchInputIcon}
                onChange={this.queryApps}
                loading={loading}
                type="search"
              />
              <Input
                className={style.dropBoxSearchInputContrl}
                placeholder={formatMessage({id:"header.app.search"})}
              />
            </div>
          </div>
        </div>
        <div>
          <div className={style.dropBoxList}>
            <ul>
              {teamApps.map(item => {
                const link = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/apps/${item.group_id}`;
                return (
                  <li key={item.group_name}>
                    <Link to={link} title={item.group_name}>
                      <span>
                        {item.group_name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div
                className={style.dropBoxListCreate}
                onClick={this.showCreateApp}
              >
                <Icon type="plus" />
                <FormattedMessage id="header.app.create"></FormattedMessage>
              </div>
          </div>
          <Link className={style.dropBoxAll} to={currentTeamAppsPageLink}>
            <span><FormattedMessage id="header.app.getall"></FormattedMessage></span>
            <Icon type="right" />
          </Link>
        </div>
      </div>
    );

    return (
      <div className={className}>
        <Dropdown overlay={dropdown}>
          <div className={style.selectButton}>
            <Link className={style.selectButtonLink} to={currentTeamRegionLink}>
              <div className={style.selectButtonName}>
                {currentApp.group_name}
              </div>
              <Icon className={style.selectButtonArray} type="caret-down" />
            </Link>
          </div>
        </Dropdown>
        {showCreateApp && <EditGroupName
            title={formatMessage({id:"header.app.create"})}
            onCancel={this.cancelCreateApp}
            onOk={this.handleCreateApp}
          />}
      </div>
    );
  }
}
