/* eslint-disable react/sort-comp */
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Row,
  Select,
  Tooltip,
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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ScrollerX from '../../components/ScrollerX';
import TeamBasicInfo from './TeamBasicInfo';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import sourceUtil from '../../utils/source-unit';
import PluginUtil from '../../utils/pulginUtils'
import userUtil from '../../utils/user';
import styles from './NewIndex.less';
const FormItem = Form.Item;
const { Option } = Select;
@connect(({ user, index, loading, global, teamControl, enterprise }) => ({
  currentUser: user.currentUser,
  index,
  enterprise: global.enterprise,
  events: index.events,
  pagination: index.pagination,
  rainbondInfo: global.rainbondInfo,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  loading,
  pluginsList: teamControl.pluginsList,
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      userTeamList: [],
      page: 1,
      page_size: 100,
      showPipeline: [],
      isNeedAuthz: false,
      currentTeam: this.props.currentTeam || {},
      indexLoading: true,
    };
  }
  componentDidMount() {
    this.loadUserTeams();
    this.fetchGroup()
  }
  // 加载用户团队
  loadUserTeams = () => {
    this.setState({ loading: true });
    const { dispatch, currentEnterprise } = this.props;
    const { page, page_size } = this.state;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        name: '',
        page,
        page_size
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            userTeamList: res.list,
            loading: false
          }, () => {
            this.fetchPipePipeline(currentEnterprise.enterprise_id);
          });
        }
      }
    });
  };
  // 设置流水线插件
  setTeamMenu = (pluginMenu, menuName) => {
    if(pluginMenu){
      const isShow = pluginMenu.some(item =>{
          return item.name == menuName
      })
      return isShow
    }
  }
  fetchPipePipeline = (eid) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: eid,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        const pluginArr = PluginUtil.segregatePluginsByHierarchy(res.list, 'Team')
        const pluginList = []
        pluginArr.forEach(item => {
          pluginList.push({
            name: item.display_name,
            path: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/plugins/${item.name}`,
          })
        })
        this.setState({
          showPipeline: pluginList
        })
      }
    })
  }
  fetchGroup = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'user/fetchCurrent',
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
    });
  };
  getPluginsMenu = () => {
    const { showPipeline } = this.state;
    const menu = (
      <Menu>
        {showPipeline.map(item => {
          return <Menu.Item key={item.path}>
            <Link to={item.path}>{item.name}</Link>
          </Menu.Item>;
        })}
      </Menu>
    )
    if (showPipeline.length > 0) {
      return <Dropdown overlay={menu} placement="bottomLeft" style={{ marginRight: 10 }}>
        <Button style={{ marginRight: 10 }}>
          <Icon type="control" />功能拓展
          <Icon type="down" className={styles.downIcon} />
        </Button>
      </Dropdown>
    }
    return null
  }
  // 生成菜单
  generateMenu = () => {
    const { currentUser } = this.props;
    const { userTeamList } = this.state;
    const items = [];
    userTeamList.map(team => {
      const teamInfo = userUtil.getTeamByTeamName(currentUser, team.team_name);
      if (teamInfo) {
        teamInfo.region.map(region => {
          const link = `/team/${team.team_name}/region/${region.team_region_name}/index`;
          const item = {
            name: `${team.team_alias} | ${region.team_region_alias}`,
            link: link,
            key: team.team_name
          };
          items.push(item);
        });
      }
    });
    const menu = (
      <Menu>
        {items.map(item => {
          return <Menu.Item key={item.key}>
            <Link to={item.link} title={item.name} onClick={() => {
              this.setState({
                indexLoading: true
              }, () => {
                this.fetchGroup()
              })
            }}>
              <span>{item.name}</span>
            </Link>
          </Menu.Item>;
        })}
      </Menu>
    );
    return menu;
  };

  render() {
    const { currentTeam } = this.state
    const { pluginsList } = this.props;
    return (
      <div className={styles.container} key={this.state.loading}>
        <Spin spinning={this.state.loading}>
          <div className={styles.header}>
            <div className={styles.left}>
              <Dropdown overlay={this.generateMenu()} placement="bottomLeft">
                <div className={styles.teamName}>
                  {this.state.currentTeam.team_alias}
                  <Icon type="down" className={styles.downIcon} />
                </div>
              </Dropdown>
            </div>
            <div className={styles.right}>
              {this.getPluginsMenu()}
              {this.setTeamMenu(pluginsList, 'pipeline') && 
                <Button
                style={{ marginRight: 10 }}
                onClick={() => {
                  const { dispatch } = this.props;
                  dispatch(
                    routerRedux.push({
                      pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Pipeline`,
                    })
                  );
                }}
              >
                {globalUtil.fetchSvg('pipeLine', false, '14px' )}
                {formatMessage({id:'menu.team.pipeline'})}
              </Button>
              }
    
              <Button
                style={{ marginRight: 10 }}
                onClick={() => {
                  const { dispatch } = this.props;
                  dispatch(
                    routerRedux.push({
                      pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`,
                    })
                  );
                }}
              >
                <Icon type="setting" />
                插件管理
              </Button>
              <Button onClick={() => {
                const { dispatch } = this.props;
                dispatch(
                  routerRedux.push({
                    pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/team`,
                  })
                );
              }}>
                <Icon type="setting" />
                {formatMessage({id:'versionUpdata_6_1.setting'})}
              </Button>
            </div>
          </div>
          <div className={styles.content}>
            <TeamBasicInfo pluginsList={pluginsList} />
          </div>
        </Spin>
      </div>

    );
  }
}
