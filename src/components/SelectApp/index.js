import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Icon, Dropdown, notification, Input } from "antd";
import style from "../SelectTeam/index.less";
import EditGroupName from "../AddOrEditGroup";
import { Link } from "dva/router";
import { FormattedMessage, formatMessage } from "umi-plugin-react/locale";

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
      type: "global/fetchGroups",
      payload: {
        team_name: currentTeam.team_name,
        query: queryName
      },
      callback: re => {
        this.setState({ teamApps: re, loading: false });
        re.map(item => {
          if (item.group_id == currentAppID) {
            this.setState({ teamApps: re, loading: false, currentApp: item });
          }
        });
      }
    });
  };
  showCreateApp = () => {
    this.setState({ showCreateApp: true });
  };
  handleCreateApp = vals => {
    const { dispatch, currentTeam } = this.props;
    dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: currentTeam.team_name,
        group_name: vals.group_name
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: "add.success" }) });
        this.cancelCreateApp();
        this.loadTeamApps();
      }
    });
  };
  cancelCreateApp = () => {
    this.setState({ showCreateApp: false });
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
      currentAppID,
      currentComponent
    } = this.props;
    const currentTeamAppsPageLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/apps`;
    const {
      teamApps,
      loading,
      showCreateApp,
      currentApp,
      visible
    } = this.state;
    const currentAPPLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/apps/${currentAppID}`;
    const dropdown = (
      <div className={style.dropBox}>
        <div>
          <div className={style.dropBoxSearch}>
            <div className={style.dropBoxSearchInput}>
              <Icon
                className={style.dropBoxSearchInputIcon}
                loading={loading}
                type="search"
              />
              <Input.Search
                onSearch={this.queryApps}
                className={style.dropBoxSearchInputContrl}
                placeholder={formatMessage({ id: "header.app.search" })}
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
                  <li key={item.group_id}>
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
              <FormattedMessage id="header.app.create" />
            </div>
          </div>
          <Link className={style.dropBoxAll} to={currentTeamAppsPageLink}>
            <span>
              <FormattedMessage id="header.app.getall" />
            </span>
            <Icon type="right" />
          </Link>
        </div>
      </div>
    );
    let showstyle = {}
    if (!currentComponent) {
      showstyle = {background: "#1890ff", color: "#ffffff"}
    }
    return (
      <div
        className={className}
        onMouseLeave={this.handleOut}
        onMouseEnter={this.handleEnter}
      >
        <Dropdown overlay={dropdown} visible={visible}>
          <div className={style.selectButton}>
            <div className={style.selectButtonName} style={showstyle}>
              <span>
                <FormattedMessage id="header.app.name" />
              </span>
              <Icon className={style.selectButtonArray} type="caret-down" />
            </div>
          </div>
        </Dropdown>
        <Link className={style.selectButtonLink} to={currentAPPLink}>
          {currentApp.group_name}
        </Link>
        {showCreateApp &&
          <EditGroupName
            title={formatMessage({ id: "header.app.create" })}
            onCancel={this.cancelCreateApp}
            onOk={this.handleCreateApp}
          />}
      </div>
    );
  }
}
