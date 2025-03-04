import { Dropdown, Icon, notification } from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import OpenRegion from '../OpenRegion';
import style from '../SelectTeam/index.less';

@connect(({ user }) => ({
  currentUser: user.currentUser
}))
export default class SelectRegion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      teamRegions: [],
      showOpenRegion: false,
      loading: true,
      visible: false
    };
  }
  componentDidMount() {
    this.loadTeamRegions();
  }

  loadTeamRegions = () => {
    const { currentTeam } = this.props;
    this.setState({
      loading: false,
      teamRegions: currentTeam && currentTeam.region
    });
  };
  showOpenRegion = () => {
    this.handleOut();
    this.setState({ showOpenRegion: true });
  };
  handleOpenRegion = regions => {
    if (regions.length === 0) {
      return;
    }
    const { currentTeam } = this.props;
    this.props.dispatch({
      type: 'teamControl/openRegion',
      payload: {
        team_name: currentTeam.team_name,
        region_names: regions.join(',')
      },
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'notification.success.opened_successfully' })
        });
        this.cancelOpenRegion();
        this.props.dispatch({
          type: 'user/fetchCurrent',
          payload: {
            team_name: currentTeam.team_name
          },
          callback: () => {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${currentTeam.team_name}/region/${regions[0]}/index`
              )
            );
          }
        });
      }
    });
  };
  cancelOpenRegion = () => {
    this.handleOut();
    this.setState({ showOpenRegion: false });
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
      currentUser
    } = this.props;
    const { teamRegions, loading, showOpenRegion, visible } = this.state;
    const currentTeamRegionLink = `/team/${currentTeam?.team_name}/region/${currentRegion?.team_region_name}/index`;
    const dropdown = (
      <div className={style.dropBox}>
        <div>
          <div className={style.dropBoxList}>
            <ul>
              {teamRegions &&
                teamRegions.map(item => {
                  const link = `/team/${currentTeam?.team_name}/region/${item.team_region_name}/index`;
                  return (
                    <li key={item.team_region_alias}>
                      <Link to={link} title={item.team_region_alias}>
                        <span>{item.team_region_alias}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
            {currentUser.is_user_enter_amdin && (
              <div
                className={style.dropBoxListCreate}
                onClick={this.showOpenRegion}
              >
                <Icon type="plus" />
                <FormattedMessage id="header.region.open" />
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div
        className={className}
        onMouseLeave={this.handleOut}
        onMouseEnter={this.handleEnter}
      >
        <Dropdown overlay={dropdown} visible={showOpenRegion ? false : visible}>
          <div className={style.selectButton}>
            <div className={style.selectButtonName}>
              <span>
                <FormattedMessage id="header.region.name" />
              </span>
              <Icon className={style.selectButtonArray} type="caret-down" />
            </div>
          </div>
        </Dropdown>
        <Link className={style.selectButtonLink} to={currentTeamRegionLink}>
          {currentRegion.team_region_alias}
        </Link>
        {showOpenRegion && (
          <OpenRegion
            onSubmit={this.handleOpenRegion}
            onCancel={this.cancelOpenRegion}
          />
        )}
      </div>
    );
  }
}
