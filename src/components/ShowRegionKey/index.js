import React, { PureComponent } from "react";
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
        title={formatMessage({id:'componentCheck.modify_image_name.key.title'})}
        visible
        onCancel={onCancel}
        footer={[<Button onClick={onOk || onCancel}>{formatMessage({id:'button.be_authorized'})}</Button>]}
      >
        <p>
          <Icon type="info-circle-o" />{" "}
          {formatMessage({id:'componentCheck.modify_image_name.key.pages.desc'})}
        </p>
        <p
          style={{
            border: "1px dotted #dcdcdc",
            padding: "20px",
            wordWrap: "break-word",
            wordBreak: "normal"
          }}
        >
          {key || formatMessage({id:'status.loading'})}
        </p>
      </Modal>
    );
  }
}
