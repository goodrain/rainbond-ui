import React, { PureComponent } from 'react';
import { Button, Icon, Modal, Form, Checkbox, Select, Input } from 'antd';
import { getAllRegion } from '../../services/api';
import globalUtil from '../../utils/global';
import styles from "./index.less";

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
class CreateTeam extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actions: [],
      regions: [],
    };
  }
  componentDidMount() {
    this.getUnRelationedApp();
  }
  getUnRelationedApp = () => {
    getAllRegion().then(data => {
      if (data) {
        this.setState({ regions: data.list || [] });
      }
    });
  };
  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel, actions } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      },
    };
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 14,
          offset: 6,
        },
      },
    };

    const options = actions || [];

    return (
      <Modal
        title="创建团队"
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button typs="primary" onClick={this.handleSubmit}>
            确定
          </Button>,
        ]}
      >

        <Form onSubmit={this.handleSubmit} layout="horizontal"  hideRequiredMark>
          <FormItem {...formItemLayout} label="团队名称" hasFeedback>
            {getFieldDecorator('team_name', {
              rules: [
                {
                  required: true,
                  message: '请输入团队名称',
                },
              ],
            })(<Input placeholder="请输入团队名称" />)}
             <div className={styles.conformDesc}>请输入创建的团队名称，最多10字</div>
          </FormItem>

          <FormItem {...formItemLayout} label="数据中心" hasFeedback>
            {getFieldDecorator('useable_regions', {
              rules: [
                {
                  required: true,
                  message: '请选择数据中心',
                },
              ],
            })(
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="选择数据中心"
              >
                {(this.state.regions || []).map(item => {
                  return (
                    <Option key={item.region_name}>{item.region_alias}</Option>
                  );
                })}
              </Select>
            )}
             <div className={styles.conformDesc}>请选择使用的数据中心</div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default CreateTeam;
