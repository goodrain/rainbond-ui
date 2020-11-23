import React, { PureComponent } from 'react';
import { Form, Modal, Input } from 'antd';
import styless from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class CollectionView extends PureComponent {
  handleSubmit = (e) => {
    e.preventDefault();
    const { form, onOk } = this.props;
    const { validateFields } = form;
    validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };

  render() {
    const {
      visible,
      onCancel,
      form,
      title,
      data,
      loading = false
    } = this.props;
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const { getFieldDecorator } = form;
    return (
      <Modal
        className={styless.TelescopicModal}
        confirmLoading={loading}
        title={title}
        visible={visible}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        afterClose={() => {
          form.resetFields();
        }}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="名称">
            {getFieldDecorator('name', {
              initialValue: (data && data.name) || '',
              rules: [
                { required: true, message: '请输入名称' },
                {
                  max: 10,
                  message: '收藏名称最多10个字'
                }
              ]
            })(<Input placeholder="请输入名称" />)}
            <div className={styless.conformDesc}>
              请输入收藏名称，最多10个字
            </div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
