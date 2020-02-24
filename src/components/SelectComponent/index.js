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
      components: [],
      showOpenRegion: false,
      loading: true,
      currentApp: {},
      queryName: "",
      visible: false
    };
  }
  componentDidMount() {
    this.loadComponents();
  }
  queryApps = query => {
    this.setState({ queryName: query }, () => {
      this.loadComponents();
    });
  };
  loadComponents = () => {
    const { dispatch, currentTeam, currentRegion, currentAppID } = this.props;
    const { queryName } = this.state;
    if (currentAppID) {
      dispatch({
        type: "groupControl/fetchApps",
        payload: {
          team_name: currentTeam.team_name,
          region_name: currentRegion.team_region_name,
          group_id: currentAppID,
          page: 1,
          page_size: 50,
          query: queryName
        },
        callback: data => {
          if (data && data._code == 200) {
            this.setState({
              components: data.list || []
            });
          }
        }
      });
    }
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
      currentComponent,
      currentRegion,
      currentAppID
    } = this.props;
    const currentTeamAppsPageLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/apps`;
    const { components, loading, currentApp, visible } = this.state;
    const currentAPPLink = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/apps/${currentAppID}`;
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
                placeholder={formatMessage({ id: "header.app.search" })}
              />
            </div>
          </div>
        </div>
        <div>
          <div className={style.dropBoxList}>
            <ul>
              {components.map(item => {
                const link = `/team/${currentTeam.team_name}/region/${currentRegion.team_region_name}/components/${item.service_alias}/overview`;
                return (
                  <li key={item.service_alias}>
                    <Link to={link} title={item.service_cname}>
                      <span>
                        {item.service_cname}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <Link className={style.dropBoxAll} to={currentTeamAppsPageLink}>
            <span>
              <FormattedMessage id="header.component.getall" />
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
        <Dropdown overlay={dropdown} visible={visible}>
          <div className={style.selectButton}>
            <Link className={style.selectButtonLink} to={currentAPPLink}>
              <div className={style.selectButtonName}>
                <span>
                  <FormattedMessage id="header.component.name" />
                </span>
                {currentComponent && currentComponent.service_cname}
              </div>
              <Icon className={style.selectButtonArray} type="caret-down" />
            </Link>
          </div>
        </Dropdown>
      </div>
    );
  }
}
