import React from "react";
import { Link, Redirect, Switch, Route } from "dva/router";
import DocumentTitle from "react-document-title";
import { Icon } from "antd";
import { connect } from "dva";
import GlobalFooter from "../components/GlobalFooter";
import styles from "./UserLayout.less";
import logo from "../../public/logo.png";
import { getRoutes } from "../utils/utils";
import configureGlobal from "../utils/configureGlobal";
import cookie from "../utils/cookie";

class OauthLayout extends React.PureComponent {
  componentDidMount() {
    const load = document.getElementById("load");
    if (load) {
      document.body.removeChild(load);
    }
  }
  getPageTitle() {
    const { routerData, location, rainbondInfo } = this.props;
    const { pathname } = location;
    let title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      "Rainbond is Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.";
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - ${title} `;
    }
    return title;
  }
  render() {
    const { routerData, match, rainbondInfo, nouse } = this.props;
    return (
      <DocumentTitle title={this.getPageTitle()}>
        <div className={styles.container}>
          <Switch>
            1234567890
            {/* <Redirect exact from="/oauth" to="/oauth/callback" /> */}
          </Switch>
        </div>
      </DocumentTitle>
    );
  }
}

export default connect(({ global }) => ({
  rainbondInfo: global.rainbondInfo,
  nouse: global.nouse
}))(OauthLayout);
