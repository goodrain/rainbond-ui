import { Form, Input, Radio, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
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
    const { envs } = this.props;
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
        <Form.Item {...formItemLayout}  label={<FormattedMessage id="componentOverview.body.GoConfig.edition"/>}>
          {getFieldDecorator('BUILD_GOVERSION', {
            initialValue: (envs && envs.BUILD_GOVERSION) || 'go1.20.4'
          })(
            <RadioGroup>
              <Radio value="go1.20.4">go1.20<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="go1.19.9">go1.19</Radio>
              <Radio value="go1.18.10">go1.18</Radio>
              <Radio value="go1.17.13">go1.17</Radio>
              <Radio value="go1.16.15">go1.16</Radio>
              <Radio value="go1.15.15">go1.15</Radio>
              <Radio value="go1.14.15">go1.14</Radio>
              <Radio value="go1.13.15">go1.13</Radio>
              <Radio value="go1.12.17">go1.12</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="GOPROXY"
          help={<FormattedMessage id="componentOverview.body.GoConfig.only"/>}
        >
          {getFieldDecorator('BUILD_GOPROXY', {
            initialValue: (envs && envs.BUILD_GOPROXY) || 'https://goproxy.io',
            rules: [{ type: 'url',  message:formatMessage({id:'componentOverview.body.GoConfig.url'})}]
          })(<Input />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="GOPRIVATE"
        >
          {getFieldDecorator('BUILD_GOPRIVATEY', {
            initialValue: (envs && envs.BUILD_GOPRIVATE) || '',
          })(<Input />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.GoConfig.blocks"/>}
          help={<FormattedMessage id="componentOverview.body.GoConfig.all"/>}
        >
          {getFieldDecorator('BUILD_GO_INSTALL_PACKAGE_SPEC', {
            initialValue: (envs && envs.BUILD_GO_INSTALL_PACKAGE_SPEC) || ''
          })(<Input placeholder="" />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.GoConfig.Start"/>}
          help={<FormattedMessage id="componentOverview.body.GoConfig.Example"/>}
        >
          {getFieldDecorator('BUILD_PROCFILE', {
            initialValue: (envs && envs.BUILD_PROCFILE) || ''
          })(<Input placeholder="" />)}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
