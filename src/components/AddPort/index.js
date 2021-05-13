import { Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
const FormItem = Form.Item;

@Form.create()
@connect(({ region }) => {
  return {
    protocols: region.protocols || []
  };
})
export default class AddPort extends PureComponent {
  componentWillMount() {}
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  handleCheckPort = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    if (this.props.isImageApp || this.props.isDockerfile) {
      if (value < 1 || value > 65534) {
        callback('端口范围为1-65534');
        return;
      }
    }
    callback();
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const protocols = this.props.protocols || [];

    return (
      <Modal
        title="添加端口"
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
        visible={true}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="端口">
            {getFieldDecorator('port', {
              rules: [
                { required: true, message: '请添写端口' },
                { validator: this.handleCheckPort }
              ]
            })(
              <Input
                type="number"
                placeholder={
                  this.props.isImageApp || this.props.isDockerfile
                    ? '请填写端口,范围1-65535'
                    : '请填写端口,范围1025-65535'
                }
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="协议">
            {getFieldDecorator('protocol', {
              initialValue: 'http',
              rules: [{ required: true, message: '请添加端口' }]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {protocols.map(item => {
                  return <Option value={item}>{item}</Option>;
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
