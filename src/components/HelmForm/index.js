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
        dispatch({
          type: 'market/HelmwaRehouseAdd',
          payload: {
            repo_name: values.name,
            repo_url: values.url,
            username: values.username,
            password: values.password
          },
          callback: res => {
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
              dispatch({
                type: 'market/HelmwaRehouseEdit',
                payload: {
                  repo_name: values.name,
                  repo_url: values.url,
                },
                callback: res =>{
                  setTimeout(()=>{
                    window.history.go(0)
                  },1000)
                }
              });
             
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
    // if (!name) {
    //   return callbacks();
    // }
    // if (name.length < 4) {
    //   return callbacks(`${formatMessage({id:'applicationMarket.HelmForm.min'})}`);
    // }
    // if (name.length > 32) {
    //   return callbacks(`${formatMessage({id:'applicationMarket.HelmForm.max'})}`);
    // }
    const pattern = /^[a-z][a-z0-9]+$/;
    if (!name.match(pattern)) {
      return callbacks(`${formatMessage({id:'applicationMarket.HelmForm.only'})}`);
    }

    dispatch({
      type: 'market/checkWarehouseAppName',
      payload: {
        name,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          callbacks(`${formatMessage({id:'applicationMarket.HelmForm.name'})}`);
        } else {
          callbacks();
        }
      },
      handleError: res => {
        if (callbacks && res && res.data && res.data.code) {
          if (res.data.code === 8001) {
            callbacks(`${formatMessage({id:'applicationMarket.HelmForm.name'})}`);
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
        message: formatMessage({id:'notification.warn.warehouse_exist'})
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
        <Alert message={<FormattedMessage id='applicationMarket.HelmForm.helm'/>} type="info" />
        <Form.Item {...formItemLayout} label={<FormattedMessage id='applicationMarket.HelmForm.shop_name'/>}>
          {getFieldDecorator('name', {
            initialValue: (data && data.name) || '',
            rules: [
              {
                required: true,
                message:formatMessage({id:'applicationMarket.HelmForm.input_name'})
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
              placeholder={formatMessage({id:'applicationMarket.HelmForm.input_name'})}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<FormattedMessage id='applicationMarket.HelmForm.address'/>}>
          {getFieldDecorator('url', {
            initialValue: (data && data.url) || '',
            rules: [
              {
                required: true,
                message:formatMessage({id:'applicationMarket.HelmForm.input_address'})
              },
              {
                pattern: /^[^\s]*$/,
                message: formatMessage({id:'placeholder.no_spaces'})
              }
            ]
          })(<Input type="text"  placeholder={formatMessage({id:'applicationMarket.HelmForm.input_address'})}/>)}
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
            <FormattedMessage id='applicationMarket.HelmForm.private'/>
          </Checkbox>
        </div>
        {showUsernameAndPass && (
          <Form.Item {...formItemLayout} label={<FormattedMessage id='applicationMarket.HelmForm.shop_name_user'/>}>
            {getFieldDecorator('username', {
              initialValue: (data && data.username) || '',
              rules: [
                {
                  required: showUsernameAndPass,
                  message:formatMessage({id:'applicationMarket.HelmForm.shop_name_input'})
                }
              ]
            })(<Input autoComplete="off"  placeholder={formatMessage({id:'applicationMarket.HelmForm.shop_name_input'})}/>)}
          </Form.Item>
        )}
        {showUsernameAndPass && (
          <Form.Item {...formItemLayout} label={<FormattedMessage id='applicationMarket.HelmForm.password'/>}>
            {getFieldDecorator('password', {
              initialValue: (data && data.password) || '',
              rules: [
                { required: showUsernameAndPass,  message:formatMessage({id:'applicationMarket.HelmForm.input_password'})}
              ]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder={formatMessage({id:'applicationMarket.HelmForm.input_password'})}
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
              <FormattedMessage id='button.create'/>
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
              <FormattedMessage id='button.cancel'/>
            </Button>
          )}
          {isEditor && (
            <Button onClick={this.handleUpHelmAppStore} type="primary">
              <FormattedMessage id='button.confirm'/>
            </Button>
          )}
        </div>
      </Form>
    );
  }
}
