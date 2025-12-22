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
import styles from './NewIndex.less';
@connect(({ user, loading, global, teamControl, enterprise }) => ({
  currentUser: user.currentUser,
  enterprise: global.enterprise,
  currentTeam: teamControl.currentTeam,
  currentEnterprise: enterprise.currentEnterprise,
  loading,
  pluginsList: teamControl.pluginsList,
  noviceGuide: global.noviceGuide
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      userTeamList: [],
      showPipeline: [],
      currentTeam: this.props.currentTeam || {},
      indexLoading: true
    };
  }
  componentDidMount() {
    this.loadUserTeams();
    this.fetchGroup();
  }

  // 获取企业ID
  getEnterpriseId = () => {
    const { currentEnterprise, enterprise, currentUser } = this.props;
    return (currentEnterprise && currentEnterprise.enterprise_id)
      || (enterprise && enterprise.enterprise_id)
      || (currentUser && currentUser.enterprise_id)
      || globalUtil.getCurrEnterpriseId();
  };

  // 加载用户团队
  loadUserTeams = () => {
    const { dispatch } = this.props;
    const eid = this.getEnterpriseId();

    if (!eid) {
      return;
    }

    this.setState({ loading: true });

    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        name: '',
        page: 1,
        page_size: 100
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            userTeamList: res.list,
            loading: false
          }, () => {
            this.fetchPipePipeline(eid);
          });
        } else {
          this.setState({ loading: false });
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ loading: false });
      }
    });
  };
  // 设置流水线插件
  setTeamMenu = (pluginMenu, menuName) => {
    if (!pluginMenu) {
      return false;
    }
    return pluginMenu.some(item => item.name === menuName);
  };

  // 获取团队插件
  fetchPipePipeline = (eid) => {
    const { dispatch } = this.props;
    const enterpriseId = eid || this.getEnterpriseId();

    if (!enterpriseId) {
      return;
    }

    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: enterpriseId,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list) {
          const pluginArr = PluginUtil.segregatePluginsByHierarchy(res.list, 'Team');
          const pluginList = pluginArr.map(item => ({
            name: item.display_name,
            path: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/plugins/${item.name}`
          }));
          this.setState({ showPipeline: pluginList });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
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
        } else {
          this.setState({ indexLoading: false });
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({ indexLoading: false });
      }
    });
  };
  // 生成插件菜单
  getPluginsMenu = () => {
    const { showPipeline } = this.state;

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
    const { currentTeam, loading, indexLoading } = this.state;
    const { pluginsList, noviceGuide } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    return (
      <div className={styles.container}>
        <Spin spinning={loading || indexLoading}>
          <div className={styles.content}>
            <TeamBasicInfo noviceGuide={noviceGuide} pluginsList={pluginsList} />
          </div>
        </Spin>
      </div>
    );
  }
}
