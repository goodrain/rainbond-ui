import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { Redirect, Link } from 'dva/router';
import DocumentTitle from 'react-document-title';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import { stringify } from 'querystring';
import { enquireScreen } from 'enquire-js';

import { Layout } from 'antd';

import Context from './MenuContext';
import SiderMenu from '../components/SiderMenu';
import GlobalHeader from '../components/GlobalHeader';
import PageLoading from '../components/PageLoading';
import headerStype from '../components/GlobalHeader/index.less';
import Authorized from '../utils/Authorized';
import rainbondUtil from '../utils/rainbond';

import logo from '../../public/logo.png';

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
      enterpriseList: [],
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
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
              ready: true,
            },
            () => {
              this.fetchEnterpriseInfo();
            }
          );
        }
      },
    });
  };

  getPageTitle = () => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title &&
        rainbondInfo.title.enable &&
        rainbondInfo.title.value) ||
      ' Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.';
    return title;
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
    };
  }
  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };

  fetchEnterpriseInfo = () => {
    const { dispatch, currentUser } = this.props;
    if (currentUser && currentUser.enterprise_id) {
      // this.fetchEnterpriseService(currentUser.enterprise_id);
      dispatch({
        type: 'global/fetchEnterpriseInfo',
        payload: {
          enterprise_id: currentUser.enterprise_id,
        },
      });
    }
  };
  fetchEnterpriseService = eid => {
    const { dispatch } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseService',
      payload: {
        enterprise_id: eid,
      },
    });
  };

  render() {
    const {
      children,
      currentUser,
      rainbondInfo,
      collapsed,
      enterprise,
      location,
      location: { pathname },
    } = this.props;

    const { enterpriseList, isMobiles, ready } = this.state;
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, enterprise) || '';
    if (!ready || !enterprise) {
      return <PageLoading />;
    }
    const queryString = stringify({
      redirect: window.location.href,
    });
    if (!currentUser || !rainbondInfo || enterpriseList.length === 0) {
      return <Redirect to={`/user/login?${queryString}`} />;
    }

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
    const autoWidth = 'calc(100% -48px)';
    const customHeader = () => {
      return (
        <div className={headerStype.enterprise}>
          <Link to={`/enterprise/${currentUser.enterprise_id}/index`}>
            {enterprise && enterprise.enterprise_alias}
          </Link>
        </div>
      );
    };

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
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={isMobiles}
              customHeader={customHeader}
            />
            <Content
              key="sdfds"
              style={{
                margin: '24px 24px 0',
                height: '100%',
                width: autoWidth,
              }}
            >
              <Authorized
                logined
                authority={['admin', 'user']}
                noMatch={<Redirect to="/user/login" />}
              >
                {children}
              </Authorized>
            </Content>
          </Layout>
        </Layout>
      );
    };

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
      </Fragment>
    );
  }
}

export default connect(({ user, global, order }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  collapsed: global.collapsed,
  enterprise: global.enterprise,
}))(AccountLayout);
