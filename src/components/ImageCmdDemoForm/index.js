/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../AddOrEditGroup';
import globalUtil from '../../utils/global';
import role from '../../utils/newRole';
import cookie from '../../utils/cookie';

const { Option } = Select;
const { TextArea } = Input;

const DEMO_CONFIGS = {
  mysql: {
    dockerCmd: 'docker run --name mysql -e MYSQL_ROOT_PASSWORD=Pa88Word -d dockerhub.rainbond.cn/library/mysql:5.7.42',
    name: 'mysql',
    saasDockerCmd: 'docker run --name mysql -e MYSQL_ROOT_PASSWORD=Pa88Word -d registry.cn-hangzhou.aliyuncs.com/goodrain/mysql:5.7.42'
  },
  nginx: {
    dockerCmd: 'docker run --name nginx -d -p 80:80 dockerhub.rainbond.cn/library/nginx:alpine',
    name: 'nginx',
    saasDockerCmd: 'docker run --name nginx -d -p 80:80 registry.cn-hangzhou.aliyuncs.com/goodrain/nginx:alpine'
  },
  redis: {
    dockerCmd: 'docker run --name redis -d dockerhub.rainbond.cn/library/redis:7.0.11',
    name: 'redis',
    saasDockerCmd: 'docker run --name redis -d registry.cn-hangzhou.aliyuncs.com/goodrain/redis:7.0.11'
  }
};

const DEFAULT_ARCH = 'amd64';
const MAX_NAME_LENGTH = 16;
const MAX_SERVICE_NAME_LENGTH = 24;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

@connect(
  ({ global, loading, teamControl }) => ({
    groups: global.groups,
    createAppByDockerrunLoading: loading.effects['createApp/createAppByDockerrun'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
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
    const defaultDemo = DEMO_CONFIGS.mysql;
    this.state = {
      showUsernameAndPass: false,
      addGroup: false,
      language: cookie.get('language') === 'zh-CN',
      dockerRun: defaultDemo.saasDockerCmd,
      demoName: defaultDemo.name,
      creatComPermission: {}
    };
  }

  componentDidMount() {
    const group_id = globalUtil.getAppID();
    if (group_id) {
      this.setState({
        creatComPermission: role.queryPermissionsInfo(
          this.props.currentTeamPermissionsInfo?.team,
          'app_overview',
          `app_${globalUtil.getAppID() || group_id}`
        )
      });
    }
  }

  onAddGroup = () => this.setState({ addGroup: true });

  cancelAddGroup = () => this.setState({ addGroup: false });

  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    role.refreshPermissionsInfo(groupId, false, this.handlePermissionCallback);
    this.cancelAddGroup();
  };

  handlePermissionCallback = (val) => {
    this.setState({ creatComPermission: val });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, handleType, archInfo } = this.props;
    const group_id = globalUtil.getAppID();
    const isService = handleType === 'Service';

    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        // 非服务模式设置示例应用配置
        if (!isService) {
          fieldsValue.k8s_app = 'appDockerDemo';
          fieldsValue.is_demo = !group_id;
        }

        // 处理架构信息
        if (archInfo?.length === 1) {
          fieldsValue.arch = archInfo[0];
        }

        onSubmit(fieldsValue);
      }
    });
  };

  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
    }
    
    if (value.length > MAX_NAME_LENGTH) {
      return callback(new Error(formatMessage({ id: 'placeholder.max16' })));
    }

    const nameSpaceRegex = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (!nameSpaceRegex.test(value)) {
      return callback(new Error(formatMessage({ id: 'placeholder.nameSpaceReg' })));
    }

    callback();
  };

  demoChange = (val) => {
    const { setFieldsValue } = this.props.form;
    const selectedDemo = DEMO_CONFIGS[val] || DEMO_CONFIGS.mysql;

    setFieldsValue({
      service_cname: selectedDemo.name,
      k8s_component_name: selectedDemo.name,
      docker_cmd: selectedDemo.saasDockerCmd
    });

    this.setState({
      dockerRun: selectedDemo.saasDockerCmd,
      demoName: selectedDemo.name
    });
  };

  render() {
    const {
      groups,
      createAppByDockerrunLoading,
      form,
      handleType,
      ButtonGroupState,
      showSubmitBtn = true,
      isDemo = false,
      archInfo = []
    } = this.props;

    const { creatComPermission: { isCreate } } = this.state;
    const { getFieldDecorator } = form;
    const isService = handleType === 'Service';
    const { language, dockerRun, demoName } = this.state;
    const group_id = globalUtil.getAppID();

    const arch = (archInfo?.length === 2 ? DEFAULT_ARCH : archInfo?.[0]) || DEFAULT_ARCH;

    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.code.selectDemo' })}>
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
                {Object.keys(DEMO_CONFIGS).map(key => (
                  <Option key={key} value={key}>{key}</Option>
                ))}
              </Select>
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: group_id ? Number(group_id) : (language ? '镜像构建示例' : 'Source sample application'),
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'placeholder.appName' })}
                disabled={true}
                style={{ width: '100%' }}
              >
                {(groups || []).map(group => (
                  <Option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: demoName,
              rules: [
                { required: true, message: formatMessage({ id: 'placeholder.service_cname' }) },
                { max: MAX_SERVICE_NAME_LENGTH, message: formatMessage({ id: 'placeholder.max24' }) }
              ]
            })(
              <Input
                disabled={isDemo}
                placeholder={formatMessage({ id: 'placeholder.service_cname' })}
                style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              />
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: demoName,
              rules: [{ required: true, validator: this.handleValiateNameSpace }]
            })(
              <Input
                disabled={isDemo}
                placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
                style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              />
            )}
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
            {getFieldDecorator('docker_cmd', {
              initialValue: dockerRun,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.dockerRunMsg' }) }]
            })(
              <TextArea
                style={{ height: 80 }}
                placeholder={formatMessage({ id: 'placeholder.dockerRun' })}
                disabled={isDemo}
              />
            )}
          </Form.Item>

          {archInfo?.length === 2 && (
            <Form.Item {...formItemLayout} label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
              {getFieldDecorator('arch', {
                initialValue: arch,
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
              })(
                <Radio.Group>
                  <Radio value='amd64'>amd64</Radio>
                  <Radio value='arm64'>arm64</Radio>
                </Radio.Group>
              )}
            </Form.Item>
          )}

          {showSubmitBtn && (
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: { span: 24, offset: 0 }
              }}
              label=""
            >
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
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
              </div>
            </Form.Item>
          )}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}
