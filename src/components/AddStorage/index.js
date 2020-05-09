import { Button, Col, Drawer, Form, Input, Radio, Row, Tooltip, Upload } from 'antd';
// 引入编辑器样式
import 'braft-editor/dist/index.css';
import React, { PureComponent } from "react";
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      configurationShow: !!(
        this.props.data &&
        this.props.data.volume_type &&
        this.props.data.volume_type == "config-file"
      ),
      configuration_content: ""
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSubmit && this.props.onSubmit(values);
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleChange = e => {
    if (e.target.value == "config-file") {
      this.setState({
        configurationShow: true
      });
    } else {
      this.setState({
        configurationShow: false
      });
    }
  };

  handleChangeUpload = info => {
    let fileList = [...info.fileList];
    if (fileList.length > 0) {
      fileList = fileList.slice(-1);
      this.readFileContents(fileList, "file_content");
    }
  };

  readFileContents = (fileList, name) => {
    const _th = this;
    let fileString = "";
    for (let i = 0; i < fileList.length; i++) {
      const reader = new FileReader(); // 新建一个FileReader
      reader.readAsText(fileList[i].originFileObj, "UTF-8"); // 读取文件
      reader.onload = function ss(evt) {
        // 读取完文件之后会回来这里
        fileString += evt.target.result; // 读取文件内容
        // _th.props.form.setFieldsValue({ [name]: fileString });

        _th.props.form.setFieldsValue({
          file_content: fileString
        });
      };
    }
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { data } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      }
    };
    const token = cookie.get("token");
    return (
      <Drawer
        title={this.props.editor ? "编辑配置文件" : "添加配置文件"}
        placement="right"
        width={500}
        closable={false}
        onClose={this.handleCancel}
        visible
        maskClosable={false}
        closable
        style={{
          height: "calc(100% - 55px)",
          overflow: "auto",
          paddingBottom: 53
        }}
      >
        <Form onSubmit={this.handleSubmit} labelAlign="left">
          <FormItem {...formItemLayout} label="配置文件名称">
            {getFieldDecorator("volume_name", {
              initialValue: data.volume_name || "",
              rules: [
                {
                  required: true,
                  message: "请输入配置文件名称"
                }
              ]
            })(
              <Input
                placeholder="请输入配置文件名称"
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="配置文件挂载路径">
            {getFieldDecorator("volume_path", {
              initialValue: data.volume_path || "",
              rules: [
                {
                  required: true,
                  message: "请输入配置文件挂载路径"
                }
              ]
            })(<Input placeholder="请输入配置文件挂载路径" />)}
          </FormItem>
          <div style={{ display: "none" }}>
            <FormItem {...formItemLayout} label="类型">
              {getFieldDecorator("volume_type", {
                initialValue: "config-file",
                rules: [
                  {
                    required: true,
                    message: "请选择存储类型"
                  }
                ]
              })(
                <RadioGroup onChange={this.handleChange}>
                  <Radio value="config-file" disabled={!!this.props.editor}>
                    <Tooltip title="编辑或上传您的配置文件内容">
                      配置文件
                    </Tooltip>
                  </Radio>
                </RadioGroup>
              )}
            </FormItem>
          </div>

          <FormItem
            {...formItemLayout}
            label="配置文件内容"
            style={{ textAlign: "right" }}
          >
            {getFieldDecorator("file_content", {
              initialValue: data.file_content || undefined,
              rules: [{ required: true, message: "请编辑内容!" }]
            })(
              <TextArea
                rows={20}
                style={{ backgroundColor: "#02213f", color: "#fff" }}
              />
            )}
          </FormItem>
          <Row>
            <Col style={{ marginTop: "-7%" }} span={24}>
              <FormItem>
                {getFieldDecorator("configuration_check", {
                })(
                  <Upload
                    action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                    showUploadList={false}
                    withCredentials={true}
                    headers={{ Authorization: `GRJWT ${token}` }}
                    onChange={this.handleChangeUpload}
                  >
                    <Button size="small">上传</Button>
                  </Upload>
                )}
              </FormItem>
            </Col>
          </Row>
        </Form>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            borderTop: "1px solid #e8e8e8",
            padding: "10px 16px",
            textAlign: "right",
            left: 0,
            background: "#fff",
            borderRadius: "0 0 4px 4px"
          }}
        >
          <Button
            style={{
              marginRight: 8
            }}
            onClick={this.handleCancel}
          >
            取消
          </Button>
          <Button onClick={this.handleSubmit} type="primary">
            确认
          </Button>
        </div>
      </Drawer>
    );
  }
}
