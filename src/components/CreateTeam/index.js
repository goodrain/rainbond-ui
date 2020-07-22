import React, { PureComponent } from "react";
import { Button, Icon, Modal, Form, Checkbox, Select, Input } from "antd";
import { getAllRegion } from "../../services/api";
import globalUtil from "../../utils/global";
import styles from "./index.less";

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
class CreateTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actions: [],
      regions: []
    };
  }
  componentDidMount() {
    const { enterprise_id } = this.props;
    if (enterprise_id) {
      this.getUnRelationedApp(enterprise_id);
    }
  }
  getUnRelationedApp = enterprise_id => {
    getAllRegion({ enterprise_id, status: "1" }).then(data => {
      if (data) {
        this.setState({ regions: data.list || [] });
      }
    });
  };
  handleSubmit = () => {
    const { onOk, form } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  render() {
    const { onOk, onCancel, actions, form } = this.props;
    const { getFieldDecorator } = form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };

    return (
      <Modal
        title="创建团队"
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" onClick={this.handleSubmit}>
            确定
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label="团队名称" hasFeedback>
            {getFieldDecorator("team_name", {
              rules: [
                {
                  required: true,
                  message: "请输入团队名称"
                },
                {
                  max: 10,
                  message: "团队名称最多10个字"
                }
              ]
            })(<Input placeholder="请输入团队名称" />)}
            <div className={styles.conformDesc}>
              请输入创建的团队名称，最多10个字
            </div>
          </FormItem>

          <FormItem {...formItemLayout} label="集群" hasFeedback>
            {getFieldDecorator("useable_regions", {
              rules: [
                {
                  required: true,
                  message: "请选择集群"
                }
              ]
            })(
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="选择集群"
              >
                {(this.state.regions || []).map(item => {
                  return (
                    <Option key={item.region_name}>{item.region_alias}</Option>
                  );
                })}
              </Select>
            )}
            <div className={styles.conformDesc}>请选择使用的集群</div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default CreateTeam;
