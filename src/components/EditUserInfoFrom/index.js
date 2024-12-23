import React, { Component } from 'react'
import { Form, Input, Modal, Upload, Icon } from 'antd'
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import apiconfig from '../../../config/api.config'
import cookie from '@/utils/cookie';
import styles from './index.less'

@Form.create()

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageUrl: '',
      loading: false,
      userInfo: this.props.userInfo || {},
      imageBase64: ''
    };
  }
  componentDidMount(){
    const {userInfo} = this.props
    if(userInfo?.logo){
      this.setState({
        imageUrl:userInfo?.logo
      })
    }
  }
  handleOk = () => {
    const {imageUrl} = this.state
    this.props.form.validateFields((err, values) => {
      if (!err) {
        values.logo = imageUrl
        this.props.onOk(values,'info');
      }
    });
  }
  handleCancel = () => {
    this.props.onCancel();
  }
  handleLogoChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      this.setState({
        imageUrl:
          info.file &&
          info.file.response &&
          info.file.response.data &&
          info.file.response.data.bean &&
          info.file.response.data.bean.file_url,
        loading: false
      });
      this.getLogoBase64(info.file.originFileObj, imageBase64 =>
        this.setState({
          imageBase64
        })
      );
    }
  };
  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  handleLogoRemove = () => {
    this.setState({ imageUrl: '', imageBase64: '' });
  };
  render() {
    const { userInfo, imageBase64, imageUrl } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 20 },
    };
    const uploadButton = (
      <div>
        <Icon type={this.state.loading ? 'loading' : 'plus'} />
        <div className="ant-upload-text">上传头像</div>
      </div>
    );
    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    return (
      <Modal
        title={formatMessage({ id: 'versionUpdata_6_1.editUserInfo' })}
        visible={this.props.visible}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
      >
        <Form {...formItemLayout}>
          <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.name' })}>
            {getFieldDecorator(`real_name`, {
              initialValue: userInfo.real_name || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'versionUpdata_6_1.name.placeholder' }),
                },
                {
                  max: 24,
                  message: formatMessage({ id: 'versionUpdata_6_1.name.length' }),
                }
              ],
            })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.name.placeholder' })} />)}
          </Form.Item>
          <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.email' })}>
            {getFieldDecorator(`email`, {
              initialValue: userInfo.email || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'versionUpdata_6_1.email.placeholder' }),
                },
                {
                  type: 'email',
                  message: formatMessage({ id: 'versionUpdata_6_1.email.format' }),
                }
              ],
            })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.email.placeholder' })} />)}
          </Form.Item>
          <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.avatar' })}>
            {getFieldDecorator(`logo`, {
              initialValue: userInfo.logo || imageUrl,
            })(
              <Upload
                className="logo-uploader"
                name="file"
                accept="image/jpg,image/jpeg,image/png"
                action={apiconfig.imageUploadUrl}
                listType="picture-card"
                headers={myheaders}
                showUploadList={false}
                onChange={this.handleLogoChange}
                onRemove={this.handleLogoRemove}
              >
                {imageUrl ? (
                  <img
                    src={imageBase64 || imageUrl}
                    alt="avatar"
                    style={{ width: '100%' }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            )}

          </Form.Item>
        </Form>
      </Modal>
    )
  }
}
