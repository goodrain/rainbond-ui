import React, { PureComponent } from "react";
import { formatMessage } from '@/utils/intl';
import { Form, Modal, Input } from "antd";

const FormItem = Form.Item;

@Form.create()
export default class EditAlias extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields({ force: true }, (err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const port = this.props.port || {};
    return (
      <Modal
        title={formatMessage({id:'componentOverview.body.EditPortAlias.edit'})}
        onOk={this.handleSubmit}
        visible={true}
        onCancel={this.handleCancel}
        maskClosable={false}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label={formatMessage({id:'componentOverview.body.EditPortAlias.name'})}>
            {getFieldDecorator("alias", {
              initialValue: port.port_alias,
              rules: [{ required: true, message: formatMessage({id:'componentOverview.body.EditPortAlias.input_name'}) }]
            })(<Input placeholder={formatMessage({id:'componentOverview.body.EditPortAlias.input_name'})} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
