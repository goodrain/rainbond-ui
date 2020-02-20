import React from "react";
import { connect } from "dva";
import { Redirect } from "umi";
import { PageLoading } from "@ant-design/pro-layout";
import { stringify } from "querystring";
import cookie from "../utils/cookie";
import globalUtil from "../utils/global";

class SecurityLayout extends React.PureComponent {
  state = {
    isReady: false
  };

  componentDidMount() {
    const { dispatch } = this.props;
    if (dispatch) {
      dispatch({
        type: "global/fetchRainbondInfo",
        callback: info => {
          if (info) {
            globalUtil.putLog(info);
            dispatch({
              type: "user/fetchCurrent",
              callback: () => {
                this.setState({
                  isReady: true
                });
              }
            });
          }
        }
      });
    }
  }

  render() {
    const { children, currentUser } = this.props;
    const { isReady } = this.state;
    // You can replace it to your authentication rule (such as check token exists)
    const token = cookie.get("token");
    const isLogin = token && currentUser;
    const queryString = stringify({
      redirect: window.location.href
    });
    if (!isReady) {
      return <PageLoading />;
    }
    if (isReady && !isLogin && window.location.pathname !== "/user/login") {
      return <Redirect to={`/user/login?${queryString}`} />;
    }
    return children;
  }
}

export default connect(({ user, loading }) => ({
  currentUser: user.currentUser,
  loading: loading.models.user
}))(SecurityLayout);
