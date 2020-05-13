import React, { PureComponent } from 'react';
import {
  Form,
  Input,
  Radio,
  Tooltip,
  Drawer,
  Button,
  Row,
  Col,
  Upload,
} from 'antd';
import CodeMirrorForm from '../../components/CodeMirrorForm';

import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      configurationShow: !!(
        this.props.data &&
        this.props.data.volume_type &&
        this.props.data.volume_type == 'config-file'
      ),
      configuration_content: '',
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
    if (e.target.value == 'config-file') {
      this.setState({
        configurationShow: true,
      });
    } else {
      this.setState({
        configurationShow: false,
      });
    }
  };

  handleChangeUpload = info => {
    let fileList = [...info.fileList];
    if (fileList.length > 0) {
      fileList = fileList.slice(-1);
      this.readFileContents(fileList, 'file_content');
    }
  };

  readFileContents = fileList => {
    const th = this;
    let fileString = '';
    for (let i = 0; i < fileList.length; i++) {
      const reader = new FileReader(); // 新建一个FileReader
      reader.readAsText(fileList[i].originFileObj, 'UTF-8'); // 读取文件
      reader.onload = function ss(evt) {
        // 读取完文件之后会回来这里
        fileString += evt.target.result; // 读取文件内容
        th.props.form.setFieldsValue({
          file_content: fileString,
        });
      };
    }
  };

  render() {
    const { data, editor, form } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 },
      },
    };

    const token = cookie.get('token');
    return (
      <Drawer
        title={editor ? '编辑配置文件' : '添加配置文件'}
        placement="right"
        width={500}
        closable={false}
        onClose={this.handleCancel}
        visible
        maskClosable={false}
        style={{
          height: 'calc(100% - 55px)',
          overflow: 'auto',
          paddingBottom: 53,
        }}
      >
        <Form onSubmit={this.handleSubmit} labelAlign="left">
          <FormItem {...formItemLayout} label="配置文件名称">
            {getFieldDecorator('volume_name', {
              initialValue: data.volume_name || '',
              rules: [
                {
                  required: true,
                  message: '请输入配置文件名称',
                },
              ],
            })(
              <Input
                placeholder="请输入配置文件名称"
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="配置文件挂载路径">
            {getFieldDecorator('volume_path', {
              initialValue: data.volume_path || '',
              rules: [
                {
                  required: true,
                  message: '请输入配置文件挂载路径',
                },
              ],
            })(<Input placeholder="请输入配置文件挂载路径" />)}
          </FormItem>
          <div style={{ display: 'none' }}>
            <FormItem {...formItemLayout} label="类型">
              {getFieldDecorator('volume_type', {
                initialValue: 'config-file',
                rules: [
                  {
                    required: true,
                    message: '请选择存储类型',
                  },
                ],
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

          <CodeMirrorForm
            setFieldsValue={setFieldsValue}
            formItemLayout={formItemLayout}
            Form={Form}
            getFieldDecorator={getFieldDecorator}
            name="file_content"
            label="配置文件内容"
            message="请编辑内容"
            width="428px"
            data={data.file_content || ''}
          />

          <Row>
            <Col style={{ marginTop: '-7%' }} span={4} offset={20}>
              <FormItem>
                {getFieldDecorator(
                  'configuration_check',
                  {}
                )(
                  <Upload
                    action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                    showUploadList={false}
                    withCredentials
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
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTop: '1px solid #e8e8e8',
            padding: '10px 16px',
            textAlign: 'right',
            left: 0,
            background: '#fff',
            borderRadius: '0 0 4px 4px',
          }}
        >
          <Button
            style={{
              marginRight: 8,
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
