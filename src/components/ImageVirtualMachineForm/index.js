/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import {
  Button,
  Form,
  Input,
  Select,
  Radio,
  Upload,
  Icon,
  Tooltip,
  notification,
  Switch,
  InputNumber,
  message
} from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import handleAPIError from '../../utils/error';
import VMAssetCatalogModal from '../VMAssetCatalogModal';
import styles from './index.less';
import centOS from '../../../public/images/centos.png';
import ubuntuOS from '../../../public/images/ubuntu.png';
const { mergeRuntimeFormValues, normalizeAssetRuntimeSnapshot } = require('./runtimeFieldMerge');
const { getSelectableVMAssets, isVMAssetSelectable } = require('./assetReadiness');

const { Option } = Select;

const PUBLIC_VM_OPTIONS = [
  {
    key: 'ubuntu-22.04.5-lts',
    vm_url:
      'https://mirrors.tuna.tsinghua.edu.cn/ubuntu-releases/22.04/ubuntu-22.04.5-live-server-amd64.iso',
    image_name: 'ubuntu-22.04.5-lts',
    display_name: 'Ubuntu 22.04.5 LTS',
    icon: ubuntuOS
  },
  {
    key: 'debian-13.4.0-standard',
    vm_url:
      'https://mirrors.tuna.tsinghua.edu.cn/debian-cd/current-live/amd64/iso-hybrid/debian-live-13.4.0-amd64-standard.iso',
    image_name: 'debian-13.4.0-standard',
    display_name: 'Debian 13.4.0 Standard',
    icon_label: 'D'
  },
  {
    key: 'centos-stream-9-dvd1',
    vm_url:
      'https://mirrors.tuna.tsinghua.edu.cn/centos-stream/9-stream/BaseOS/x86_64/iso/CentOS-Stream-9-latest-x86_64-dvd1.iso',
    image_name: 'centos-stream-9-dvd1',
    display_name: 'CentOS Stream 9 DVD1',
    icon: centOS
  }
];

@connect(
  ({ global, loading, user, teamControl }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    rainbondInfo: global.rainbondInfo,
    createAppByVirtualMachineLoading:
      loading.effects['createApp/createAppByVirtualMachine'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    const defaultPublicVm = PUBLIC_VM_OPTIONS[0];
    this.state = {
      radioKey: 'public',
      fileList: [],
      vmShow: false,
      existFileList: [],
      showAdvanced: false,
      vmCapabilities: {
        chunk_upload_supported: false,
        gpu_supported: false,
        usb_supported: false,
        network_modes: ['random'],
        gpu_resources: [],
        usb_resources: [],
        networks: []
      },
      publicVmOptions: PUBLIC_VM_OPTIONS,
      selectedPublicVm: defaultPublicVm,
      comNames: [],
      creatComPermission: {}
    };
    this.appliedTemplateVersionId = null;
  }

  componentWillMount() {
    this.loop = false;
  }

  componentWillUnmount() {
    this.loop = false;
  }

  componentDidMount() {
    this.fetchPipePipeline();
    this.fetchVMCapabilities();
    this.handleJarWarUpload();
    const fixedGroupId = this.getFixedGroupId();
    if (fixedGroupId) {
      this.setState({
        creatComPermission: role.queryPermissionsInfo(
          this.props.currentTeamPermissionsInfo?.team,
          'app_overview',
          `app_${fixedGroupId}`
        )
      });
      this.fetchComponentNames(fixedGroupId);
    }
  }

  getFixedGroupId = () => {
    const { handleType, groupId, data = {} } = this.props;
    const currentAppId = globalUtil.getAppID();
    if (handleType === 'Service' && groupId) {
      return Number(groupId);
    }
    if (currentAppId) {
      return Number(currentAppId);
    }
    if (data.group_id) {
      return Number(data.group_id);
    }
    return undefined;
  };

  getCurrentGroupName = () => {
    const { groups = [] } = this.props;
    const fixedGroupId = this.getFixedGroupId();
    if (!fixedGroupId) {
      return '';
    }
    const target = (groups || []).find(
      item => Number(item.group_id) === Number(fixedGroupId)
    );
    return target ? target.group_name : `${fixedGroupId}`;
  };

  inferSourceFormat = (...candidates) => {
    const knownSuffixes = ['.qcow2', '.img', '.iso', '.tar.gz', '.tar.xz', '.gz', '.xz', '.tar'];
    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = `${candidates[i] || ''}`.toLowerCase();
      for (let j = 0; j < knownSuffixes.length; j += 1) {
        const suffix = knownSuffixes[j];
        if (candidate.endsWith(suffix)) {
          return suffix.slice(1);
        }
      }
    }
    return '';
  };

  handleJarWarUpload = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'createApp/createJarWarServices',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        component_id: ''
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              record: res.bean,
              event_id: res.bean.event_id,
              region_name: res.bean && res.bean.region,
              team_name: res.bean && res.bean.team_name
            },
            () => {
              if (res.bean.region !== '') {
                this.loop = true;
                this.handleJarWarUploadStatus();
              }
            }
          );
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  fetchVMCapabilities = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'createApp/getVMCapabilities',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        const capabilities = (res && res.bean) || this.state.vmCapabilities;
        this.setState({
          vmCapabilities: capabilities
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  handleJarWarUploadStatus = () => {
    const { dispatch } = this.props;
    const { event_id } = this.state;
    dispatch({
      type: 'createApp/createJarWarUploadStatus',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: data => {
        if (data && data.bean.package_name && data.bean.package_name.length > 0) {
          this.setState({
            existFileList: data.bean.package_name
          });
          this.loop = false;
        }
        if (this.loop) {
          setTimeout(() => {
            this.handleJarWarUploadStatus();
          }, 3000);
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  handleJarWarUploadDelete = () => {
    const { event_id } = this.state;
    const { dispatch, form } = this.props;
    dispatch({
      type: 'createApp/deleteJarWarUploadStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: data => {
        if (data.bean.res === 'ok') {
          this.setState({
            existFileList: [],
            fileList: []
          });
          form.setFieldsValue({ packageTarFile: [] });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          });
          this.handleJarWarUpload();
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { event_id, radioKey, existFileList, selectedPublicVm } = this.state;
    const { form, onSubmit, archInfo } = this.props;
    const fixedGroupId = this.getFixedGroupId();

    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if (radioKey === 'upload' && existFileList.length === 0) {
          message.warning(
            formatMessage({ id: 'teamAdd.create.upload.finishBeforeSubmit' })
          );
          return;
        }

        if (archInfo && archInfo.length !== 2 && archInfo.length !== 0) {
          fieldsValue.arch = archInfo[0];
        }

        if (fixedGroupId) {
          fieldsValue.group_id = fixedGroupId;
        }

        if (radioKey === 'public') {
          fieldsValue.vm_url = selectedPublicVm.vm_url;
          fieldsValue.image_name = selectedPublicVm.image_name;
          fieldsValue.source_type = 'public';
          fieldsValue.format = this.inferSourceFormat(
            selectedPublicVm.format,
            selectedPublicVm.vm_url,
            selectedPublicVm.image_name
          );
          fieldsValue.asset_id =
            this.findAssetByName(selectedPublicVm.image_name)?.id || '';
        } else if (radioKey === 'url') {
          fieldsValue.source_type = 'url';
          fieldsValue.format = this.inferSourceFormat(fieldsValue.vm_url, fieldsValue.image_name);
          fieldsValue.asset_id = '';
        } else if (radioKey === 'upload') {
          fieldsValue.source_type = 'upload';
          fieldsValue.format = this.inferSourceFormat(
            (existFileList && existFileList[0]) || '',
            fieldsValue.image_name
          );
          fieldsValue.asset_id = '';
        } else {
          const selectedAsset = this.findAssetByName(fieldsValue.image_name);
          if (selectedAsset && !isVMAssetSelectable(selectedAsset)) {
            message.warning(formatMessage({ id: 'Vm.assetCatalog.useDisabled' }));
            return;
          }
          fieldsValue.source_type = 'existing';
          fieldsValue.format = selectedAsset
            ? this.inferSourceFormat(
              selectedAsset.format,
              selectedAsset.source_uri,
              selectedAsset.image_url,
              selectedAsset.name
            )
            : fieldsValue.format || '';
          fieldsValue.asset_id = selectedAsset
            ? selectedAsset.id
            : fieldsValue.asset_id || '';
        }

        if (!fieldsValue.gpu_enabled) {
          fieldsValue.gpu_resources = [];
          fieldsValue.gpu_count = 0;
        } else {
          fieldsValue.gpu_count = fieldsValue.gpu_count || 1;
        }
        if (!fieldsValue.usb_enabled) {
          fieldsValue.usb_resources = [];
        }
        if (fieldsValue.network_mode !== 'fixed') {
          fieldsValue.network_name = '';
          fieldsValue.fixed_ip = '';
          fieldsValue.gateway = '';
          fieldsValue.dns_servers = '';
        } else if ((this.state.vmCapabilities.networks || []).length === 0) {
          fieldsValue.network_name = '';
          fieldsValue.gateway = '';
          fieldsValue.dns_servers = '';
        }
        fieldsValue.os_family = fieldsValue.os_family || 'linux';

        if (!fieldsValue.group_id) {
          fieldsValue.group_name =
            fieldsValue.group_name || fieldsValue.service_cname;
          fieldsValue.k8s_app =
            fieldsValue.k8s_app ||
            this.generateEnglishName(fieldsValue.group_name || fieldsValue.service_cname);
        }

        onSubmit(fieldsValue, radioKey === 'upload' ? event_id : '');
      }
    });
  };

  handleValidateK8sName = (_, value, callback) => {
    if (!value) {
      return callback(
        new Error(formatMessage({ id: 'placeholder.k8s_component_name' }))
      );
    }
    if (value.length > 16) {
      return callback(new Error(formatMessage({ id: 'placeholder.max16' })));
    }
    const reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (!reg.test(value)) {
      return callback(new Error(formatMessage({ id: 'placeholder.nameSpaceReg' })));
    }
    callback();
  };

  handleChangeImageSource = e => {
    const radioKey = e.target.value;
    const { form } = this.props;
    this.setState({
      radioKey
    });
    form.setFieldsValue({
      imagefrom: radioKey,
      asset_id: ''
    });
  };

  openAssetCatalog = () => {
    const { onOpenAssetCatalog } = this.props;
    if (onOpenAssetCatalog) {
      onOpenAssetCatalog();
    }
  };

  closeAssetCatalog = () => {
    const { onCloseAssetCatalog } = this.props;
    if (onCloseAssetCatalog) {
      onCloseAssetCatalog();
    }
  };

  findAssetByName = name => {
    const { virtualMachineImage = [] } = this.props;
    return (virtualMachineImage || []).find(item => item.name === name);
  };

  getAssetSourceLabel = sourceType => {
    const sourceMap = {
      public: 'Vm.createVm.public',
      url: 'Vm.createVm.add',
      upload: 'Vm.createVm.upload',
      existing: 'Vm.createVm.have',
      clone: 'Vm.createVm.clone'
    };
    return formatMessage({
      id: sourceMap[sourceType] || 'Vm.assetCatalog.sourceUnknown'
    });
  };

  renderAssetOptionLabel = asset => {
    return `${asset.display_name || asset.name}`;
  };

  handleUseAsset = asset => {
    const { form } = this.props;
    if (!isVMAssetSelectable(asset)) {
      message.warning(formatMessage({ id: 'Vm.assetCatalog.useDisabled' }));
      return;
    }
    const runtimeSnapshot =
      asset && asset.extra && asset.extra.runtime_snapshot
        ? asset.extra.runtime_snapshot
        : {};
    const sanitizedRuntimeSnapshot = normalizeAssetRuntimeSnapshot({
      asset,
      runtimeSnapshot
    });
    const guestOSFamily = this.inferGuestOSFamily(sanitizedRuntimeSnapshot, asset);
    this.setState(
      {
        radioKey: 'existing'
      },
      () => {
        const mergedRuntimeValues = mergeRuntimeFormValues({
          form,
          currentValues: form.getFieldsValue([
            'os_family',
            'network_mode',
            'network_name',
            'fixed_ip',
            'gateway',
            'dns_servers'
          ]),
          incomingValues: {
            os_family: guestOSFamily,
            network_mode: sanitizedRuntimeSnapshot.network_mode || 'random',
            network_name: sanitizedRuntimeSnapshot.network_name || undefined,
            fixed_ip: sanitizedRuntimeSnapshot.fixed_ip || undefined,
            gateway: sanitizedRuntimeSnapshot.gateway || undefined,
            dns_servers: sanitizedRuntimeSnapshot.dns_servers || undefined
          }
        });
        form.setFieldsValue({
          imagefrom: 'existing',
          image_name: asset.name,
          asset_id: asset.id,
          ...mergedRuntimeValues,
          boot_mode: sanitizedRuntimeSnapshot.boot_mode || undefined,
          gpu_enabled: !!sanitizedRuntimeSnapshot.gpu_enabled,
          gpu_resources: sanitizedRuntimeSnapshot.gpu_resources || [],
          gpu_count: sanitizedRuntimeSnapshot.gpu_count || 1,
          usb_enabled: !!sanitizedRuntimeSnapshot.usb_enabled,
          usb_resources: sanitizedRuntimeSnapshot.usb_resources || []
        });
        this.closeAssetCatalog();
      }
    );
  };

  inferGuestOSFamily = (runtimeSnapshot = {}, source = {}) => {
    const explicit = String(runtimeSnapshot.os_family || source.os_family || '').toLowerCase();
    if (explicit === 'windows' || explicit === 'linux') {
      return explicit;
    }
    const osHint = String(
      runtimeSnapshot.os_name ||
      source.os_name ||
      source.name ||
      ''
    ).toLowerCase();
    if (osHint.indexOf('windows') > -1) {
      return 'windows';
    }
    return 'linux';
  };

  handleDeleteAsset = asset => {
    const { dispatch, onRefreshAssets } = this.props;
    return new Promise((resolve, reject) => {
      dispatch({
        type: 'createApp/deleteVMAsset',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          asset_id: asset.id
        },
        callback: data => {
          notification.success({
            message: formatMessage({ id: 'notification.success.delete' })
          });
          if (onRefreshAssets) {
            onRefreshAssets();
          }
          resolve(data);
        },
        handleError: err => {
          handleAPIError(err);
          reject(err);
        }
      });
    });
  };

  validateRuntimeResources = (enabledField, messageId) => (_, value, callback) => {
    if (!this.props.form.getFieldValue(enabledField)) {
      callback();
      return;
    }
    if (value && value.length > 0) {
      callback();
      return;
    }
    callback(new Error(formatMessage({ id: messageId })));
  };

  validateGPUCount = (_, value, callback) => {
    const { form } = this.props;
    if (!form.getFieldValue('gpu_enabled')) {
      callback();
      return;
    }
    const gpuResources = form.getFieldValue('gpu_resources') || [];
    const gpuCount = Number(value);
    if (!gpuCount || gpuCount < 1) {
      callback(new Error(formatMessage({ id: 'Vm.createVm.gpuCountRequired' })));
      return;
    }
    if (gpuCount > 1 && gpuResources.length > 1) {
      callback(
        new Error(formatMessage({ id: 'Vm.createVm.gpuCountSingleResourceOnly' }))
      );
      return;
    }
    callback();
  };

  onChangeUpload = info => {
    let { fileList } = info;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    this.setState({ fileList });
  };

  onRemove = () => {
    this.setState({ fileList: [] });
  };

  fetchPipePipeline = () => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list) {
          res.list.forEach(item => {
            if (item.name === 'rainbond-vm') {
              this.setState({
                vmShow: true
              });
            }
          });
        }
      }
    });
  };

  handleSelectPublicVm = item => {
    this.setState({
      selectedPublicVm: item
    });
  };

  fetchComponentNames = group_id => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: role.queryPermissionsInfo(
        this.props.currentTeamPermissionsInfo?.team,
        'app_overview',
        `app_${group_id}`
      )
    });
    dispatch({
      type: 'appControl/getComponentNames',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            comNames:
              res.bean.component_names && res.bean.component_names.length > 0
                ? res.bean.component_names
                : []
          });
        }
      }
    });
  };

  generateEnglishName = name => {
    if (name === undefined || name === null || name === '') {
      return '';
    }
    const { comNames } = this.state;
    const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    const cleanedPinyinName = pinyinName.toLowerCase();
    if (comNames && comNames.length > 0) {
      const isExist = comNames.some(item => item === cleanedPinyinName);
      if (isExist) {
        const random = Math.floor(Math.random() * 10000);
        return `${cleanedPinyinName}${random}`;
      }
    }
    return cleanedPinyinName;
  };

  renderFileList = () => {
    const { existFileList } = this.state;
    if (existFileList.length === 0) {
      return (
        <div className={styles.emptyState}>
          {formatMessage({ id: 'teamAdd.create.null_data' })}
        </div>
      );
    }
    return (
      <div className={styles.fileList}>
        {existFileList.map(item => (
          <div key={item} className={styles.fileCard}>
            <div className={styles.fileMain}>
              <Icon type="inbox" className={styles.fileIcon} />
              <div className={styles.fileMeta}>
                <div className={styles.fileName}>{item}</div>
                <div className={styles.fileHint}>
                  {formatMessage({ id: 'Vm.createVm.uploadSuccessHint' })}
                </div>
              </div>
            </div>
            <Button
              type="link"
              className={styles.fileDelete}
              onClick={this.handleJarWarUploadDelete}
            >
              {formatMessage({ id: 'Vm.assetCatalog.delete' })}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  renderPublicVmCards = () => {
    const { publicVmOptions, selectedPublicVm } = this.state;
    return (
      <div className={styles.publicVmGrid}>
        {publicVmOptions.map(item => {
          const active = selectedPublicVm.image_name === item.image_name;
          return (
            <div
              key={item.key}
              className={`${styles.publicVmCard} ${
                active ? styles.publicVmCardActive : ''
              }`}
              onClick={() => this.handleSelectPublicVm(item)}
            >
              <div className={styles.publicVmCardIconWrap}>
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt={item.display_name || item.image_name}
                    className={styles.publicVmCardIcon}
                  />
                ) : (
                  <span className={styles.publicVmCardFallbackIcon}>
                    {item.icon_label || item.image_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.publicVmCardName}>
                {item.display_name || item.image_name}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  renderSourceFields = () => {
    const { form, virtualMachineImage = [] } = this.props;
    const { getFieldDecorator } = form;
    const { radioKey } = this.state;
    const selectableVirtualMachineImages = getSelectableVMAssets(virtualMachineImage);

    if (radioKey === 'public') {
      return this.renderPublicVmCards();
    }

    if (radioKey === 'url') {
      return (
        <Fragment>
          <Form.Item
            label={formatMessage({ id: 'Vm.createVm.install' })}
            extra={formatMessage({ id: 'Vm.createVm.packageInstall' })}
          >
            {getFieldDecorator('vm_url', {
              rules: [{ required: true, message: formatMessage({ id: 'Vm.createVm.InputInstall' }) }]
            })(
              <Input
                placeholder={formatMessage({ id: 'Vm.createVm.InputInstall' })}
              />
            )}
          </Form.Item>
          <Form.Item label={formatMessage({ id: 'Vm.createVm.imgName' })}>
            {getFieldDecorator('image_name', {
              rules: [{ required: true, message: formatMessage({ id: 'Vm.createVm.inputName' }) }]
            })(
              <Input placeholder={formatMessage({ id: 'Vm.createVm.saveName' })} />
            )}
          </Form.Item>
        </Fragment>
      );
    }

    if (radioKey === 'upload') {
      return (
        <Fragment>
          <Form.Item
            label={formatMessage({ id: 'Vm.createVm.imgUpload' })}
            extra={formatMessage({ id: 'Vm.createVm.package' })}
          >
            {getFieldDecorator('packageTarFile', { initialValue: [] })(
              <div className={styles.uploadPanel}>
                <Upload
                  fileList={this.state.fileList}
                  name="packageTarFile"
                  onChange={this.onChangeUpload}
                  onRemove={this.onRemove}
                  action={this.state.record && this.state.record.upload_url}
                  maxCount={1}
                  multiple={false}
                >
                  <Button>
                    <Icon type="upload" />
                    {formatMessage({ id: 'Vm.createVm.imgUpload' })}
                  </Button>
                </Upload>
              </div>
            )}
          </Form.Item>
          <Form.Item label={formatMessage({ id: 'teamAdd.create.fileList' })}>
            {this.renderFileList()}
          </Form.Item>
          <Form.Item label={formatMessage({ id: 'Vm.createVm.imgName' })}>
            {getFieldDecorator('image_name', {
              rules: [{ required: true, message: formatMessage({ id: 'Vm.createVm.inputName' }) }]
            })(
              <Input placeholder={formatMessage({ id: 'Vm.createVm.saveName' })} />
            )}
          </Form.Item>
        </Fragment>
      );
    }

    return (
      <Fragment>
        <Form.Item label={formatMessage({ id: 'Vm.createVm.img' })}>
          {getFieldDecorator('image_name', {
            rules: [{ required: true, message: formatMessage({ id: 'Vm.createVm.selectImg' }) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={formatMessage({ id: 'Vm.createVm.selectImg' })}
            >
              {selectableVirtualMachineImages.map(image => (
                <Option key={image.id || image.name} value={image.name}>
                  {this.renderAssetOptionLabel(image)}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>
      </Fragment>
    );
  };

  renderRuntimeFields = (archLength, arch, form) => {
    const { getFieldDecorator } = form;
    const { vmCapabilities } = this.state;
    const hasBusinessNetworks = (vmCapabilities.networks || []).length > 0;
    return (
      <Fragment>
        {archLength === 2 ? (
          <Form.Item label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
            {getFieldDecorator('arch', {
              initialValue: arch,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group>
                <Radio value="amd64">amd64</Radio>
                <Radio value="arm64">arm64</Radio>
              </Radio.Group>
            )}
          </Form.Item>
        ) : null}

        <Form.Item label={formatMessage({ id: 'Vm.createVm.guestOS' })}>
          {getFieldDecorator('os_family', {
            initialValue: 'linux',
            rules: [
              {
                required: true,
                message: formatMessage({ id: 'Vm.createVm.guestOSRequired' })
              }
            ]
          })(
            <Radio.Group>
              <Radio value="linux">
                {formatMessage({ id: 'Vm.createVm.guestOSLinux' })}
              </Radio>
              <Radio value="windows">
                {formatMessage({ id: 'Vm.createVm.guestOSWindows' })}
              </Radio>
            </Radio.Group>
          )}
        </Form.Item>

        {vmCapabilities.gpu_supported ? (
          <Form.Item>
            <div className={styles.switchPanel}>
              <div className={styles.switchPanelMeta}>
                <div className={styles.switchPanelTitle}>
                  {formatMessage({ id: 'Vm.createVm.gpu' })}
                </div>
              </div>
              {getFieldDecorator('gpu_enabled', {
                valuePropName: 'checked',
                initialValue: false
              })(<Switch />)}
            </div>
          </Form.Item>
        ) : null}
        {vmCapabilities.gpu_supported && form.getFieldValue('gpu_enabled') ? (
          <Form.Item label={formatMessage({ id: 'Vm.createVm.gpuResources' })}>
            {getFieldDecorator('gpu_resources', {
              initialValue: [],
              rules: [
                {
                  validator: this.validateRuntimeResources(
                    'gpu_enabled',
                    'Vm.createVm.gpuResourcesRequired'
                  )
                }
              ]
            })(
              <Select
                mode="multiple"
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'Vm.createVm.gpuResourcesPlaceholder' })}
              >
                {(vmCapabilities.gpu_resources || []).map(resource => (
                  <Option key={resource} value={resource}>
                    {resource}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        ) : null}
        {vmCapabilities.gpu_supported && form.getFieldValue('gpu_enabled') ? (
          <Form.Item label={formatMessage({ id: 'Vm.createVm.gpuCount' })}>
            {getFieldDecorator('gpu_count', {
              initialValue: 1,
              rules: [{ validator: this.validateGPUCount }]
            })(
              <InputNumber
                min={1}
                precision={0}
                style={{ width: '100%' }}
              />
            )}
          </Form.Item>
        ) : null}

        {vmCapabilities.usb_supported ? (
          <Form.Item>
            <div className={styles.switchPanel}>
              <div className={styles.switchPanelMeta}>
                <div className={styles.switchPanelTitle}>
                  {formatMessage({ id: 'Vm.createVm.usb' })}
                </div>
              </div>
              {getFieldDecorator('usb_enabled', {
                valuePropName: 'checked',
                initialValue: false
              })(<Switch />)}
            </div>
          </Form.Item>
        ) : null}
        {vmCapabilities.usb_supported && form.getFieldValue('usb_enabled') ? (
          <Form.Item label={formatMessage({ id: 'Vm.createVm.usbResources' })}>
            {getFieldDecorator('usb_resources', {
              initialValue: [],
              rules: [
                {
                  validator: this.validateRuntimeResources(
                    'usb_enabled',
                    'Vm.createVm.usbResourcesRequired'
                  )
                }
              ]
            })(
              <Select
                mode="multiple"
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'Vm.createVm.usbResourcesPlaceholder' })}
              >
                {(vmCapabilities.usb_resources || []).map(resource => (
                  <Option key={resource} value={resource}>
                    {resource}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        ) : null}

        <Form.Item label={formatMessage({ id: 'Vm.createVm.networkMode' })}>
          {getFieldDecorator('network_mode', {
            initialValue: 'random'
          })(
            <Radio.Group>
              <Radio value="random">
                {formatMessage({ id: 'Vm.createVm.networkRandom' })}
              </Radio>
              <Radio
                value="fixed"
                disabled={(vmCapabilities.network_modes || []).indexOf('fixed') === -1}
              >
                {formatMessage({ id: 'Vm.createVm.networkFixed' })}
              </Radio>
            </Radio.Group>
          )}
        </Form.Item>

        {form.getFieldValue('network_mode') === 'fixed' ? (
          <Fragment>
            {hasBusinessNetworks ? (
              <Form.Item label={formatMessage({ id: 'Vm.createVm.networkName' })}>
                {getFieldDecorator('network_name', {
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'Vm.createVm.networkNamePlaceholder' })
                    }
                  ]
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder={formatMessage({ id: 'Vm.createVm.networkNamePlaceholder' })}
                  >
                    {(vmCapabilities.networks || []).map(item => {
                      const value = `${item.namespace}/${item.name}`;
                      return (
                        <Option key={value} value={value}>
                          {value}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
            ) : null}
            <Form.Item label={formatMessage({ id: 'Vm.createVm.fixedIP' })}>
              {getFieldDecorator('fixed_ip', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'Vm.createVm.fixedIPPlaceholder' })
                  }
                ]
              })(
                <Input
                  placeholder={formatMessage({ id: 'Vm.createVm.fixedIPPlaceholder' })}
                />
              )}
            </Form.Item>
            {hasBusinessNetworks ? (
              <Form.Item label={formatMessage({ id: 'Vm.createVm.gateway' })}>
                {getFieldDecorator('gateway')(
                  <Input
                    placeholder={formatMessage({ id: 'Vm.createVm.gatewayPlaceholder' })}
                  />
                )}
              </Form.Item>
            ) : null}
            {hasBusinessNetworks ? (
              <Form.Item label={formatMessage({ id: 'Vm.createVm.dnsServers' })}>
                {getFieldDecorator('dns_servers')(
                  <Input
                    placeholder={formatMessage({ id: 'Vm.createVm.dnsServersPlaceholder' })}
                  />
                )}
              </Form.Item>
            ) : null}
          </Fragment>
        ) : null}
      </Fragment>
    );
  };

  renderSubmitButton = fixedGroupId => {
    const {
      handleType,
      ButtonGroupState,
      rainbondInfo,
      createAppByVirtualMachineLoading
    } = this.props;
    const {
      vmShow,
      creatComPermission: { isCreate }
    } = this.state;
    const host = rainbondInfo.document?.enable
      ? rainbondInfo.document.value.platform_url
      : 'https://www.rainbond.com';

    if (handleType && ButtonGroupState) {
      return this.props.handleServiceBotton(
        <Tooltip title={!isCreate ? formatMessage({ id: 'versionUpdata_6_1.noApp' }) : null}>
          <Button
            onClick={this.handleSubmit}
            type="primary"
            loading={createAppByVirtualMachineLoading}
            disabled={!isCreate}
          >
            {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
          </Button>
        </Tooltip>,
        false
      );
    }

    return (
      <Tooltip
        placement="top"
        title={
          vmShow ? null : (
            <Fragment>
              <span>{formatMessage({ id: 'Vm.createVm.unInstall' })}</span>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${host}docs/vm-guide/vm_deploy/`}
              >
                {formatMessage({ id: 'Vm.createVm.doc' })}
              </a>
            </Fragment>
          )
        }
        key={`${vmShow}-${fixedGroupId || 'new'}`}
      >
        <Button
          onClick={this.handleSubmit}
          type="primary"
          loading={createAppByVirtualMachineLoading}
          disabled={!vmShow}
        >
          {fixedGroupId
            ? formatMessage({ id: 'teamAdd.create.btn.createComponent' })
            : formatMessage({ id: 'teamAdd.create.btn.create' })}
        </Button>
      </Tooltip>
    );
  };

  render() {
    const {
      form,
      showSubmitBtn = true,
      archInfo = [],
      virtualMachineImage = [],
      showAssetCatalog = false
    } = this.props;
    const { getFieldDecorator } = form;
    const {
      radioKey,
      showAdvanced
    } = this.state;
    const fixedGroupId = this.getFixedGroupId();
    let arch = 'amd64';
    const archLength = archInfo.length;
    if (archLength === 1) {
      arch = archInfo[0];
    }

    return (
      <Fragment>
        <div className={styles.vmForm}>
          <div style={{ display: showAssetCatalog ? 'none' : 'block' }}>
            <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
            {getFieldDecorator('group_id', {
              initialValue: fixedGroupId
            })(<Input type="hidden" />)}
            {getFieldDecorator('asset_id', {
              initialValue: ''
            })(<Input type="hidden" />)}

            <Form.Item
              label={
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabelText}>
                    {formatMessage({ id: 'teamAdd.create.form.service_cname' })}
                  </span>
                  {virtualMachineImage && virtualMachineImage.length > 0 ? (
                    <Button
                      type="link"
                      size="small"
                      className={styles.assetCatalogTrigger}
                      onClick={this.openAssetCatalog}
                    >
                      {formatMessage({ id: 'Vm.assetCatalog.manage' })}
                    </Button>
                  ) : null}
                </div>
              }
            >
              {getFieldDecorator('service_cname', {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.service_cname' })
                  },
                  {
                    max: 24,
                    message: formatMessage({ id: 'placeholder.max24' })
                  }
                ]
              })(<Input placeholder="vm-service" />)}
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
              {getFieldDecorator('k8s_component_name', {
                initialValue: this.generateEnglishName(
                  form.getFieldValue('service_cname')
                ),
                rules: [{ required: true, validator: this.handleValidateK8sName }]
              })(<Input placeholder="vm-service" />)}
            </Form.Item>

            <Form.Item label={formatMessage({ id: 'Vm.createVm.from' })}>
              {getFieldDecorator('imagefrom', {
                initialValue: radioKey,
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.code_version' })
                  }
                ]
              })(
                <Radio.Group onChange={this.handleChangeImageSource}>
                  <Radio value="public">
                    {formatMessage({ id: 'Vm.createVm.public' })}
                  </Radio>
                  <Radio value="url">
                    {formatMessage({ id: 'Vm.createVm.add' })}
                  </Radio>
                  <Radio value="upload">
                    {formatMessage({ id: 'Vm.createVm.upload' })}
                  </Radio>
                  {virtualMachineImage && virtualMachineImage.length > 0 ? (
                    <Radio
                      value="existing"
                      disabled={getSelectableVMAssets(virtualMachineImage).length === 0}
                    >
                      {formatMessage({ id: 'Vm.createVm.have' })}
                    </Radio>
                  ) : null}
                </Radio.Group>
              )}
            </Form.Item>
            {this.renderSourceFields()}

            {this.renderRuntimeFields(archLength, arch, form)}

            {!fixedGroupId ? (
              <div className={styles.advancedToggle}>
                <Button
                  type="link"
                  onClick={() => this.setState({ showAdvanced: !showAdvanced })}
                >
                  <Icon type={showAdvanced ? 'up' : 'down'} />
                  {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
                </Button>
              </div>
            ) : null}

            {!fixedGroupId && showAdvanced ? (
              <div className={styles.advancedPanel}>
                <div className={styles.advancedDivider} />
                <Form.Item label={formatMessage({ id: 'popover.newApp.appName' })}>
                  {getFieldDecorator('group_name', {
                    initialValue: form.getFieldValue('service_cname') || '',
                    rules: [
                      {
                        required: true,
                        message: formatMessage({ id: 'popover.newApp.appName.placeholder' })
                      },
                      {
                        max: 24,
                        message: formatMessage({ id: 'placeholder.max24' })
                      }
                    ]
                  })(
                    <Input
                      placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })}
                    />
                  )}
                </Form.Item>
                <Form.Item label={formatMessage({ id: 'teamAdd.create.form.k8s_app_name' })}>
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(
                      form.getFieldValue('group_name') ||
                        form.getFieldValue('service_cname') ||
                        ''
                    ),
                    rules: [{ required: true, validator: this.handleValidateK8sName }]
                  })(<Input placeholder={formatMessage({ id: 'placeholder.appEngName' })} />)}
                </Form.Item>
              </div>
            ) : null}

            {showSubmitBtn ? (
              <Form.Item className={styles.submitRow}>
                {this.renderSubmitButton(fixedGroupId)}
              </Form.Item>
            ) : null}
            </Form>
          </div>

          {showAssetCatalog ? (
            <VMAssetCatalogModal
              assets={virtualMachineImage || []}
              onCancel={this.closeAssetCatalog}
              onUseAsset={this.handleUseAsset}
              onDelete={this.handleDeleteAsset}
            />
          ) : null}
        </div>
      </Fragment>
    );
  }
}
