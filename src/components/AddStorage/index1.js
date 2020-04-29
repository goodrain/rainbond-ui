import React, { PureComponent } from "react";
import {
  Form,
  Input,
  Modal,
  Radio,
  Tooltip,
  Drawer,
  Button,
  Row,
  Col,
  Tabs,
  Upload,
  message
} from "antd";
import BraftEditor from "braft-editor";
// 引入编辑器样式
import "braft-editor/dist/index.css";
import 'braft-extensions/dist/code-highlighter.css'
import CodeHighlighter from 'braft-extensions/dist/code-highlighter'

import apiconfig from "../../../config/api.config";
import cookie from "../../utils/cookie";
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;
const TabPane = Tabs.TabPane;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      configurationShow:
        this.props.data &&
        this.props.data.volume_type &&
        this.props.data.volume_type == "config-file"
          ? true
          : false,
      configuration_content: ""
    };
  }

  componentDidMount() {
    BraftEditor.use(CodeHighlighter({
      includeEditors: ['editor-with-code-highlighter'],
    }))
    // 异步设置编辑器内容
    setTimeout(() => {
      this.props.form.setFieldsValue({
        file_content: BraftEditor.createEditorState(
          `<pre><code>${this.props.data && this.props.data.file_content}</code></pre>`
          // this.props.data && this.props.data.file_content
        )
      });
    }, 1000);
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        // const obj = values.file_content.toRAW(true);
        const obj = values.file_content.toHTML();
        console.log('obj',obj)
        values.file_content =
          obj && obj.blocks && obj.blocks.length > 0 && obj.blocks[0].text;
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
  //验证上传文件方式
  checkFile = (rules, value, callback) => {
    if (value) {
      if (
        value.fileList.length > 0 &&
        (value.file.name.endsWith(".txt") ||
          value.file.name.endsWith(".json") ||
          value.file.name.endsWith(".yaml") ||
          value.file.name.endsWith(".yml") ||
          value.file.name.endsWith(".xml"))
      ) {
        const fileList = value.fileList.splice(-1);
        this.readFileContents(fileList, "file_content");
        callback();
        return;
      }
    }
    callback();
  };
  beforeUpload = file => {
    const fileArr = file.name.split(".");
    const length = fileArr.length;
    let isRightType =
      fileArr[length - 1] == "txt" ||
      fileArr[length - 1] == "json" ||
      fileArr[length - 1] == "yaml" ||
      fileArr[length - 1] == "yml" ||
      fileArr[length - 1] == "xml";
    if (!isRightType) {
      message.error("请上传以.txt, .json, .yaml, .yaml, .xml结尾的文件", 5);
      return false;
    } else {
      return true;
    }
  };
  readFileContents = (fileList, name) => {
    const _th = this;
    let fileString = "";
    for (var i = 0; i < fileList.length; i++) {
      var reader = new FileReader(); //新建一个FileReader
      reader.readAsText(fileList[i].originFileObj, "UTF-8"); //读取文件
      reader.onload = function ss(evt) {
        //读取完文件之后会回来这里
        fileString += evt.target.result; // 读取文件内容
        _th.props.form.setFieldsValue({ [name]: fileString });
      };
    }
  };

  callback = key => {
    console.log(key);
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { data, appBaseInfo } = this.props;
    const controls = [
      "bold",
      "italic",
      "underline",
      "text-color",
      "separator",
      "link",
      "bfi-fullscreen"
    ];
    const excludeControls = [
      'fullscreen',
      'screen',
      'hr',
      'text-align'
    ]
    const extendControls = [
      {
        key: 'custom-button',
        type: 'button',
        text: '预览',
        // onClick: this.preview
      }
    ]
    const formItemLayout = {
      labelCol: {
        xs: { span: 7 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 17 },
        sm: { span: 17 }
      }
    };
    let token = cookie.get("token");
    return (
      <Drawer
        title={this.props.editor ? "编辑配置文件" : "添加配置文件"}
        placement="right"
        width={500}
        closable={false}
        onClose={this.handleCancel}
        visible={true}
        maskClosable={false}
        closable={true}
        style={{
          height: "calc(100% - 55px)",
          overflow: "auto",
          paddingBottom: 53
        }}
      >
        <Form onSubmit={this.handleSubmit}>
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
                disabled={this.props.editor ? true : false}
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
                  <Radio
                    value="config-file"
                    disabled={this.props.editor ? true : false}
                  >
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
              validateTrigger: "onBlur",
              rules: [
                {
                  required: true,
                  validator: (_, value, callback) => {
                    if (value.isEmpty()) {
                      callback("请编辑内容!");
                    } else {
                      callback();
                    }
                  }
                }
              ]
            })(
      <div className="editor-container">

              <BraftEditor
              id="editor-with-code-highlighter"
                className="my-editor editor-container"
                style={{border: '1px solid #e8e8e8'}}
                // controls={excludeControls}
                contentStyle={{height: 110, boxShadow: 'inset 0 1px 3px rgba(0,0,0,.1)'}}
                // extendControls={extendControls}
                placeholder="请编辑内容"
              />
            </div>

              // <TextArea rows={8} style={{ backgroundColor: "#02213f", color: "#fff" }} />
            )}
          </FormItem>
          <Row>
            <Col style={{ marginTop: "-7%" }} span={4} offset={9}>
              <FormItem>
                {getFieldDecorator("configuration_check", {
                  rules: [{ validator: this.checkFile }]
                })(
                  <Upload
                    action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                    showUploadList={false}
                    withCredentials={true}
                    headers={{ Authorization: `GRJWT ${token}` }}
                    beforeUpload={this.beforeUpload}
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
