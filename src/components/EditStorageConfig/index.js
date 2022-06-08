/* eslint-disable no-unused-expressions */
/* eslint-disable no-loop-func */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-constructor */
/* eslint-disable camelcase */
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  notification,
  Radio,
  Tooltip
} from 'antd';
import React, { PureComponent } from 'react';
import CodeMirrorForm from '../../components/CodeMirrorForm';
import pluginUtil from '../../utils/plugin';

const FormItem = Form.Item;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      volumeCapacityValidation: {},
      optionsConfig: false,
      loading: false
    };
  }

  // eslint-disable-next-line react/sort-comp
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, data } = this.props;
    form.validateFields((err, values) => {
      if (!err && onSubmit) {
        this.setState({ loading: true });
        const ismount = pluginUtil.isMountPath(values.volume_path);
        if (ismount) {
          return notification.warning({ message: '挂载路径不可使用' });
        }
        onSubmit(values, data);
      }
    });
  };
  checkMountPath = (_, value, callback) => {
    if (value === '' || !value) {
      callback('请输入挂载路径');
      return;
    }

    if (pluginUtil.isMountPath(value)) {
      callback('挂载路径为系统保留路径，请更换其他路径');
      return;
    }
    if (value && value.length > 100) {
      callback('最大长度100位');
      return;
    }
    if (!/^\//g.test(value)) {
      callback('挂载路径必须以/开头');
      return;
    }
    callback();
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  handleChange = e => {
    e.target.value === 'config-file'
      ? this.setState({
          optionsConfig: true
        })
      : this.setState({
          optionsConfig: false
        });
  };
  setVolumeCapacityValidation = volume_type => {
    const { volumeOpts } = this.props;
    for (let i = 0; i < volumeOpts.length; i++) {
      if (
        volumeOpts[i].volume_type === volume_type &&
        volumeOpts[i].capacity_validation
      ) {
        this.setState({
          volumeCapacityValidation: volumeOpts[i].capacity_validation
        });
      }
    }
  };
  checkVolumeCapacity = (rules, value, callback) => {
    if (value) {
      if (value > 1000) {
        callback(`限额最大值为1000GB`);
        return;
      }
      if (value < 0) {
        callback(`限额最小值为0，即不进行限制`);
        return;
      }
    }
    callback();
  };
  // 验证上传文件方式
  checkFile = (rules, value, callback) => {
    if (value) {
      if (
        value.fileList.length > 0 &&
        (value.file.name.endsWith('.txt') ||
          value.file.name.endsWith('.json') ||
          value.file.name.endsWith('.yaml') ||
          value.file.name.endsWith('.yml') ||
          value.file.name.endsWith('.xml'))
      ) {
        const fileList = value.fileList.splice(-1);
        this.readFileContents(fileList, 'file_content');
        callback();
        return;
      }
    }
    callback();
  };
  beforeUpload = file => {
    const fileArr = file.name.split('.');
    const { length } = fileArr;
    const isRightType =
      fileArr[length - 1] == 'txt' ||
      fileArr[length - 1] == 'json' ||
      fileArr[length - 1] == 'yaml' ||
      fileArr[length - 1] == 'yml' ||
      fileArr[length - 1] == 'xml';
    if (!isRightType) {
      message.error('请上传以.txt, .json, .yaml, .yaml, .xml结尾的文件', 5);
      return false;
    }
    return true;
  };
  readFileContents = (fileList, name) => {
    const _th = this;
    let fileString = '';
    for (let i = 0; i < fileList.length; i++) {
      const reader = new FileReader(); // 新建一个FileReader
      reader.readAsText(fileList[i].originFileObj, 'UTF-8'); // 读取文件
      reader.onload = function ss(evt) {
        // 读取完文件之后会回来这里
        fileString += evt.target.result; // 读取文件内容
        _th.props.form.setFieldsValue({ [name]: fileString });
      };
    }
  };
  render() {
    const {
      data = {},
      form: { getFieldDecorator, setFieldsValue }
    } = this.props;
    // console.log(data, 'data');
    const { volumeCapacityValidation, optionsConfig } = this.state;
    let defaultVolumeCapacity = '';
    if (data.volume_capacity) {
      defaultVolumeCapacity = data.volume_capacity || '';
    }
    if (volumeCapacityValidation.default) {
      defaultVolumeCapacity = volumeCapacityValidation.default || '';
    }

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
        title={this.props.editor ? '编辑存储' : '添加存储'}
        placement="right"
        width={500}
        closable={false}
        onClose={this.handleCancel}
        visible
        maskClosable={false}
        style={{
          height: '100%',
          overflow: 'auto',
          paddingBottom: 53
        }}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="名称">
            {getFieldDecorator('volume_name', {
              initialValue: data.volume_name || '',
              rules: [
                {
                  required: true,
                  message: '请输入存储名称'
                },
                {
                  max: 40,
                  message: '最大长度40位'
                },
                {
                  pattern: /^[a-zA-Z0-9]([-a-zA-Z0-9_]*[a-zA-Z0-9])?$/,
                  message:
                    '只支持字母、数字和-_组合，并且必须以字母数字开始和结束'
                }
              ]
            })(
              <Input
                placeholder="请输入存储名称"
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="挂载路径">
            {getFieldDecorator('volume_path', {
              initialValue: data.volume_path || '',
              rules: [
                {
                  required: true,
                  validator: this.checkMountPath
                }
              ]
            })(<Input placeholder="请输入挂载路径" />)}
          </FormItem>
          {/* <FormItem {...formItemLayout} label="存储配额(GB)">
            {getFieldDecorator('volume_capacity', {
              initialValue: defaultVolumeCapacity,
              rules: [
                {
                  min: 0,
                  message: '最小值为0，即不限制'
                },
                {
                  validator: this.checkVolumeCapacity
                }
              ]
            })(
              <Input
                type="number"
                placeholder={
                  !!this.props.editor && data.volume_capacity === 0
                    ? '不限制'
                    : '请输入存储配额'
                }
                min={1}
                disabled={!!this.props.editor}
              />
            )}
          </FormItem> */}
          {!this.props.editor && (
            <FormItem {...formItemLayout} label="类型">
              {getFieldDecorator('volume_type', {
                initialValue: data.attr_type || 'storage',
                rules: [
                  {
                    required: true,
                    message: '请选择存储类型'
                  }
                ]
              })(
                <Radio.Group onChange={this.handleChange}>
                  <Radio key="1" value="storage" disabled={!!this.props.editor}>
                    <Tooltip title="">共享存储</Tooltip>
                  </Radio>
                  <Radio
                    key="2"
                    value="config-file"
                    disabled={!!this.props.editor}
                  >
                    <Tooltip title="">配置文件</Tooltip>
                  </Radio>
                </Radio.Group>
              )}
            </FormItem>
          )}

          {/* 配置项 */}
          {(optionsConfig || data.attr_type === 'config-file') && (
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              style={{ marginBottom: '20px' }}
              getFieldDecorator={getFieldDecorator}
              name="file_content"
              label="配置文件内容"
              message="请编辑内容"
              data={data.file_content || ''}
            />
          )}
        </Form>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #e8e8e8',
            padding: '10px 16px',
            textAlign: 'right',
            left: 0,
            background: '#fff',
            borderRadius: '0 0 4px 4px'
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
          <Button
            onClick={this.handleSubmit}
            type="primary"
            loading={this.state.loading}
          >
            确认
          </Button>
        </div>
      </Drawer>
    );
  }
}
