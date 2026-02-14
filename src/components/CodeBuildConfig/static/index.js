import React, { PureComponent } from "react";
import { Alert, Form, Radio, Switch } from "antd";
import { FormattedMessage } from 'umi';
import { connect } from "dva";
import cookie from "@/utils/cookie";
import GlobalUtils from '@/utils/global';

const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
  constructor(props) {
    super(props);
  }

  // CNB 构建：纯静态项目无需配置，展示提示 + 文档链接
  renderCNB() {
    const platformUrl = cookie.get("platform_url") || "";
    const docUrl = `${platformUrl}docs/use-manual/component-create/language-support/html/`;
    return (
      <div style={{ padding: '16px 0' }}>
        <Alert
          message="纯静态项目无需配置构建参数，将自动使用 Nginx 托管静态文件。"
          description={
            <span>
              如需了解更多，请参考
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 4 }}
              >
                静态语言部署文档
              </a>
              。
            </span>
          }
          type="info"
          showIcon
        />
      </div>
    );
  }

  // Slug 构建：保留原有配置表单（兼容升级）
  renderSlug() {
    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 4 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 20 } }
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
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.StaticConfig.web"/>}>
          {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || GlobalUtils.getDefaultVsersion(buildSourceArr.web_runtime || []),
          })(
            <RadioGroup>
              {buildSourceArr && buildSourceArr.web_runtime?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                  </Radio>
                );
              })}
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }

  render() {
    const { isSlug } = this.props;
    return isSlug ? this.renderSlug() : this.renderCNB();
  }
}

export default Index;
