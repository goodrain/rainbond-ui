import React, { Fragment } from "react";

import { routerRedux, Route } from "dva/router";
import { LocaleProvider, Spin } from "antd";
import zhCN from "antd/lib/locale-provider/zh_CN";
import dynamic from "dva/dynamic";
import { getRouterData } from "./common/router";
import Authorized from "./utils/Authorized";
import styles from "./index.less";

const { ConnectedRouter } = routerRedux;
const { AuthorizedRoute } = Authorized;
dynamic.setDefaultLoadingComponent(() => (
  <Spin size="large" className={styles.globalSpin} />
));

function RouterConfig({ history, app }) {
  const routerData = getRouterData(app);
  const OauthLayout = routerData["/oauth"].component;
  const UserLayout = routerData["/user"].component;
  const BasicLayout = routerData["/"].component;

  const oauths = () => {
    return (
      <AuthorizedRoute
        path="/"
        component={OauthLayout}
        logined={false}
        redirectPath="/"
      />
    );
  };
  return (
      <LocaleProvider locale={zhCN}>
        <ConnectedRouter history={history}>
          <div>
            <Route exact path="/oauth/callback" component={OauthLayout} />
            <AuthorizedRoute
              path="/user"
              render={props => <UserLayout {...props} />}
              authority="guest"
              logined={false} //关键的判断条件
              redirectPath="/"
            />
            <AuthorizedRoute
              path="/"
              render={props => <BasicLayout {...props} />}
              authority={["admin", "user"]}
              logined
              redirectPath="/user"
            />
          </div>
        </ConnectedRouter>
      </LocaleProvider>
  );
}

export default RouterConfig;
