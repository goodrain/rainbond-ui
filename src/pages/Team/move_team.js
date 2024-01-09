/* eslint-disable react/sort-comp */
import { Form, Input, Modal, Upload, Icon } from 'antd';
import React, { PureComponent } from 'react';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import styles from './index.less'
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;
@Form.create()
export default class MoveTeam extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      imageUrl: '', 
      imageBase64: ''
    };
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    const { imageUrl } = this.state
    form.validateFields((err, fieldsValue) => {
      fieldsValue.new_logo= imageUrl
      if (err) return;
      this.props.onSubmit(fieldsValue);
    });
  };
  onCancel = () => {
    this.props.onCancel();
  };
  handleLogoRemove = () => {
    this.setState({ imageUrl: '', imageBase64: '' });
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
  getLogoBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const initValue = this.props.teamAlias;
    const { imageBase64, imageUrl } =this.state
    const { imageUrlTeam = false } =this.props
    const token = cookie.get('token');
    const myheaders = {};
    if (token) {
      myheaders.Authorization = `GRJWT ${token}`;
    }
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 14
        }
      }
    };
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">{formatMessage({id:'popover.newApp.upload_pictures'})}</div>
      </div>
    );
    return (
      <Modal
        title={formatMessage({id:'teamOther.move_team.logo_label'})}
        visible
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label={formatMessage({id:'teamOther.move_team.name_label'})}>
            {getFieldDecorator('new_team_alias', {
              initialValue: initValue || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'teamOther.move_team.null'})
                },
                { max: 24, message:  formatMessage({id:'teamOther.move_team.max'})}
              ]
            })(<Input placeholder= {formatMessage({id:'teamOther.move_team.input_name'})}/>)}
          </FormItem>
          {/* 团队头像 */}
          <FormItem {...formItemLayout} label='LOGO'
            extra={
              <div className={styles.conformDesc}>
                <FormattedMessage id='popover.enterpriseOverview.setUpTeam.label.logo' />
              </div>
            }
          >
            {getFieldDecorator('logo', {
              rules: [
                {
                  required: false,
                  message: formatMessage({ id: 'popover.enterpriseOverview.setUpTeam.input_logo' })
                }
              ]
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
                {(imageUrl ||imageUrlTeam) ? (
                  <img
                    src={imageBase64 || imageUrlTeam}
                    alt="LOGO"
                    style={{ width: '100%' }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            )}

          </FormItem>
        </Form>
      </Modal>
    );
  }
}
