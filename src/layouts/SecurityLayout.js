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
