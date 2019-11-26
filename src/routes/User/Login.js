import React, { Component } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import { Checkbox, Alert, Divider, Row, Col, Icon } from "antd";
import Login from "../../components/Login";
import styles from "./Login.less";
import cookie from "../../utils/cookie";
import Gitee from "../../../public/images/gitee.png";
import Github from "../../../public/images/github.png";
import Gitlab from "../../../public/images/gitlab.png";
import rainbondUtil from "../../utils/rainbond";
import LoginComponent from "./loginComponent";

const { Tab, UserName, Password, Submit } = Login;

@connect(({ global }) => ({
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo
}))
export default class LoginPage extends Component {
  handleSubmit = values => {
    const { dispatch } = this.props;
    dispatch({
      type: "user/login",
      payload: {
        ...values
      }
    });
  };

  render() {
    const { rainbondInfo } = this.props;
    const map = {
      github: Github,
      gitlab: Gitlab,
      gitee: Gitee
    };

    return (
      <div className={styles.main}>
        <LoginComponent onSubmit={this.handleSubmit} type="login" />
        {rainbondUtil.OauthbEnable(rainbondInfo) && (
          <div className={styles.thirdBox}>
            <Divider>
              <div className={styles.thirdLoadingTitle}>第三方登录</div>
            </Divider>
            <Row className={styles.third}>
              {rainbondInfo &&
                rainbondInfo.oauth_services.value.length > 0 &&
                rainbondInfo.oauth_services.value.map(item => {
                  const {
                    oauth_type,
                    name,
                    client_id,
                    auth_url,
                    redirect_uri,
                    service_id
                  } = item;

                  let githubUrl = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&scope=user%20repo%20admin:repo_hook`;
                  let gitlabUrl = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&response_type=code`;
                  let giteeUrl = `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&response_type=code`;
                  const linkUrl = {
                    github: githubUrl,
                    gitlab: gitlabUrl,
                    gitee: giteeUrl
                  };
                  return (
                    <Col span="8" className={styles.thirdCol} key={client_id}>
                      <a href={linkUrl[oauth_type]}>
                        {oauth_type !== "other" ? (
                          <img src={map[oauth_type]} />
                        ) : (
                          <Icon type="star" />
                        )}
                        <p>{name}</p>
                      </a>
                    </Col>
                  );
                })}
            </Row>
          </div>
        )}
      </div>
    );
  }
}
