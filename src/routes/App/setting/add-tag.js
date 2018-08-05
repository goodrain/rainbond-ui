import React, { PureComponent } from "react";
import { Modal, Tag, notification } from "antd";

const CheckableTag = Tag.CheckableTag;

// 添加标签
export default class AddTag extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selected: {},
    };
  }
  handleOk = () => {
    const keys = Object.keys(this.state.selected);
    if (!keys.length) {
      notification.warning({ message: "请选择要添加的标签" });
      return;
    }
    this.props.onOk && this.props.onOk(keys);
  };
  isCheck = id => !!this.state.selected[id];
  handleChange = (id, checked) => {
    if (!checked) {
      delete this.state.selected[id];
    } else {
      this.state.selected[id] = true;
    }
    this.forceUpdate();
  };
  render() {
    const tags = this.props.tags || [];
    const onCancel = this.props.onCancel;
    return (
      <Modal title="点击标签进行选择" visible onOk={this.handleOk} onCancel={onCancel}>
        {!tags || !tags.length ? (
          <div
            style={{
              textAlign: "center",
            }}
          >
            暂无可用标签
          </div>
        ) : (
          tags.map(tag => (
            <CheckableTag
              onChange={(checked) => {
                this.handleChange(tag.label_id, checked);
              }}
              checked={this.isCheck(tag.label_id)}
            >
              {tag.label_alias}
            </CheckableTag>
          ))
        )}
      </Modal>
    );
  }
}
