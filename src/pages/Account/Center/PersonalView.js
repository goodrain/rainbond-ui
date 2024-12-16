import React, { Component } from 'react'
import { Form, Row, Col, Input, Button, Icon, Upload } from 'antd';

@Form.create()
export default class PersonalView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageUrl: '',
      loading: false,
    };
  }
  handleChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, imageUrl =>
        this.setState({
          imageUrl,
          loading: false,
        }),
      );
    }
  };
  beforeUpload = file => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isLt2M;
  }
  render() {
    const uploadButton = (
      <div>
        <Icon type={this.state.loading ? 'loading' : 'plus'} />
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    const { imageUrl } = this.state;
    const { getFieldDecorator } = this.props.form;
    return (
      <div>
        <Form>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={formatMessage({id:'versionUpdata_6_1.name'})}>
                {getFieldDecorator(`name`, {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'versionUpdata_6_1.name.placeholder'}),
                    },
                  ],
                })(<Input placeholder="placeholder" />)}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={formatMessage({id:'versionUpdata_6_1.email'})}>
                {getFieldDecorator(`email`, {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'versionUpdata_6_1.email.placeholder'}),
                    },
                  ],
                })(<Input placeholder="placeholder" />)}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={formatMessage({id:'versionUpdata_6_1.username'})}>
                {getFieldDecorator(`username`, {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'versionUpdata_6_1.username.placeholder'}),
                    },
                  ],
                })(<Input placeholder="placeholder" />)}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={formatMessage({id:'versionUpdata_6_1.password'})}>
                {getFieldDecorator(`password`, {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'versionUpdata_6_1.password.placeholder'}),
                    },
                  ],
                })(<Input placeholder="placeholder" />)}
              </Form.Item>
            </Col>
          </Row>
          {/* 手机号 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={formatMessage({id:'versionUpdata_6_1.phone'})}>
                {getFieldDecorator(`phone`, {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'versionUpdata_6_1.phone.placeholder'}),
                    },
                  ],
                })(<Input placeholder="placeholder" />)}
              </Form.Item>
            </Col>
          </Row>
          {/* 头像 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={formatMessage({id:'versionUpdata_6_1.avatar'})}>
                {getFieldDecorator(`avatar`, {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'versionUpdata_6_1.avatar.placeholder'}),
                    },
                  ],
                })(
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    beforeUpload={this.beforeUpload}
                    onChange={this.handleChange}
                  >
                    {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
                  </Upload>
                )}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    )
  }
}
