import React, { PureComponent } from "react";
import { Button, Modal, Form, Select, Input } from "antd";
import { connect } from "dva";
import { getAllRegion } from "../../services/api";
import styles from "./index.less";

const FormItem = Form.Item;
const { Option } = Select;
@connect(({ loading }) => ({
  Loading: loading.effects["teamControl/createTeam"]
}))
@Form.create()
class CreateTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      regions: []
    };
  }
  componentDidMount() {
    const { enterprise_id: ID } = this.props;
    if (ID) {
      this.getUnRelationedApp(ID);
    }
  }
  getUnRelationedApp = ID => {
    getAllRegion({ enterprise_id: ID, status: "1" }).then(data => {
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
    const { onCancel, form, Loading } = this.props;
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
          <Button type="primary" onClick={this.handleSubmit} loading={Loading}>
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
