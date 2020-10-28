import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Modal, Input, Checkbox } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { TextArea } = Input;

@Form.create()
export default class EditAppVersion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      Checkboxvalue: !!(props.appInfo && props.appInfo.dev_status)
    };
  }
  onChangeCheckbox = () => {
    this.setState({
      Checkboxvalue: !this.state.Checkboxvalue
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields({ force: true }, (err, values) => {
      const { onOk } = this.props;
      if (!err && onOk) {
        values.dev_status = values.dev_status ? 'release' : '';
        onOk(values);
      }
    });
  };

  render() {
    const { onCancel, form, appInfo, loading } = this.props;
    const { Checkboxvalue } = this.state;
    const { getFieldDecorator } = form;
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
    return (
      <Modal
        title="编辑版本"
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
        confirmLoading={loading}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="版本别名">
            {getFieldDecorator('version_alias', {
              initialValue: (appInfo && appInfo.version_alias) || '',
              rules: [{ required: true, message: '请填写版本别名' }]
            })(<Input placeholder="请填写版本别名" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="是否Release">
            {getFieldDecorator('dev_status', {
              initialValue: appInfo && appInfo.dev_status ? true : ''
            })(
              <Checkbox
                onChange={this.onChangeCheckbox}
                checked={Checkboxvalue}
              >
                release
              </Checkbox>
            )}
            <div className={styles.conformDesc}>请选择当前应用的开发状态</div>
          </FormItem>
          <FormItem {...formItemLayout} label="描述信息">
            {getFieldDecorator('app_version_info', {
              initialValue: (appInfo && appInfo.app_version_info) || '',
              rules: [
                {
                  required: false,
                  message: '请输入描述信息'
                }
              ]
            })(<TextArea placeholder="请输入描述信息" />)}
            <div className={styles.conformDesc}>请输入应用模版描述</div>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
