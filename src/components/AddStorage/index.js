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
  notification,
} from 'antd';
import BraftEditor from 'braft-editor';
// 引入编辑器样式
import 'braft-editor/dist/index.css';
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

  componentDidMount() {
    const { data, form } = this.props;
    // 异步设置编辑器内容

      setTimeout(() => {
        form.setFieldsValue({
          file_content: BraftEditor.createEditorState(
            `<pre><code>${(data && data.file_content || '')}</code></pre>`
          ),
        });
      }, 1000);
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const obj = values.file_content.toRAW(true);
        // const obj = values.file_content.toHTML();
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

  handleChanges = info => {
      let fileList = [...info.fileList];
      if (fileList.length > 0) {
        fileList = fileList.slice(-1);
        this.readFileContents(fileList, 'file_content');
    }
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
        // _th.props.form.setFieldsValue({ [name]: fileString });

        _th.props.form.setFieldsValue({
          file_content: BraftEditor.createEditorState(
            `<pre><code>${fileString}</code></pre>`
          ),
        });
      };
    }
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { data } = this.props;
    const controls = ['fullscreen'];

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
        title={this.props.editor ? '编辑配置文件' : '添加配置文件'}
        placement="right"
        width={500}
        closable={false}
        onClose={this.handleCancel}
        visible
        maskClosable={false}
        closable
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
          <FormItem {...formItemLayout} label="配置文件内容">
            <div className="editor-container">
              {getFieldDecorator('file_content', {
                initialValue: data.file_content || undefined,
                validateTrigger: 'onBlur',
                rules: [
                  {
                    required: true,
                    validator: (_, value, callback) => {
                      if (value.isEmpty()) {
                        callback('请填写配置文件内容!');
                      } else {
                        callback();
                      }
                    },
                  },
                ],
              })(
                <BraftEditor
                  id="editor-with-code-highlighter"
                  className="my-editor"
                  style={{ border: '1px solid #e8e8e8' }}
                  contentStyle={{
                    height: 400,
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,.1)',
                  }}
                  controls={controls}
                  extendControls={[
                    {
                      key: 'antd-uploader',
                      type: 'component',
                      component: (
                        <Upload
                          action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                          showUploadList={false}
                          withCredentials
                          headers={{ Authorization: `GRJWT ${token}` }}
                          onChange={this.handleChanges}
                        >
                          <div style={{ cursor: 'pointer',width:'36px',marginTop:'12px',textAlign:'center' }}>上传</div>
                        </Upload>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          </FormItem>
          <Row>
            <Col style={{ marginTop: '-7%' }} span={4} offset={9} />
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
