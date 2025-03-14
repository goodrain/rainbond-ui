import { Dropdown, Icon, Input } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import style from '../SelectTeam/index.less';

@connect(({ user, appControl }) => ({
  currentUser: user.currentUser,
  appDetail: appControl.appDetail
}))
export default class SelectComponent extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      components: [],
      showOpenRegion: false,
      loading: true,
      queryName: '',
      visible: false
    };
  }
  componentDidMount() {
    this.loadComponents();
  }
  queryComponent = query => {
    this.setState({ queryName: query }, () => {
      this.loadComponents();
    });
  };
  loadComponents = () => {
    const { dispatch, currentTeam, currentRegion, currentAppID } = this.props;
    const { queryName } = this.state;
    if (currentAppID) {
      dispatch({
        type: 'application/fetchApps',
        payload: {
          team_name: currentTeam?.team_name,
          region_name: currentRegion?.team_region_name,
          group_id: currentAppID,
          page: 1,
          page_size: -1,
          query: queryName
        },
        callback: data => {
          if (data && data.status_code === 200) {
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
      active,
      appDetail
    } = this.props;
    const groupId =
      appDetail && appDetail.service && appDetail.service.group_id;
    const currentTeamAppsPageLink = `/team/${currentTeam?.team_name}/region/${currentRegion?.team_region_name}/apps/${groupId}`;
    const { components, loading, visible } = this.state;
    const currentAPPLink =
      currentComponent &&
      `/team/${currentTeam.team_name}/region/${currentRegion?.team_region_name}/components/${currentComponent.service_alias}/overview`;
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
                onSearch={this.queryComponent}
                className={style.dropBoxSearchInputContrl}
                placeholder={formatMessage({ id: 'header.component.search' })}
              />
            </div>
          </div>
        </div>
        <div>
          <div className={style.dropBoxList}>
            <ul>
              {components.map(item => {
                const link = `/team/${currentTeam.team_name}/region/${currentRegion?.team_region_name}/components/${item.service_alias}/overview`;
                return (
                  <li key={item.service_alias}>
                    <Link to={link} title={item.service_cname}>
                      <span>{item.service_cname}</span>
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
    let showstyle = {};
    if (currentComponent) {
      showstyle = { background: '#4d73b1', color: '#ffffff' };
    }
    return (
      <div
        className={className}
        onMouseLeave={this.handleOut}
        onMouseEnter={this.handleEnter}
      >
        <Dropdown overlay={dropdown} visible={visible}>
          <div>
            {active && (
              <div className={style.selectButton}>
                <div className={style.selectButtonName} style={showstyle}>
                  <span>
                    {currentComponent && currentComponent.service_cname}
                    <Icon
                      className={style.selectButtonArray}
                      type="caret-down"
                    />
                  </span>
                </div>
              </div>
            )}
            {!active && currentAPPLink && (
              <Link
                className={style.selectButtonLink}
                to={currentAPPLink}
                title={currentComponent && currentComponent.service_cname}
              >
                {currentComponent && currentComponent.service_cname}
              </Link>
            )}
          </div>
        </Dropdown>
      </div>
    );
  }
}
