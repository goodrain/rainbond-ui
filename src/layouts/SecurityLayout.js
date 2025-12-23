import React from 'react';
import { connect } from 'dva';
import { Redirect } from 'umi';
import PageLoading from '../components/PageLoading';
import { stringify } from 'querystring';
import cookie from '../utils/cookie';
import globalUtil from '../utils/global';
import ErrorBoundary from './ErrorBoundary';

class SecurityLayout extends React.PureComponent {
  state = {
    isReady: false,
  };

  componentDidMount() {
    // 检查URL中是否有门户传来的token参数，如果有则设置到cookie
    this.checkAndSetPortalToken();

    const { dispatch } = this.props;
    if (dispatch) {
      dispatch({
        type: 'global/fetchRainbondInfo',
        callback: info => {
          if (info) {
            this.fetchUserInfo();
          }
        },
      });
    }
  }

  checkAndSetPortalToken = () => {
    // 从URL参数中获取token
    const urlParams = new URLSearchParams(window.location.search);
    const portalToken = urlParams.get('token');

    if (portalToken) {
      // 如果URL中有token，设置到cookie中
      cookie.set('token', portalToken);

      // 清除URL中的token参数，避免token暴露在地址栏
      urlParams.delete('token');
      const newSearch = urlParams.toString();
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
    }
  }

  fetchUserInfo = () => {
    const { dispatch } = this.props;
    if (dispatch) {
      dispatch({
        type: 'user/fetchCurrent',
        callback: () => {
          this.setState({
            isReady: true,
          });
        },
        handleError: () => {
          this.setState({
            isReady: true,
          });
        },
      });
    }
  };

  render() {
    const { children, currentUser, needLogin } = this.props;
    const { isReady } = this.state;
    // You can replace it to your authentication rule (such as check token exists)
    const token = cookie.get('token');
    const isLogin = token && currentUser;
    const queryString = stringify({
      redirect: window.location.href,
    });
    if (needLogin) {
      globalUtil.removeCookie();
      return <Redirect to={`/user/login?${queryString}`} />;
    }
    if (!isReady) {
      return <PageLoading />;
    }
    if (isReady && !isLogin && window.location.pathname !== '/user/login') {
      globalUtil.removeCookie();
      return <Redirect to={`/user/login?${queryString}`} />;
    }

    return <ErrorBoundary children={children} />;
  }
}

export default connect(({ user, loading, global }) => ({
  currentUser: user.currentUser,
  loading: loading.models.user,
  needLogin: global.needLogin,
}))(SecurityLayout);
