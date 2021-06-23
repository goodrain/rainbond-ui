/* eslint-disable no-empty-pattern */
import { Button, Form, Input, Modal, Select, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
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
        title={edit ? '编辑第三方服务配置' : '添加 Oauth 第三方服务'}
        maskClosable={false}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        width={600}
        className={styless.TelescopicModal}
        footer={[
          <Button type="primary" loading={loading} onClick={this.handleSubmit}>
            确定
          </Button>,
          <Button onClick={onCancel}>取消</Button>
        ]}
      >
        <Form layout="horizontal" hideRequiredMark onSubmit={this.handleSubmit}>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                OAuth类型
              </div>
            }
          >
            {getFieldDecorator('oauth_type', {
              initialValue: oauthInfo ? oauthInfo.oauth_type : 'github',
              rules: [{ required: true, message: '请选择oauth_type类型' }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                disabled={edit}
                placeholder="请选择要oauth_type类型"
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
                如需编辑类型，请删除配置后重新添加
              </div>
            )}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                名称
              </div>
            }
          >
            {getFieldDecorator('name', {
              initialValue: oauthInfo ? oauthInfo.name : '',
              rules: [
                { required: true, message: '请输入名称' },
                {
                  max: 32,
                  message: '最大长度32位'
                }
              ]
            })(<Input placeholder="请输入名称" />)}
            <div className={styles.conformDesc}>OAuth服务显示名称</div>
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
                    服务地址
                  </div>
                }
              >
                {getFieldDecorator('home_url', {
                  initialValue: oauthInfo ? oauthInfo.home_url : '',
                  rules: [
                    { required: true, message: '请输入服务地址' },
                    { type: 'url', message: '输入数据不是合法的URL' },
                    {
                      max: 255,
                      message: '最大长度255位'
                    }
                  ]
                })(<Input disabled={edit} placeholder="请输入服务地址" />)}
                <div className={styles.conformDesc}>第三方服务访问地址</div>
              </Form.Item>
            )}

          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                客户端ID
              </div>
            }
          >
            {getFieldDecorator('client_id', {
              initialValue: oauthInfo ? oauthInfo.client_id : '',
              rules: [
                { required: true, message: '请输入client_id' },
                {
                  max: 64,
                  message: '最大长度64位'
                }
              ]
            })(<Input disabled={edit} placeholder="请输入client_id" />)}
            <div className={styles.conformDesc}>Client ID</div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                客户端密钥
              </div>
            }
          >
            {getFieldDecorator('client_secret', {
              initialValue: oauthInfo ? oauthInfo.client_secret : '',
              rules: [
                { required: true, message: '请输入client_secret' },
                {
                  max: 64,
                  message: '最大长度64位'
                }
              ]
            })(<Input disabled={edit} placeholder="请输入client_secret" />)}
            <div className={styles.conformDesc}>Client Secret</div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                回调地址
              </div>
            }
          >
            {getFieldDecorator('redirect_domain', {
              initialValue: oauthInfo
                ? oauthInfo.redirect_uri.replace('/console/oauth/redirect', '')
                : `${window.location.protocol}//${window.location.host}`,
              rules: [
                { required: true, message: '请输入正确的回调地址' },
                { type: 'url', message: '输入数据不是合法的URL' },
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(
              <Input
                placeholder="请输入回调地址"
                addonAfter="/console/oauth/redirect"
              />
            )}

            <div className={styles.conformDesc}>
              回调地址是用于 OAuth
              认证完回跳时的访问地址，默认填充为当前访问地址。通常也需要您在
              Oauth 服务提供商进行相同的配置。
            </div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                自动登录
              </div>
            }
          >
            {getFieldDecorator('is_auto_login', {
              initialValue: oauthInfo ? oauthInfo.is_auto_login : false,
              rules: [{ required: true, message: '设置是否开启自动登录选项' }]
            })(
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                defaultChecked={oauthInfo ? oauthInfo.is_auto_login : false}
              />
            )}
            <div className={styles.conformDesc}>
              开启自动登录即需要登录时将自动跳转到该Oauth服务进行认证，实现单点登录效果，未确认该服务可用之前请谨慎开启。
            </div>
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
const creatOauth = Form.create()(CreateOAuthForm);
export default creatOauth;
