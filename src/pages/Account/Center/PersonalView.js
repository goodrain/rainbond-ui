import React, { Component } from 'react'
import { connect } from 'dva';
import { Form, Row, Col, Input, Button, Icon, Upload, Avatar, notification, Skeleton } from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
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
      showChangePassword: false
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
  render() {
    const { imageUrl, userInfo, showEditUserInfoFrom, loading, showChangePassword } = this.state;
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
                          required: true,
                          message: formatMessage({ id: 'versionUpdata_6_1.email.placeholder' }),
                        },
                      ],
                    })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.email.placeholder' })} disabled={true} />)}
                  </Form.Item>
                </Col>
              </Row>

              <Row >
                <Col span={12}>
                  <Form.Item label={formatMessage({ id: 'versionUpdata_6_1.phone' })}>
                    {getFieldDecorator(`phone`, {
                      initialValue: userInfo.phone,
                      rules: [
                        {
                          required: true,
                          message: formatMessage({ id: 'versionUpdata_6_1.phone.placeholder' }),
                        },
                      ],
                    })(<Input placeholder={formatMessage({ id: 'versionUpdata_6_1.phone.placeholder' })} disabled={true} />)}
                  </Form.Item>
                </Col>
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
        </Skeleton>
      </div>
    )
  }
}
