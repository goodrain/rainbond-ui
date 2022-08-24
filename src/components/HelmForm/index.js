/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-multi-assign */
/* eslint-disable no-undef */
/* eslint-disable jsx-a11y/iframe-has-title */
/* eslint-disable react/no-multi-comp */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
  Tabs
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cloud from '../../utils/cloud';

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
              onOk(res.name);
              onCancel();
            }
            this.handleClose();
          },
          handleError: res => {
            cloud.handleCloudAPIError(res);
            this.handleClose();
          }
        });
      }
    });
  };

  handleUpHelmAppStore = () => {
    const { dispatch, form, eid, onOk } = this.props;
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
          handleError: res => {
            this.handleError(res);
            this.handleClose();
          }
        });
      }
    });
  };
  handleCheckAppName = (name, callbacks) => {
    const { dispatch, eid } = this.props;
    if (!callbacks) {
      return null;
    }
    if (!name) {
      return callbacks();
    }
    if (name.length < 4) {
      return callbacks('最小长度4位');
    }
    if (name.length > 32) {
      return callbacks('最大长度32位');
    }
    const pattern = /^[a-z][a-z0-9]+$/;
    if (!name.match(pattern)) {
      return callbacks('只支持小写字母开头、小写字母和数字组合');
    }

    dispatch({
      type: 'market/checkWarehouseAppName',
      payload: {
        name,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          callbacks('仓库名称已存在');
        } else {
          callbacks();
        }
      },
      handleError: res => {
        if (callbacks && res && res.data && res.data.code) {
          if (res.data.code === 8001) {
            callbacks('仓库名称已存在');
          } else {
            callbacks();
          }
        }
      }
    });
  };
  handleError = res => {
    if (res && res.data && res.data.code) {
      notification.warning({
        message: '仓库名称已存在'
      });
    }
  };
  render() {
    const { form, data, onCancel, isEditor = false } = this.props;
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
    return (
      <Form>
        <Alert message="当前版本仅支持 Helm 仓库对接应用商店。" type="info" />
        <Form.Item {...formItemLayout} label="商店名称">
          {getFieldDecorator('name', {
            initialValue: (data && data.name) || '',
            rules: [
              {
                required: true,
                message: '请填写商店名称'
              },
              {
                validator: (_, value, callback) => {
                  this.handleCheckAppName(value, callback);
                }
              }
            ]
          })(
            <Input
              disabled={data && data.name}
              type="text"
              placeholder="请填写商店名称"
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="商店地址">
          {getFieldDecorator('url', {
            initialValue: (data && data.url) || '',
            rules: [
              {
                required: true,
                message: '请填写商店地址'
              },
              {
                pattern: /^[^\s]*$/,
                message: formatMessage({id:'placeholder.no_spaces'})
              }
            ]
          })(<Input type="text" placeholder="请填写商店地址" />)}
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
            私有商店
          </Checkbox>
        </div>
        {showUsernameAndPass && (
          <Form.Item {...formItemLayout} label="商店用户名">
            {getFieldDecorator('username', {
              initialValue: (data && data.username) || '',
              rules: [
                {
                  required: showUsernameAndPass,
                  message: '请输入商店用户名'
                }
              ]
            })(<Input autoComplete="off" placeholder="请输入商店用户名" />)}
          </Form.Item>
        )}
        {showUsernameAndPass && (
          <Form.Item {...formItemLayout} label="商店密码">
            {getFieldDecorator('password', {
              initialValue: (data && data.password) || '',
              rules: [
                { required: showUsernameAndPass, message: '请输入商店密码' }
              ]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="请输入商店密码"
              />
            )}
          </Form.Item>
        )}
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
