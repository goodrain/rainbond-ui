import React from "react";
import { routerRedux, Switch } from "dva/router";
import { LocaleProvider, Spin } from "antd";
import zhCN from "antd/lib/locale-provider/zh_CN";
import dynamic from "dva/dynamic";
import { getRouterData } from "./common/router";
import Authorized from "./utils/Authorized";
import styles from "./index.less";
import InitRainbondInfo from "./components/InitRainbondInfo";

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
  return (
    <InitRainbondInfo>
      <LocaleProvider locale={zhCN}>
        <ConnectedRouter history={history}>
          <Switch>
            {/* <AuthorizedRoute
              path="/oauth"
              render={props => <OauthLayout {...props} />}
              authority={["admin", "user", "guest"]}
              logined={false}
              redirectPath="/"
            /> */}
            <AuthorizedRoute
              path="/user"
              render={props => <UserLayout {...props} />}
              authority="guest"
              logined={false}
              redirectPath="/"
            />
            <AuthorizedRoute
              path="/"
              render={props => <BasicLayout {...props} />}
              authority={["admin", "user"]}
              logined
              redirectPath="/user"
            />
          </Switch>
        </ConnectedRouter>
      </LocaleProvider>
    </InitRainbondInfo>
  );
}

export default RouterConfig;
