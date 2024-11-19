/* eslint-disable camelcase */
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  notification,
  Radio,
  Tooltip,
  Select
} from 'antd';
import React, { PureComponent } from 'react';
import pluginUtil from '../../utils/plugin';
import cookie from '../../utils/cookie';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';


const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { volumeCapacityValidation: {}, language: cookie.get('language') === 'zh-CN' ? true : false };
  }
  componentDidMount = () => {
    const { data } = this.props;
    if (data && data.volume_type) {
      // this.setVolumeCapacityValidation(data.volume_type);
    } else {
      // this.setVolumeCapacityValidation('share-file');
    }
  };
  // eslint-disable-next-line react/sort-comp
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, method } = this.props;
    form.validateFields((err, values) => {
      if (!err && onSubmit) {
        const ismount = pluginUtil.isMountPath(values.volume_path);
        if (ismount) {
          return notification.warning({ message: <FormattedMessage id='notification.warn.mountPath' /> });
        }
        if(method == 'vm'){
          values.volume_type = 'vm-file'
        }
        onSubmit(values);
      }
    });
  };
  checkMountPath = (_, value, callback) => {
    if (value === '' || !value) {
      callback(<FormattedMessage id='componentOverview.body.AddVolumes.callback_null' />);
      return;
    }

    if (pluginUtil.isMountPath(value)) {
      callback(<FormattedMessage id='componentOverview.body.AddVolumes.callback_path' />);
      return;
    }
    if (value && value.length > 100) {
      callback(<FormattedMessage id='componentOverview.body.AddVolumes.callback_max' />);
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
    this.setVolumeCapacityValidation(e.target.value);
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
        callback(`${formatMessage({ id: 'componentOverview.body.AddVolumes.Max' })}`);
        return;
      }
      if (value < 0) {
        callback(`${formatMessage({ id: 'componentOverview.body.AddVolumes.Min' })}`);
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
      message.error(formatMessage({ id: 'notification.error.upload' }), 5);
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
    const { getFieldDecorator } = this.props.form;
    const { data = {}, volumeOpts, method } = this.props;
    const { volumeCapacityValidation, language } = this.state;
    let defaultVolumeCapacity = '';
    if (data.volume_capacity) {
      defaultVolumeCapacity = data.volume_capacity;
    }
    if (volumeCapacityValidation.default) {
      defaultVolumeCapacity = volumeCapacityValidation.default;
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
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout
    return (
      <Drawer
        title={this.props.editor ? <FormattedMessage id='componentOverview.body.AddVolumes.edit' /> : <FormattedMessage id='componentOverview.body.AddVolumes.add' />}
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
          <FormItem {...is_language} label={<FormattedMessage id='componentOverview.body.AddVolumes.name' />}>
            {getFieldDecorator('volume_name', {
              initialValue: data.volume_name || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'componentOverview.body.AddVolumes.required' })

                },
                {
                  max: 40,
                  message: formatMessage({ id: 'componentOverview.body.AddVolumes.max' })
                },
                {
                  pattern: /^[a-zA-Z0-9]([-a-zA-Z0-9_]*[a-zA-Z0-9])?$/,
                  message: formatMessage({ id: 'componentOverview.body.AddVolumes.pattern' })
                }
              ]
            })(
              <Input
                placeholder={formatMessage({ id: 'componentOverview.body.AddVolumes.required' })}
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          {method == 'vm' ? (
            <FormItem {...is_language} label={'挂载格式'}>
              {getFieldDecorator('volume_path', {
                initialValue: data.volume_path || '',
                rules: [
                  {
                    required: true,
                    validator: this.checkMountPath
                  }
                ]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  defaultValue={'/disk'}
                >
                  <Option value="/lun">LUN</Option>
                  <Option value="/disk">磁盘</Option>
                  <Option value="/cdrom">光盘</Option>
                </Select>
              )}
            </FormItem>
          ) : (
            <FormItem {...is_language} label={<FormattedMessage id='componentOverview.body.AddVolumes.volume_path' />}>
              {getFieldDecorator('volume_path', {
                initialValue: data.volume_path || '',
                rules: [
                  {
                    required: true,
                    validator: this.checkMountPath
                  }
                ]
              })(<Input placeholder={formatMessage({ id: 'componentOverview.body.AddVolumes.volume_path_placeholder' })} />)}
            </FormItem>
          )}
          <FormItem {...is_language} label={<FormattedMessage id='componentOverview.body.AddVolumes.volume_capacity' />}>
            {getFieldDecorator('volume_capacity', {
              initialValue: defaultVolumeCapacity || 10,
              rules: [
                {
                  validator: this.checkVolumeCapacity
                }
              ]
            })(
              <Input
                type="number"
                placeholder={
                  !!this.props.editor && data.volume_capacity === 0
                    ? formatMessage({ id: 'componentOverview.body.AddVolumes.unlimited' })
                    : formatMessage({ id: 'componentOverview.body.AddVolumes.input' })
                }
                min={1}
                max={500}
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          {method != 'vm' &&
            <FormItem {...is_language} label={<FormattedMessage id='componentOverview.body.AddVolumes.type' />}>
              {getFieldDecorator('volume_type', {
                initialValue: data.volume_type || "memoryfs",
              })(
                <RadioGroup onChange={this.handleChange}>
                  {volumeOpts.map(item => {
                    return (
                      <Radio
                        key={item.volume_type}
                        value={item.volume_type}
                        disabled={!!this.props.editor}
                      >
                        <Tooltip title={item.description}>
                          {language ? item.name_show : item.volume_type}
                        </Tooltip>
                      </Radio>
                    );
                  })}
                </RadioGroup>
              )}
            </FormItem>
          }
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
            <FormattedMessage id='componentOverview.body.AddVolumes.cancel' />
          </Button>
          <Button onClick={this.handleSubmit} type="primary">
            <FormattedMessage id='componentOverview.body.AddVolumes.confirm' />
          </Button>
        </div>
      </Drawer>
    );
  }
}
