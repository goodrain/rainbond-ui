import { Form, Input, Radio, Switch } from 'antd';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const RadioGroup = Radio.Group;

@connect(
  ({ loading, teamControl }) => ({
  soundCodeLanguage: teamControl.codeLanguage,
  packageType: teamControl.packageNpmOrYarn
}), null, null, { withRef: true })
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
    const { envs, languageType, soundCodeLanguage, packageType, buildSourceArr } = this.props;
    const { webType, nodeType, nodeBuildType } = this.state;
    const { getFieldDecorator } = this.props.form;
    // 从高级设置进入
    const advanced_setup = JSON.parse(window.sessionStorage.getItem('advanced_setup')) || false;
    return (
      <div>
        {(languageType == 'NodeJSStatic' || languageType == 'nodejsstatic') ? (
          <Form.Item
            {...formItemLayout}
            label={<FormattedMessage id="componentOverview.body.GoConfig.Disable"/>}
            help={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}
          >
            {getFieldDecorator('BUILD_NODE_MODULES_CACHE', {
              initialValue: !!(envs && envs.BUILD_NODE_MODULES_CACHE)
            })(<Switch defaultChecked={!!(envs && envs.BUILD_NODE_MODULES_CACHE)} />)}
            </Form.Item>
          ):(
            <Form.Item
              {...formItemLayout}
              label={<FormattedMessage id="componentOverview.body.GoConfig.Disable"/>}
              help={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}
            >
              {getFieldDecorator('BUILD_NO_CACHE', {
                initialValue: !!(envs && envs.BUILD_NO_CACHE)
              })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
            </Form.Item>
          )}
        
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.NodeJSConfig.node"/>}>
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || GlobalUtils.getDefaultVsersion(buildSourceArr.node || [])
          })(
            <RadioGroup onChange={this.onRadioNodeTypeChange}>
              {buildSourceArr && buildSourceArr.node?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                    {item.first_choice && <FormattedMessage id='componentOverview.body.GoConfig.default'/>}
                  </Radio>
                )
              })}
              {/* <Radio value="20.0.0" selected="selected">20.0.0<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="19.9.0">19.9.0</Radio>
              <Radio value="18.16.0">18.16.0</Radio>
              <Radio value="17.9.1">17.9.1</Radio>
              <Radio value="16.20.0">16.20.0</Radio>
              <Radio value="16.15.0">16.15.0</Radio>
              <Radio value="15.14.0">15.14.0</Radio>
              <Radio value="14.21.3">14.21.3</Radio>
              <Radio value="13.14.0">13.14.0</Radio>
              <Radio value="12.22.12">12.22.12</Radio>
              <Radio value="11.15.0">11.15.0</Radio>
              <Radio value="10.24.1">10.24.1</Radio>
              <Radio value="8.17.0">8.17.0</Radio> */}
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
              'https://registry.npmmirror.com'
          })(<Input placeholder="https://registry.npmmirror.com" />)}
        </Form.Item>

        <Form.Item
          label={<FormattedMessage id="componentOverview.body.NodeJSConfig.yarn"/>}
          {...formItemLayout}
          label="YARN MIRROR_URL"
        >
          {getFieldDecorator('BUILD_YARN_REGISTRY', {
            initialValue:
              (envs && envs.BUILD_YARN_REGISTRY) ||
              'https://registry.npmmirror.com'
          })(<Input placeholder="https://registry.npmmirror.com" />)}
        </Form.Item>
        { ((languageType === 'nodejs' && soundCodeLanguage === 'NodeJSStatic') || (languageType === 'NodeJSStatic')) && 
        <Form.Item
          label={<FormattedMessage id="componentOverview.body.NodeJSConfig.yarn"/>}
          {...formItemLayout}
          label={formatMessage({id:'componentOverview.body.CodeBuildConfig.type'})}
        >
          {getFieldDecorator('BUILD_MODE', {
            initialValue:
              (envs && envs.BUILD_MODE) ||
              'DEFAULT'
          })(<Radio.Group name="radiogroup">
                <Radio value='DEFAULT'>{formatMessage({id:'componentOverview.body.CodeBuildConfig.default'})}</Radio>
                <Radio value='DOCKERFILE'>{formatMessage({id:'componentOverview.body.CodeBuildConfig.dockerfile'})}</Radio>
              </Radio.Group>)}
        </Form.Item>
      }
        {(((languageType === 'nodejsstatic' && advanced_setup != 'advanced') || (languageType === 'NodeJSStatic' && advanced_setup != 'advanced')) || (soundCodeLanguage == 'NodeJSStatic' && advanced_setup == 'advanced')) && (
          <Form.Item
            {...formItemLayout}
            label={<FormattedMessage id="componentOverview.body.NodeJSConfig.build"/>}
            help={<FormattedMessage id="componentOverview.body.NodeJSConfig.fill"/>}
          >
            {getFieldDecorator('BUILD_NODE_BUILD_CMD', {
              initialValue: (envs && envs.BUILD_NODE_BUILD_CMD) || (packageType == 'npm' ? 'npm run build' : 'yarn run build')
            })(<Input />)}
          </Form.Item>
        )}
        
        {(((languageType === 'nodejs' && advanced_setup != 'advanced') || (languageType === 'Node.js' && advanced_setup != 'advanced')) || (soundCodeLanguage == 'Node.js' && advanced_setup == 'advanced')) && (
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
