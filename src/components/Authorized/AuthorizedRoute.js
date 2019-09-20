import React from "react";
import { Route, Redirect } from "dva/router";
import { connect } from "dva";
import Authorized from "./Authorized";
import PublicLogin from "./PublicLogin";

class AuthorizedRoute extends React.Component {
  // not login
  getNoMatch() {
    const {
      isPubCloud,
      logined,
      render,
      authority,
      redirectPath,
      rainbondInfo,
      ...rest
    } = this.props;
    if (redirectPath === "/user/login") {
      if (
        rainbondInfo &&
        rainbondInfo.is_public !== undefined &&
        rainbondInfo.is_public
      ) {
        return <PublicLogin />;
      }
      return (
        <Route
          {...rest}
          render={() => (
            <Redirect
              to={{
                pathname: redirectPath
              }}
            />
          )}
        />
      );
    }
    return (
      <Route
        {...rest}
        render={() => (
          <Redirect
            to={{
              pathname: redirectPath
            }}
          />
        )}
      />
    );
  }
  render() {
    const {
      component: Component,
      logined,
      render,
      authority,
      redirectPath,
      rainbondInfo,
      ...rest
    } = this.props;
    return (
      <Authorized
        authority={authority}
        logined={logined}
        noMatch={this.getNoMatch()}
      >
        <Route
          {...rest}
          render={props =>
            Component ? <Component {...props} /> : render(props)
          }
        />
      </Authorized>
    );
  }
}
export default connect(({ global }) => ({ rainbondInfo: global.rainbondInfo }))(
  AuthorizedRoute
);
