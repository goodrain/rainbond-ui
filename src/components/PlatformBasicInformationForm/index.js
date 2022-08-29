/* eslint-disable no-param-reassign */
/* eslint-disable no-const-assign */
/* eslint-disable prefer-destructuring */
import UploadForm from '@/components/UploadForm';
import { Form, Input, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
@connect(({ loading }) => ({
  basicInformationLoading: loading.effects['global/putBasicInformation']
}))
export default class PlatformBasicInformationForm extends PureComponent {
  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, values) => {
      if (!err && onOk) {
        if (values.logo.fileList && values.logo.fileList.length > 0) {
          const fileUrl = this.handleFileUrl(values.logo.fileList[0]);
          if (fileUrl) {
            values.logo = fileUrl;
          }
        }
        if (values.favicon.fileList && values.favicon.fileList.length > 0) {
          const fileUrl = this.handleFileUrl(values.favicon.fileList[0]);
          if (fileUrl) {
            values.favicon = fileUrl;
          }
        }
        onOk(values);
      }
    });
  };
  handleFileUrl = fileInfo => {
    return (
      fileInfo.response &&
      fileInfo.response.code === 200 &&
      fileInfo.response.data.bean &&
      fileInfo.response.data.bean.file_url
    );
  };

  render() {
    const {
      title,
      onCancel,
      form,
      loading = false,
      basicInformationLoading,
      data = {}
    } = this.props;
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

    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }

    const parameters = {
      formItemLayout,
      form,
      data
    };
    return (
      <Modal
        visible
        title={title}
        confirmLoading={loading || basicInformationLoading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.basicInformation.form.label.title'})}>
            {getFieldDecorator('title', {
              initialValue: data.title || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.oauth.title'})
                },
                {
                  max: 64,
                  message: formatMessage({id:'placeholder.appShare.max64'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.title'})} />)}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.basicInformation.form.label.enterprise_alias'})}>
            {getFieldDecorator('enterprise_alias', {
              initialValue: data.enterprise_alias || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.oauth.enterprise_alias'})
                },
                {
                  max: 64,
                  message: formatMessage({id:'placeholder.appShare.max64'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.enterprise_alias'})} />)}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.basicInformation.form.label.doc_url'})}>
            {getFieldDecorator('doc_url', {
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ],
              initialValue: data.doc_url || ''
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.doc_url'})} />)}
          </FormItem>
          <UploadForm
            {...parameters}
            name="logo"
            label={formatMessage({id:'enterpriseSetting.basicsSetting.basicInformation.form.label.logo'})}
            extra={formatMessage({id:'placeholder.oauth.logo'})}
            initialValue={data.logo}
            required={false}
            uploadBtnStyle={{ width: '236px', height: '35px' }}
            imgstyle={{ width: '236px', height: '35px' }}
          />
          <UploadForm
            {...parameters}
            name="favicon"
            label={formatMessage({id:'enterpriseSetting.basicsSetting.basicInformation.form.label.favicon'})}
            extra={formatMessage({id:'placeholder.oauth.favicon'})}
            initialValue={data.favicon}
            required={false}
            uploadBtnStyle={{ width: '33px', height: '33px' }}
            imgstyle={{ width: '33px', height: '33px' }}
          />
        </Form>
      </Modal>
    );
  }
}
