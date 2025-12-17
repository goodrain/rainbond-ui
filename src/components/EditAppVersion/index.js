import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Modal, Input, Checkbox } from 'antd';
import { formatMessage } from '@/utils/intl';
import cookie from '../../utils/cookie';

import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { TextArea } = Input;

@Form.create()
export default class EditAppVersion extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      Checkboxvalue: !!(props.appInfo && props.appInfo.dev_status),
      language: cookie.get('language') === 'zh-CN' ? true : false
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
    const { Checkboxvalue,language } = this.state;
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
    const formItemLayouts = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const is_language = language ? formItemLayout : formItemLayouts
    return (
      <Modal
        title={formatMessage({id:'applicationMarket.EditAppVersion.edit'})}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
        confirmLoading={loading}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...is_language} label={formatMessage({id:'applicationMarket.EditAppVersion.name'})}>
            {getFieldDecorator('version_alias', {
              initialValue: (appInfo && appInfo.version_alias) || '',
              rules: [
                { required: true, message: formatMessage({id:'applicationMarket.EditAppVersion.input_name'}) },
                {
                  max: 64,
                  message: formatMessage({id:'applicationMarket.EditAppVersion.max'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'applicationMarket.EditAppVersion.input_name'})} />)}
          </FormItem>

          <FormItem {...is_language} label={formatMessage({id:'applicationMarket.EditAppVersion.state'})}>
            {getFieldDecorator('dev_status', {
              initialValue: appInfo && appInfo.dev_status ? true : ''
            })(
              <Checkbox
                onChange={this.onChangeCheckbox}
                checked={Checkboxvalue}
              >
                Release
              </Checkbox>
            )}
            <div className={styles.conformDesc}>
              {formatMessage({id:'applicationMarket.EditAppVersion.release'})}
            </div>
          </FormItem>
          <FormItem {...is_language} label={formatMessage({id:'applicationMarket.EditAppVersion.introduction'})}>
            {getFieldDecorator('app_version_info', {
              initialValue: (appInfo && appInfo.app_version_info) || '',
              rules: [
                {
                  required: false,
                  message: formatMessage({id:'applicationMarket.EditAppVersion.input_introduction'})
                },
                {
                  max: 255,
                  message: formatMessage({id:'applicationMarket.EditAppVersion.max_length'})
                }
              ]
            })(<TextArea placeholder={formatMessage({id:'applicationMarket.EditAppVersion.input_introduction'})} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
