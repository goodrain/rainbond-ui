/* eslint-disable camelcase */
import MavenConfiguration from '@/components/MavenConfiguration';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/role';
import { Button, Form, Input, Radio, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import JavaJDK from '../java-jdk';

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
    this.fetchMavensettings(MavenName);
    this.setState({
      mavenVisible: false
    });
  };

  fetchMavensettings = MavenName => {
    const { dispatch, currentEnterprise, form } = this.props;
    const { setFieldsValue } = form;

    dispatch({
      type: 'appControl/fetchMavensettings',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        enterprise_id: currentEnterprise.enterprise_id,
        onlyname: true
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({ MavenList: res.list }, () => {
            setFieldsValue({
              BUILD_MAVEN_SETTING_NAME: MavenName || ''
            });
          });
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
    let isDefault = false;
    const Default_BUILD_MAVEN_SETTING_NAME =
      (envs && envs.BUILD_MAVEN_SETTING_NAME) ||
      (MavenList.length > 0 && MavenList[0].name) ||
      '';

    MavenList.map(item => {
      if (item.name === MavenList) {
        isDefault = true;
      }
    });

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
        <Form.Item {...formItemLayout} label="Maven版本">
          {getFieldDecorator('BUILD_RUNTIMES_MAVEN', {
            initialValue: (envs && envs.BUILD_RUNTIMES_MAVEN) || '3.3.1'
          })(
            <RadioGroup>
              <Radio value="3.3.1">3.3.1(默认)</Radio>
              <Radio value="3.0.5">3.0.5</Radio>
              <Radio value="3.1.1">3.1.1</Radio>
              <Radio value="3.2.5">3.2.5</Radio>
              <Radio value="3.3.9">3.3.9</Radio>
              <Radio value="3.5.4">3.5.4</Radio>
              <Radio value="3.6.2">3.6.2</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="Web服务器版本"
          help="仅适用于打包为War包的项目"
        >
          {getFieldDecorator('BUILD_RUNTIMES_SERVER', {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || 'tomcat85'
          })(
            <RadioGroup>
              <Radio value="tomcat85">tomcat85(默认)</Radio>
              <Radio value="tomcat7">tomcat7</Radio>
              <Radio value="tomcat8">tomcat8</Radio>
              <Radio value="tomcat9">tomcat9</Radio>
              <Radio value="jetty7">jetty7</Radio>
              <Radio value="jetty9">jetty9</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Maven配置">
          {getFieldDecorator('BUILD_MAVEN_SETTING_NAME', {
            initialValue: isDefault && Default_BUILD_MAVEN_SETTING_NAME,
            rules: [
              {
                required: true,
                message: '请选择Maven配置'
              }
            ]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder="请选择Maven配置"
              style={{ width: '300px', marginRight: '20px' }}
            >
              {MavenList.map(item => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Option key={item.name}>{item.name}</Option>
                );
              })}
            </Select>
          )}
          {mavenPermissions && (
            <Button onClick={this.handleMavenConfiguration} type="primary">
              管理Maven配置
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
        <Form.Item {...formItemLayout} label="Maven构建参数">
          {getFieldDecorator('BUILD_MAVEN_CUSTOM_OPTS', {
            initialValue:
              (envs && envs.BUILD_MAVEN_CUSTOM_OPTS) || '-DskipTests',
            rules: [
              {
                required: true,
                message: '请输入Maven构建参数'
              }
            ]
          })(<Input placeholder="请输入Maven构建参数" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Maven构建命令">
          {getFieldDecorator('BUILD_MAVEN_CUSTOM_GOALS', {
            initialValue:
              (envs && envs.BUILD_MAVEN_CUSTOM_GOALS) ||
              'clean dependency:list install',
            rules: [
              {
                required: true,
                message: '请输入Maven构建命令'
              }
            ]
          })(<Input placeholder="请输入Maven构建命令" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="MAVEN构建Java参数配置">
          {getFieldDecorator('BUILD_MAVEN_JAVA_OPTS', {
            initialValue: (envs && envs.BUILD_MAVEN_JAVA_OPTS) || '-Xmx1024m',
            rules: [
              {
                required: true,
                message: '请输入MAVEN构建Java参数配置'
              }
            ]
          })(<Input placeholder="请输入MAVEN构建Java参数配置" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="启动命令">
          {getFieldDecorator('BUILD_PROCFILE', {
            initialValue: (envs && envs.BUILD_PROCFILE) || '',
            rules: [
              {
                required: true,
                message: '请输入启动命令'
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
