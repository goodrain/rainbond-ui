/* eslint-disable import/extensions */
/* eslint-disable camelcase */
import MavenConfiguration from '@/components/MavenConfiguration';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/role';
import { Button, Form, Input, Radio, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import JavaJDK from '../java-jdk';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const RadioGroup = Radio.Group;
const { Option } = Select;

@connect(
  ({ enterprise, teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currentEnterprise: enterprise.currentEnterprise
  }),
  null,
  null,
  { withRef: true }
)
class Index extends PureComponent {
  // eslint-disable-next-line constructor-super
  constructor(props) {
    super(props);
    this.state = {
      mavenPermissions: this.handleEventPermissions('maven_setting'),
      mavenVisible: false,
      MavenList: [],
      activeMaven: ''
    };
  }
  componentDidMount() {
    this.fetchMavensettings();
  }

  onCancel = MavenName => {
    this.fetchMavensettings();
    const { setFieldsValue } = this.props.form;
    setFieldsValue({
      BUILD_MAVEN_SETTING_NAME: MavenName || ''
    });
    this.setState({
      mavenVisible: false
    });
  };

  fetchMavensettings = () => {
    const { dispatch, currentEnterprise } = this.props;
    dispatch({
      type: 'appControl/fetchMavensettings',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        enterprise_id: currentEnterprise.enterprise_id,
        onlyname: true
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({ MavenList: res.list });
        }
      }
    });
  };
  handleMavenConfiguration = () => {
    const { getFieldValue } = this.props.form;
    this.setState({
      activeMaven: getFieldValue('BUILD_MAVEN_SETTING_NAME'),
      mavenVisible: true
    });
  };

  handleSubmit = () => {};

  handleEventPermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.queryTeamBasicInfo(currentTeamPermissionsInfo, type);
  };

  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 20
        }
      }
    };
    const { envs, form } = this.props;
    const { getFieldDecorator } = form;
    const {
      mavenVisible,
      MavenList,
      activeMaven,
      mavenPermissions
    } = this.state;
    const envBUILD_MAVEN_SETTING_NAME = envs && envs.BUILD_MAVEN_SETTING_NAME;
    const mavens = MavenList && MavenList.length > 0;

    let Default_BUILD_MAVEN_SETTING_NAME = '';
    if (mavens && envBUILD_MAVEN_SETTING_NAME) {
      MavenList.map(item => {
        if (item.name === envBUILD_MAVEN_SETTING_NAME) {
          Default_BUILD_MAVEN_SETTING_NAME = envBUILD_MAVEN_SETTING_NAME;
        }
      });
    }
    if (mavens && !Default_BUILD_MAVEN_SETTING_NAME) {
      const defaultMaven = MavenList.filter(item => item.is_default);
      if (defaultMaven && defaultMaven.length > 0) {
        Default_BUILD_MAVEN_SETTING_NAME = defaultMaven[0].name;
      } else {
        Default_BUILD_MAVEN_SETTING_NAME = MavenList[0].name;
      }
    }

    return (
      <div>
        <JavaJDK form={form} envs={envs} />
        {mavenVisible && (
          <MavenConfiguration
            activeMaven={activeMaven}
            onCancel={this.onCancel}
            onOk={this.handleSubmit}
          />
        )}
        <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.Maven'/>}>
          {getFieldDecorator('BUILD_RUNTIMES_MAVEN', {
            initialValue: (envs && envs.BUILD_RUNTIMES_MAVEN) || '3.3.9'
          })(
            <RadioGroup>
              <Radio value="3.1.1">3.1.1</Radio>
              <Radio value="3.2.5">3.2.5</Radio>
              <Radio value="3.3.9">3.3.9<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="3.5.4">3.5.4</Radio>
              <Radio value="3.6.3">3.6.3</Radio>
              <Radio value="3.8.8">3.8.8</Radio>
              <Radio value="3.9.1">3.9.1</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.Web'/>}
          help={<FormattedMessage id='componentOverview.body.JavaMavenConfig.War'/>}
        >
          {getFieldDecorator('BUILD_RUNTIMES_SERVER', {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || 'tomcat85'
          })(
            <RadioGroup>
              <Radio value="tomcat85">tomcat85<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="tomcat7">tomcat7</Radio>
              <Radio value="tomcat8">tomcat8</Radio>
              <Radio value="tomcat9">tomcat9</Radio>
              <Radio value="jetty7">jetty7</Radio>
              <Radio value="jetty9">jetty9</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.configure'/>}>
          {getFieldDecorator('BUILD_MAVEN_SETTING_NAME', {
            initialValue: Default_BUILD_MAVEN_SETTING_NAME,
            rules: [
              {
                required: true,
                message: formatMessage({id:'componentOverview.body.JavaMavenConfig.choice'})
              }
            ]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={formatMessage({id:'componentOverview.body.JavaMavenConfig.choice'})}
              style={{ width: '300px', marginRight: '20px' }}
            >
              {MavenList.map(item => {
                const { is_default = false, name } = item;
                return (
                  <Option key={name}>
                    {is_default ? `默认(${name})` : name}
                  </Option>
                );
              })}
            </Select>
          )}
          {mavenPermissions && (
            <Button onClick={this.handleMavenConfiguration} type="primary">
              <FormattedMessage id='componentOverview.body.JavaMavenConfig.Administration'/>
            </Button>
          )}
        </Form.Item>
        {/* <Form.Item
          {...formItemLayout}
          label="禁用Maven Mirror"
          help="禁用Mirror后不再使用goodrain.me内部maven仓库进行缓存镜像"
        >
          {getFieldDecorator("BUILD_MAVEN_MIRROR_DISABLE", {
            initialValue: !!(envs && envs.BUILD_MAVEN_MIRROR_DISABLE)
          })(
            <Switch
              defaultChecked={!!(envs && envs.BUILD_MAVEN_MIRROR_DISABLE)}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="MAVEN MIRROR OF配置">
          {getFieldDecorator("BUILD_MAVEN_MIRROR_OF", {
            initialValue: (envs && envs.BUILD_MAVEN_MIRROR_OF) || "central"
          })(<Input placeholder="" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="MAVEN MIRROR_URL">
          {getFieldDecorator("BUILD_MAVEN_MIRROR_URL", {
            initialValue:
              (envs && envs.BUILD_MAVEN_MIRROR_URL) || "maven.goodrain.me"
          })(<Input placeholder="" />)}
        </Form.Item> */}
        <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.parameter'/>}>
          {getFieldDecorator('BUILD_MAVEN_CUSTOM_OPTS', {
            initialValue:
              (envs && envs.BUILD_MAVEN_CUSTOM_OPTS) || '-DskipTests',
            rules: [
              {
                required: true,
                message: formatMessage({id:'componentOverview.body.JavaMavenConfig.parameters'})
              }
            ]
          })(<Input  placeholder={formatMessage({id:'componentOverview.body.JavaMavenConfig.parameters'})} />)}
        </Form.Item>
        <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.Build_command'/>}>
          {getFieldDecorator('BUILD_MAVEN_CUSTOM_GOALS', {
            initialValue:
              (envs && envs.BUILD_MAVEN_CUSTOM_GOALS) ||
              'clean dependency:list install',
            rules: [
              {
                required: true,
                message: formatMessage({id:'componentOverview.body.JavaMavenConfig.input_parameters'})
              }
            ]
          })(<Input  placeholder={formatMessage({id:'componentOverview.body.JavaMavenConfig.input_parameters'})}/>)}
        </Form.Item>
        <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.configuration'/>}>
          {getFieldDecorator('BUILD_MAVEN_JAVA_OPTS', {
            initialValue: (envs && envs.BUILD_MAVEN_JAVA_OPTS) || '-Xmx1024m',
            rules: [
              {
                required: true,
                message: formatMessage({id:'componentOverview.body.JavaMavenConfig.input_configuration'})
              }
            ]
          })(<Input  placeholder={formatMessage({id:'componentOverview.body.JavaMavenConfig.input_configuration'})}/>)}
        </Form.Item>
        <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.JavaMavenConfig.start'/>}>
          {getFieldDecorator('BUILD_PROCFILE', {
            initialValue: (envs && envs.BUILD_PROCFILE) || '',
            rules: [
              {
                required: true,
                message: formatMessage({id:'componentOverview.body.JavaMavenConfig.input'})
              }
            ]
          })(
            <Input placeholder="web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT ./*.war" />
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
