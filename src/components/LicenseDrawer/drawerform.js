import React, { Component } from "react";
import {
  Row,
  Col,
  Button,
  Form,
  Input,
  Radio,
  Upload,
} from "antd";
import apiconfig from "../../../config/api.config";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;

class FormDrawer extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }
  render() {
    const {
      getFieldDecorator,
    } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 }
      }
    };
    return (
      <Form>
        <FormItem
          {...formItemLayout}
          label="证书名称"
          style={{ textAlign: "right" }}
        >
          {getFieldDecorator("alias", {
            rules: [
              { required: true, message: "请输入证书名称!" },
              { max: 64, message: "证书名称最大64字符" }
            ]
          })(<Input placeholder="请输入证书名称" />)}
        </FormItem>
        <FormItem {...formItemLayout} label="证书类型">
          {getFieldDecorator("certificate_type", {
            initialValue: "service_key",
            rules: [{ required: true }]
          })(
            <RadioGroup>
              <Radio value="service_key">服务端证书</Radio>
              <Radio value="client_key">客户端证书</Radio>
            </RadioGroup>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          style={{ textAlign: "right" }}
          label="公钥证书"
        >
          {getFieldDecorator("certificate", {
            rules: [{ required: true, message: "请输入证书名称!" }]
          })(
            <TextArea
              rows={8}
              style={{ backgroundColor: "#02213f", color: "#fff" }}
            />
          )}
        </FormItem>
        <Row>
          <Col style={{ marginTop: "-6%" }} span={4} offset={4}>
            <FormItem>
              {getFieldDecorator("public_key_btn", {
                rules: [{ validator: this.checkFile_public }]
              })(
                <Upload
                  action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                  showUploadList={false}
                  withCredentials
                  headers={{
                    Authorization: `GRJWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxOTcsImVtYWlsIjoiMTUzMTA3NzIyMEAxNjMuY29tIiwiZXhwIjoxNTQzOTc3NzkzLCJ1c2VybmFtZSI6IndhbmdjIn0.RTCZIJI8Fsl2rs8a7grhuo_F9DWM77nomMg8dyq8lU8`
                  }}
                >
                  <Button size="small">上传</Button>
                </Upload>
              )}
            </FormItem>
          </Col>
        </Row>
        <FormItem {...formItemLayout} style={{ textAlign: "right" }} label="私钥">
          {getFieldDecorator("private_key", {
            rules: [{ required: true, message: "请输入私钥!" }]
          })(
            <TextArea
              rows={8}
              style={{ backgroundColor: "#02213f", color: "#fff" }}
            />
          )}
        </FormItem>
        <Row>
          <Col style={{ marginTop: "-6%" }} span={4} offset={4}>
            <FormItem>
              {getFieldDecorator("private_key_btn", {
                rules: [{ validator: this.checkFile_private }]
              })(
                <Upload
                  action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                  showUploadList={false}
                  withCredentials
                  headers={{
                    Authorization: `GRJWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxOTcsImVtYWlsIjoiMTUzMTA3NzIyMEAxNjMuY29tIiwiZXhwIjoxNTQzOTc3NzkzLCJ1c2VybmFtZSI6IndhbmdjIn0.RTCZIJI8Fsl2rs8a7grhuo_F9DWM77nomMg8dyq8lU8`
                  }}
                >
                  <Button size="small">上传</Button>
                </Upload>
              )}
            </FormItem>
          </Col>
        </Row>
      </Form>
    );
  }
}

const formDrawer = Form.create()(FormDrawer);

export default formDrawer;
