/* eslint-disable react/sort-comp */
import {
  Button,
  Dropdown,
  Menu,
  Icon,
  Spin
} from 'antd';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import ScrollerX from '../../components/ScrollerX';
import TeamBasicInfo from './TeamBasicInfo';
import globalUtil from '../../utils/global';
import PluginUtil from '../../utils/pulginUtils';
import userUtil from '../../utils/user';
import handleAPIError from '../../utils/error';
import teamUtil from '../../utils/team';
import MoveTeam from '../Team/move_team';
import styles from './NewIndex.less';
@connect(({ loading, global, teamControl, index }) => ({
  currentTeam: teamControl.currentTeam,
  overviewInfo: index.overviewInfo,
  loading,
  pluginsList: teamControl.pluginsList,
  noviceGuide: global.noviceGuide
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currentTeam: this.props.currentTeam || {},
      indexLoading: true,
      showEditName: false
    };
  }
  componentDidMount() {
    this.fetchGroup();
  }
  // 设置流水线插件
  setTeamMenu = (pluginMenu, menuName) => {
    if (!pluginMenu) {
      return false;
    }
    return pluginMenu.some(item => item.name === menuName);
  };

  getTeamPluginMenu = pluginsList => {
    const pluginArr = PluginUtil.segregatePluginsByHierarchy(pluginsList, 'Team');
    return pluginArr.map(item => ({
      name: item.display_name,
      path: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/plugins/${item.name}`
    }));
  };
  // 获取当前团队信息
  fetchGroup = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'user/fetchCurrent',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
          this.setState({
            currentTeam: team,
            indexLoading: false
          });
          dispatch({
            type: 'teamControl/fetchCurrentTeamPermissions',
            payload: team && team.tenant_actions
          });
          dispatch({
            type: 'teamControl/fetchCurrentTeam',
            payload: team
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ indexLoading: false });
      }
    });
  };

  showEditName = () => {
    this.setState({ showEditName: true });
  };

  hideEditName = () => {
    this.setState({ showEditName: false });
  };

  handleEditName = data => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/editTeamAlias',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...data
      },
      callback: () => {
        // 重新调用 fetchGroup 来更新整个状态
        this.fetchGroup();
        this.hideEditName();
      }
    });
  };

  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
    });
  };
  getPluginsMenu = () => {
    const { pluginsList } = this.props;
    const showPipeline = this.getTeamPluginMenu(pluginsList);

    if (showPipeline.length === 0) {
      return null;
    }

    const menu = (
      <Menu>
        {showPipeline.map(item => (
          <Menu.Item key={item.path}>
            <Link to={item.path}>{item.name}</Link>
          </Menu.Item>
        ))}
      </Menu>
    );

    return (
      <Dropdown overlay={menu} placement="bottomLeft">
        <Button style={{ marginRight: 10 }}>
          <Icon type="control" />功能拓展
          <Icon type="down" className={styles.downIcon} />
        </Button>
      </Dropdown>
    );
  };

  // 跳转路由
  navigateTo = pathname => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push({ pathname }));
  };

  render() {
    const { currentTeam, loading, indexLoading, showEditName } = this.state;
    const { pluginsList, noviceGuide, overviewInfo } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    return (
      <div className={styles.container}>
        <Spin spinning={loading || indexLoading}>
          <div className={styles.content}>
            <TeamBasicInfo noviceGuide={noviceGuide} pluginsList={pluginsList} />
          </div>
        </Spin>
        {showEditName && (
          <MoveTeam
            teamAlias={currentTeam.team_alias}
            imageUrlTeam={overviewInfo && overviewInfo.logo || false}
            onSubmit={this.handleEditName}
            onCancel={this.hideEditName}
          />
        )}
      </div>
    );
  }
}
