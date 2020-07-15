import React, { Component } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import userUtil from "../../utils/global";
import Login from "../../components/Login";
import styles from "./Login.less";

const { UserName, Password, Submit } = Login;

@connect(({ loading, global }) => ({
  isRegist: global.isRegist,
  thirdLogin: loading.effects["user/thirdLogin"],
  userLogin: loading.effects["user/login"]
}))
export default class LoginComponent extends Component {
  componentDidMount() {
    userUtil.removeCookie();
  }

  handleSubmit = (err, values) => {
    const { onSubmit } = this.props;
    if (!err && onSubmit) {
      userUtil.removeCookie();
      onSubmit(values);
    }
  };

  render() {
    const { thirdLogin, userLogin, type } = this.props;
    return (
      <div className={styles.main}>
        <Login defaultActiveKey="account" onSubmit={this.handleSubmit}>
          <UserName name="nick_name" placeholder="用户名/邮箱" />
          <Password name="password" placeholder="密码" />
          <Submit loading={type !== "thirdLogin" ? userLogin : thirdLogin}>
            {type === "thirdLogin" ? "登录并绑定" : "登录"}
          </Submit>
          <div className={styles.other}>
            {this.props.isRegist && type !== "thirdLogin" && (
              <Link className={styles.register} to="/user/register">
                注册账户
              </Link>
            )}
          </div>
        </Login>
      </div>
    );
  }
}
