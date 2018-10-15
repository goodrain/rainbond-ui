import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Row, Col, Button, Modal, Form, Input, Steps, notification } from 'antd';
import globalUtil from '../../utils/global';

const { Step } = Steps;
const {TextArea} = Input;
@Form.create()
class AuthForm extends PureComponent {
  handleSubmit = (e) => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const formItemLayout = {
      labelCol: {
        span: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };
    const { getFieldDecorator } = this.props.form;
    return (
      <Form
        style={{
          textAlign: 'left',
        }}
        layout="horizontal"
        hideRequiredMark
      >
        {/* <Form.Item {...formItemLayout} label="企业ID">
          {getFieldDecorator('market_client_id', {
            initialValue: '',
            rules: [
              {
                required: true,
                message: '请输入您的企业ID',
              },
            ],
          })(<Input placeholder="请输入您的企业ID" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="企业Token">
          {getFieldDecorator('market_client_token', {
            initialValue: '',
            rules: [
              {
                required: true,
                message: '请输入您的企业Token',
              },
            ],
          })(<Input placeholder="请输入您的企业Token" />)}
        </Form.Item> */}
        <Form.Item {...formItemLayout} label="企业秘钥">
          {getFieldDecorator('market_info', {
            initialValue: '',
            rules: [
              {
                required: true,
                message: '请输入您的企业秘钥',
              },
            ],
          })(<TextArea placeholder="请输入您的企业秘钥" autosize />)}
        </Form.Item>

        <Row>
          <Col span="6" />
          <Col span="18" style={{}}>
            <Button onClick={this.handleSubmit} type="primary">
              提交认证
            </Button>
          </Col>
        </Row>
      </Form>
    );
  }
}

@connect(({ user }) => ({ currUser: user.currentUser }))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      currStep: 0,
    };
  }
  handleAuthEnterprise = (vals) => {
    const { currUser } = this.props;
    this.props.dispatch({
      type: 'global/authEnterprise',
      payload: {
        // team_name: globalUtil.getCurrTeamName(),
        // enterprise_id: currUser.enterprise_id,
        // ...vals,
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: currUser.enterprise_id,
        market_info: vals.market_info
      },
      callback: () => {
        notification.success({
          message: '认证成功',
        });
        this.hidden();
        this.props.onOk && this.props.onOk();
      },
    });
  };
  hidden = () => {
    this.props.dispatch({ type: 'global/hideAuthCompany' });
  };
  handleTakeInfo = () => {
    const { currUser } = this.props;
    this.setState(
      {
        currStep: 1,
      },
      () => {
        window.open(`https://www.goodrain.com/spa/#/check-key/${currUser.enterprise_id}`);
      },
    );
  };
  render() {
    const step = this.state.currStep;
    return (
      <Modal
        width={800}
        title="企业尚未认证, 按以下步骤进行认证"
        visible
        onCancel={this.hidden}
        footer={null}
      >
        <div>
          <Steps
            style={{
              margin: '0 auto',
              width: 'calc(100% - 80px)',
            }}
            progressDot
            current={step}
          >
            <Step title="获取认证信息">yyy</Step>
            <Step title="填写认证信息" />
          </Steps>
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              display: step === 0 ? 'block' : 'none',
            }}
          >
            <p>获取您企业的认证信息后返回本页进行第二步</p>
            <Button onClick={this.handleTakeInfo} type="primary">
              去获取
            </Button>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              width: '350px',
              margin: '0 auto',
              display: step === 1 ? 'block' : 'none',
            }}
          >
            <AuthForm onSubmit={this.handleAuthEnterprise} />
          </div>
        </div>
      </Modal>
    );
  }
}
