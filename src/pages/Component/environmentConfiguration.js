import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Select,
  notification,
  Spin,
  Divider,
  Input
} from "antd";
import CustomEnvironmentVariables from "./customEnvironmentVariables";

const { Option } = Select;
const { Search } = Input;

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    baseInfo: appControl.baseInfo,
    extendInfo: appControl.extendInfo,
    instances: appControl.pods
  }),
  null,
  null,
  { pure: false, withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
    };
  }
 

  render() {
    return(  <div>
        <CustomEnvironmentVariables {...this.props}/>
     
      </div>
    )
  }
}
