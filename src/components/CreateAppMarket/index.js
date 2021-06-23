import { Form, Input, Modal, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect()
class CreateAppMarket extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      marketType: [{ key: 'rainstore', name: 'Rainstore' }]
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
        if (res && res.status_code === 200) {
          const { list } = res;
          onOk && onOk(list && list.ID);
        }
      }
    });
  };
  createAppMarket = values => {
    const { dispatch, eid, onOk } = this.props;

    dispatch({
      type: 'market/createAppMarket',
      payload: Object.assign({}, { enterprise_id: eid }, values),
      callback: res => {
        if (res && res.status_code === 200) {
          const { bean } = res;
          onOk && onOk(bean && bean.ID);
        }
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { onCancel, title, marketInfo = {}, loading } = this.props;
    const { marketType } = this.state;
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
        title={title}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        confirmLoading={loading || false}
      >
        <span
          style={{
            textAlign: 'center',
            display: 'block',
            marginBottom: '16px'
          }}
        >
          开通自己的应用商店？
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://store.goodrain.com/marketregist"
          >
            去开通
          </a>
        </span>
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label="标识">
            {getFieldDecorator('name', {
              initialValue: marketInfo.name || '',
              rules: [
                { required: true, message: '请输入标识' },
                {
                  pattern: /^[a-z0-9A-Z-_]+$/,
                  message: '只支持字母、数字和-_组合'
                },
                {
                  max: 64,
                  message: '最大长度64位'
                }
              ]
            })(<Input placeholder="请输入标识" />)}
            <div className={styles.conformDesc}>
              相同的标识可以帮助用户在删除已有市场后重新添加回来。
            </div>
          </FormItem>
          <FormItem {...formItemLayout} label="类型">
            {getFieldDecorator('type', {
              initialValue: marketInfo.type || 'rainstore',
              rules: [
                {
                  required: true,
                  message: '请选择应用市场类型'
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder="请选择应用市场类型"
              >
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
                  message: '请输入通信地址'
                }
              ]
            })(<Input placeholder="请输入通信地址" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="市场域">
            {getFieldDecorator('domain', {
              initialValue: marketInfo.domain || '',

              rules: [
                {
                  required: true,
                  message: '请输入市场域'
                }
              ]
            })(<Input placeholder="请输入市场域" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="AccessKey">
            {getFieldDecorator('access_key', {
              initialValue: marketInfo.access_key || '',
              rules: [
                { required: false, message: '请输入AccessKey' },
                {
                  max: 64,
                  message: '最大长度64位'
                }
              ]
            })(<Input placeholder="请输入AccessKey" />)}
            <div className={styles.conformDesc}>
              为空则只读权限、请前往应用市场获取AccessKey
            </div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default CreateAppMarket;
