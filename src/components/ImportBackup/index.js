import { Button, Modal, notification, Upload } from "antd";
import { connect } from "dva";
import React, { PureComponent } from "react";
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import apiconfig from "../../../config/api.config";
import cookie from "../../utils/cookie";
import globalUtil from "../../utils/global";

const token = cookie.get("token");
const myheaders = {};
if (token) {
  myheaders.Authorization = `GRJWT ${token}`;
  myheaders.X_REGION_NAME = globalUtil.getCurrRegionName();
  myheaders.X_TEAM_NAME = globalUtil.getCurrTeamName();
}

// @connect(({user, global}) => ({currUser: user.currentUser}))

@connect(({ user, global, application }) => ({
  groupDetail: application.groupDetail || {},
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
    const { fileList } = info;
    const { status } = info.file;
    if (status === "done") {
      this.props.onReLoad && this.props.onReLoad();
    } else if (status === "error") {
      const { response } = info.file;
      notification.warning({ message: response.msg_show });
    }

    // 重新设置state
    if (fileList[0] && fileList[0].status == "error") {
      this.setState({ fileList: [] });
    } else {
      this.setState({ fileList });
    }
  };
  // 处理进度条
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
      message: formatMessage({id:'status.app.backups.imported'}),
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
    console.log(`--->${JSON.stringify(file)}`);
  };
  render() {
    const group_id = this.props.groupId;
    const team_name = globalUtil.getCurrTeamName();
    const uploadUrl = `${
      apiconfig.baseUrl
    }/console/teams/${team_name}/groupapp/${group_id}/backup/import`;
    const { fileList } = this.state;

    return (
      <Modal
        visible
        onCancel={this.props.onCancel}
        title={formatMessage({id:'appBackups.table.pages.importBackup.title'})}
        footer={[
          <Button key="back" onClick={this.props.onCancel}>
            {formatMessage({id:'button.close'})}
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
          {fileList.length > 0 ? null : <Button>{formatMessage({id:'appBackups.importBackup.select.file'})}</Button>}
        </Upload>
      </Modal>
    );
  }
}
