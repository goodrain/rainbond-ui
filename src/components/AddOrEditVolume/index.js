import React, { PureComponent } from "react";
import { Form, Input, Radio, Tooltip, Drawer, Button, message } from "antd";
import { call } from "redux-saga/effects";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {volumeCapacityValidation:{}};
  }
  componentDidMount = () => {
    const { data } = this.props;
    if (data && data.volume_type){
      this.setVolumeCapacityValidation(data.volume_type)
    }else{
      this.setVolumeCapacityValidation("share-file")
    }
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
    this.setVolumeCapacityValidation(e.target.value)
  };
  setVolumeCapacityValidation = (volume_type) =>{
    const { volumeOpts } = this.props;
    for (let i = 0; i < volumeOpts.length; i++) {
      if (
        volumeOpts[i].volume_type == volume_type &&
        volumeOpts[i].capacity_validation
      ) {
        this.setState({
          volumeCapacityValidation: volumeOpts[i].capacity_validation
        });
      }
    }
  }
  checkVolumeCapacity = (rules, value, callback) => {
    const { volumeCapacityValidation } = this.state
    if (value) {
      if (volumeCapacityValidation.required && value==0){
        callback(`请设置存储配额，不能为0`)
        return 
      }
      if (volumeCapacityValidation.min && value<volumeCapacityValidation.min){
        callback(`限额最小值为${volumeCapacityValidation.min}GB`)
        return 
      }
      if (volumeCapacityValidation.max && value>volumeCapacityValidation.max){
        callback(`限额最大值为${volumeCapacityValidation.min}GB`)
        return
      }
    }
    callback()
  }
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
  render() {
    const { getFieldDecorator } = this.props.form;
    const { data, volumeOpts } = this.props;
    const { volumeCapacityValidation } = this.state
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
      <Drawer
        title={this.props.editor ? "编辑存储" : "添加存储"}
        placement="right"
        width={500}
        closable={false}
        onClose={this.handleCancel}
        visible={true}
        maskClosable={false}
        closable={true}
        style={{
          height: "100%",
          overflow: "auto",
          paddingBottom: 53
        }}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="名称">
            {getFieldDecorator("volume_name", {
              initialValue: data.volume_name || "",
              rules: [
                {
                  required: true,
                  message: "请输入存储名称"
                }
              ]
            })(
              <Input
                placeholder="请输入存储名称"
                disabled={this.props.editor ? true : false}
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="挂载路径">
            {getFieldDecorator("volume_path", {
              initialValue: data.volume_path || "",
              rules: [
                {
                  required: true,
                  message: "请输入挂载路径"
                }
              ]
            })(<Input placeholder="请输入挂载路径" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="存储配额(GB)">
            {getFieldDecorator("volume_capacity", {
              initialValue: data.volume_capacity || volumeCapacityValidation?volumeCapacityValidation.default:0,
              rules: [
                {
                  validator: this.checkVolumeCapacity,
                }
              ]
            })(<Input type="number" disabled={this.props.editor ? true : false} />)}
          </FormItem>
          <FormItem {...formItemLayout} label="类型">
            {getFieldDecorator("volume_type", {
              initialValue: data.volume_type || "share-file",
              rules: [
                {
                  required: true,
                  message: "请选择存储类型"
                }
              ]
            })(
              <RadioGroup onChange={this.handleChange}>
                {volumeOpts.map(item => {
                  return (
                    <Radio
                      key={item.volume_type}
                      value={item.volume_type}
                      disabled={this.props.editor ? true : false}
                    >
                      <Tooltip title={item.description}>
                        {item.name_show}
                      </Tooltip>
                    </Radio>
                  );
                })}
              </RadioGroup>
            )}
          </FormItem>
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
