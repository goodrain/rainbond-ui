import { Form, Input, Radio, Switch } from 'antd';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
          label={<FormattedMessage id="componentOverview.body.GoConfig.Disable"/>}
          help={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE)
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.NodeJSConfig.node"/>}>
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || '8.12.0'
          })(
            <RadioGroup onChange={this.onRadioNodeTypeChange}>
              <Radio value="8.12.0" selected="selected">
                8.12.0<FormattedMessage id='componentOverview.body.GoConfig.default'/>
              </Radio>
              <Radio value="4.9.1">4.9.1</Radio>
              <Radio value="5.12.0">5.12.0</Radio>
              <Radio value="6.14.4">6.14.4</Radio>
              <Radio value="7.10.1">7.10.1</Radio>
              <Radio value="8.9.3">8.9.3</Radio>
              <Radio value="9.11.2">9.11.2</Radio>
              <Radio value="10.13.0">10.13.0</Radio>
              <Radio value="11.1.0">11.1.0</Radio>
              <Radio value="16.15.0">16.15.0</Radio>
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
          help={<FormattedMessage id="componentOverview.body.NodeJSConfig.npm"/>}
        >
          {getFieldDecorator('BUILD_NPM_REGISTRY', {
            initialValue:
              (envs && envs.BUILD_NPM_REGISTRY) ||
              'https://registry.npm.taobao.org'
          })(<Input placeholder="https://registry.npm.taobao.org" />)}
        </Form.Item>

        <Form.Item
          label={<FormattedMessage id="componentOverview.body.NodeJSConfig.yarn"/>}
          {...formItemLayout}
          label="YARN MIRROR_URL"
        >
          {getFieldDecorator('BUILD_YARN_REGISTRY', {
            initialValue:
              (envs && envs.BUILD_YARN_REGISTRY) ||
              'https://registry.npm.taobao.org'
          })(<Input placeholder="https://registry.npm.taobao.org" />)}
        </Form.Item>

        {(languageType === 'nodejsstatic' || languageType === 'NodeJSStatic')&& (
          <Form.Item
            {...formItemLayout}
            label={<FormattedMessage id="componentOverview.body.NodeJSConfig.build"/>}
            help={<FormattedMessage id="componentOverview.body.NodeJSConfig.fill"/>}
          >
            {getFieldDecorator('BUILD_NODE_BUILD_CMD', {
              initialValue: envs && envs.BUILD_NODE_BUILD_CMD
            })(<Input />)}
          </Form.Item>
        )}

        {languageType !== 'nodejsstatic' && languageType !== 'NodeJSStatic' && (
          <Form.Item
            {...formItemLayout}
            label={<FormattedMessage id="componentOverview.body.NodeJSConfig.start"/>}
            help={<FormattedMessage id="componentOverview.body.NodeJSConfig.priority"/>}
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
