import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { Form, Radio, Switch } from 'antd';
import { connect } from 'dva';
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
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(
            <Switch
              defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout}  label={<FormattedMessage id="componentOverview.body.PHPConfig.web"/>}>
          {getFieldDecorator('BUILD_RUNTIMES_SERVER', {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || 'apache'
          })(
            <RadioGroup>
              <Radio value="apache">apache<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="nginx">nginx</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.PHPConfig.php"/>}
          help={<FormattedMessage id="componentOverview.body.PHPConfig.definition"/>}
        >
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || ''
          })(
            <RadioGroup>
              <Radio value="5.6.35" selected="selected">
                5.6.35<FormattedMessage id='componentOverview.body.GoConfig.default'/>
              </Radio>
              <Radio value="5.5.38">5.5.38</Radio>
              <Radio value="7.0.29">7.0.29</Radio>
              <Radio value="7.1.27">7.1.27</Radio>
              <Radio value="7.2.16">7.2.16</Radio>
              <Radio value="7.3.3">7.3.3</Radio>
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
