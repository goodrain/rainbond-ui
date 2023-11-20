/* eslint-disable no-empty-pattern */
import { Button, Form, Input, Modal, Select, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import Application from '../../../public/images/application.svg';
import Branches from '../../../public/images/branches.svg';
import styless from '../CreateTeam/index.less';
import styles from './Index.less';

const { Option } = Select;

@connect(({}) => ({}))
class CreateOAuthForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      oauthList: [],
      edit: false
    };
  }
  componentDidMount() {
    this.fetchOauthType();
    const { oauthInfo } = this.props;
    if (oauthInfo) {
      this.setState({ edit: true });
    }
  }
  componentWillUpdate(props) {
    const { oauthInfo } = props;
    if (oauthInfo) {
      this.setState({ edit: true });
    }
  }

  fetchOauthType = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'user/fetchOauthType',
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            oauthList: res.bean && res.bean.oauth_type
          });
        }
      }
    });
  };

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err && this.props.onOk) {
        this.props.onOk(values);
      }
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { onCancel, loading, oauthInfo } = this.props;
    const { edit, oauthList } = this.state;
    const formItemLayout = {
      labelCol: {
        span: 8
      },
      wrapperCol: {
        span: 16
      }
    };
    const oauthType = getFieldValue('oauth_type') || 'github';
    return (
      <Modal
        visible
        title={edit ? formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.title.edit'}) : formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.title.add'})}
        maskClosable={false}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        width={600}
        className={styless.TelescopicModal}
        footer={[
          <Button type="primary" loading={loading} onClick={this.handleSubmit}>
            {formatMessage({id:'button.confirm'})}
          </Button>,
          <Button onClick={onCancel}> {formatMessage({id:'button.cancel'})}</Button>
        ]}
      >
        <Form layout="horizontal" hideRequiredMark onSubmit={this.handleSubmit}>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.oauth_type'})}
              </div>
            }
          >
            {getFieldDecorator('oauth_type', {
              initialValue: oauthInfo ? oauthInfo.oauth_type : 'github',
              rules: [{ required: true, message: formatMessage({id:'placeholder.oauth.oauth_type'}) }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                disabled={edit}
                placeholder={formatMessage({id:'placeholder.oauth.oauth_type'})}
              >
                {oauthList &&
                  oauthList.map(item => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
              </Select>
            )}
            {edit && (
              <div className={styles.conformDesc}>
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.oauth_type.desc'})}
              </div>
            )}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.name'})}
              </div>
            }
          >
            {getFieldDecorator('name', {
              initialValue: oauthInfo ? oauthInfo.name : '',
              rules: [
                { required: true, message: formatMessage({id:'placeholder.appShare.appPublish.name'}) },
                {
                  max: 32,
                  message: formatMessage({id:'placeholder.max32'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.appShare.appPublish.name'})} />)}
            <div className={styles.conformDesc}>{formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.name.desc'})}</div>
          </Form.Item>

          {oauthType !== 'github' &&
            oauthType !== 'aliyun' &&
            oauthType !== 'dingtalk' && (
              <Form.Item
                className={styles.clearConform}
                {...formItemLayout}
                label={
                  <div className={styles.clearConformMinTitle}>
                    <img src={Branches} alt="" />
                    {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.home_url'})}
                  </div>
                }
              >
                {getFieldDecorator('home_url', {
                  initialValue: oauthInfo ? oauthInfo.home_url : '',
                  rules: [
                    { required: true, message: formatMessage({id:'placeholder.oauth.home_url'}) },
                    { type: 'url', message: formatMessage({id:'placeholder.oauth.not_url'}) },
                    {
                      max: 255,
                      message: formatMessage({id:'placeholder.max255'})
                    }
                  ]
                })(<Input disabled={edit} placeholder={formatMessage({id:'placeholder.oauth.home_url'})} />)}
                <div className={styles.conformDesc}>{formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.home_url.desc'})}</div>
              </Form.Item>
            )}

          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.client_id'})}
              </div>
            }
          >
            {getFieldDecorator('client_id', {
              initialValue: oauthInfo ? oauthInfo.client_id : '',
              rules: [
                { required: true, message: formatMessage({id:'placeholder.oauth.client_id'}) },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.appShare.max255'})
                }
              ]
            })(<Input disabled={edit} placeholder={formatMessage({id:'placeholder.oauth.client_id'})} />)}
            <div className={styles.conformDesc}>{formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.client_id.desc'})}</div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.client_secret'})}
              </div>
            }
          >
            {getFieldDecorator('client_secret', {
              initialValue: oauthInfo ? oauthInfo.client_secret : '',
              rules: [
                { required: true, message: formatMessage({id:'placeholder.oauth.client_secret'}) },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.appShare.max255'})
                }
              ]
            })(<Input disabled={edit} placeholder={formatMessage({id:'placeholder.oauth.client_secret'})} />)}
            <div className={styles.conformDesc}>{formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.client_secret.desc'})}</div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.redirect_domain'})}
              </div>
            }
          >
            {getFieldDecorator('redirect_domain', {
              initialValue: oauthInfo
                ? oauthInfo.redirect_uri.replace('/console/oauth/redirect', '')
                : `${window.location.protocol}//${window.location.host}`,
              rules: [
                { required: true, message: formatMessage({id:'placeholder.oauth.redirect_domain'}) },
                { type: 'url', message: formatMessage({id:'placeholder.oauth.not_url'}) },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(
              <Input
                placeholder={formatMessage({id:'placeholder.oauth.redirect_domains'})}
                addonAfter="/console/oauth/redirect"
              />
            )}

            <div className={styles.conformDesc}>
              
              {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.redirect_domain.desc'})}
            </div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                {formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.is_auto_login'})}
              </div>
            }
            extra={formatMessage({id:'enterpriseSetting.basicsSetting.serve.form.label.is_auto_login.desc'})}
          >
            {getFieldDecorator('is_auto_login', {
              initialValue: oauthInfo ? oauthInfo.is_auto_login : false,
              rules: [{ required: true, message: formatMessage({id:'placeholder.oauth.is_auto_login'}) }]
            })(
              <Switch
                checkedChildren={formatMessage({id:'button.switch.open'})}
                unCheckedChildren={formatMessage({id:'button.switch.close'})}
                defaultChecked={oauthInfo ? oauthInfo.is_auto_login : false}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
const creatOauth = Form.create()(CreateOAuthForm);
export default creatOauth;
