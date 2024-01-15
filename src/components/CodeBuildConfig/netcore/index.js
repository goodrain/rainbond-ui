import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { connect } from "dva";
import GlobalUtils from '@/utils/global';
const RadioGroup = Radio.Group;

@connect(null, null, null,
  { withRef: true }
  )
class Index extends PureComponent {
  constructor(props) {
    super(props);
  }

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
          label={<FormattedMessage id="componentOverview.body.GoConfig.Disable"/>}
          help={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}
        >
          {getFieldDecorator("BUILD_NO_CACHE", {
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(
            <Switch
              defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.NetCoreConfig.compile"/>}>
          {getFieldDecorator("BUILD_DOTNET_SDK_VERSION", {
            initialValue:
              (envs && envs.BUILD_DOTNET_SDK_VERSION) || GlobalUtils.getDefaultVsersion(buildSourceArr.net_compiler || [])
          })(
            <RadioGroup>
              {buildSourceArr && buildSourceArr.net_compiler?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                    {item.first_choice && <FormattedMessage id='componentOverview.body.GoConfig.default'/>}
                  </Radio>
                )
              })}
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout}  label={<FormattedMessage id="componentOverview.body.NetCoreConfig.function"/>}>
          {getFieldDecorator("BUILD_DOTNET_RUNTIME_VERSION", {
            initialValue:
              (envs && envs.BUILD_DOTNET_RUNTIME_VERSION) || GlobalUtils.getDefaultVsersion(buildSourceArr.net_runtime || [])
          })(
            <RadioGroup>
              {buildSourceArr && buildSourceArr.net_runtime?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                    {item.first_choice && <FormattedMessage id='componentOverview.body.GoConfig.default'/>}
                  </Radio>
                )
              })}
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
