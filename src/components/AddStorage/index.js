import { Button, Drawer, Form, Input, InputNumber, Radio, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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

  modeCheck = (_, value, callback) => {
    if (value && !/^[0-7]{1,3}$/.test(value)) {
      callback('权限的数值限制在0-777之间的8进制数');
      return;
    }
    callback();
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
          overflow: 'auto'
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
                  pattern: /^[^\s]*$/,
                  message: formatMessage({id:'placeholder.no_spaces'})
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
                  pattern: /^[^\s]*$/,
                  message: formatMessage({id:'placeholder.no_spaces'})
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
          <FormItem {...formItemLayout} label="权限">
            {getFieldDecorator('mode', {
              initialValue: data.mode || 777,
              rules: [{ required: true, validator: this.modeCheck }]
            })(<InputNumber min={0} style={{ width: '100%' }} />)}
          </FormItem>
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
        </Form>
        <div
          style={{
            borderTop: '1px solid #e8e8e8',
            padding: '10px 16px',
            textAlign: 'right',
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
