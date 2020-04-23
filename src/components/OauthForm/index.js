import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Input, Select, Modal, Switch, Button } from 'antd';
import Branches from '../../../public/images/branches.svg';
import Application from '../../../public/images/application.svg';
import styles from './Index.less';
import styless from '../CreateTeam/index.less';

const Option = Select.Option;

@connect(({}) => ({}))
class CreateOAuthForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      oauthList: [],
      tenant_name: '',
      edit: false,
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
        if (res && res._code === 200) {
          this.setState({
            oauthList: res.bean && res.bean.oauth_type,
          });
        }
      },
    });
  };

  handleChange = tenant_name => {
    this.setState({ tenant_name });
  };
  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { onCancel, loading, oauthInfo } = this.props;
    const { edit, oauthList } = this.state;
    const formItemLayout = {
      labelCol: {
        span: 8,
      },
      wrapperCol: {
        span: 16,
      },
    };
    const oauthType = getFieldValue('oauth_type') || 'github';
    return (
      <Modal
        visible
        title="OAuth"
        maskClosable={false}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        width={600}
        className={styless.TelescopicModal}
        footer={[
          <Button type="primary" loading={loading} onClick={this.handleSubmit}>
            确定
          </Button>,
          <Button onClick={onCancel}>取消</Button>,
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
              rules: [{ required: true, message: '请选择oauth_type类型' }],
            })(
              <Select disabled={edit} placeholder="请选择要oauth_type类型">
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
                  message: '最大长度32位',
                },
              ],
            })(<Input placeholder="请输入名称" />)}
            <div className={styles.conformDesc}>OAuth服务显示名称</div>
          </Form.Item>

          {oauthType !== 'github' && (
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
                    message: '最大长度255位',
                  },
                ],
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
                  message: '最大长度64位',
                },
              ],
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
                  message: '最大长度64位',
                },
              ],
            })(<Input disabled={edit} placeholder="请输入client_secret" />)}
            <div className={styles.conformDesc}>Client Secret</div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                平台访问域名
              </div>
            }
          >
            {getFieldDecorator('redirect_domain', {
              initialValue: oauthInfo
                ? oauthInfo.redirect_uri.replace('/console/oauth/redirect', '')
                : `${window.location.protocol}//${window.location.host}`,
              rules: [
                { required: true, message: '请输入正确的平台访问域名' },
                { type: 'url', message: '输入数据不是合法的URL' },
                {
                  max: 255,
                  message: '最大长度255位',
                },
              ],
            })(<Input placeholder="请输入平台访问域名" />)}
            <div className={styles.conformDesc}>
              平台访问域名是用于OAuth认证完回跳时的访问地址
            </div>
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
const creatOauth = Form.create()(CreateOAuthForm);
export default creatOauth;
