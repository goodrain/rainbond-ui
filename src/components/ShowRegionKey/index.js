import React, { PureComponent } from "react";
import { Button, Icon, Modal } from "antd";
import { connect } from "dva";
import globalUtil from "../../utils/global";

@connect()
export default class ShowKeyModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      key: ""
    };
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "teamControl/getRegionKey",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName()
      },
      callback: data => {
        if (data) {
          this.setState({ key: data.public_key });
        }
      }
    });
  }
  render() {
    const { onCancel, onOk } = this.props;
    const { key } = this.state;
    return (
      <Modal
        title="配置授权Key"
        visible
        onCancel={onCancel}
        footer={[<Button onClick={onOk || onCancel}>已授权</Button>]}
      >
        <p>
          <Icon type="info-circle-o" />{" "}
          请拷贝如下Key到您的私有Git仓库进行授权，云帮平台方可访问您的私有Git仓库
        </p>
        <p
          style={{
            border: "1px dotted #dcdcdc",
            padding: "20px",
            wordWrap: "break-word",
            wordBreak: "normal"
          }}
        >
          {key || "加载中..."}
        </p>
      </Modal>
    );
  }
}
