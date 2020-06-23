import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Modal, Form, Select, Input } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect()
class CreateAppMarket extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      marketType: [{ key: 'rainstore', name: 'Rainstore' }],
    };
  }

  handleSubmit = () => {
    const { form, marketInfo } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        if (marketInfo) {
          this.upAppMarket(values);
        } else {
          this.createAppMarket(values);
        }
      }
    });
  };
  upAppMarket = values => {
    const { dispatch, eid, onOk, marketInfo } = this.props;
    dispatch({
      type: 'market/upAppMarket',
      payload: Object.assign(
        {},
        { enterprise_id: eid, marketName: marketInfo.name },
        values
      ),
      callback: res => {
        if (res && res._code === 200) {
          onOk && onOk();
        }
      },
    });
  };
  createAppMarket = values => {
    const { dispatch, eid, appInfo, onOk } = this.props;

    dispatch({
      type: 'market/createAppMarket',
      payload: Object.assign({}, { enterprise_id: eid }, values),
      callback: res => {
        if (res && res._code === 200) {
          onOk && onOk(appInfo);
        }
      },
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onCancel, title, marketInfo = {}, loading } = this.props;
    const { marketType } = this.state;
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

    return (
      <Modal
        title={title}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        confirmLoading={loading || false}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label="备注">
            {getFieldDecorator('name', {
              initialValue: marketInfo.name || '',

              rules: [
                {
                  required: true,
                  message: '请输入备注',
                },
              ],
            })(<Input placeholder="请输入备注" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="应用市场类型">
            {getFieldDecorator('type', {
              initialValue: marketInfo.type || 'rainstore',
              rules: [
                {
                  required: true,
                  message: '请选择应用市场类型',
                },
              ],
            })(
              <Select placeholder="请选择应用市场类型">
                {marketType.map(item => {
                  return <Option key={item.key}>{item.name}</Option>;
                })}
              </Select>
            )}
          </FormItem>

          <FormItem {...formItemLayout} label="通信地址">
            {getFieldDecorator('url', {
              initialValue: marketInfo.url || '',
              rules: [
                {
                  required: true,
                  message: '请输入通信地址',
                },
              ],
            })(<Input placeholder="请输入通信地址" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="Rainstore市场域">
            {getFieldDecorator('domain', {
              initialValue: marketInfo.domain || '',

              rules: [
                {
                  required: true,
                  message: '请输入Rainstore市场域',
                },
              ],
            })(<Input placeholder="请输入Rainstore市场域" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="通信秘钥">
            {getFieldDecorator('access_key', {
              initialValue: marketInfo.access_key || '',
            })(<Input placeholder="请输入通信秘钥" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default CreateAppMarket;
