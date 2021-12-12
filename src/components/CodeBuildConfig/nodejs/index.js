import { Form, Input, Radio, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      webType: '',
      nodeType: '',
      nodeBuildType: ''
    };
  }

  onRadioNodeBuildTypeChange = e => {
    this.setState({
      nodeBuildType: e.target.value
    });
  };

  onRadioNodeTypeChange = e => {
    this.setState({
      nodeType: e.target.value
    });
  };
  onRadioWebTypeChange = e => {
    this.setState({
      webType: e.target.value
    });
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
    const { envs, languageType } = this.props;
    const { webType, nodeType, nodeBuildType } = this.state;
    const { getFieldDecorator } = this.props.form;
    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label="禁用缓存"
          help="开启后下一次构建将移除所有缓存文件，包括编译工具和依赖库"
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE)
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Node版本">
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || '8.12.0'
          })(
            <RadioGroup onChange={this.onRadioNodeTypeChange}>
              <Radio value="8.12.0" selected="selected">
                8.12.0(默认)
              </Radio>
              <Radio value="4.9.1">4.9.1</Radio>
              <Radio value="5.12.0">5.12.0</Radio>
              <Radio value="6.14.4">6.14.4</Radio>
              <Radio value="7.10.1">7.10.1</Radio>
              <Radio value="8.9.3">8.9.3</Radio>
              <Radio value="9.11.2">9.11.2</Radio>
              <Radio value="10.13.0">10.13.0</Radio>
              <Radio value="11.1.0">11.1.0</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item {...formItemLayout} label="BUILD_NODE_ENV">
          {getFieldDecorator('BUILD_NODE_ENV', {
            initialValue: (envs && envs.BUILD_NODE_ENV) || 'production'
          })(<Input placeholder="production" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label="NPM MIRROR_URL"
          help="使用 NPM 进行项目依赖管理时生效"
        >
          {getFieldDecorator('BUILD_NPM_REGISTRY', {
            initialValue:
              (envs && envs.BUILD_NPM_REGISTRY) ||
              'https://registry.npm.taobao.org'
          })(<Input placeholder="https://registry.npm.taobao.org" />)}
        </Form.Item>

        <Form.Item
          help="使用 YARN 进行项目依赖管理时生效"
          {...formItemLayout}
          label="YARN MIRROR_URL"
        >
          {getFieldDecorator('BUILD_YARN_REGISTRY', {
            initialValue:
              (envs && envs.BUILD_YARN_REGISTRY) ||
              'https://registry.npm.taobao.org'
          })(<Input placeholder="https://registry.npm.taobao.org" />)}
        </Form.Item>

        {languageType === 'nodejsstatic' && (
          <Form.Item
            {...formItemLayout}
            label="构建命令"
            help="不指定时根据编译工具类型填充为npm run build 或者 yarn run build"
          >
            {getFieldDecorator('BUILD_NODE_BUILD_CMD', {
              initialValue: envs && envs.BUILD_NODE_BUILD_CMD
            })(<Input />)}
          </Form.Item>
        )}

        {languageType !== 'nodejsstatic' && (
          <Form.Item
            {...formItemLayout}
            label="启动命令"
            help="此处启动命令优先级高于package.json中的scripts.start"
          >
            {getFieldDecorator('BUILD_PROCFILE', {
              initialValue: (envs && envs.BUILD_PROCFILE) || 'node index.js'
            })(<Input placeholder="" />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default Index;
