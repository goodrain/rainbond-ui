import React, { PureComponent } from "react";
import { connect } from "dva";
import { Form, Button, Select, Modal, Tooltip, Radio } from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect(
  ({ user, global }) => ({ groups: global.groups }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      addGroup: false,
      is_deploy: true,
      group_version: ""
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = vals => {
    const { setFieldsValue } = this.props.form;
    this.props.dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals
      },
      callback: group => {
        if (group) {
          // 获取群组
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              region_name: globalUtil.getCurrRegionName()
            },
            callback: () => {
              setFieldsValue({ group_id: group.ID });
              this.cancelAddGroup();
            }
          });
        }
      }
    });
  };

  handleChangeVersion = () => {};

  fetchGroup = () => {
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { is_deploy } = this.state;
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue, is_deploy);
      this.props.onSubmit && this.setState({ is_deploy: true });
    });
  };

  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { groups, onCancel, showCreate } = this.props;
    const data = this.props.data || {};

    return (
      <Modal
        visible={showCreate}
        onCancel={onCancel}
        onOk={this.handleSubmit}
        title="要安装到哪个应用?"
        footer={[
          <Button onClick={onCancel}>取消</Button>,
          <Button
            onClick={this.handleSubmit}
            type="primary"
            disabled={this.props.disabled}
          >
            安装
          </Button>,
          // <Tooltip placement="topLeft" title={<p>取消本选项你可以先对组件进行<br />高级设置再构建启动。</p>} >
          <Radio
            size="small"
            onClick={this.renderSuccessOnChange}
            checked={this.state.is_deploy}
          >
            并构建启动
          </Radio>
          // </Tooltip>
        ]}
      >
        <Form onSubmit={this.handleOk} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="安装版本">
            {getFieldDecorator("group_version", {
              initialValue:
                showCreate && showCreate.group_version_list
                  ? showCreate.group_version_list[0]
                  : showCreate.app_versions &&
                    showCreate.app_versions[0].app_version,

              rules: [
                {
                  required: true,
                  message: "请选择版本"
                }
              ]
            })(
              <Select
                onChange={this.handleChangeVersion}
                style={{ width: "220px" }}
              >
                {showCreate && showCreate.group_version_list
                  ? showCreate.group_version_list.map((item, index) => {
                      return (
                        <Option key={index} value={item}>
                          {item}
                        </Option>
                      );
                    })
                  : showCreate.app_versions &&
                    showCreate.app_versions.map((item, index) => {
                      return (
                        <Option key={index} value={item.app_version}>
                          {item.app_version}
                        </Option>
                      );
                    })}
              </Select>
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label="选择应用">
            {getFieldDecorator("group_id", {
              initialValue: data.groupd_id,
              rules: [
                {
                  required: true,
                  message: "请选择"
                }
              ]
            })(
              <Select
                style={{
                  display: "inline-block",
                  width: 220,
                  marginRight: 15
                }}
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
            <Button onClick={this.onAddGroup}>新建应用</Button>
          </Form.Item>
          {this.state.addGroup && (
            <AddGroup
              onCancel={this.cancelAddGroup}
              onOk={this.handleAddGroup}
            />
          )}
        </Form>
      </Modal>
    );
  }
}
