import React, { PureComponent } from "react";
import { connect } from "dva";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  notification,
  Modal,
  Upload,
  message
} from "antd";
import globalUtil from "../../utils/global";
import apiconfig from '../../../config/api.config';
import cookie from "../../utils/cookie";

const token = cookie.get("token");
let myheaders = {};
if (token) {
  myheaders.Authorization = `GRJWT ${token}`;
  myheaders["X_REGION_NAME"] = globalUtil.getCurrRegionName();
  myheaders["X_TEAM_NAME"] = globalUtil.getCurrTeamName();
}

// @connect(({user, global}) => ({currUser: user.currentUser}))

@connect(({ user, global, groupControl }) => ({
  groupDetail: groupControl.groupDetail || {},
  currUser: user.currentUser,
  groups: global.groups || []
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fileList: []
    };
  }

  onChange = info => {
    let { fileList } = info;
    const status = info.file.status;
    if (status === "done") {
      this.props.onReLoad && this.props.onReLoad();
    } else if (status === "error") {
      const { response } = info.file;
      notification.error({ message: response.msg_show });
    }

    //重新设置state
    if (fileList[0] && fileList[0].status == "error") {
      this.setState({ fileList: [] });
      return;
    } else {
      this.setState({ fileList });
    }
  };
  //处理进度条
  handleProgress = (event, file) => {
    let { fileList } = this.state;
    fileList = fileList.map(item => {
      if (item.uid === file.uid) {
        item.percent = event.percent;
      }
      return item;
    });
    this.setState({ fileList });
  };
  onRemove = file => {
    notification.info({
      message: "备份已导入",
      duration: "2"
    });
    return false;
    // this.setState((state) => {
    //   const index = state.fileList.indexOf(file);
    //   const newFileList = state.fileList.slice();
    //   newFileList.splice(index, 1);
    //   return {
    //     fileList: newFileList,
    //   };
    // });
  };
  onData = file => {
    console.log("--->" + JSON.stringify(file));
  };
  render() {
    const group_id = this.props.groupId;
    const team_name = globalUtil.getCurrTeamName();
    const uploadUrl =
      apiconfig.baseUrl +
      "/console/teams/" +
      team_name +
      "/groupapp/" +
      group_id +
      "/backup/import";
    const fileList = this.state.fileList;

    return (
      <Modal
        visible={true}
        onCancel={this.props.onCancel}
        title="请导入备份"
        footer={[
          <Button key="back" onClick={this.props.onCancel}>
            关闭
          </Button>
        ]}
      >
        <Upload
          action={uploadUrl}
          fileList={fileList}
          onChange={this.onChange}
          headers={myheaders}
          onRemove={this.onRemove}
          onProgress={this.handleProgress}
          data={this.onData}
        >
          {fileList.length > 0 ? null : <Button>请选择文件</Button>}
        </Upload>
      </Modal>
    );
  }
}
