import { Button, Drawer, Form, Input, Radio, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import CodeMirrorForm from '../../components/CodeMirrorForm';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@Form.create()
export default class AddVolumes extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    const { validateFields } = form;

    validateFields((err, values) => {
      if (!err && onSubmit) {
        onSubmit(values);
      }
    });
  };
  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  render() {
    const { data, editor, form } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;

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
          paddingBottom: 53
        }}
      >
        <Form onSubmit={this.handleSubmit} labelAlign="left">
          <FormItem {...formItemLayout} label="配置文件名称">
            {getFieldDecorator('volume_name', {
              initialValue: data.volume_name || '',
              rules: [
                {
                  required: true,
                  message: '请输入配置文件名称'
                },
                {
                  max: 30,
                  message: '最大长度30位'
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
            {getFieldDecorator('volume_path', {
              initialValue: data.volume_path || '',
              rules: [
                {
                  required: true,
                  message: '请输入配置文件挂载路径'
                },
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input placeholder="请输入配置文件挂载路径" />)}
          </FormItem>
          <div style={{ display: 'none' }}>
            <FormItem {...formItemLayout} label="类型">
              {getFieldDecorator('volume_type', {
                initialValue: 'config-file',
                rules: [
                  {
                    required: true,
                    message: '请选择存储类型'
                  }
                ]
              })(
                <RadioGroup>
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
            width="452px"
            data={data.file_content || ''}
          />
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
          <Button onClick={this.handleSubmit} type="primary">
            确认
          </Button>
        </div>
      </Drawer>
    );
  }
}
