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

  componentDidUpdate(prevProps) {
    // 监听路由变化，确保token参数不会在导航时重新出现
    if (this.props.location !== prevProps.location) {
      this.checkAndCleanToken();
    }
  }

  checkAndCleanToken = () => {
    // 检查并清除可能重新出现的token参数
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('token')) {
      searchParams.delete('token');
      const newSearch = searchParams.toString();
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
    }
  }

  checkAndSetPortalToken = () => {
    let portalToken = null;

    // 情况1: token在hash前面 (?token=xxx#/path)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('token')) {
      portalToken = searchParams.get('token');
    }

    // 情况2: token在hash后面 (#/path?token=xxx)
    if (!portalToken && window.location.hash) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        if (hashParams.has('token')) {
          portalToken = hashParams.get('token');
        }
      }
    }

    // 如果找到token，设置到cookie并清除URL
    if (portalToken) {
      cookie.set('token', portalToken);
      // 清除URL中的所有token参数并重定向到干净的路径
      this.cleanTokenFromUrl();
    }
  }

  cleanTokenFromUrl = () => {
    // 获取hash路径（不包含参数）
    let hashPath = window.location.hash;
    if (hashPath.includes('?')) {
      hashPath = hashPath.split('?')[0];
    }

    // 如果没有hash路径，默认跳转到根路径
    if (!hashPath || hashPath === '#' || hashPath === '#/') {
      hashPath = '#/';
    }

    // 构造干净的URL - 只保留pathname和hash，完全移除search参数
    const pathname = window.location.pathname;
    const cleanUrl = pathname + hashPath;

    // 使用replaceState更新URL，不刷新页面
    window.history.replaceState(null, '', cleanUrl);

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
