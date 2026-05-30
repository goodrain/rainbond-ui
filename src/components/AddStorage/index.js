import { Button, Drawer, Form, Input, InputNumber, Radio, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import CodeMirrorForm from '../../components/CodeMirrorForm';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@Form.create()
export default class AddVolumes extends PureComponent {
  isVirtualMachine = () => this.props?.appBaseInfo?.service?.extend_method === 'vm';

  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    const { validateFields } = form;

    this.fillVolumeNameFromPath();

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
      callback(<FormattedMessage id='componentOverview.body.tab.AddStorage.limit' />);
      return;
    }
    callback();
  };

  volumePathCheck = (_, value, callback) => {
    if (!value || /\s/.test(value)) {
      callback();
      return;
    }
    if (this.isVirtualMachine()) {
      callback();
      return;
    }
    if (!value.startsWith('/') || value.endsWith('/')) {
      callback(formatMessage({ id: 'componentOverview.body.tab.AddStorage.full_file_path' }));
      return;
    }
    callback();
  };

  getVolumeNameFromPath = value => {
    if (this.isVirtualMachine()) {
      return '';
    }
    if (!value || !value.startsWith('/') || value.endsWith('/')) {
      return '';
    }
    const fileName = value.split('/').filter(Boolean).pop();
    if (!fileName) {
      return '';
    }
    return fileName
      .replace(/[^A-Za-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  };

  fillVolumeNameFromPath = () => {
    const { editor, form } = this.props;
    const { getFieldValue, setFieldsValue } = form;
    if (editor || getFieldValue('volume_name')) {
      return;
    }
    const volumeName = this.getVolumeNameFromPath(getFieldValue('volume_path'));
    if (volumeName) {
      setFieldsValue({ volume_name: volumeName });
    }
  };

  render() {
    const { data, editor, form } = this.props;
    const { getFieldDecorator, setFieldsValue } = form;
    const isVirtualMachine = this.isVirtualMachine();

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
        title={editor ? <FormattedMessage id='componentOverview.body.tab.AddStorage.edit' /> : <FormattedMessage id='componentOverview.body.tab.AddStorage.add' />}
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
          <FormItem {...formItemLayout} label={<FormattedMessage id="componentOverview.body.tab.AddStorage.name" />}>
            {getFieldDecorator('volume_name', {
              initialValue: data.volume_name || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'componentOverview.body.tab.AddStorage.input' })
                },
                {
                  pattern: /^[^\s]*$/,
                  message: formatMessage({ id: 'placeholder.no_spaces' })
                },
                {
                  max: 30,
                  message: formatMessage({ id: 'componentOverview.body.tab.AddStorage.max' })
                }
              ]
            })(
              <Input
                placeholder={formatMessage({ id: 'componentOverview.body.tab.AddStorage.input' })}
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={isVirtualMachine ? '注入文件标识' : <FormattedMessage id="componentOverview.body.tab.AddStorage.path" />}>
            {getFieldDecorator('volume_path', {
              initialValue: data.volume_path || '',
              rules: [
                {
                  required: true,
                  message: isVirtualMachine ? '请输入注入文件标识' : formatMessage({ id: 'componentOverview.body.tab.AddStorage.full_file_path' })
                },
                {
                  pattern: /^[^\s]*$/,
                  message: formatMessage({ id: 'placeholder.no_spaces' })
                },
                {
                  validator: this.volumePathCheck
                },
                {
                  max: 255,
                  message: formatMessage({ id: 'componentOverview.body.tab.AddStorage.Maximum_length' })
                }
              ]
            })(
              <Input
                placeholder={isVirtualMachine ? '例如 /rainbond/env/app.env 或 config/app.env' : formatMessage({ id: 'componentOverview.body.tab.AddStorage.input_path' })}
                onBlur={this.fillVolumeNameFromPath}
              />
            )}
          </FormItem>
          <div style={{ display: 'none' }}>
            <FormItem {...formItemLayout} label={<FormattedMessage id="componentOverview.body.tab.AddStorage.type" />}>
              {getFieldDecorator('volume_type', {
                initialValue: 'config-file',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'componentOverview.body.tab.AddStorage.input_type' })
                  }
                ]
              })(
                <RadioGroup>
                  <Radio value="config-file" disabled={!!this.props.editor}>
                    <Tooltip title={<FormattedMessage id='componentOverview.body.tab.AddStorage.content' />}>
                      <FormattedMessage id='enterpriseColony.import.recognition.tabs.configFiles' />
                    </Tooltip>
                  </Radio>
                </RadioGroup>
              )}
            </FormItem>
          </div>
          <FormItem {...formItemLayout} label={<FormattedMessage id="componentOverview.body.tab.AddStorage.mode" />}>
            {getFieldDecorator('mode', {
              initialValue: data.mode || 777,
              rules: [{ required: true, validator: this.modeCheck }]
            })(<InputNumber min={0} style={{ width: '100%' }} />)}
          </FormItem>
          {isVirtualMachine ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
              message="虚拟机配置文件会作为只读配置盘注入到 guest。这里的标识用于平台区分注入文件，不代表 guest 内固定绝对路径。"
            />
          ) : null}
          <CodeMirrorForm
            setFieldsValue={setFieldsValue}
            formItemLayout={formItemLayout}
            Form={Form}
            style={{ marginBottom: '20px' }}
            getFieldDecorator={getFieldDecorator}
            name="file_content"
            label={<FormattedMessage id="componentOverview.body.tab.AddStorage.Document" />}
            message={<FormattedMessage id="componentOverview.body.tab.AddStorage.edit_content" />}
            data={data.file_content || ''}
          />
          <div
            style={{
              borderTop: '1px solid #e8e8e8',
              padding: '10px 16px',
              textAlign: 'right',
              background: '#fff',
              borderRadius: '0 0 4px 4px',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              zIndex: 99999
            }}
          >
            <Button
              style={{
                marginRight: 8
              }}
              onClick={this.handleCancel}
            >
              <FormattedMessage id='button.cancel' />
            </Button>
            <Button onClick={this.handleSubmit} type="primary">
              <FormattedMessage id='button.determine' />
            </Button>
          </div>
        </Form>
      </Drawer>
    );
  }
}
