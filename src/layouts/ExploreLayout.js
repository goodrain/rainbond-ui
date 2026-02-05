import { Layout } from 'antd';
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import { stringify } from 'querystring';
import React, { PureComponent } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import logo from '../../public/logo-icon.png';
import GlobalHeader from '../components/GlobalHeader';
import PageLoading from '../components/PageLoading';
import Authorized from '../utils/Authorized';
import rainbondUtil from '../utils/rainbond';
import { BackTopIcon } from '../pages/Explore/icons';
import styles from './ExploreLayout.less';

const { Content } = Layout;

class ExploreLayout extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      enterpriseInfo: null,
      showBackTop: false
    };
  }

  componentDidMount() {
    this.loadData();
    window.addEventListener('scroll', this.handleScroll);
  }

  componentDidUpdate(prevProps) {
    // 页面切换时滚动到顶部
    if (prevProps.location.pathname !== this.props.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    this.setState({
      showBackTop: scrollTop > windowHeight
    });
  };

  scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  loadData = () => {
    const { dispatch, currentUser } = this.props;
    const {
      match: {
        params: { eid }
      }
    } = this.props;

    if (!currentUser) {
      dispatch(routerRedux.push('/user/login'));
      return;
    }

    // 获取企业信息
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: { enterprise_id: eid },
      callback: info => {
        if (info && info.bean) {
          this.setState({
            enterpriseInfo: info.bean,
            ready: true
          });
        }
      }
    });
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed
    });
  };

  render() {
    const {
      currentUser,
      children,
      rainbondInfo,
      enterprise,
      collapsed,
      location,
      match: {
        params: { eid }
      }
    } = this.props;
    const { ready, showBackTop } = this.state;

    const queryString = stringify({
      redirect: window.location.href
    });

    if (!ready) {
      return <PageLoading />;
    }

    if (!currentUser || !rainbondInfo) {
      return <Redirect to={`/user/login?${queryString}`} />;
    }

    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, enterprise) || logo;

    return (
      <Layout className={styles.exploreLayout}>
        <GlobalHeader
          eid={eid}
          logo={fetchLogo}
          currentUser={currentUser}
          collapsed={collapsed}
          onCollapse={this.handleMenuCollapse}
        />
        <Content className={styles.content}>
          <Authorized
            logined
            authority={['admin', 'user']}
            noMatch={<Redirect to="/user/login" />}
          >
            {children}
          </Authorized>
        </Content>

        {/* 回到顶部按钮 */}
        {showBackTop && (
          <div className={styles.backTop} onClick={this.scrollToTop}>
            <BackTopIcon className={styles.backTopIcon} />
          </div>
        )}
      </Layout>
    );
  }
}

export default connect(({ user, global }) => ({
  currentUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  collapsed: global.collapsed
}))(ExploreLayout);
