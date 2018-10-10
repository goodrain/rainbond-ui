import React, { PureComponent } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { connect } from "dva";
import { Card, Form, Button, Divider, Input, Alert, notification } from "antd";
import DescriptionList from "../../../components/DescriptionList";
import globalUtil from "../../../utils/global";

const { Description } = DescriptionList;
const FormItem = Form.Item;

@connect()
@Form.create()
export default class AutoDeploy extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      display: false,
      status: false,
      support_type: 0,
      url: "",
      custom_url: "",
      secret_key: "",
    };
  }
  componentDidMount() {
    this.getInfo();
  }
  getInfo = () => {
    this.props.dispatch({
      type: "appControl/getAutoDeployStatus",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.app.service.service_alias,
      },
      callback: (data) => {
        this.setState({
          display: data.bean.display,
          status: data.bean.status || false,
          url: data.bean.url,
          custom_url: data.bean.custom_url,
          secret_key: data.bean.secret_key,
          support_type: data.bean.support_type,
        });
        //this.props.form.setFieldsValue({ secret_key: data.bean.secret_key });
      },
    });
  };
  handleCancel = () => {
    this.props.dispatch({
      type: "appControl/cancelAutoDeploy",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.app.service.service_alias,
      },
      callback: () => {
        this.getInfo();
      },
    });
  };
  handleOpen = () => {
    this.props.dispatch({
      type: "appControl/openAutoDeploy",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.app.service.service_alias,
      },
      callback: () => {
        this.getInfo();
      },
    });
  };
  handleScretSubmit = () => {
    this.props.form.validateFields((err, fieldsValue) => {
      if (err) return;
      const secretKey = this.props.form.getFieldValue("secret_key");
      this.props.dispatch({
        type: "appControl/putAutoDeploySecret",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.app.service.service_alias,
          secret_key: secretKey,
        },
        callback: () => {
          notification.success({ message: "更新成功" });
        },
      });
    });
  };
  render() {
    if (!this.state.display) return null;
    const { getFieldDecorator } = this.props.form;
    return (
      <Card
        style={{
          marginBottom: 24,
        }}
        title="自动部署"
      >
        {this.state.status === false && (
          <div>
            <h3>未开启</h3>
          </div>
        )}
        {this.state.status === true && (
          <Card type="inner" title="自动构建触发方式">
            {
              this.state.support_type === 1 && (
                <div>
                  <DescriptionList size="small" style={{ marginBottom: 16 }} title="Git-Webhook" col="1">
                    <Description term="支持类型">Gitlab,Github,Gitee,Gogs</Description>
                    <Description term="Webhook">
                      {this.state.url}{" "}
                      <CopyToClipboard
                        text={this.state.url}
                        onCopy={() => {
                          notification.success({ message: "复制成功" });
                        }}
                      >
                        <Button size="small">复制</Button>
                      </CopyToClipboard>
                    </Description>
                  </DescriptionList>
                  <Alert message="当Commmit信息包含“@deploy”时将自动触发应用自动部署" type="success" />
                  <Divider style={{ margin: "16px 0" }} />
                </div>
              )
            }
            <DescriptionList size="small" style={{ marginBottom: 16 }} title="自定义API" col="1">
              <Description term="API">
                {this.state.custom_url}{" "}
                <CopyToClipboard
                  text={this.state.custom_url}
                  onCopy={() => {
                    notification.success({ message: "复制成功" });
                  }}
                >
                  <Button size="small">复制</Button>
                </CopyToClipboard>
              </Description>
              <Description term="秘钥">
                <FormItem>
                  {getFieldDecorator("secret_key", {
                    initialValue: this.state.secret_key || "",
                    rules: [
                      {
                        required: true,
                        min: 8,
                        message: "秘钥必须大于等于8位",
                      },
                    ],
                  })(<Input style={{ width: 256 }} />)}
                  <Button
                    onClick={this.handleScretSubmit}
                    style={{
                      marginLeft: 10,
                    }}
                    type="primary"
                  >
                    更新
                  </Button>
                </FormItem>
              </Description>
            </DescriptionList>
          </Card>
        )}
        <div
          style={{
            marginTop: 10,
            textAlign: "right",
          }}
        >
          {this.state.status === false && <Button onClick={this.handleOpen}>开启自动部署</Button>}
          {this.state.status === true && <Button onClick={this.handleCancel}>关闭自动部署</Button>}
        </div>
      </Card>
    );
  }
}
