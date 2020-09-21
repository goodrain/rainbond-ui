import { Form, Input, Modal, Icon, Upload } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';

const FormItem = Form.Item;

@Form.create()
export default class PlatformBasicInformationForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      imageBase64: '',
      imageUrl: '',
      loading: false
    };
  }
  onOk = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields({ force: true }, (err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

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

  handleLogoRemove = () => {
    this.setState({ imageUrl: '', imageBase64: '' });
  };
  handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await this.getBase64(file.originFileObj);
    }
    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true
    });
  };

  render() {
    const { title, onCancel, data = {}, form, loading = false } = this.props;
    const { getFieldDecorator } = form;
    const { imageBase64, imageUrl } = this.state;
    const uploadButton = (
      <div style={{ width: '284px', height: '44px' }}>
        <Icon type="plus" />
        <div className="ant-upload-text">上传图标</div>
      </div>
    );
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

    return (
      <Modal
        visible
        title={title}
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="标题">
            {getFieldDecorator('name', {
              initialValue: data.name || '',
              rules: [
                {
                  required: true,
                  message: '请输入标题'
                },
                {
                  max: 64,
                  message: '最大长度64位'
                }
              ]
            })(<Input placeholder="请输入标题" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="企业名称">
            {getFieldDecorator('enterpriseName', {
              initialValue: data.enterpriseName || '',
              rules: [
                {
                  required: true,
                  message: '请输入企业名称'
                },
                {
                  max: 64,
                  message: '最大长度64位'
                }
              ]
            })(<Input placeholder="请输入企业名称" />)}
          </FormItem>

          <Form.Item
            {...formItemLayout}
            label="LOGO"
            extra="请上传宽度300px、高64px的图片"
          >
            {getFieldDecorator('pic', {
              initialValue: data.pic || '',
              rules: [
                {
                  required: false,
                  message: '请上传图标'
                }
              ]
            })(
              <Upload
                name="file"
                accept="image/jpg,image/jpeg,image/png"
                className={styles.customUpload}
                action={apiconfig.imageUploadUrl}
                listType="picture-card"
                headers={myheaders}
                showUploadList={false}
                onChange={this.handleLogoChange}
                onRemove={this.handleLogoRemove}
                onPreview={this.handlePreview}
              >
                {imageUrl ? (
                  <img
                    src={imageBase64 || imageUrl}
                    alt="avatar"
                    style={{ width: '300px', height: '64px' }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
