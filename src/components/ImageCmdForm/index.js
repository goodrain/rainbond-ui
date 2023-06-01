/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import cookie from '../../utils/cookie';

const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 14
  }
};
const formItemLayouts = {
  labelCol: {
    span: 10
  },
  wrapperCol: {
    span: 14
  }
};

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
    createAppByDockerrunLoading:
      loading.effects['createApp/createAppByDockerrun']
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showUsernameAndPass: false,
      addGroup: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      dockerRun: 'docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag'
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({id: 'placeholder.k8s_component_name'})));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({id: 'placeholder.nameSpaceReg'}))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({id: 'placeholder.max32'})));
    }
  };
  demoChange = (val)=>{
      this.setState({
        dockerRun: val=="mysql" ? 'docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag' : val=="nginx" ? 'docker run --name some-nginx -v /some/content:/usr/share/nginx/html:ro -d nginx' : 'docker run --name some-redis -d redis'
      })
  }
  render() {
    const {
      groups,
      createAppByDockerrunLoading,
      form,
      groupId,
      handleType,
      ButtonGroupState,
      showSubmitBtn = true,
      showCreateGroup = true,
      isDemo = false
    } = this.props;
    const { getFieldDecorator } = form;
    const data = this.props.data || {};
    const isService = handleType && handleType === 'Service';
    const {language, dockerRun} = this.state;
    const is_language = language ? formItemLayout : formItemLayouts;
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.appName'})}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [{ required: true, message: formatMessage({id: 'placeholder.select'}) }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({id: 'placeholder.appName'})}
                style={ language ? {
                  display: 'inline-block',
                  width: isService ? '' : 250,
                  marginRight: 10
                } : {
                  display: 'inline-block',
                  width: isService ? '' : 264,
                  marginRight: 10
                }}
                disabled={!!isService}
              >
                {(groups || []).map(group => {
                  return (
                    <Option value={group.group_id}>{group.group_name}</Option>
                  );
                })}
              </Select>
            )}
            {isService ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>{formatMessage({id: 'teamApply.createApp'})}</Button>
            ) : null}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.service_cname'})}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                { required: true, message: formatMessage({id: 'placeholder.service_cname'}) },
                {
                  max: 24,
                  message: formatMessage({id: 'placeholder.max24'})
                }
              ]
            })(<Input placeholder={formatMessage({id: 'placeholder.service_cname'})}style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
          </Form.Item>

          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.form.k8s_component_name'})}>
            {getFieldDecorator('k8s_component_name', {
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({id: 'placeholder.k8s_component_name'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.image.docker_cmd'})}>
            {getFieldDecorator('docker_cmd', {
              initialValue: isDemo ? dockerRun : data.docker_cmd || '',
              rules: [{ required: true, message: formatMessage({id: 'placeholder.dockerRunMsg'}) }]
            })(
              <TextArea placeholder={formatMessage({id: 'placeholder.dockerRun'})} disabled={isDemo}/>
            )}
          </Form.Item>
          {isDemo && 
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.demo' })}>
          {getFieldDecorator('type', {
            initialValue: 'mysql',
            rules: [{ required: true, message: formatMessage({id: 'placeholder.code_version'}) }]
          })(
            <Select
            onChange={this.demoChange}
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            <Option value="mysql">mysql</Option>
            <Option value="nginx">nginx</Option>
            <Option value="redis">redis</Option>
          </Select>
          )}
          </Form.Item>
          }
          {!isDemo && <>
            <div style={{ textAlign: 'right', marginTop: '-16px' }}>
          {formatMessage({id: 'teamAdd.create.image.hint1'})}
            <a
              onClick={() => {
                this.setState({ showUsernameAndPass: true });
              }}
              href="javascript:;"
            >
             {formatMessage({id: 'teamAdd.create.image.hint2'})}
            </a>
          </div>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
            {...is_language}
            label={formatMessage({id: 'teamAdd.create.form.user'})}
          >
            {getFieldDecorator('user_name', {
              initialValue: data.user_name || '',
              rules: [{ required: false, message: formatMessage({id: 'placeholder.username_1'}) }]
            })(<Input autoComplete="off" placeholder={formatMessage({id: 'placeholder.username_1'})} style={{textOverflow: 'ellipsis',overflow: 'hidden',whiteSpace: 'nowrap'}}/>)}
          </Form.Item>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
            {...is_language}
            label={formatMessage({id: 'teamAdd.create.form.password'})}
          >
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [{ required: false, message: formatMessage({id: 'placeholder.password_1'}) }]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder={formatMessage({id: 'placeholder.password_1'})}
              />
            )}
          </Form.Item>
          </>
          }
          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? this.props.handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                    >
                      {formatMessage({id: 'teamAdd.create.btn.createComponent'})}
                    </Button>,
                    false
                  )
                : !handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                    >
                     {formatMessage({id: 'teamAdd.create.btn.create'})}
                    </Button>
                  )}
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}
