import React, { PureComponent } from 'react';
import { Form, Radio, Switch, Input } from 'antd';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const RadioGroup = Radio.Group;

class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { envs } = this.props;
    let initialJDKType = 'OpenJDK';
    if (envs && envs.BUILD_ENABLE_ORACLEJDK) {
      initialJDKType = 'Jdk';
    }
    this.state = {
      JDKType: initialJDKType,
    };
  }

  onRadioGroupChange = e => {
    this.setState({
      JDKType: e.target.value,
    });
  };

  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 4,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 20,
        },
      },
    };
    const { envs, form } = this.props;
    const { getFieldDecorator } = form;
    const { JDKType } = this.state;
    let initialJDKType = 'OpenJDK';
    if (envs && envs.BUILD_ENABLE_ORACLEJDK) {
      initialJDKType = 'Jdk';
    }
    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.GoConfig.Disable"/>}
          help={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE),
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.JavaJDKConfig.type"/>}
          help={<FormattedMessage id="componentOverview.body.JavaJDKConfig.OpenJDK"/>}
        >
          {getFieldDecorator('JDK_TYPE', {
            initialValue: initialJDKType,
          })(
            <RadioGroup onChange={this.onRadioGroupChange}>
              <Radio value="OpenJDK"><FormattedMessage id="componentOverview.body.JavaJDKConfig.built_in"/></Radio>
              <Radio value="Jdk"><FormattedMessage id="componentOverview.body.JavaJDKConfig.jdk"/></Radio>
            </RadioGroup>
          )}
        </Form.Item>

        {JDKType === 'OpenJDK' && (
          <Form.Item {...formItemLayout}  label={<FormattedMessage id="componentOverview.body.JavaJDKConfig.edition"/>}>
            {getFieldDecorator('BUILD_RUNTIMES', {
              initialValue: (envs && envs.BUILD_RUNTIMES) || '1.8',
            })(
              <RadioGroup>          
                <Radio value="1.9">1.9</Radio>
                <Radio value="1.8">1.8<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
                <Radio value="10">10</Radio>
                <Radio value="11">11</Radio>
                <Radio value="12">12</Radio>
                <Radio value="13">13</Radio>
                <Radio value="14">14</Radio>
                <Radio value="15">15</Radio>
                <Radio value="16">16</Radio>
              </RadioGroup>
            )}
          </Form.Item>
        )}

        {JDKType === 'Jdk' && (
          <Form.Item {...formItemLayout}  label={<FormattedMessage id="componentOverview.body.JavaJDKConfig.path"/>}>
            {getFieldDecorator('BUILD_ORACLEJDK_URL', {
              initialValue: envs && envs.BUILD_ORACLEJDK_URL,
              rules: [{ validator: this.validCustomJDK }],
            })(<Input  placeholder={formatMessage({id:'componentOverview.body.JavaJDKConfig.provide_path'})}/>)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default Index;
