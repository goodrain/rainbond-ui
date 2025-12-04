import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import styless from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class CollectionView extends PureComponent {
  handleSubmit = e => {
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
          <FormItem {...formItemLayout} label={formatMessage({id:'otherEnterprise.SiderMenu.name'})}>
            {getFieldDecorator('name', {
              initialValue: (data && data.name) || '',
              rules: [
                { required: true, message: formatMessage({id:'otherEnterprise.SiderMenu.input_name'}) },
                {
                  max: 10,
                  message: formatMessage({id:'otherEnterprise.SiderMenu.max'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'otherEnterprise.SiderMenu.input_name'})} />)}
            <div className={styless.conformDesc}>
              {formatMessage({id:'otherEnterprise.SiderMenu.imput_max'})}
            </div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
