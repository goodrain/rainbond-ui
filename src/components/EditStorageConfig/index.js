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
  notification,
  Radio,
  Tooltip
} from 'antd';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import CodeMirrorForm from '../../components/CodeMirrorForm';
import cookie from '../../utils/cookie';
import pluginUtil from '../../utils/plugin';

const {
  STORAGE_NAME_ERROR_INVALID,
  STORAGE_NAME_ERROR_TOO_LONG,
  hasDuplicateStorageName,
  hasDuplicateStoragePath,
  validatePluginStorageName
} = require('./storageConfigHelpers');
const {
  selectVolumeAccessMode
} = require('../../pages/Plugin/manageStorageHelpers');

const FormItem = Form.Item;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    const data = props.data || {};
    const volumeOpts = props.volumeOpts || [];
    const volumeType =
      data.volume_type ||
      (volumeOpts[0] && volumeOpts[0].volume_type) ||
      'local-path';
    const volumeOption = volumeOpts.find(
      item => item.volume_type === volumeType
    );
    this.state = {
      language: cookie.get('language') === 'zh-CN',
      volumeCapacityValidation:
        (volumeOption && volumeOption.capacity_validation) || {}
    };
  }

  componentDidUpdate(prevProps) {
    const {
      data = {},
      editor,
      form,
      storageType = data.attr_type || 'storage',
      volumeOpts = []
    } = this.props;
    if (
      storageType !== 'storage' ||
      prevProps.volumeOpts === volumeOpts
    ) {
      return;
    }

    const currentVolumeType = form.getFieldValue('volume_type');
    const selectedVolumeType = editor
      ? data.volume_type || currentVolumeType
      : volumeOpts.some(item => item.volume_type === currentVolumeType)
      ? currentVolumeType
      : volumeOpts[0] && volumeOpts[0].volume_type;
    const selectedOption = volumeOpts.find(
      item => item.volume_type === selectedVolumeType
    );
    const volumeCapacityValidation =
      (selectedOption && selectedOption.capacity_validation) || {};

    this.setState({ volumeCapacityValidation });
    if (!editor && selectedOption) {
      form.setFieldsValue({
        volume_type: selectedVolumeType,
        volume_capacity:
          volumeCapacityValidation.default ||
          form.getFieldValue('volume_capacity') ||
          10
      });
    }
  }

  // eslint-disable-next-line react/sort-comp
  handleSubmit = e => {
    e.preventDefault();
    const {
      form,
      onSubmit,
      data,
      storageType = (data && data.attr_type) || 'storage',
      volumeOpts = []
    } = this.props;
    form.validateFields((err, values) => {
      if (!err && onSubmit) {
        const ismount = pluginUtil.isMountPath(values.volume_path);
        if (ismount) {
          return notification.warning({ message:  formatMessage({id:'notification.warn.mountPath'})});
        }
        values.attr_type = storageType;
        values.storageType = storageType;
        if (storageType === 'storage') {
          const selectedOption = volumeOpts.find(
            item => item.volume_type === values.volume_type
          );
          if (!selectedOption && !this.props.editor) {
            notification.warning({
              message: formatMessage({
                id: 'componentOverview.body.StorageConfig.select_type'
              })
            });
            return;
          }
          values.access_mode = this.props.editor
            ? data.access_mode || 'RWO'
            : selectVolumeAccessMode(selectedOption);
        }
        onSubmit(values, data);
      }
    });
  };
  checkStorageName = (_, value, callback) => {
    const { data, storageList } = this.props;
    const nameError = validatePluginStorageName(value);
    if (nameError === STORAGE_NAME_ERROR_TOO_LONG) {
      callback(
        <FormattedMessage id='componentOverview.body.StorageConfig.Maximum_length'/>
      );
      return;
    }
    if (nameError === STORAGE_NAME_ERROR_INVALID) {
      callback(<FormattedMessage id='componentOverview.body.StorageConfig.only'/>);
      return;
    }
    if (hasDuplicateStorageName(storageList, data, value)) {
      callback(
        <FormattedMessage id='componentOverview.body.StorageConfig.duplicate_name'/>
      );
      return;
    }
    callback();
  };
  checkMountPath = (_, value, callback) => {
    if (value === '' || !value) {
      callback(<FormattedMessage id='componentOverview.body.StorageConfig.path'/>);
      return;
    }

    if (pluginUtil.isMountPath(value)) {
      callback(<FormattedMessage id='componentOverview.body.StorageConfig.change_patnh'/>);
      return;
    }
    if (value && value.length > 100) {
      callback(<FormattedMessage id='componentOverview.body.StorageConfig.max'/>);
      return;
    }
    if (!/^\//g.test(value)) {
      callback(<FormattedMessage id='componentOverview.body.StorageConfig.start'/>);
      return;
    }
    const { data, storageList } = this.props;
    if (hasDuplicateStoragePath(storageList, data, value)) {
      callback(
        <FormattedMessage id='componentOverview.body.StorageConfig.duplicate_path'/>
      );
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
    const { form } = this.props;
    this.setVolumeCapacityValidation(e.target.value, validation => {
      if (validation.default) {
        form.setFieldsValue({ volume_capacity: validation.default });
      }
    });
  };
  setVolumeCapacityValidation = (volume_type, callback) => {
    const { volumeOpts = [] } = this.props;
    const option = volumeOpts.find(item => item.volume_type === volume_type);
    const volumeCapacityValidation =
      (option && option.capacity_validation) || {};
    this.setState({
      volumeCapacityValidation
    }, () => {
      if (callback) {
        callback(volumeCapacityValidation);
      }
    });
  };
  checkVolumeCapacity = (rules, value, callback) => {
    if (value !== undefined && value !== null && value !== '') {
      const { volumeCapacityValidation } = this.state;
      const min = Number(volumeCapacityValidation.min) || 1;
      const max = Number(volumeCapacityValidation.max) || 500;
      const capacity = Number(value);
      if (
        !Number.isFinite(capacity) ||
        !Number.isInteger(capacity) ||
        capacity <= 0 ||
        capacity < min ||
        capacity > max
      ) {
        callback(
          <FormattedMessage
            id='componentOverview.body.StorageConfig.capacity_range'
            values={{ min, max }}
          />
        );
        return;
      }
    }
    callback();
  };
  render() {
    const {
      data = {},
      form: { getFieldDecorator, setFieldsValue },
      storageType = data.attr_type || 'storage',
      volumeOpts = []
    } = this.props;
    const { language, volumeCapacityValidation } = this.state;
    const minimumVolumeCapacity =
      Number(volumeCapacityValidation.min) || 1;
    const maximumVolumeCapacity =
      Number(volumeCapacityValidation.max) || 500;
    const defaultVolumeCapacity =
      data.volume_capacity !== undefined &&
      data.volume_capacity !== null &&
      data.volume_capacity !== ''
        ? data.volume_capacity
        : volumeCapacityValidation.default || 10;
    const defaultVolumeType =
      data.volume_type ||
      (volumeOpts[0] && volumeOpts[0].volume_type) ||
      'local-path';
    const displayVolumeOpts =
      this.props.editor &&
      data.volume_type &&
      !volumeOpts.some(item => item.volume_type === data.volume_type)
        ? [
            {
              volume_type: data.volume_type,
              name_show: data.volume_type,
              description: ''
            },
            ...volumeOpts
          ]
        : volumeOpts;
    const drawerTitleId =
      storageType === 'config-file'
        ? this.props.editor
          ? 'componentOverview.body.StorageConfig.edit_config_file'
          : 'componentOverview.body.StorageConfig.add_config_file'
        : this.props.editor
        ? 'componentOverview.body.StorageConfig.edit_persistent_storage'
        : 'componentOverview.body.StorageConfig.add_persistent_storage';

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
        title={<FormattedMessage id={drawerTitleId}/>}
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
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.StorageConfig.name'/>}>
            {getFieldDecorator('volume_name', {
              initialValue: data.volume_name || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.StorageConfig.input_name'}),
                },
                {
                  validator: this.checkStorageName
                }
              ]
            })(
              <Input
                placeholder={formatMessage({id:'componentOverview.body.StorageConfig.input_name'})}
                disabled={!!this.props.editor}
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.StorageConfig.mount_path'/>}>
            {getFieldDecorator('volume_path', {
              initialValue: data.volume_path || '',
              rules: [
                {
                  required: true,
                  validator: this.checkMountPath
                }
              ]
            })(<Input  placeholder={formatMessage({id:'componentOverview.body.StorageConfig.path'})}/>)}
          </FormItem>
          {storageType === 'storage' && (
            <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.AddVolumes.type'/>}>
              {getFieldDecorator('volume_type', {
                initialValue: defaultVolumeType,
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'componentOverview.body.StorageConfig.select_type'}),
                  }
                ]
              })(
                <Radio.Group onChange={this.handleChange}>
                  {displayVolumeOpts.map(item => (
                    <Radio
                      key={item.volume_type}
                      value={item.volume_type}
                      disabled={!!this.props.editor}
                    >
                      <Tooltip title={item.description || ''}>
                        {language
                          ? item.name_show || item.volume_type
                          : item.volume_type}
                      </Tooltip>
                    </Radio>
                  ))}
                </Radio.Group>
              )}
            </FormItem>
          )}

          {storageType === 'storage' && (
            <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.AddVolumes.volume_capacity'/>}>
              {getFieldDecorator('volume_capacity', {
                initialValue: defaultVolumeCapacity,
                rules: [
                  {
                    required: true,
                    validator: this.checkVolumeCapacity
                  }
                ]
              })(
                <Input
                  type="number"
                  min={minimumVolumeCapacity}
                  max={maximumVolumeCapacity}
                  placeholder={formatMessage({id:'componentOverview.body.AddVolumes.input'})}
                />
              )}
            </FormItem>
          )}

          {storageType === 'config-file' && (
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              formItemLayout={formItemLayout}
              Form={Form}
              style={{ marginBottom: '20px' }}
              getFieldDecorator={getFieldDecorator}
              name="file_content"
              title={<FormattedMessage id='componentOverview.body.StorageConfig.msg'/>}
              label={<FormattedMessage id='componentOverview.body.StorageConfig.content'/>}
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
            <FormattedMessage id='componentOverview.body.StorageConfig.cancel'/>
          </Button>
          <Button
            onClick={this.handleSubmit}
            type="primary"
            loading={!!this.props.loading}
            disabled={
              storageType === 'storage' &&
              !this.props.editor &&
              volumeOpts.length === 0
            }
          >
            <FormattedMessage id='componentOverview.body.StorageConfig.confirm'/>
          </Button>
        </div>
      </Drawer>
    );
  }
}
