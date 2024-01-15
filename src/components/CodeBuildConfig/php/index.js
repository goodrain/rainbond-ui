import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Form, Radio, Switch } from 'antd';
import { connect } from 'dva';
import GlobalUtils from '@/utils/global';
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
    const { envs, buildSourceArr } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.GoConfig.Disable" />}
          help={<FormattedMessage id="componentOverview.body.GoConfig.remove" />}
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(
            <Switch
              defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.PHPConfig.web" />}>
          {getFieldDecorator('BUILD_RUNTIMES_SERVER', {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || GlobalUtils.getDefaultVsersion(buildSourceArr.web_runtime || [])
          })(
            <RadioGroup>
              {buildSourceArr && buildSourceArr.web_runtime?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                    {item.first_choice && <FormattedMessage id='componentOverview.body.GoConfig.default' />}
                  </Radio>
                );

              })}
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.PHPConfig.php" />}
          help={<FormattedMessage id="componentOverview.body.PHPConfig.definition" />}
        >
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || GlobalUtils.getDefaultVsersion(buildSourceArr.php || []),
          })(
            <RadioGroup>
              {buildSourceArr && buildSourceArr.php?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                    {item.first_choice && <FormattedMessage id='componentOverview.body.GoConfig.default' />}
                  </Radio>
                );

              })}
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
