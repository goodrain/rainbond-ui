import { Layout } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import { Link, Redirect, routerRedux } from 'dva/router';
import { enquireScreen } from 'enquire-js';
import { stringify } from 'querystring';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { ContainerQuery } from 'react-container-query';
import DocumentTitle from 'react-document-title';
import logo from '../../public/logo.png';
import GlobalHeader from '../components/GlobalHeader';
import headerStype from '../components/GlobalHeader/index.less';
import PageLoading from '../components/PageLoading';
import SiderMenu from '../components/SiderMenu';
import Authorized from '../utils/Authorized';
import rainbondUtil from '../utils/rainbond';
import Context from './MenuContext';

const { Content } = Layout;
let isMobile;
enquireScreen(b => {
  isMobile = b;
});
class AccountLayout extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      isMobiles: isMobile,
      enterpriseList: []
    };
  }
  componentDidMount() {
    this.getEnterpriseList();
  }

  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    // 获取最新的用户信息
    dispatch({ type: 'user/fetchCurrent' });
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
              ready: true
            },
            () => {
              this.fetchEnterpriseInfo();
            }
          );
        }
      }
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location
    };
  }
  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed
    });
  };

  fetchEnterpriseInfo = () => {
    const { dispatch, currentUser } = this.props;
    if (currentUser && currentUser.enterprise_id) {
      // this.fetchEnterpriseService(currentUser.enterprise_id);
      dispatch({
        type: 'global/fetchEnterpriseInfo',
        payload: {
          enterprise_id: currentUser.enterprise_id
        }
      });
    }
  };
  fetchEnterpriseService = eid => {
    const { dispatch } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseService',
      payload: {
        enterprise_id: eid
      }
    });
  };
  onJumpPersonal = () => {
    const { 
      enterprise,
      dispatch,
    } = this.props
    const eid = enterprise && enterprise.enterprise_id;
    dispatch(routerRedux.replace(`/enterprise/${eid}/personal`))
  }
  render() {
    const {
      children,
      currentUser,
      rainbondInfo,
      collapsed,
      enterprise,
      location
    } = this.props;

    const { enterpriseList, isMobiles, ready } = this.state;
    const eid = enterprise && enterprise.enterprise_id;
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, enterprise) || logo;
    if (!ready || !enterprise) {
      return <PageLoading />;
    }
    const queryString = stringify({
      redirect: window.location.href
    });
    if (!currentUser || !rainbondInfo || enterpriseList.length === 0) {
      return <Redirect to={`/user/login?${queryString}`} />;
    }

    const query = {
      'screen-xs': {
        maxWidth: 575
      },
      'screen-sm': {
        minWidth: 576,
        maxWidth: 767
      },
      'screen-md': {
        minWidth: 768,
        maxWidth: 991
      },
      'screen-lg': {
        minWidth: 992,
        maxWidth: 1199
      },
      'screen-xl': {
        minWidth: 1200
      }
    };
    const autoWidth = 'calc(100% -48px)';
    const customHeaderImg = () => {
      return (
        <div className={headerStype.enterprise} onClick={this.onJumpPersonal}>
           <img src={fetchLogo} alt="" />
        </div>
      );
    };
    const customHeader = () => {
      return (
        <Link
          style={{ color: '#fff', fontSize: '16px', fontWeight: 'bolder' }}
          to={`/enterprise/${eid}/personal`}
        >
          {formatMessage({ id: 'enterpriseTeamManagement.other.personal' })}
        </Link>
      )
    }
    const layout = () => {
      return (
        <Layout>
          <SiderMenu
            currentEnterprise={currentUser}
            enterpriseList={enterpriseList}
            currentUser={currentUser}
            logo={fetchLogo}
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={isMobiles}
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
              eid={eid}
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={isMobiles}
              customHeader={customHeader}
              customHeaderImg={customHeaderImg}
            />
            <Content
              key="sdfds"
              style={{
                height: 'calc(100vh - 64px)',
                overflow: 'auto',
                width: autoWidth
              }}
            >
              <div
                style={{
                  margin: '24px 24px 0'
                }}
              >
                <Authorized
                  logined
                  authority={['admin', 'user']}
                  noMatch={<Redirect to="/user/login" />}
                >
                  {children}
                </Authorized>
              </div>
            </Content>
          </Layout>
        </Layout>
      );
    };
    const SiteTitle = rainbondUtil.fetchSiteTitle(rainbondInfo);

    return (
      <Fragment>
        <DocumentTitle title={SiteTitle}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout()}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
      </Fragment>
    );
  }
}

export default connect(({ user, global }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  collapsed: global.collapsed,
  enterprise: global.enterprise
}))(AccountLayout);
