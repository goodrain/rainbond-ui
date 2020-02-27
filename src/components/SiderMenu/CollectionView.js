import React, { PureComponent, Fragment } from 'react';
import { Form, Modal, Input } from 'antd';
import styless from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class CollectionView extends PureComponent {
  constructor(props) {
    super(props);
  }

  handleSubmit = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    const { validateFields } = form;
    validateFields({ force: true }, (err, vals) => {
      if (!err) {
        onOk && onOk(vals);
      }
    });
  };

  render() {
    const { visible, onOk, onCancel, form, title, data } = this.props;
    const formItemLayout = {
      labelCol: {
        span: 5,
      },
      wrapperCol: {
        span: 19,
      },
    };
    const { getFieldDecorator } = form;
    return (
      <Modal
        className={styless.TelescopicModal}
        title={title}
        visible={visible}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="名称">
            {getFieldDecorator('name', {
              initialValue: (data && data.name) || '',
              rules: [{ required: true, message: '请输入名称' }],
            })(<Input placeholder="请输入名称" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
