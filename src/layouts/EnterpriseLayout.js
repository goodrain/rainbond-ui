import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Layout, Icon, message, notification } from 'antd';
import DocumentTitle from 'react-document-title';
import { connect } from 'dva';
import { Route, Redirect, routerRedux } from 'dva/router';
import { stringify } from 'querystring';
import memoizeOne from 'memoize-one';
import deepEqual from 'lodash.isequal';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import { enquireScreen } from 'enquire-js';
import GlobalHeader from '../components/GlobalHeader';
import PageLoading from '../components/PageLoading';
import SiderMenu from '../components/SiderMenu';
import pathToRegexp from 'path-to-regexp';
import globalUtil from '../utils/global';
import Authorized from '../utils/Authorized';
import rainbondUtil from '../utils/rainbond';
import { getMenuData } from '../common/enterpriseMenu';
import logo from '../../public/logo.png';
import Loading from '../components/Loading';
import GlobalRouter from '../components/GlobalRouter';
import AuthCompany from '../components/AuthCompany';
import Context from './MenuContext';
import headerStype from '../components/GlobalHeader/index.less';

const qs = require('query-string');

const { Content } = Layout;

const getBreadcrumbNameMap = memoizeOne(meun => {
  const routerMap = {};
  const mergeMeunAndRouter = meunData => {
    meunData.forEach(meunItem => {
      if (meunItem.children) {
        mergeMeunAndRouter(meunItem.children);
      }
      // Reduce memory usage
      routerMap[meunItem.path] = meunItem;
    });
  };
  mergeMeunAndRouter(meun);
  return routerMap;
}, deepEqual);

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

class EnterpriseLayout extends PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.breadcrumbNameMap = getBreadcrumbNameMap(
      getMenuData(this.props.groups)
    );
    this.state = {
      isMobile,
      isInit: false,
      showWelcomeCreateTeam: false,
      canCancelOpenRegion: true,
      market_info: '',
      showAuthCompany: false,
      enterpriseList: [],
      enterpriseInfo: false,
      ready: false,
    };
  }

  componentDidMount() {
    // fetch enterprise info
    this.getEnterpriseList();
  }

  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
              ready: true,
            },
            () => {
              this.redirectEnterpriseView();
              this.load();
            }
          );
        }
      },
    });
  };

  load = () => {
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    // 连接云应用市场
    this.setState({ showAuthCompany: this.props.showAuthCompany });
    const query = qs.parse(this.props.location.search);
    if (query && query.market_info) {
      this.setState({ market_info: query.market_info, showAuthCompany: true });
    }
  };

  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  getPageTitle = pathname => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title &&
        rainbondInfo.title.enable &&
        rainbondInfo.title.value) ||
      'Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.';
    return title;
  };

  matchParamsPath = pathname => {
    const pathKey = Object.keys(this.breadcrumbNameMap).find(key => {
      return pathToRegexp(key).test(pathname);
    });
    return this.breadcrumbNameMap[pathKey];
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap,
    };
  }

  redirectEnterpriseView = () => {
    const {
      dispatch,
      currentUser,
      rainbondInfo,
      match: {
        params: { eid },
      },
    } = this.props;
    const { enterpriseList } = this.state;
    if (!eid || eid == 'auto') {
      if (enterpriseList.length > 0) {
        let selectE = null;
        enterpriseList.map(item => {
          if (item.enterprise_id == currentUser.enterprise_id) {
            selectE = item;
          }
        });
        if (selectE == null) {
          selectE = enterpriseList[0];
        }
        globalUtil.putLog(Object.assign(rainbondInfo, selectE));
        this.fetchEnterpriseInfo(selectE.enterprise_id);
        this.setState({ enterpriseInfo: selectE });
        dispatch(
          routerRedux.replace(`/enterprise/${selectE.enterprise_id}/index`)
        );
      } else {
        dispatch(routerRedux.push('/user/login'));
      }
    } else {
      enterpriseList.map(item => {
        if (item.enterprise_id == eid) {
          this.fetchEnterpriseInfo(eid);
          globalUtil.putLog(Object.assign(rainbondInfo, item));
          this.setState({ enterpriseInfo: item });
        }
      });
    }
  };

  fetchEnterpriseInfo = eid => {
    if (!eid) {
      return null;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid,
      },
    });
  };

  render() {
    const {
      currentUser,
      collapsed,
      location: { pathname },
      match: {
        params: { eid },
      },
      groups,
      children,
      rainbondInfo,
      enterprise,
    } = this.props;

    const { enterpriseList, enterpriseInfo, ready } = this.state;
    const autoWidth = collapsed ? 'calc(100% - 416px)' : 'calc(100% - 116px)';

    const queryString = stringify({
      redirect: window.location.href,
    });
    if (!ready || !enterpriseInfo) {
      return <PageLoading />;
    }
    if (!currentUser || !rainbondInfo || enterpriseList.length === 0) {
      return <Redirect to={`/user/login?${queryString}`} />;
    }

    const customHeader = () => {
      return (
        <div className={headerStype.enterprise}>
          {enterpriseInfo && enterpriseInfo.enterprise_alias}
        </div>
      );
    };
    const layout = () => {
      return (
        <Layout>
          <SiderMenu
            currentEnterprise={enterpriseInfo}
            enterpriseList={enterpriseList}
            currentUser={currentUser}
            logo={fetchLogo}
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
          />
          <Layout>
            <GlobalHeader
              logo={fetchLogo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public &&
                rainbondInfo.is_public.enable
              }
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={this.state.isMobile}
              customHeader={customHeader}
            />
            <Layout style={{ flexDirection: 'row' }}>
              <GlobalRouter
                enterpriseList={enterpriseList}
                title={
                  rainbondInfo &&
                  rainbondInfo.title &&
                  rainbondInfo.title.enable &&
                  rainbondInfo.title.value
                }
                currentUser={currentUser}
                Authorized={Authorized}
                menuData={getMenuData(eid, currentUser)}
                showMenu
                pathname={pathname}
                location={location}
                isMobile={this.state.isMobile}
              />
              <Content
                key={eid}
                style={{
                  margin: '24px 24px 0',
                  height: '100%',
                  width: autoWidth,
                }}
              >
                <Authorized
                  logined
                  // authority={children.props.route.authority}
                  authority={['admin', 'user']}
                  noMatch={<Redirect to="/user/login" />}
                >
                  {children}
                </Authorized>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      );
    };
    const fetchLogo =
      rainbondUtil.fetchLogo(enterpriseInfo, enterprise) || logo;
    return (
      <Fragment>
        <DocumentTitle title={this.getPageTitle(pathname)}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout()}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>

        <Loading />

        {/* 企业尚未认证 */}
        {(this.props.showAuthCompany || this.state.showAuthCompany) && (
          <AuthCompany
            eid={eid}
            market_info={this.state.market_info}
            onOk={() => {
              const jumpPath = this.props.location.pathname;
              const query = this.props.location.search.replace(
                `market_info=${this.state.market_info}`,
                ''
              );
              this.setState({ market_info: '', showAuthCompany: false });
              this.props.dispatch(routerRedux.replace(jumpPath + query));
              window.location.reload();
            }}
          />
        )}
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
  currTeam: globalUtil.getCurrTeamName(),
  currRegion: globalUtil.getCurrRegionName(),
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse,
  enterprise: global.enterprise,
}))(EnterpriseLayout);
