/* eslint-disable camelcase */
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  message,
  notification,
  Select
} from 'antd';
import React, { Fragment, PureComponent } from 'react';
import pluginUtil from '../../utils/plugin';
import cookie from '../../utils/cookie';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import {
  findVolumeOptionByType,
  resolveVMLiveMigrationAccessMode
} from '../../utils/vmVolumeOptions';


const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    const defaultVolumeType = this.getDefaultVolumeType(props);
    this.state = {
      volumeCapacityValidation: {},
      language: cookie.get('language') === 'zh-CN',
      volume_type: defaultVolumeType,
      volume_path: this.getDevicePathValue(props)
    };
  }
  componentDidMount() {
    this.setVolumeCapacityValidation(this.state.volume_type);
  }
  getDefaultVolumeType = (props = this.props) => {
    const { data = {}, volumeOpts = [] } = props;
    return data.volume_type || (volumeOpts[0] && volumeOpts[0].volume_type) || '';
  };
  getDevicePathValue = (data = {}) => {
    if (data.device_path) {
      return data.device_path;
    }
    if (data.device_type) {
      return `/${data.device_type}`;
    }
    return data.volume_path || '/disk';
  };
  isCDROM = () => this.state.volume_path === '/cdrom';
  // eslint-disable-next-line react/sort-comp
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, volumeOpts = [] } = this.props;
    form.validateFields((err, values) => {
      if (!err && onSubmit) {
        const ismount = pluginUtil.isMountPath(values.volume_path);
        if (ismount) {
          return notification.warning({ message: <FormattedMessage id='notification.warn.mountPath' /> });
        }
        if (values.volume_path === '/cdrom') {
          onSubmit({
            volume_name: values.volume_name,
            volume_path: values.volume_path,
            image: values.image,
            source_kind: 'container_disk',
            device_type: 'cdrom'
          });
          return;
        }
        const selectedOption = findVolumeOptionByType(volumeOpts, values.volume_type);
        values.access_mode = resolveVMLiveMigrationAccessMode(selectedOption);
        onSubmit(values);
      }
    });
  };
  handleVolumePathChange = value => {
    this.setState({
      volume_path: value
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
    const volumeType = e.target ? e.target.value : e;
    this.setState({
      volume_type: volumeType
    });
    this.setVolumeCapacityValidation(volumeType);
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
    const { data = {}, volumeOpts } = this.props;
    const { volumeCapacityValidation, language, volume_type, volume_path } = this.state;
    const isCDROM = volume_path === '/cdrom';
    let defaultVolumeCapacity = '';
    if (data.volume_capacity) {
      defaultVolumeCapacity = data.volume_capacity;
    }
    if (volumeCapacityValidation.default) {
      defaultVolumeCapacity = volumeCapacityValidation.default;
    }
    const initialVolumeCapacity =
      !!this.props.editor && data.volume_capacity === 0
        ? undefined
        : defaultVolumeCapacity;

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
    const enFormItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    };
    const layoutConfig = language ? formItemLayout : enFormItemLayout;
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
          {volumeOpts.length === 0 && !isCDROM ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={formatMessage({ id: 'Vm.createVm.noLiveMigrationStorage' })}
              description={formatMessage({ id: 'Vm.createVm.noLiveMigrationStorageHint' })}
            />
          ) : null}
          <FormItem {...layoutConfig} label={<FormattedMessage id='componentOverview.body.AddVolumes.name' />}>
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
          <FormItem {...layoutConfig} label={<FormattedMessage id='componentOverview.body.AddVolumes.mount_format' />}>
            {getFieldDecorator('volume_path', {
              initialValue: this.getDevicePathValue(data),
              rules: [
                {
                  required: true,
                  validator: this.checkMountPath
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                onChange={this.handleVolumePathChange}
              >
                <Option value="/disk"><FormattedMessage id='componentOverview.body.AddVolumes.disk' /></Option>
                <Option value="/cdrom"><FormattedMessage id='componentOverview.body.AddVolumes.cdrom' /></Option>
              </Select>
            )}
          </FormItem>
          {isCDROM ? (
            <FormItem {...layoutConfig} label={<FormattedMessage id='componentOverview.body.AddVolumes.image' />}>
              {getFieldDecorator('image', {
                initialValue: data.image || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'componentOverview.body.AddVolumes.image_required' })
                  }
                ]
              })(
                <Input placeholder={formatMessage({ id: 'componentOverview.body.AddVolumes.image_placeholder' })} />
              )}
            </FormItem>
          ) : (
            <Fragment>
              <FormItem {...layoutConfig} label={<FormattedMessage id='componentOverview.body.AddVolumes.volume_capacity' />}>
                {getFieldDecorator('volume_capacity', {
                  initialValue: initialVolumeCapacity,
                  rules: [
                    {
                      min: 0,
                      message: formatMessage({ id: 'componentOverview.body.AddVolumes.min' })
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
                        ? formatMessage({ id: 'componentOverview.body.AddVolumes.unlimited' })
                        : formatMessage({ id: 'componentOverview.body.AddVolumes.input' })
                    }
                    min={1}
                  />
                )}
              </FormItem>
              <FormItem
                {...layoutConfig}
                label={formatMessage({ id: 'componentCheck.advanced.setup.storage_setting.label.volume_type' })}
              >
                {getFieldDecorator('volume_type', {
                  initialValue: volume_type,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'Vm.createVm.selectLiveMigrationStorage' })
                    }
                  ]
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder={formatMessage({ id: 'Vm.createVm.selectLiveMigrationStorage' })}
                    onChange={this.handleChange}
                    disabled={!!this.props.editor || volumeOpts.length === 0}
                  >
                    {volumeOpts.map(item => (
                      <Option key={item.volume_type} value={item.volume_type}>
                        {language ? item.name_show : item.volume_type}
                      </Option>
                    ))}
                  </Select>
                )}
              </FormItem>
            </Fragment>
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
            <FormattedMessage id='componentOverview.body.AddVolumes.cancel' />
          </Button>
          <Button onClick={this.handleSubmit} type="primary" disabled={!isCDROM && volumeOpts.length === 0}>
            <FormattedMessage id='componentOverview.body.AddVolumes.confirm' />
          </Button>
        </div>
      </Drawer>
    );
  }
}
