import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Upload, Icon, Spin } from 'antd';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

@connect()
class UploadForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      imageUrl: ''
    };
  }
  componentDidMount() {
    const { initialValue } = this.props;
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      // eslint-disable-next-line react/no-unused-state
      imageUrl: initialValue || ''
    });
  }
  handleLogoChange = info => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      if (
        info.file &&
        info.file.response &&
        info.file.response.data &&
        info.file.response.data.bean &&
        info.file.response.data.bean.file_url
      ) {
        this.setState({
          // eslint-disable-next-line react/no-unused-state
          imageUrl: info.file.response.data.bean.file_url,
          loading: false
        });
      }
    }
  };

  handleLogoRemove = () => {
    this.setState({ imageUrl: '' });
  };
  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  render() {
    const {
      label,
      extra,
      initialValue,
      form,
      imgstyle,
      uploadBtnStyle,
      formItemLayout,
      name,
      message,
      required = true
    } = this.props;
    const { getFieldDecorator } = form;
    const { loading, imageUrl } = this.state;
    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }

    const uploadButton = (
      <div style={uploadBtnStyle}>
        <Icon type="plus" />
        <div className="ant-upload-text">{formatMessage({id:'teamOverview.uploadIcon'})}</div>
      </div>
    );
    return (
      <Form.Item {...formItemLayout} label={label} extra={extra}>
        {getFieldDecorator(name, {
          initialValue,
          rules: [
            {
              required,
              message: message || formatMessage({id:'teamOverview.uploadIcon'})
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
            loading={loading}
          >
            {imageUrl ? (
              <Spin spinning={loading}>
                <img src={imageUrl} alt="avatar" style={imgstyle} />
              </Spin>
            ) : (
              uploadButton
            )}
          </Upload>
        )}
      </Form.Item>
    );
  }
}
export default UploadForm;
