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
  message,
  Modal,
  Table,
  Tag,
  Popconfirm,
  Popover
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import handleAPIError from '../../utils/error';
import styles from './index.less';
import centOS from '../../../public/images/centos.png';
import ubuntuOS from '../../../public/images/ubuntu.png';
const { normalizeAssetRuntimeSnapshot } = require('./runtimeFieldMerge');
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
    deleteVirtualMachineImageAssetLoading:
      loading.effects['createApp/deleteVirtualMachineImageAsset'],
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
        gpu_resources: [],
        usb_resources: []
      },
      publicVmOptions: PUBLIC_VM_OPTIONS,
      selectedPublicVm: defaultPublicVm,
      comNames: [],
      creatComPermission: {},
      assetCatalogVisible: false,
      deletingAssetId: ''
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

  findAssetByName = name => {
    const { virtualMachineImage = [] } = this.props;
    return (virtualMachineImage || []).find(item => item.name === name);
  };

  renderAssetOptionLabel = asset => {
    return `${asset.display_name || asset.name}`;
  };

  applyLocalImageSelection = asset => {
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
    this.setState(
      {
        radioKey: 'existing'
      },
      () => {
        form.setFieldsValue({
          image_name: asset.name,
          asset_id: asset.id,
          boot_mode: sanitizedRuntimeSnapshot.boot_mode || undefined,
          gpu_enabled: !!sanitizedRuntimeSnapshot.gpu_enabled,
          gpu_resources: sanitizedRuntimeSnapshot.gpu_resources || [],
          gpu_count: sanitizedRuntimeSnapshot.gpu_count || 1,
          usb_enabled: !!sanitizedRuntimeSnapshot.usb_enabled,
          usb_resources: sanitizedRuntimeSnapshot.usb_resources || []
        });
      }
    );
  };

  handleLocalImageChange = value => {
    const selectedAsset = this.findAssetByName(value);
    if (!selectedAsset) {
      return;
    }
    this.applyLocalImageSelection(selectedAsset);
  };

  openAssetCatalog = () => {
    this.setState({
      assetCatalogVisible: true
    });
  };

  closeAssetCatalog = () => {
    this.setState({
      assetCatalogVisible: false
    });
  };

  getAssetId = asset => {
    return asset ? asset.id || asset.asset_id || '' : '';
  };

  getAssetReferenceCount = asset => {
    if (!asset) {
      return 0;
    }
    const referenceCount =
      asset.reference_count !== undefined
        ? asset.reference_count
        : Array.isArray(asset.references)
          ? asset.references.length
          : asset.references || asset.ref_count || 0;
    const numericCount = Number(referenceCount);
    return Number.isNaN(numericCount) ? 0 : numericCount;
  };

  getAssetReferences = asset => {
    if (!asset || !Array.isArray(asset.references)) {
      return [];
    }
    return asset.references;
  };

  getReferenceDisplayName = reference => {
    if (!reference) {
      return '';
    }
    return (
      reference.display_name ||
      reference.service_cname ||
      reference.service_alias ||
      reference.service_id ||
      reference.component_id ||
      ''
    );
  };

  buildReferenceRoute = reference => {
    if (!reference) {
      return '';
    }
    const teamName = globalUtil.getCurrTeamName();
    const regionName = reference.region_name || globalUtil.getCurrRegionName();
    const groupId = reference.group_id || reference.app_id;
    const serviceAlias = reference.service_alias || reference.component_alias || '';
    if (!teamName || !regionName || !groupId || !serviceAlias) {
      return '';
    }
    return `/team/${teamName}/region/${regionName}/apps/${groupId}/overview?type=components&componentID=${encodeURIComponent(serviceAlias)}&tab=overview`;
  };

  handleJumpReference = reference => {
    const { dispatch } = this.props;
    const route = this.buildReferenceRoute(reference);
    if (!route) {
      return;
    }
    this.closeAssetCatalog();
    dispatch(routerRedux.push(route));
  };

  renderReferencePopover = references => (
    <div className={styles.assetReferenceList}>
      {references.map(reference => {
        const route = this.buildReferenceRoute(reference);
        const displayName = this.getReferenceDisplayName(reference);
        const serviceAlias = reference.service_alias || reference.component_id || reference.service_id || '';
        return (
          <div
            className={styles.assetReferenceItem}
            key={`${reference.service_id || reference.component_id || serviceAlias}-${reference.group_id || reference.app_id || ''}`}
          >
            <div className={styles.assetReferenceInfo}>
              <div className={styles.assetReferenceName} title={displayName}>
                {displayName || '-'}
              </div>
              <div className={styles.assetReferenceMeta} title={serviceAlias}>
                {serviceAlias || '-'}
              </div>
            </div>
            <Button
              type="link"
              disabled={!route}
              onClick={() => this.handleJumpReference(reference)}
            >
              {formatMessage({ id: 'Vm.assetCatalog.jumpToComponent' })}
            </Button>
          </div>
        );
      })}
    </div>
  );

  renderAssetReferences = asset => {
    const referenceCount = this.getAssetReferenceCount(asset);
    const references = this.getAssetReferences(asset);
    if (referenceCount <= 0 || references.length === 0) {
      return referenceCount;
    }
    return (
      <Popover
        trigger="click"
        title={formatMessage({ id: 'Vm.assetCatalog.referenceComponents' })}
        content={this.renderReferencePopover(references)}
      >
        <Button type="link" className={styles.assetReferenceCount}>
          {referenceCount}
        </Button>
      </Popover>
    );
  };

  getAssetSource = asset => {
    if (!asset) {
      return '';
    }
    return asset.source_uri || asset.vm_url || asset.source || asset.image_url || '';
  };

  getAssetCreatedAt = asset => {
    if (!asset) {
      return '';
    }
    return asset.created_at || asset.create_time || asset.update_time || '';
  };

  formatAssetSize = value => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    const size = Number(value);
    if (Number.isNaN(size)) {
      return value;
    }
    if (size < 1024) {
      return `${size} B`;
    }
    const units = ['KB', 'MB', 'GB', 'TB'];
    let nextSize = size / 1024;
    let unitIndex = 0;
    while (nextSize >= 1024 && unitIndex < units.length - 1) {
      nextSize /= 1024;
      unitIndex += 1;
    }
    return `${nextSize.toFixed(nextSize >= 10 ? 1 : 2)} ${units[unitIndex]}`;
  };

  renderAssetStatus = asset => {
    const status = (asset && asset.status) || formatMessage({ id: 'Vm.assetCatalog.statusUnknown' });
    const statusColorMap = {
      ready: 'green',
      importing: 'blue',
      pending: 'orange',
      failed: 'red',
      error: 'red'
    };
    return <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>;
  };

  refreshVirtualMachineImages = () => {
    const { onRefreshVirtualMachineImage } = this.props;
    if (typeof onRefreshVirtualMachineImage === 'function') {
      onRefreshVirtualMachineImage();
    }
  };

  handleSelectCatalogAsset = asset => {
    this.applyLocalImageSelection(asset);
    if (isVMAssetSelectable(asset)) {
      this.closeAssetCatalog();
    }
  };

  handleDeleteCatalogAsset = asset => {
    const { dispatch, form } = this.props;
    const assetId = this.getAssetId(asset);
    if (!assetId) {
      return;
    }
    if (this.getAssetReferenceCount(asset) > 0) {
      message.warning(formatMessage({ id: 'Vm.assetCatalog.deleteDisabled' }));
      return;
    }
    this.setState({
      deletingAssetId: assetId
    });
    dispatch({
      type: 'createApp/deleteVirtualMachineImageAsset',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        asset_id: assetId
      },
      callback: () => {
        const selectedAssetId = form.getFieldValue('asset_id');
        const selectedImageName = form.getFieldValue('image_name');
        if (
          String(selectedAssetId || '') === String(assetId) ||
          selectedImageName === asset.name
        ) {
          form.setFieldsValue({
            asset_id: '',
            image_name: undefined
          });
        }
        this.setState({
          deletingAssetId: ''
        });
        message.success(formatMessage({ id: 'Vm.assetCatalog.deleteSuccess' }));
        this.refreshVirtualMachineImages();
      },
      handleError: err => {
        this.setState({
          deletingAssetId: ''
        });
        handleAPIError(err);
      }
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

  renderAssetCatalogModal = () => {
    const { virtualMachineImage = [], deleteVirtualMachineImageAssetLoading } = this.props;
    const { assetCatalogVisible, deletingAssetId } = this.state;
    const columns = [
      {
        title: formatMessage({ id: 'Vm.assetCatalog.name' }),
        dataIndex: 'name',
        key: 'name',
        width: 150,
        render: (text, record) => (
          <div className={styles.assetCatalogNameWrap}>
            <div className={styles.assetCatalogName}>
              {record.display_name || text || '-'}
            </div>
            <div className={styles.assetCatalogMeta}>
              {this.getAssetId(record) || '-'}
            </div>
          </div>
        )
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.source' }),
        dataIndex: 'source_uri',
        key: 'source_uri',
        width: 248,
        render: (_, record) => (
          <span
            className={styles.assetCatalogSource}
            title={this.getAssetSource(record) || formatMessage({ id: 'Vm.assetCatalog.sourceUnknown' })}
          >
            {this.getAssetSource(record) || formatMessage({ id: 'Vm.assetCatalog.sourceUnknown' })}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.archFormat' }),
        key: 'arch_format',
        width: 100,
        render: (_, record) => (
          <span className={styles.assetCatalogCompactText}>
            {`${record.arch || '-'} / ${record.format || '-'}`}
          </span>
        )
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.size' }),
        dataIndex: 'size',
        key: 'size',
        width: 72,
        render: (value, record) =>
          this.formatAssetSize(value || record.size_bytes || record.virtual_size || record.disk_size)
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.status' }),
        dataIndex: 'status',
        key: 'status',
        width: 78,
        render: (_, record) => this.renderAssetStatus(record)
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.references' }),
        dataIndex: 'reference_count',
        key: 'reference_count',
        width: 84,
        render: (_, record) => this.renderAssetReferences(record)
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.createdAt' }),
        key: 'created_at',
        width: 132,
        render: (_, record) => this.getAssetCreatedAt(record) || '-'
      },
      {
        title: formatMessage({ id: 'Vm.assetCatalog.actions' }),
        key: 'actions',
        width: 104,
        render: (_, record) => {
          const assetId = this.getAssetId(record);
          const referenceCount = this.getAssetReferenceCount(record);
          const deleteDisabled = !assetId || referenceCount > 0;
          const deleteButton = (
            <Button
              type="link"
              className={styles.assetDangerAction}
              disabled={deleteDisabled}
              loading={
                deleteVirtualMachineImageAssetLoading &&
                deletingAssetId === assetId
              }
            >
              {formatMessage({ id: 'Vm.assetCatalog.delete' })}
            </Button>
          );
          return (
            <div className={styles.assetCatalogActions}>
              <Button
                type="link"
                disabled={!isVMAssetSelectable(record)}
                onClick={() => this.handleSelectCatalogAsset(record)}
              >
                {formatMessage({ id: 'Vm.assetCatalog.useAsset' })}
              </Button>
              {deleteDisabled ? (
                <Tooltip
                  title={
                    referenceCount > 0
                      ? formatMessage({ id: 'Vm.assetCatalog.deleteDisabled' })
                      : null
                  }
                >
                  <span>{deleteButton}</span>
                </Tooltip>
              ) : (
                <Popconfirm
                  title={formatMessage({ id: 'Vm.assetCatalog.deleteConfirm' })}
                  onConfirm={() => this.handleDeleteCatalogAsset(record)}
                  okText={formatMessage({ id: 'button.confirm' })}
                  cancelText={formatMessage({ id: 'button.cancel' })}
                >
                  {deleteButton}
                </Popconfirm>
              )}
            </div>
          );
        }
      }
    ];

    return (
      <Modal
        title={formatMessage({ id: 'Vm.assetCatalog.title' })}
        visible={assetCatalogVisible}
        onCancel={this.closeAssetCatalog}
        footer={null}
        width="min(1040px, calc(100vw - 48px))"
        className={styles.assetCatalogModal}
        destroyOnClose
      >
        <Table
          className={styles.assetCatalogTable}
          rowKey={record => this.getAssetId(record) || record.name}
          columns={columns}
          dataSource={virtualMachineImage || []}
          size="middle"
          tableLayout="fixed"
          scroll={{ x: 980 }}
          pagination={{ pageSize: 6 }}
          locale={{
            emptyText: formatMessage({ id: 'Vm.assetCatalog.empty' })
          }}
        />
      </Modal>
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
        <div className={styles.assetSelectHeader}>
          <span className={styles.assetSelectSummary}>
            {formatMessage(
              { id: 'Vm.assetCatalog.total' },
              {
                count: selectableVirtualMachineImages.length,
                total: (virtualMachineImage || []).length
              }
            )}
          </span>
          <Button
            size="small"
            icon="setting"
            onClick={this.openAssetCatalog}
          >
            {formatMessage({ id: 'Vm.assetCatalog.manage' })}
          </Button>
        </div>
        <Form.Item label={formatMessage({ id: 'Vm.createVm.img' })}>
          {getFieldDecorator('image_name', {
            rules: [{ required: true, message: formatMessage({ id: 'Vm.createVm.selectImg' }) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              placeholder={formatMessage({ id: 'Vm.createVm.selectImg' })}
              onChange={this.handleLocalImageChange}
            >
              {selectableVirtualMachineImages.map(image => (
                <Option key={image.id || image.name} value={image.name}>
                  {this.renderAssetOptionLabel(image)}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>
        {this.renderAssetCatalogModal()}
      </Fragment>
    );
  };

  renderRuntimeFields = (archLength, arch, form) => {
    const { getFieldDecorator } = form;
    const { vmCapabilities } = this.state;
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
      virtualMachineImage = []
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
          <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
            {getFieldDecorator('group_id', {
              initialValue: fixedGroupId
            })(<Input type="hidden" />)}
            {getFieldDecorator('asset_id', {
              initialValue: ''
            })(<Input type="hidden" />)}

            <Form.Item label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
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
                    <Radio value="existing">
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
      </Fragment>
    );
  }
}
