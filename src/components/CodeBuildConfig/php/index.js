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
            initialValue: (envs && envs.BUILD_RUNTIMES) || '5.6.40'
          })(
            <RadioGroup>
              <Radio value="5.6.40" selected="selected">
              5.6.40<FormattedMessage id='componentOverview.body.GoConfig.default'/>
              </Radio>
              <Radio value="7.3.33">7.3.33</Radio>
              <Radio value="7.4.33">7.4.33</Radio>
              <Radio value="8.0.28">8.0.28</Radio>
              <Radio value="8.1.18">8.1.18</Radio>
              <Radio value="8.2.5">8.2.5</Radio>
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
