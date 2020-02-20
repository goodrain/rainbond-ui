import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Layout, Icon, message, notification } from 'antd';
import DocumentTitle from 'react-document-title';
import { connect } from 'dva';
import { Route, Redirect, routerRedux } from 'dva/router';
import { PageLoading } from "@ant-design/pro-layout";
import memoizeOne from 'memoize-one';
import SelectTeam from '../components/SelectTeam';
import SelectRegion from '../components/SelectRegion';
import SelectApp from '../components/SelectApp';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import { enquireScreen } from 'enquire-js';
import GlobalHeader from '../components/GlobalHeader';
import SiderMenu from '../components/SiderMenu';
import userUtil from '../utils/user';
import globalUtil from '../utils/global';
import cookie from '../utils/cookie';
import Authorized from '../utils/Authorized';
import { getMenuData } from '../common/teamMenu';
import { getAppMenuData } from '../common/appMenu';
import logo from '../../public/logo.png';
import GlobalRouter from '../components/GlobalRouter';
import Context from './MenuContext';
import headerStype from '../components/GlobalHeader/index.less';

const qs = require('query-string');

const { Content } = Layout;

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
  },
};

let isMobile;
enquireScreen(b => {
  isMobile = b;
});

class TeamLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.state = {
      isMobile,
      isInit: false,
      openRegion: false,
      createTeam: false,
      joinTeam: false,
      showChangePassword: false,
      showWelcomeCreateTeam: false,
      canCancelOpenRegion: true,
      market_info: '',
      showAuthCompany: false,
      enterpriseList: [],
      ready: false,
    };
  }

  componentDidMount() {
    this.getEnterpriseList()
  }

  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchEnterpriseList",
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
              ready: true,
            },
            () => {
              this.load();
            }
          );
        }
      }
    });
  };

  load = () => {
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    this.setState({ showAuthCompany: this.props.showAuthCompany });
    const query = qs.parse(this.props.location.search);
    if (query && query.market_info) {
      this.setState({ market_info: query.market_info });
      this.setState({ showAuthCompany: true });
    }
  };
  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };
  cancelOpenRegion = () => {
    this.setState({ openRegion: false, canCancelOpenRegion: true });
  };
  onCreateTeam = () => {
    this.setState({ createTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ createTeam: false });
  };
  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '添加成功' });
        this.cancelCreateTeam();
        this.props.dispatch({ type: 'user/fetchCurrent' });
      },
    });
  };
  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
  };
  handleJoinTeam = values => {
    this.props.dispatch({
      type: 'global/joinTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '申请成功，请等待审核' });
        this.cancelJoinTeam();
      },
    });
  };
  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  getPageTitle = pathname => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      'Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.';
    return title;
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };
  handleNoticeClear = type => {
    message.success(`清空了${type}`);
    const { dispatch } = this.props;
    dispatch({ type: 'global/clearNotices', payload: type });
  };
  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;

    if (key === 'cpw') {
      this.showChangePass();
    }
    if (key === 'logout') {
      cookie.remove('token', { domain: '' });
      cookie.remove('team', { domain: '' });
      cookie.remove('region_name', { domain: '' });
      dispatch({ type: 'user/logout' });
    }
  };
  handleNoticeVisibleChange = visible => {
    const { dispatch } = this.props;
    if (visible) {
      dispatch({ type: 'global/fetchNotices' });
    }
  };
  handleTeamClick = ({ key }) => {
    if (key === 'createTeam') {
      this.onCreateTeam();
      return;
    }
    if (key === 'joinTeam') {
      this.onJoinTeam();
      return;
    }

    cookie.set('team', key);
    const currentUser = this.props.currentUser;
    let currRegionName = globalUtil.getCurrRegionName();
    const currTeam = userUtil.getTeamByTeamName(currentUser, key);

    if (currTeam) {
      const regions = currTeam.region || [];
      if (!regions.length) {
        notification.warning({ message: '该团队下无可用数据中心!' });
        return;
      }
      const selectRegion = regions.filter(
        item => item.team_region_name === currRegionName
      )[0];
      const selectRegionName = selectRegion
        ? selectRegion.team_region_name
        : regions[0].team_region_name;
      currRegionName = selectRegionName;
    }
    const { enterpriseList } = this.state;
    this.props.dispatch(
      routerRedux.push(`/team/${key}/region/${currRegionName}/index`)
    );
    // location.reload();
  };

  handleRegionClick = ({ key }) => {
    if (key === 'openRegion') {
      this.onOpenRegion();
      return;
    }
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${key}/index`
      )
    );
    // location.reload();
  };
  showChangePass = () => {
    this.setState({ showChangePassword: true });
  };
  cancelChangePass = () => {
    this.setState({ showChangePassword: false });
  };
  handleChangePass = vals => {
    this.props.dispatch({
      type: 'user/changePass',
      payload: {
        ...vals,
      },
      callback: () => {
        notification.success({ message: '修改成功，请重新登录' });
      },
    });
  };

  handleInitTeamOk = () => {
    this.setState({ showWelcomeCreateTeam: false });
    this.fetchUserInfo();
  };
  handleCurrTeamNoRegion = () => {
    this.setState({ openRegion: true, canCancelOpenRegion: false });
  };
  handleOpenRegion = regions => {
    const { enterpriseList } = this.state;
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'teamControl/openRegion',
      payload: {
        team_name,
        region_names: regions.join(','),
      },
      callback: () => {
        notification.success({ message: '开通成功' });
        this.cancelOpenRegion();
        this.props.dispatch({
          type: 'user/fetchCurrent',
          callback: () => {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${key}/index`
              )
            );
          },
        });
      },
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap,
    };
  }
  getMode(appID) {
    if (appID){
      return "app"
    }
    return "team"
  }

  render() {
    const {
      currentUser,
      collapsed,
      children,
      location: { pathname },
      nouse,
      rainbondInfo,
    } = this.props;
    const { enterpriseList, ready } = this.state;
    const { teamName, regionName } = this.props.match.params
    if (!teamName || !regionName){
      return <Redirect to={`/`} />;
    }
    if (!ready) {
      return <PageLoading />;
    }
    const appID = globalUtil.getAppID()
    const mode = this.getMode(appID)
    const customHeader = () => {
      return (
      mode == "team" ?
        <div className={headerStype.enterprise}>
          <SelectTeam className={headerStype.select} teamName={teamName}></SelectTeam>
          <SelectRegion className={headerStype.select} regionName={regionName}></SelectRegion>
        </div> : <div className={headerStype.enterprise}>
          <SelectApp className={headerStype.select} teamName={teamName} appID={appID}></SelectApp>
        </div>
      )
    }
    let menuData = getMenuData(teamName, regionName)
    if (mode == "app") {
      menuData = getAppMenuData(teamName, regionName, appID)
    }
    const layout = () => {
      const team = userUtil.getTeamByTeamName(currentUser, teamName);
      const hasRegion = team && team.region && team.region.length;
      let region = null;
      let isRegionMaintain = false;
      if (hasRegion) {
        region = userUtil.hasTeamAndRegion(currentUser, teamName, regionName) || {};
        isRegionMaintain = region.region_status === '3' && !userUtil.isSystemAdmin(currentUser);
      }else{
        return <Redirect to={`/`} />;
      }
      const renderContent = () => {
        // 数据中心维护中
        if (isRegionMaintain || nouse) {
          return (
            <div style={{ textAlign: 'center', padding: '200px 0' }}>
              <Icon
                style={{ fontSize: 40, marginBottom: 32, color: 'red' }}
                type="warning"
              />
              <h1
                style={{
                  fontSize: 40,
                  color: 'rgba(0, 0, 0, 0.65)',
                  marginBottom: 20,
                }}
              >
                {nouse ? '当前授权已过期' : '数据中心维护中'}
              </h1>
              <p
                style={{
                  fontSize: 20,
                }}
              >
                {nouse
                  ? '请联系 010-64666786 获取更多商业服务。'
                  : '请稍后访问当前数据中心'}
              </p>
            </div>
          );
        }

        return (
          <div>
            <Authorized
              logined
              authority={['admin', 'user']}
              noMatch={<Redirect to="/user/login" />}
            >
              {children}
            </Authorized>
          </div>
        );
      };
      return (
        <Layout>
          <SiderMenu
            enterpriseList={enterpriseList}
            currentUser={currentUser}
            logo={
              (rainbondInfo &&
                rainbondInfo.logo !== undefined &&
                rainbondInfo.logo) ||
              logo
            }
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
          />
          <GlobalRouter
            enterpriseList={enterpriseList}
            title={
              rainbondInfo &&
              rainbondInfo.title !== undefined &&
              rainbondInfo.title
            }
            currentUser={currentUser}
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
            menuData={menuData}
            completeMenuData={menuData}
          />
          <Layout>
            <GlobalHeader
              logo={logo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public !== undefined &&
                rainbondInfo.is_public
              }
              currentUser={currentUser}
              collapsed={collapsed}
              isMobile={this.state.isMobile}
              customHeader={customHeader}
            />
            <Content
              style={{
                margin: '24px 24px 0',
                height: '100%',
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      );
    };
    return (
       <Fragment>
        <DocumentTitle title={this.getPageTitle(pathname)}>
              <ContainerQuery key={teamName+regionName} query={query}>
                {params =>
                  <Context.Provider value={this.getContext()}>
                    <div className={classNames(params)}>
                      {layout()}
                    </div>
                  </Context.Provider>}
              </ContainerQuery>
         </DocumentTitle>
     </Fragment>
    );
  }
}

export default connect(({ user, global, index, loading }) => ({
  currentUser: user.currentUser,
  notifyCount: user.notifyCount,
  collapsed: global.collapsed,
  groups: global.groups,
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse,
}))(TeamLayout);
