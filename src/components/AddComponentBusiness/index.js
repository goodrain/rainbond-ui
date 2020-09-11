import React, { PureComponent } from 'react';
import { Form, Input, Modal, Switch, Checkbox, Row, Col } from 'antd';
import Parameterinput from '@/components/Parameterinput';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class AddComponentBusiness extends PureComponent {
  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };
  render() {
    const { title, onCancel, form, data = {} } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    return (
      <Modal
        title={title || '添加配置'}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="名称">
            {getFieldDecorator('name', {
              initialValue: data.name || '',
              rules: [{ required: true, message: '请填写名称' }]
            })(<Input placeholder="请填写名称" />)}
          </FormItem>
          <Form.Item {...formItemLayout} label="状态">
            {getFieldDecorator('state', {
              initialValue: true,
              rules: [{ required: true }]
            })(<Switch />)}
          </Form.Item>
          <FormItem {...formItemLayout} label="配置项">
            {getFieldDecorator('configuration', {
              initialValue: '',
              rules: [{ required: true }]
            })(<Parameterinput editInfo={''} />)}
          </FormItem>
          <FormItem {...formItemLayout} label="组件">
            {getFieldDecorator('rule_extensions_http', {
              initialValue: [],
              rules: [{ required: true }]
            })(
              <Checkbox.Group>
                <Row>
                  <Col span={24}>
                    <Checkbox value="httptohttps">HTTP Rewrite HTTPs</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
