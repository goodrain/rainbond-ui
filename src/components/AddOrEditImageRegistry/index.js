import { Form, Input, Modal, Select, Skeleton, Button, Spin, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import roleUtil from '../../utils/role';
import UserSelect from '../UserSelect';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect()
class ConfirmModal extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      roles: [],
      currentRoles: [],
      roleLoading: true,
      currentRolesLoading: true,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      checking: true,
      checkLoading: false
    };
  }
  // 检查仓库链接状态
  handleCheckImageHub = (values) => {
    const { dispatch, clusters, onOk } = this.props
    this.setState({ checkLoading: true })
    dispatch({
      type: 'global/checkHubLink',
      payload: {
          regionName: clusters[0].region_name,
          domain: values.domain,
          username: values.username,
          password: values.password
      },
      callback: res => {
          if(res){
            this.setState({
              checking: false,
              checkLoading: false
            })
            onOk(values);
          }
      },
      handleError: res => {
        this.setState({
          checking: true,
          checkLoading: false
        })
        notification.error({ message: formatMessage({ id: 'notification.settimg.image.checking' }) });
      }
    })
  };
  handleSubmit = () => {
    const { form, onOk, editData } = this.props;
    const { checking } = this.state
    form.validateFields((err, values) => {
      if (!err && onOk) {
        if (values.domain && values.domain.endsWith('/')) {
          // 如果是，删除末尾的斜杠
          values.domain = values.domain.slice(0, -1);
        }
        if(values.domain){
          this.handleCheckImageHub(values);
        } else {
          onOk(values);
        }
      }
    });
  };
  handleCloseRoleLoading = () => {
    this.setState({
      roleLoading: false
    });
  };
  handleCloseCurrentRolesLoading = () => {
    this.setState({
      currentRolesLoading: false
    });
  };
  //不能输入非汉字效验  效验不能输入非空字符串 
  validateNoChinese = (rule, value, callback) => {
    let reg = /^[^\u4e00-\u9fa5]+$/g;
    let regEmpty = /^\s*$/g;
    let regNoHttp = /^(?!.*(?:https?)).*$/;
    if (value && !reg.test(value)) {
      callback(formatMessage({id:'placeholder.reg_Chinese'}));
    } else if (value && regEmpty.test(value)) {
      callback(formatMessage({id:'placeholder.regEmpty'}));
    }  else {
      callback();
    } 
  }
  validateSecret = (rule, value, callback) => {
    const { imageList } = this.props
    // 只允许输入小写字母正则
    let reg = /^[a-z]+$/g;
    if(imageList.some(item => item.secret_id === value)){
      callback(formatMessage({ id: 'placeholder.warehouse_exist' }));
    } else if((value && !reg.test(value))){
      callback(formatMessage({ id: 'placeholder.lowercase' }));
    } else {
      callback();
    }
  }
  render() {
    const { onCancel, data, form, loading } = this.props;
    const { getFieldDecorator, getValueFormEvent } = form;
    const { language, checking, checkLoading } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
    return (
      <Modal
        title={data ? formatMessage({ id: 'confirmModal.edit.common.image.title' }) : formatMessage({ id: 'confirmModal.add.common.image.title' })}
        visible
        onCancel={onCancel}
        footer={
          <div>
            <Button onClick={onCancel}> {formatMessage({ id: 'button.cancel' })} </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={this.handleSubmit}
            >
              {formatMessage({ id: 'button.confirm' })}
            </Button>
          </div>
        }
      >
        
        <Form onSubmit={this.handleSubmit}>
        <Spin
          spinning={checkLoading}
          tip="正在检测..."
        >
        {!data &&  
          <FormItem {...is_language} label={formatMessage({id:'confirmModal.common.image.lable.name'})}>
            {getFieldDecorator('secret_id', {
              initialValue: data && data.secret_id || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.warehouse_name'}),
                },
                {
                  validator: this.validateSecret
                },
                {
                  max: 32,
                  message: formatMessage({id:'placeholder.max32'}),
                }
              ],
              getValueFromEvent: event => {return event.target.value.replace(/(^\s*)|(\s*$)/g, '');},
            })(<Input placeholder={formatMessage({id:'placeholder.warehouse_name'})} />)}
          </FormItem>
        } 
        {!data && 
          <FormItem {...is_language} label={formatMessage({id:'confirmModal.common.image.lable.domain'})}>
            {getFieldDecorator('domain', {
              initialValue: data && data.domain || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.git_url_domain'}),
                },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'}),
                },
                {
                  pattern: /^(http:\/\/|https:\/\/)/,
                  message: formatMessage({ id: 'placeholder.warehouse_address.Ban' }),
                }
              ],
              getValueFromEvent: event => {return event.target.value.replace(/(^\s*)|(\s*$)/g, '');},
            })(<Input placeholder={formatMessage({id:'placeholder.git_url_domain'})} />)}
          </FormItem>
        }
          <FormItem {...is_language} label={formatMessage({id:'confirmModal.common.image.lable.username'})}>
            {getFieldDecorator('username', {
              initialValue: data && data.username || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.userName'}),
                },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'}),
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.userName'})} />)}
          </FormItem>
          <FormItem {...is_language} label={formatMessage({id:'confirmModal.common.image.lable.password'})}>
            {getFieldDecorator('password', {
              initialValue: data && data.password || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.password_1'}),
                },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'}),
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.password_1'})} type="password" />)}
          </FormItem>
          </Spin>
        </Form>
      </Modal>
    );
  }
}

export default ConfirmModal;
