/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-multi-assign */
/* eslint-disable no-undef */
/* eslint-disable jsx-a11y/iframe-has-title */
/* eslint-disable react/no-multi-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import { Button, Checkbox, Form, Input, Radio, Select, Tabs } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const RadioGroup = Radio.Group;
const { TabPane } = Tabs;
const { Option } = Select;

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(post) {
    super(post);
    this.state = {
      createLoading: false,
      showUsernameAndPass: false
    };
  }

  componentDidMount() {
    const { data } = this.props;
    if (data && data.username) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({
        showUsernameAndPass: true
      });
    }
  }

  handleClose = () => {
    this.setState({
      createLoading: false
    });
  };

  handleCreateAppStore = () => {
    const { dispatch, form, eid, onCancel, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          createLoading: true
        });
        dispatch({
          type: 'market/addHelmAppStore',
          payload: Object.assign({}, { enterprise_id: eid }, values),
          callback: res => {
            if (res && res.status_code === 200 && onOk && onCancel) {
              onOk();
              onCancel();
              this.handleClose();
            }
          },
          handleError: () => {
            this.handleClose();
          }
        });
      }
    });
  };

  handleUpHelmAppStore = () => {
    const { dispatch, form, eid, onCancel, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          createLoading: true
        });
        dispatch({
          type: 'market/upHelmAppStore',
          payload: Object.assign({}, { enterprise_id: eid }, values),
          callback: res => {
            if (res && res.status_code === 200) {
              this.handleClose();
              onOk();
            }
          },
          handleError: () => {
            this.handleClose();
          }
        });
      }
    });
  };

  render() {
    const { rainbondInfo, form, data, onCancel, isEditor = false } = this.props;
    const { createLoading, showUsernameAndPass } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        span: 0
      },
      wrapperCol: {
        span: 24
      }
    };
    const defaultMarketUrl = rainbondInfo && rainbondInfo.default_market_url;
    return (
      <Form>
        <Form.Item {...formItemLayout} label="名称">
          {getFieldDecorator('name', {
            initialValue: (data && data.name) || '',
            rules: [
              {
                required: true,
                message: '请填写名称'
              },
              {
                pattern: /^[a-zA-Z0-9]+$/,
                message: '只支持字母、数字组合'
              }
            ]
          })(
            <Input
              disabled={data && data.name}
              type="text"
              placeholder="请填写名称"
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="仓库地址">
          {getFieldDecorator('url', {
            initialValue: (data && data.url) || defaultMarketUrl || '',
            rules: [
              {
                required: true,
                message: '请填写需要进行绑定的应用市场的URL'
              }
            ]
          })(
            <Input
              type="text"
              placeholder="请填写需要进行绑定的应用市场的URL"
            />
          )}
        </Form.Item>
        <div style={{ textAlign: 'right', marginTop: '-16px' }}>
          <Checkbox
            checked={showUsernameAndPass}
            onClick={() => {
              this.setState({
                showUsernameAndPass: !showUsernameAndPass
              });
            }}
          >
            私有仓库
          </Checkbox>
        </div>
        {showUsernameAndPass && (
          <Form.Item {...formItemLayout} label="仓库用户名">
            {getFieldDecorator('username', {
              initialValue: (data && data.username) || '',
              rules: [
                {
                  required: showUsernameAndPass,
                  message: '请输入仓库用户名'
                }
              ]
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
        )}
        {showUsernameAndPass && (
          <Form.Item {...formItemLayout} label="仓库密码">
            {getFieldDecorator('password', {
              initialValue: (data && data.password) || '',
              rules: [
                { required: showUsernameAndPass, message: '请输入仓库密码' }
              ]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="请输入仓库密码"
              />
            )}
          </Form.Item>
        )}
        <Form.Item {...formItemLayout} label="仓库分支">
          {getFieldDecorator('branch', {
            initialValue: (data && data.branch) || '',
            rules: [
              {
                required: true,
                message: '请填写分支名称'
              }
            ]
          })(<Input type="text" placeholder="例如: master" />)}
        </Form.Item>
        <div style={{ textAlign: 'center' }}>
          {!isEditor && (
            <Button
              onClick={this.handleCreateAppStore}
              loading={createLoading}
              type="primary"
            >
              创建
            </Button>
          )}
          {isEditor && (
            <Button
              style={{
                marginRight: 20,
                marginBottom: 24
              }}
              onClick={onCancel}
            >
              取消
            </Button>
          )}
          {isEditor && (
            <Button onClick={this.handleUpHelmAppStore} type="primary">
              确认
            </Button>
          )}
        </div>
      </Form>
    );
  }
}
