/* eslint-disable react/jsx-no-target-blank */
import { Button, Form, Input, Modal, Select, Tag } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import configureGlobal from '../../utils/configureGlobal';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import cookie from '../../utils/cookie';

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 15
  }
};
const en_formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 17
  }
};

@connect(
  ({ global, loading }) => ({
    groups: global.groups,
    createAppByCodeLoading: loading.effects['createApp/createAppByCode'],
    rainbondInfo: global.rainbondInfo
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
      language: cookie.get('language') === 'zh-CN' ? true : false,
      addGroup: false,
      demoHref:
        this.props.data.git_url || configureGlobal.documentAddressDefault,
      defaultName: 'demo-2048'
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        fieldsValue.k8s_app="appCodeDemo"
        fieldsValue.is_demo = true
        onSubmit(fieldsValue);
      }
    });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  };

  handleOpenDemo = () => {
    Modal.warning({
      title: formatMessage({ id: 'teamAdd.create.code.demoBtn' }),
      content: (
        <div>
          <Tag color="magenta" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#EA2E96' }}
              href={`${configureGlobal.documentAddress}demo-2048.git`}
            >
              {formatMessage({ id: 'teamAdd.create.code.demoBtn' })}
            </a>
          </Tag>
          <Tag color="green" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#74CC49' }}
              href={`${configureGlobal.documentAddress}static-demo.git`}
            >
              {formatMessage({ id: 'teamAdd.create.code.demoBtn' })}
            </a>
          </Tag>
          <Tag color="volcano" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FA541B' }}
              href={`${configureGlobal.documentAddress}php-demo.git`}
            >
              PHP Demo
            </a>
          </Tag>
          <Tag color="blue" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#1990FF' }}
              href={`${configureGlobal.documentAddress}python-demo.git`}
            >
              Python Demo
            </a>
          </Tag>
          <Tag color="orange" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FA8E14' }}
              href={`${configureGlobal.documentAddress}nodejs-demo.git`}
            >
              Node.js Demo
            </a>
          </Tag>
          <Tag color="gold" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FCAD15' }}
              href={`${configureGlobal.documentAddress}go-demo.git`}
            >
              Golang Demo
            </a>
          </Tag>
          <Tag color="lime" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#A0D912' }}
              href={`${configureGlobal.documentAddress}java-maven-demo.git`}
            >
              Java-Maven Demo
            </a>
          </Tag>
          <Tag color="geekblue" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#3054EB' }}
              href={`${configureGlobal.documentAddress}java-jar-demo.git`}
            >
              Java-Jar Demo
            </a>
          </Tag>
          <Tag color="purple" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#722DD1' }}
              href={`${configureGlobal.documentAddress}java-war-demo.git`}
            >
              Java-War Demo
            </a>
          </Tag>
          <Tag color="volcano" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FA541B' }}
              href={`${configureGlobal.documentAddress}java-gradle-demo.git`}
            >
              Java-Gradle Demo
            </a>
          </Tag>
          <Tag color="gold" style={{ marginBottom: '10px' }}>
            <a
              target="_blank"
              style={{ color: '#FCAD15' }}
              href={`${configureGlobal.documentAddress}dotnet-demo.git`}
            >
              .NetCore Demo
            </a>
          </Tag>
        </div>
      )
    });
  };
  extractRepoName = (url) => {
    const regex = /\/([^/]+)\.git/;
    const matches = regex.exec(url);
    if (matches && matches.length > 1) {
      return matches[1];
    }
    return "demo";
  }

  handleChangeDemo = value => {
    const name = this.extractRepoName(value)
    this.setState({
      demoHref: value,
      defaultName: name
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
          new Error(
            formatMessage({ id: 'placeholder.nameSpaceReg' })
          )
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { groups, createAppByCodeLoading, rainbondInfo, handleType, showCreateGroup, groupId, showSubmitBtn = true, ButtonGroupState, handleServiceBotton } = this.props;
    const data = this.props.data || {};
    const { language, defaultName } = this.state;
    const is_language = language ? formItemLayout : en_formItemLayout;
    const isService = handleType && handleType === 'Service';
    const showCreateGroups =
      showCreateGroup === void 0 ? true : showCreateGroup;
    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...is_language} label={<span>{formatMessage({ id: 'teamAdd.create.code.selectDemo' })}</span>}>
          {getFieldDecorator('git_url', {
            initialValue:
              data.git_url || configureGlobal.documentAddressDefault,
            rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              style={language ? {
                display: 'inline-block',
                width: isService ? 210 : 300,
                marginRight: 15
              } : {
                display: 'inline-block',
                width: isService ? 234 : 340,
                marginRight: 15
              }}
              onChange={this.handleChangeDemo}
            >
              <Option value={`${configureGlobal.documentAddress}demo-2048.git`}>
                {formatMessage({ id: 'teamAdd.create.code.demo2048' })}
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}static-demo.git`}
              >
                {formatMessage({ id: 'teamAdd.create.code.demoStatic' })}
              </Option>
              <Option value={`${configureGlobal.documentAddress}php-demo.git`}>
                PHP Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}python-demo.git`}
              >
                Python Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}nodejs-demo.git`}
              >
                Node.js Demo
              </Option>
              <Option value={`${configureGlobal.documentAddress}go-demo.git`}>
                Golang Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-maven-demo.git`}
              >
                Java-Maven Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-jar-demo.git`}
              >
                Java-Jar Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-war-demo.git`}
              >
                Java-war Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}java-gradle-demo.git`}
              >
                Java-gradle Demo
              </Option>
              <Option
                value={`${configureGlobal.documentAddress}dotnet-demo.git`}
              >
                .NetCore Demo
              </Option>
            </Select>
          )}
          {this.state.demoHref &&
            rainbondUtil.documentPlatform_url(rainbondInfo) && (
              <a
                target="_blank"
                href={this.state.demoHref}
              >
                {formatMessage({ id: 'teamAdd.create.code.href' })}
              </a>
            )}
        </Form.Item>
        <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
          {getFieldDecorator('group_id', {
            initialValue: language ? "源码示例应用" : "Source sample application", 
            rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
          })(
             <Input
             disabled={true}
             placeholder={formatMessage({ id: 'placeholder.appName' })}
           />
          )}
        </Form.Item>
        <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
          {getFieldDecorator('service_cname', {
            initialValue: defaultName,
            rules: [
              { required: true, message: formatMessage({ id: 'placeholder.service_cname' }) },
              {
                max: 24,
                message: formatMessage({ id: 'placeholder.max24' })
              }
            ]
          })(
            <Input
              disabled={true}
              placeholder={formatMessage({ id: 'placeholder.service_cname' })}
            />
          )}
        </Form.Item>
        <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
          {getFieldDecorator('k8s_component_name', {
            initialValue: defaultName,
            rules: [
              {
                required: true,
                validator: this.handleValiateNameSpace
              }
            ]
          })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} disabled={true}/>)}
        </Form.Item>
        <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.code.address'})}>
            {getFieldDecorator('type', {
              initialValue: this.state.demoHref || '',
              force: true,
              rules: [
                { required: true, message: formatMessage({id: 'placeholder.git_url'}) },
              ]
            })(
              <Input
                disabled={true}
                addonBefore={
                <Select
                  disabled={true}
                  defaultValue={'git'}
                  style={{ width: 70 }}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                >
                  <Option value="git">Git</Option>
                  <Option value="svn">Svn</Option>
                  <Option value="oss">OSS</Option>
                </Select>
                }
                placeholder={formatMessage({id: 'placeholder.git_url'})}
              />
            )}
          </Form.Item>
            <Form.Item {...is_language} label={formatMessage({id: 'teamAdd.create.code.versions'})}>
              {getFieldDecorator('uuurl', {
                initialValue: 'master',
                rules: [{ required: true, message: formatMessage({id: 'placeholder.code_version'}) }]
              })(
                <Input
                  disabled={true}
                  addonBefore={
                  <Select
                    disabled={true}
                    defaultValue={'branch'}
                    style={{ width: 70 }}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                  >
                    <Option value="branch">{formatMessage({id: 'teamAdd.create.code.branch'})}</Option>
                    <Option value="tag">Tag</Option>
                  </Select>}
                  placeholder={formatMessage({id: 'placeholder.code_version'})}
                />
              )}
            </Form.Item>
        
        {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: {
                  span: is_language.wrapperCol.span,
                  offset: is_language.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? handleServiceBotton(
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({id: 'teamAdd.create.btn.createComponent'})}
                    </Button>,
                    false
                  )
                : !handleType && (
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByCodeLoading}
                    >
                      {formatMessage({id: 'teamAdd.create.btn.create'})}
                    </Button>
                  )}
            </Form.Item>
          ) : null}
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Form>
    );
  }
}
