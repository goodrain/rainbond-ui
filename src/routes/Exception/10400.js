import React, { PureComponent } from "react";

import { connect } from "dva";
import cookie from "../../utils/cookie";
import { Alert, Card } from "antd";

@connect()
export default class Index extends PureComponent {
  componentDidMount() {
    cookie.set("nouse", true);
  }
  render() {
    return (
      <div style={{ width: "500px", margin: "15% auto" }}>
        <Alert
          message={
            <span style={{ color: "red", fontSize: "18px" }}>
              当前授权已过期
            </span>
          }
          description="请联系 010-64666786 获取更多商业服务。"
          type="error"
          showIcon
        />
      </div>
    );
  }
}
