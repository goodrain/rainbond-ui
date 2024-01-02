/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../AddOrEditGroup';
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
      dockerRun: 'docker run --name mysql -e MYSQL_ROOT_PASSWORD=Pa88Word -d mysql:5.7.42',
      demoName: 'mysql'
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
    const { form, onSubmit, handleType, archInfo } = this.props;
    const isService = handleType && handleType === 'Service';
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if(!isService){
          fieldsValue.k8s_app = "appDockerDemo"
          fieldsValue.is_demo = true
        }
        if(archInfo && archInfo.length != 2 && archInfo.length != 0){
          fieldsValue.arch = archInfo[0]
        }
        onSubmit(fieldsValue);
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({ id: 'placeholder.nameSpaceReg' }))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
    }
  };
  demoChange = (val) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ service_cname: val, k8s_component_name: val,  docker_cmd: val == "mysql" ? 'docker run --name mysql -e MYSQL_ROOT_PASSWORD=Pa88Word -d mysql:5.7.42' : val == "nginx" ? 'docker run --name nginx -d -p 80:80 nginx:alpine' : 'docker run --name redis -d redis:7.0.11'})
    this.setState({
      dockerRun: val == "mysql" ? 'docker run --name mysql -e MYSQL_ROOT_PASSWORD=Pa88Word -d mysql:5.7.42' : val == "nginx" ? 'docker run --name nginx -d -p 80:80 nginx:alpine' : 'docker run --name redis -d redis:7.0.11',
      demoName: val
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
      isDemo = false,
      archInfo
    } = this.props;
    const { getFieldDecorator } = form;
    const data = this.props.data || {};
    const isService = handleType && handleType === 'Service';
    const { language, dockerRun, demoName } = this.state;
    const is_language = language ? formItemLayout : formItemLayouts;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if(archLegnth == 2){
      arch = 'amd64'
    }else if(archInfo.length == 1){
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.code.selectDemo' })}>
            {getFieldDecorator('type', {
              initialValue: 'mysql',
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Select
                showSearch
                filterOption={(input, option) => 
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onChange={this.demoChange}
                getPopupContainer={triggerNode => triggerNode.parentNode}
              >
                <Option value="mysql">mysql</Option>
                <Option value="nginx">nginx</Option>
                <Option value="redis">redis</Option>
              </Select>
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : language ? "镜像构建示例" : "Source sample application",
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
            })(
              !isService ?
                <Input
                  disabled={true}
                  placeholder={formatMessage({ id: 'placeholder.appName' })}
                />
                :
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'placeholder.appName' })}
                  style={language ? {
                    display: 'inline-block',
                    width: isService ? '' : 270,
                    marginRight: 15
                  } : {
                    display: 'inline-block',
                    width: isService ? '' : 330,
                    marginRight: 15
                  }}
                  disabled={!!isService}
                >
                  {(groups || []).map(group => (
                    <Option key={group.group_id} value={group.group_id}>
                      {group.group_name}
                    </Option>
                  ))}
                </Select>
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: demoName,
              rules: [
                { required: true, message: formatMessage({ id: 'placeholder.service_cname' }) },
                {
                  max: 24,
                  message: formatMessage({ id: 'placeholder.max24' })
                }
              ]
            })(<Input
              disabled={isDemo}
              placeholder={formatMessage({ id: 'placeholder.service_cname' })}
              style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            />)}
          </Form.Item>

          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: demoName,
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input
              disabled={isDemo}
              placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
              style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
            {getFieldDecorator('docker_cmd', {
              initialValue: dockerRun,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.dockerRunMsg' }) }]
            })(
              <TextArea style={{height:80}} placeholder={formatMessage({ id: 'placeholder.dockerRun' })} disabled={isDemo} />
            )}
          </Form.Item>
          {archLegnth == 2 &&
          <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
            {getFieldDecorator('arch', {
              initialValue: arch,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group>
                <Radio value='amd64'>amd64</Radio>
                <Radio value='arm64'>arm64</Radio>
              </Radio.Group>
            )}
          </Form.Item>}
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
                    {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                  </Button>,
                  false
                )
                : !handleType && (
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByDockerrunLoading}
                  >
                    {formatMessage({ id: 'teamAdd.create.btn.create' })}
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
