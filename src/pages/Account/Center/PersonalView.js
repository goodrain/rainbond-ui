import React, { Component } from 'react'
import { connect } from 'dva';
import { Form, Row, Col, Input, Button, Icon, Upload, Avatar, notification, Skeleton, Modal } from 'antd';
import { formatMessage } from '@/utils/intl';
import ChangePassword from '../../../components/ChangePassword'
import EditUserInfoFrom from '../../../components/EditUserInfoFrom'
import userIcon from '../../../../public/images/default_Avatar.png';
import styles from './Info.less'

@Form.create()
@connect(({ global }) => ({
  isRegist: global.isRegist,
  rainbondInfo: global.rainbondInfo
}))
export default class PersonalView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageUrl: '',
      loading: false,
      userInfo: {},
      showChangePassword: false,
      showEditFieldModal: false,
      editFieldType: '', // 'phone' or 'email'
      editFieldValue: '',
      verificationCode: '', // 验证码
      countdown: 0, // 倒计时
      sendingCode: false // 是否正在发送验证码
    };
  }
  componentDidMount() {
    this.getUserInfo();
  }
  // 获取用户信息
  getUserInfo = () => {
    this.setState({
      loading: true
    })
    const { dispatch } = this.props;
    dispatch({
      type: 'user/getUserInfo',
      callback: (data) => {
        this.setState({
          userInfo: data,
          imageUrl: data.logo,
          loading: false
        })
      },
      handleError: () => {
      }
    })
  }
  handleUpdateInfo = () => {
    this.setState({
      showEditUserInfoFrom: true
    })
  }
  handleCancel = () => {
    this.setState({
      showEditUserInfoFrom: false
    })
  }
  handleOk = (val, type) => {
    if (type == 'info') {
      this.updataUserInfo(val)
    } else {
      // 修改手机号逻辑
    }
  }
  // 更新个人信息
  updataUserInfo = (val) => {
    const { dispatch } = this.props;
    // 更新个人信息
    dispatch({
      type: 'user/updateUserInfo',
      payload: {
        ...val
      },
      callback: (data) => {
        this.setState({
          showEditUserInfoFrom: false
        }, () => {
          this.getUserInfo()
          notification.success({ message: formatMessage({ id: 'notification.success.change' }) })
        })
      },
      handleError: (err) => {
        this.setState({
          showEditUserInfoFrom: false,
        }, () => {
          notification.error({ message: formatMessage({ id: 'notification.error.change' }) })
        })
      }
    })

  }
  handleChangePass = vals => {
    this.props.dispatch({
      type: 'user/changePass',
      payload: {
        ...vals
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: 'GlobalHeader.success' }) });
      }
    });
  };
  cancelChangePass = () => {
    this.setState({ showChangePassword: false });
  };
  handleUpdatePassword = () => {
    this.setState({ showChangePassword: true });
  }

  handleEditField = (fieldType) => {
    const { userInfo } = this.state;
    this.setState({
      showEditFieldModal: true,
      editFieldType: fieldType,
      editFieldValue: userInfo[fieldType] || ''
    });
  }

  handleCancelEditField = () => {
    this.setState({
      showEditFieldModal: false,
      editFieldType: '',
      editFieldValue: '',
      verificationCode: '',
      countdown: 0
    });
  }

  // 发送验证码
  handleSendCode = () => {
    const { editFieldValue, editFieldType } = this.state;
    const { dispatch } = this.props;

    // 验证手机号
    if (editFieldType === 'phone') {
      const phoneReg = /^1[3-9]\d{9}$/;
      if (!phoneReg.test(editFieldValue)) {
        notification.error({
          message: '请输入正确的手机号码'
        });
        return;
      }
    } else {
      // 邮箱暂不支持验证码
      return;
    }

    this.setState({ sendingCode: true });

    dispatch({
      type: 'user/getSmsCode',
      payload: {
        phone: editFieldValue,
        purpose: 'update_phone'
      },
      callback: () => {
        notification.success({
          message: '验证码已发送'
        });
        this.setState({ sendingCode: false, countdown: 60 });
        this.startCountdown();
      }
    });
  }

  // 倒计时
  startCountdown = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.setState(prevState => {
        if (prevState.countdown <= 1) {
          clearInterval(this.timer);
          return { countdown: 0 };
        }
        return { countdown: prevState.countdown - 1 };
      });
    }, 1000);
  }

  componentWillUnmount() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  handleSaveField = () => {
    const { editFieldType, editFieldValue, verificationCode } = this.state;
    const { dispatch } = this.props;

    // 验证
    if (!editFieldValue) {
      notification.error({
        message: formatMessage({ id: 'notification.error.empty' })
      });
      return;
    }

    if (editFieldType === 'email') {
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(editFieldValue)) {
        notification.error({
          message: formatMessage({ id: 'versionUpdata_6_1.email.format' })
        });
        return;
      }
    }

    if (editFieldType === 'phone') {
      const phoneReg = /^1[3-9]\d{9}$/;
      if (!phoneReg.test(editFieldValue)) {
        notification.error({
          message: '请输入正确的手机号码'
        });
        return;
      }

      // 验证验证码
      if (!verificationCode) {
        notification.error({
          message: '请输入验证码'
        });
        return;
      }
    }

    // 构建 payload
    const payload = {};
    payload[editFieldType] = editFieldValue;

    // 如果是手机号,需要添加验证码
    if (editFieldType === 'phone') {
      payload.verification_code = verificationCode;
    }

    // 提交更新
    dispatch({
      type: 'user/updateUserInfo',
      payload: payload,
      callback: () => {
        notification.success({
          message: formatMessage({ id: 'notification.success.change' })
        });
        this.setState({
          showEditFieldModal: false,
          editFieldType: '',
          editFieldValue: '',
          verificationCode: '',
          countdown: 0
        });
        this.getUserInfo();
      },
      handleError: () => {
        notification.error({
          message: formatMessage({ id: 'notification.error.change' })
        });
      }
    });
  }

  render() {
    const { imageUrl, userInfo, showEditUserInfoFrom, loading, showChangePassword, showEditFieldModal, editFieldType, editFieldValue, verificationCode, countdown, sendingCode } = this.state;
    const { getFieldDecorator } = this.props.form;
    const isSaas = this.props.rainbondInfo?.is_saas || false;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 20 },
    };
    return (
      <div>
        <Skeleton loading={loading} paragraph={{ rows: 6 }} active>
          <Row type="flex" align="bottom">
            <Col span={3} style={{ paddingLeft: "2%" }}>
              <Avatar src={imageUrl || userIcon} size={100} />
            </Col>
            <Col span={21}>
              <Row style={{ display: "flex", flexDirection: "column" }}>
                <Col className={styles.userName}>
                  {userInfo.user_name}
                </Col>
                <Col>
                  <Button type="link" onClick={this.handleUpdateInfo}>{formatMessage({ id: 'versionUpdata_6_1.editBaseUserInfo' })}</Button>
                  {!isSaas && <Button type="link" onClick={this.handleUpdatePassword}>{formatMessage({ id: 'versionUpdata_6_1.editPassword' })}</Button>}
                </Col>
              </Row>
            </Col>
          </Row>
          <Row style={{ marginTop: 24 }}>
            <Form {...formItemLayout}>
              <Row >
                <Col span={12}>
                  <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.name' })}>
                    {getFieldDecorator(`real_name`, {
                      initialValue: userInfo.real_name,
                      rules: [
                        {
                          required: true,
                          message: formatMessage({ id: 'versionUpdata_6_1.name.placeholder' }),
                        },
                      ],
                    })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.name.placeholder' })} disabled={true} />)}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.email' })}>
                    {getFieldDecorator(`email`, {
                      initialValue: userInfo.email,
                      rules: [
                        {
                          required: false,
                          message: formatMessage({ id: 'versionUpdata_6_1.email.placeholder' }),
                        },
                      ],
                    })(<Input
                      placeholder={formatMessage({ id: 'versionUpdata_6_1.email.placeholder' })}
                      disabled={true}
                      suffix={
                        <Icon
                          type="edit"
                          style={{ cursor: 'pointer', color: '#1890ff' }}
                          onClick={() => this.handleEditField('email')}
                        />
                      }
                    />)}
                  </Form.Item>
                </Col>
              </Row>

              <Row >
              {isSaas && 
                <Col span={12}>
                  <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.phone' })}>
                    {getFieldDecorator(`phone`, {
                      initialValue: userInfo.phone,
                      rules: [
                        {
                          required: false,
                          message: formatMessage({ id: 'versionUpdata_6_1.phone.placeholder' }),
                        },
                      ],
                    })(<Input
                      placeholder={formatMessage({ id: 'versionUpdata_6_1.phone.placeholder' })}
                      disabled={true}
                      suffix={
                        <Icon
                          type="edit"
                          style={{ cursor: 'pointer', color: '#1890ff' }}
                          onClick={() => this.handleEditField('phone')}
                        />
                      }
                    />)}
                  </Form.Item>
                </Col>}
                {!isSaas && 
                <Col span={12}>
                  <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.password' })}>
                    {getFieldDecorator(`password`, {
                      initialValue: userInfo.password || '********',
                      rules: [
                        {
                          required: true,
                          message: formatMessage({ id: 'versionUpdata_6_1.password.placeholder' }),
                        },
                      ],
                    })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.password.placeholder' })} disabled={true} type='password' />)}
                  </Form.Item>
                </Col>
                }
              </Row>
            </Form>
          </Row>
          <EditUserInfoFrom
            userInfo={userInfo}
            visible={showEditUserInfoFrom}
            onCancel={this.handleCancel}
            onOk={this.handleOk}
          />
          {showChangePassword && (
            <ChangePassword
              onOk={this.handleChangePass}
              onCancel={this.cancelChangePass}
            />
          )}
          <Modal
            title={editFieldType === 'phone' ? '修改手机号' : '修改邮箱'}
            visible={showEditFieldModal}
            onOk={this.handleSaveField}
            onCancel={this.handleCancelEditField}
            okText="保存"
            cancelText="取消"
          >
            <Form.Item label={editFieldType === 'phone' ? '手机号' : '邮箱'}>
              <Input
                value={editFieldValue}
                onChange={(e) => this.setState({ editFieldValue: e.target.value })}
                placeholder={editFieldType === 'phone' ? '请输入手机号' : '请输入邮箱'}
              />
            </Form.Item>
            {editFieldType === 'phone' && (
              <Form.Item label="验证码">
                <Input
                  value={verificationCode}
                  onChange={(e) => this.setState({ verificationCode: e.target.value })}
                  placeholder="请输入验证码"
                  suffix={
                    <Button
                      type="link"
                      onClick={this.handleSendCode}
                      disabled={countdown > 0 || sendingCode}
                      loading={sendingCode}
                      style={{ padding: 0 }}
                    >
                      {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                    </Button>
                  }
                />
              </Form.Item>
            )}
          </Modal>
        </Skeleton>
      </div>
    )
  }
}
