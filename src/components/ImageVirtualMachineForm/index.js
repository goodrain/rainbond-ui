/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Alert, Button, Form, Input, Select, Radio, Upload, Icon, Tooltip, notification, Switch, Progress, message } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import cookie from '../../utils/cookie';
import anolisOS from '../../../public/images/anolis.png';
import centOS from '../../../public/images/centos.png';
import deepinOS from '../../../public/images/deepin.png';
import ubuntuOS from '../../../public/images/ubuntu.png';
import { pinyin } from 'pinyin-pro';
import globalUtil from '../../utils/global';
import role from '@/utils/newRole';
import handleAPIError from '../../utils/error';
import ChunkUploader from '../../utils/ChunkUploader';
import VMAssetCatalogModal from '../VMAssetCatalogModal';
import styles from './index.less';


const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 15
  }
};
const formItemLayouts = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 15
  }
};

@connect(
  ({ global, loading, user, teamControl }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    rainbondInfo: global.rainbondInfo,
    createAppByDockerrunLoading:
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
    this.state = {
      showUsernameAndPass: false,
      addGroup: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      radioKey: 'public',
      assetCatalogVisible: false,
      uploadMode: 'normal',
      fileList: [],
      percents: false,
      vmShow: false,
      existFileList: [],
      chunkUploadProgress: 0,
      isChunkUploading: false,
      currentFile: null,
      chunkUploader: null,
      vmCapabilities: {
        chunk_upload_supported: false,
        gpu_supported: false,
        usb_supported: false,
        network_modes: ['random'],
        gpu_resources: [],
        usb_resources: [],
        networks: []
      },
      PublicVm: [
        { vm_url: 'https://mirrors.aliyun.com/centos/7.9.2009/isos/x86_64/CentOS-7-x86_64-Minimal-2009.iso', image_name: 'centos7.9' },
        { vm_url: 'https://mirrors.aliyun.com/anolis/7.9/isos/GA/x86_64/AnolisOS-7.9-Minimal-x86_64-dvd.iso', image_name: 'anolisos7.9' },
        { vm_url: 'https://mirrors.aliyun.com/deepin-cd/20.9/deepin-desktop-community-20.9-amd64.iso', image_name: 'deepin20.9' },
        { vm_url: 'https://mirrors.aliyun.com/ubuntu-releases/mantic/ubuntu-23.10-live-server-amd64.iso', image_name: 'ubuntu23.10' },
      ],
      selectName: 'centos7.9',
      selectUrl: 'https://mirrors.aliyun.com/centos/7.9.2009/isos/x86_64/CentOS-7-x86_64-Minimal-2009.iso',
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
    const { handleType, groupId } = this.props;
    const group_id = globalUtil.getAppID()
    if(group_id){
      this.setState({
        creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${globalUtil.getAppID() || group_id}`)
      })
    }
    if (handleType && handleType === 'Service') {
      this.fetchComponentNames(Number(groupId));
    }
    if (this.props.templatePreset) {
      this.applyTemplatePreset(this.props.templatePreset);
    }
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.templatePreset &&
      (!prevProps.templatePreset ||
        prevProps.templatePreset.template_version_id !== this.props.templatePreset.template_version_id)
    ) {
      this.applyTemplatePreset(this.props.templatePreset);
    }
  }
  handleJarWarUpload = () => {
    const { dispatch } = this.props
    const teamName = globalUtil.getCurrTeamName()
    const regionName = globalUtil.getCurrRegionName()
    //获取上传事件
    dispatch({
      type: "createApp/createJarWarServices",
      payload: {
        region: regionName,
        team_name: teamName,
        component_id: '',
      },
      callback: (res) => {
        if (res && res.status_code === 200) {
          this.setState({
            record: res.bean,
            event_id: res.bean.event_id,
            region_name: res.bean && res.bean.region,
            team_name: res.bean && res.bean.team_name
          }, () => {
            if (res.bean.region !== '') {
              this.loop = true;
              this.handleJarWarUploadStatus();
            }
          })
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }
  fetchVMCapabilities = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'createApp/getVMCapabilities',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        const capabilities = (res && res.bean) || this.state.vmCapabilities;
        this.setState(prevState => {
          const nextState = {
            vmCapabilities: capabilities
          };
          if (!capabilities.chunk_upload_supported && prevState.uploadMode === 'chunk') {
            nextState.uploadMode = 'normal';
          }
          if (
            capabilities.chunk_upload_supported &&
            prevState.uploadMode === 'normal' &&
            prevState.fileList.length === 0 &&
            prevState.existFileList.length === 0 &&
            !prevState.currentFile
          ) {
            nextState.uploadMode = 'chunk';
          }
          return nextState;
        });
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }
  //查询上传状态
  handleJarWarUploadStatus = () => {
    const {
      dispatch
    } = this.props;
    const { event_id } = this.state
    dispatch({
      type: 'createApp/createJarWarUploadStatus',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        event_id: event_id
      },
      callback: data => {
        if (data) {
          if (data.bean.package_name && data.bean.package_name.length > 0) {
            this.setState({
              existFileList: data.bean.package_name
            });
            // notification.success({
            //   message: formatMessage({id:'notification.success.upload_file'})
            // })
            this.loop = false
          }
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
  //删除上传文件
  handleJarWarUploadDelete = () => {
    const { event_id } = this.state
    const { dispatch, form } = this.props
    dispatch({
      type: "createApp/deleteJarWarUploadStatus",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: (data) => {
        if (data.bean.res == 'ok') {
          this.setState({
            existFileList: [],
            fileList: [],
            currentFile: null,
            chunkUploader: null,
            chunkUploadProgress: 0,
            isChunkUploading: false
          });
          form.setFieldsValue({ packageTarFile: [] });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          })
          this.handleJarWarUpload()
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    role.refreshPermissionsInfo(groupId, false, this.callbcak)
    this.cancelAddGroup();
  };
  callbcak=(val)=>{
    this.setState({ creatComPermission: val })
  }
  handleSubmit = e => {
    e.preventDefault();
    const { event_id, radioKey, uploadMode, existFileList, isChunkUploading } = this.state
    const { form, onSubmit, archInfo } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if (radioKey === 'upload' && uploadMode === 'chunk' && isChunkUploading) {
          message.warning(formatMessage({ id: 'teamAdd.create.upload.waitForCompletion' }));
          return;
        }
        if (radioKey === 'upload' && existFileList.length === 0) {
          message.warning(formatMessage({ id: 'teamAdd.create.upload.finishBeforeSubmit' }));
          return;
        }
        if (archInfo && archInfo.length != 2 && archInfo.length != 0) {
          fieldsValue.arch = archInfo[0]
        }
        if (radioKey == 'public') {
          fieldsValue.vm_url = this.state.selectUrl
          fieldsValue.image_name = this.state.selectName
          fieldsValue.source_type = 'public';
          fieldsValue.asset_id = this.findAssetByName(this.state.selectName)?.id || '';
          fieldsValue.template_id = '';
          fieldsValue.template_version_id = '';
        } else if (radioKey === 'address') {
          fieldsValue.source_type = 'url';
          fieldsValue.asset_id = '';
          fieldsValue.template_id = '';
          fieldsValue.template_version_id = '';
        } else if (radioKey === 'upload') {
          fieldsValue.source_type = 'upload';
          fieldsValue.asset_id = '';
          fieldsValue.template_id = '';
          fieldsValue.template_version_id = '';
        } else {
          const selectedAsset = this.findAssetByName(fieldsValue.image_name);
          if (selectedAsset && selectedAsset.status !== 'ready' && selectedAsset.status !== 'partial') {
            message.warning(formatMessage({ id: 'Vm.assetCatalog.useDisabled' }));
            return;
          }
          fieldsValue.source_type = 'existing';
          fieldsValue.asset_id = selectedAsset ? selectedAsset.id : fieldsValue.asset_id || '';
          fieldsValue.template_id = selectedAsset && selectedAsset.template_id ? selectedAsset.template_id : fieldsValue.template_id || '';
          fieldsValue.template_version_id = selectedAsset && selectedAsset.template_version_id ? selectedAsset.template_version_id : fieldsValue.template_version_id || '';
        }
        if (!fieldsValue.gpu_enabled) {
          fieldsValue.gpu_resources = [];
        }
        if (!fieldsValue.usb_enabled) {
          fieldsValue.usb_resources = [];
        }
        if (fieldsValue.network_mode !== 'fixed') {
          fieldsValue.network_name = '';
          fieldsValue.fixed_ip = '';
        }
        onSubmit(fieldsValue, radioKey == 'upload' ? event_id : '');
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({ id: 'placeholder.nameSpaceReg' }))
        );
      }
      callback();
    }
    if (value.length > 16) {
      return callback(new Error(formatMessage({ id: 'placeholder.max16' })));
    }
  };
  handleChangeImageSource = (key) => {
    this.setState({
      radioKey: key.target.value
    });
    if (this.props.form) {
      this.props.form.setFieldsValue({
        asset_id: '',
        template_id: '',
        template_version_id: ''
      });
    }
  }
  applyTemplatePreset = (preset) => {
    const { form } = this.props;
    if (!preset || !form || this.appliedTemplateVersionId === preset.template_version_id) {
      return;
    }
    const runtimeSnapshot = preset && preset.extra && preset.extra.runtime_snapshot ? preset.extra.runtime_snapshot : {};
    this.appliedTemplateVersionId = preset.template_version_id;
    this.setState({
      radioKey: 'ok'
    });
    form.setFieldsValue({
      imagefrom: 'ok',
      image_name: preset.name,
      asset_id: preset.id,
      template_id: preset.template_id,
      template_version_id: preset.template_version_id,
      boot_mode: runtimeSnapshot.boot_mode || undefined,
      gpu_enabled: !!runtimeSnapshot.gpu_enabled,
      gpu_resources: runtimeSnapshot.gpu_resources || [],
      usb_enabled: !!runtimeSnapshot.usb_enabled,
      usb_resources: runtimeSnapshot.usb_resources || [],
      network_mode: runtimeSnapshot.network_mode || 'random',
      network_name: runtimeSnapshot.network_name || undefined,
      fixed_ip: runtimeSnapshot.fixed_ip || undefined
    });
  };
  openAssetCatalog = () => {
    this.setState({ assetCatalogVisible: true });
  };
  closeAssetCatalog = () => {
    this.setState({ assetCatalogVisible: false });
  };
  findAssetByName = (name) => {
    const { virtualMachineImage = [] } = this.props;
    return (virtualMachineImage || []).find(item => item.name === name);
  };
  getAssetSourceLabel = (sourceType) => {
    const sourceMap = {
      public: 'Vm.createVm.public',
      url: 'Vm.createVm.add',
      upload: 'Vm.createVm.upload',
      existing: 'Vm.createVm.have',
      clone: 'Vm.createVm.clone',
      vm_template: 'Vm.template.center.entry'
    };
    return formatMessage({ id: sourceMap[sourceType] || 'Vm.assetCatalog.sourceUnknown' });
  };
  renderAssetOptionLabel = (asset) => {
    return `${asset.name} / ${this.getAssetSourceLabel(asset.source_type)} / ${asset.arch || '-'} / ${asset.format || '-'} / ${asset.status || '-'}`;
  };
  handleUseAsset = (asset) => {
    const { form } = this.props;
    if (!asset || asset.status !== 'ready') {
      message.warning(formatMessage({ id: 'Vm.assetCatalog.useDisabled' }));
      return;
    }
    const runtimeSnapshot = asset && asset.extra && asset.extra.runtime_snapshot ? asset.extra.runtime_snapshot : {};
    this.setState({
      radioKey: 'ok',
      assetCatalogVisible: false
    });
    form.setFieldsValue({
      imagefrom: 'ok',
      image_name: asset.name,
      asset_id: asset.id,
      template_id: asset.template_id || undefined,
      template_version_id: asset.template_version_id || undefined,
      boot_mode: runtimeSnapshot.boot_mode || undefined,
      gpu_enabled: !!runtimeSnapshot.gpu_enabled,
      gpu_resources: runtimeSnapshot.gpu_resources || [],
      usb_enabled: !!runtimeSnapshot.usb_enabled,
      usb_resources: runtimeSnapshot.usb_resources || [],
      network_mode: runtimeSnapshot.network_mode || 'random',
      network_name: runtimeSnapshot.network_name || undefined,
      fixed_ip: runtimeSnapshot.fixed_ip || undefined
    });
  };
  handleDeleteAsset = (asset) => {
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
  onUploadModeChange = (e) => {
    if (e.target.value === 'chunk' && !this.state.vmCapabilities.chunk_upload_supported) {
      message.warning(formatMessage({ id: 'teamAdd.create.upload.chunkUnsupported' }));
      return;
    }
    this.setState({ uploadMode: e.target.value });
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
  handleChunkFileSelect = (file) => {
    const { event_id, record, vmCapabilities } = this.state;
    if (!vmCapabilities.chunk_upload_supported) {
      message.warning(formatMessage({ id: 'teamAdd.create.upload.chunkUnsupported' }));
      return false;
    }
    if (!event_id || !record || !record.upload_url) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.uploaderInitFailed' }));
      return false;
    }
    const allowedTypes = ['.img', '.qcow2', '.iso', '.tar', '.gz', '.xz'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      message.error(formatMessage({ id: 'Vm.createVm.package' }));
      return false;
    }
    this.setState({ currentFile: file });
    const uploader = new ChunkUploader(file, event_id, {
      uploadUrl: record.upload_url,
      chunkSize: 5 * 1024 * 1024,
      concurrency: 5
    });
    this.setState({ chunkUploader: uploader });
    return false;
  };
  handleStartChunkUpload = async () => {
    const { chunkUploader, currentFile, vmCapabilities } = this.state;
    const { form } = this.props;
    if (!vmCapabilities.chunk_upload_supported) {
      message.warning(formatMessage({ id: 'teamAdd.create.upload.chunkUnsupported' }));
      return;
    }
    if (!currentFile) {
      message.warning(formatMessage({ id: 'teamAdd.create.upload.selectFileFirst' }));
      return;
    }
    if (!chunkUploader) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.uploaderInitFailed' }));
      return;
    }
    this.setState({ isChunkUploading: true, chunkUploadProgress: 0 });
    try {
      await chunkUploader.upload((progress) => {
        this.setState({ chunkUploadProgress: progress });
      });
      notification.success({
        message: formatMessage({ id: 'notification.success.upload_file' })
      });
      const virtualFileList = [{
        uid: '-1',
        name: currentFile.name,
        status: 'done',
        response: { msg: 'success' }
      }];
      this.setState({
        isChunkUploading: false,
        chunkUploadProgress: 100,
        existFileList: [currentFile.name],
        fileList: virtualFileList
      });
      form.setFieldsValue({
        packageTarFile: virtualFileList
      });
      this.handleJarWarUploadStatus();
    } catch (error) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.uploadFailed' }) + ': ' + (error.message || 'Unknown error'));
      this.setState({ isChunkUploading: false });
    }
  };
  handlePauseChunkUpload = () => {
    const { chunkUploader } = this.state;
    if (chunkUploader) {
      chunkUploader.pause();
      this.setState({ isChunkUploading: false });
      message.info(formatMessage({ id: 'teamAdd.create.upload.pauseSuccess' }));
    }
  };
  handleResumeChunkUpload = async () => {
    const { chunkUploader } = this.state;
    if (!chunkUploader) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.noUploadTask' }));
      return;
    }
    this.setState({ isChunkUploading: true });
    try {
      await chunkUploader.resume((progress) => {
        this.setState({ chunkUploadProgress: progress });
      });
      notification.success({
        message: formatMessage({ id: 'teamAdd.create.upload.resumeSuccess' })
      });
      this.setState({
        isChunkUploading: false,
        chunkUploadProgress: 100
      });
      this.handleJarWarUploadStatus();
    } catch (error) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.resumeFailed' }) + ': ' + (error.message || 'Unknown error'));
      this.setState({ isChunkUploading: false });
    }
  };
  handleCancelChunkUpload = async () => {
    const { chunkUploader } = this.state;
    const { form } = this.props;
    if (chunkUploader) {
      await chunkUploader.cancel();
      this.setState({
        isChunkUploading: false,
        chunkUploadProgress: 0,
        currentFile: null,
        chunkUploader: null,
        fileList: []
      });
      form.setFieldsValue({ packageTarFile: [] });
      message.info(formatMessage({ id: 'teamAdd.create.upload.cancelSuccess' }));
    }
  };
  //上传
  onChangeUpload = info => {
    let { fileList } = info;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    if (info && info.event && info.event.percent) {
      this.setState({
        percents: info.event.percent
      });
    }

    const { status } = info.file;
    if (status === 'done') {
      this.setState({
        percents: false
      });
    }
    this.setState({ fileList });
  };
  //删除
  onRemove = () => {
    this.setState({ fileList: [] });
  };
  // 获取插件列表
  fetchPipePipeline = (eid) => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list) {
          res.list.map(item => {
            if (item.name == "rainbond-vm") {
              this.setState({
                vmShow: true,
              })
            }
          }
          )
        }
      }
    })
  }
  PublicVmSelect = (item) => {
    this.setState({
      selectName: item.image_name,
      selectUrl: item.vm_url
    })
  }
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
    })
    dispatch({
      type: 'appControl/getComponentNames',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            comNames: res.bean.component_names && res.bean.component_names.length > 0 ? res.bean.component_names : []
          })
        }
      }
      });
  };
    // 生成英文名
  generateEnglishName = (name) => {
    if(name != undefined){
      const { appNames } = this.props;
      const pinyinName = pinyin(name, {toneType: 'none'}).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (appNames && appNames.length > 0) {
        const isExist = appNames.some(item => item === cleanedPinyinName);
        if (isExist) {
          const random = Math.floor(Math.random() * 10000);          
          return `${cleanedPinyinName}${random}`;
        }
        return cleanedPinyinName;
      }
      return cleanedPinyinName;
    }
    return ''
  }
  render() {
    const {
      groups,
      createAppByDockerrunLoading,
      form,
      groupId,
      handleType,
      ButtonGroupState,
      showSubmitBtn = true,
      showCreateGroup = true,
      archInfo,
      virtualMachineImage,
      rainbondInfo
    } = this.props;
    const { getFieldDecorator } = form;
    const myheaders = {};
    const data = this.props.data || {};
    const isService = handleType && handleType === 'Service';
    const host = rainbondInfo.document?.enable ? rainbondInfo.document.value.platform_url : 'https://www.rainbond.com'
    const { language, radioKey, fileList, vmShow, existFileList, PublicVm, selectName, uploadMode, vmCapabilities, isChunkUploading, chunkUploadProgress, currentFile, creatComPermission: {
      isCreate
    } } = this.state;
    const is_language = language ? formItemLayout : formItemLayouts;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if (archLegnth == 2) {
      arch = 'amd64'
    } else if (archInfo.length == 1) {
      arch = archInfo && archInfo[0]
    }
    const group_id = globalUtil.getAppID()
    const initialGroupId = isService
      ? Number(groupId)
      : data.group_id || (group_id ? Number(group_id) : undefined)
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          {getFieldDecorator('asset_id', {
            initialValue: ''
          })(<Input type="hidden" />)}
          {getFieldDecorator('template_id', {
            initialValue: ''
          })(<Input type="hidden" />)}
          {getFieldDecorator('template_version_id', {
            initialValue: ''
          })(<Input type="hidden" />)}
          {this.props.templatePreset && this.props.templatePreset.status === 'partial' && (
            <Form.Item {...is_language} label=" ">
              <Alert
                type="warning"
                showIcon
                message={formatMessage({ id: 'Vm.template.center.partialTip' })}
              />
            </Form.Item>
          )}
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: initialGroupId,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
            })(
              <Select
                showSearch
                filterOption={(input, option) => 
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'placeholder.appName' })}
                disabled={!!isService || group_id }
                onChange={this.fetchComponentNames}
              >
                {(groups || []).map(group => {
                  return (
                    <Option value={group.group_id}>{group.group_name}</Option>
                  );
                })}
              </Select>
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                { required: true, message: formatMessage({ id: 'placeholder.service_cname' }) },
                {
                  max: 24,
                  message: formatMessage({ id: 'placeholder.max24' })
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.service_cname' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
          </Form.Item>

          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.from' })}>
            {getFieldDecorator('imagefrom', {
              initialValue: 'public',
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <Radio.Group onChange={this.handleChangeImageSource}>
                  <Radio value='public'>{formatMessage({ id: 'Vm.createVm.public' })}</Radio>
                  <Radio value='address'>{formatMessage({ id: 'Vm.createVm.add' })}</Radio>
                  <Radio value='upload'>{formatMessage({ id: 'Vm.createVm.upload' })}</Radio>
                  {virtualMachineImage && virtualMachineImage.length > 0 && <Radio value='ok'>{formatMessage({ id: 'Vm.createVm.have' })}</Radio>}
                </Radio.Group>
                {virtualMachineImage && virtualMachineImage.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" onClick={this.openAssetCatalog}>
                      {formatMessage({ id: 'Vm.assetCatalog.manage' })}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        window.location.href = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/vm/templates`;
                      }}
                    >
                      {formatMessage({ id: 'Vm.template.center.entry' })}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Form.Item>
          {radioKey != 'ok' ? (
            <>
              {radioKey == 'public' &&
                <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.img' })}>
                  {getFieldDecorator('url', {
                  })(
                    <div className={styles.public}>
                      {PublicVm && PublicVm.map((item, index) => {
                        return (
                          <div className={item.image_name == selectName ? styles.active : ''} onClick={() => this.PublicVmSelect(item)}>
                            <div className={styles.publicItemName}>
                              <div>
                                {item.image_name}
                              </div>
                              {item.image_name == 'centos7.9' && <img src={centOS} />}
                              {item.image_name == 'anolisos7.9' && <img src={anolisOS} />}
                              {item.image_name == 'deepin20.9' && <img src={deepinOS} />}
                              {item.image_name == 'ubuntu23.10' && <img src={ubuntuOS} />}
                            </div>
                          </div>
                        )
                      })
                      }
                    </div>
                  )}
                </Form.Item>

              }
              {radioKey == 'address' &&
                <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.install' })} extra={formatMessage({ id: 'Vm.createVm.packageInstall' })}>
                  {getFieldDecorator('vm_url', {
                    rules: [
                      { required: true }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'Vm.createVm.InputInstall' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                </Form.Item>
              }
              {radioKey == 'upload' &&
                <>
                  <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.upload.mode' })}>
                    <Radio.Group onChange={this.onUploadModeChange} value={uploadMode}>
                      <Radio value="normal">{formatMessage({ id: 'teamAdd.create.upload.mode.normal' })}</Radio>
                      <Radio value="chunk" disabled={!vmCapabilities.chunk_upload_supported}>
                        {formatMessage({ id: 'teamAdd.create.upload.mode.chunk' })}
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    {...is_language}
                    label={formatMessage({ id: 'Vm.createVm.imgUpload' })}
                    extra={formatMessage({ id: 'Vm.createVm.package' })}
                  >
                    {getFieldDecorator('packageTarFile', {
                      rules: [
                      ]
                    })(
                      uploadMode === 'normal' ? (
                        <Upload
                          fileList={fileList}
                          name="packageTarFile"
                          onChange={this.onChangeUpload}
                          onRemove={this.onRemove}
                          action={this.state.record.upload_url}
                          headers={myheaders}
                          maxCount={1}
                          multiple={false}
                        >
                          <Button>
                            <Icon type="upload" />
                            {formatMessage({ id: 'Vm.createVm.imgUpload' })}
                          </Button>
                        </Upload>
                      ) : (
                        <Fragment>
                          <Upload
                            accept=".img,.qcow2,.iso,.tar,.gz,.xz"
                            beforeUpload={this.handleChunkFileSelect}
                            maxCount={1}
                            showUploadList={false}
                          >
                            <Button>
                              <Icon type="upload" /> {formatMessage({ id: 'teamAdd.create.upload.selectFile' })}
                            </Button>
                          </Upload>
                          {currentFile && (
                            <div style={{ marginTop: 10 }}>
                              <div>
                                <Icon type="file" style={{ marginRight: 8 }} />
                                {currentFile.name}
                                <span style={{ marginLeft: 8, color: '#999' }}>
                                  ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <div style={{ marginTop: 10 }}>
                                <Progress
                                  percent={Math.floor(chunkUploadProgress)}
                                  status={isChunkUploading ? 'active' : 'normal'}
                                />
                              </div>
                              <div style={{ marginTop: 10 }}>
                                {!isChunkUploading && chunkUploadProgress === 0 && (
                                  <Button type="primary" onClick={this.handleStartChunkUpload}>
                                    {formatMessage({ id: 'teamAdd.create.upload.startUpload' })}
                                  </Button>
                                )}
                                {isChunkUploading && (
                                  <Button onClick={this.handlePauseChunkUpload}>
                                    {formatMessage({ id: 'teamAdd.create.upload.pause' })}
                                  </Button>
                                )}
                                {!isChunkUploading && chunkUploadProgress > 0 && chunkUploadProgress < 100 && (
                                  <Button type="primary" onClick={this.handleResumeChunkUpload}>
                                    {formatMessage({ id: 'teamAdd.create.upload.resume' })}
                                  </Button>
                                )}
                                <Button style={{ marginLeft: 8 }} onClick={this.handleCancelChunkUpload}>
                                  {formatMessage({ id: 'teamAdd.create.upload.cancel' })}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Fragment>
                      )
                    )}
                  </Form.Item>
                  <Form.Item
                    {...is_language}
                    label={formatMessage({ id: 'teamAdd.create.fileList' })}
                  >
                    <div
                      style={{
                        display: 'flex'
                      }}
                    >
                      <div>
                        {existFileList.length > 0 ?
                          (existFileList.map((item) => {
                            return (
                              <div className={styles.file}>
                                <Icon style={{ marginRight: '6px' }} type="inbox" />
                                <span className={styles.fileName}>
                                  {item}
                                </span>
                              </div>
                            )
                          })) : (
                            <div className={styles.empty}>
                              {formatMessage({ id: 'teamAdd.create.null_data' })}
                            </div>
                          )}
                      </div>
                      {existFileList.length > 0 &&
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#ff7b7b',
                            padding: '0px 12px',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon onClick={this.handleJarWarUploadDelete} style={{ color: '#fff', cursor: 'pointer' }} type="delete" />
                        </div>
                      }
                    </div>
                  </Form.Item>
                </>
              }
              {radioKey != 'public' &&
                <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.imgName' })} >
                  {getFieldDecorator('image_name', {
                    rules: [
                      { required: true }
                    ]
                  })(<Input placeholder={formatMessage({ id: 'Vm.createVm.saveName' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                </Form.Item>
              }
            </>
          ) : (
            <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.img' })}>
              {getFieldDecorator('image_name', {
                rules: [
                  { required: true, }
                ]
              })(<Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'Vm.createVm.selectImg' })}
              >
                {(virtualMachineImage || []).map(image => {
                  return (
                    <Option key={image.id || image.name} value={image.name}>{this.renderAssetOptionLabel(image)}</Option>
                  );
                })}
              </Select>)}
            </Form.Item>
          )}
          {archLegnth == 2 &&
            <Form.Item {...is_language} label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
              {getFieldDecorator('arch', {
                initialValue: arch,
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
              })(
                <Radio.Group>
                  <Radio value='amd64'>amd64</Radio>
                  <Radio value='arm64'>arm64</Radio>
                </Radio.Group>
              )}
            </Form.Item>}

          {vmCapabilities.gpu_supported && (
            <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.gpu' })}>
              {getFieldDecorator('gpu_enabled', {
                valuePropName: 'checked',
                initialValue: false
              })(
                <Switch />
              )}
            </Form.Item>
          )}
          {vmCapabilities.gpu_supported && form.getFieldValue('gpu_enabled') && (
            <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.gpuResources' })}>
              {getFieldDecorator('gpu_resources', {
                initialValue: [],
                rules: [
                  {
                    validator: this.validateRuntimeResources('gpu_enabled', 'Vm.createVm.gpuResourcesRequired')
                  }
                ]
              })(
                <Select
                  mode="multiple"
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'Vm.createVm.gpuResourcesPlaceholder' })}
                >
                  {(vmCapabilities.gpu_resources || []).map(resource => (
                    <Option key={resource} value={resource}>{resource}</Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          )}

          {vmCapabilities.usb_supported && (
            <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.usb' })}>
              {getFieldDecorator('usb_enabled', {
                valuePropName: 'checked',
                initialValue: false
              })(
                <Switch />
              )}
            </Form.Item>
          )}
          {vmCapabilities.usb_supported && form.getFieldValue('usb_enabled') && (
            <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.usbResources' })}>
              {getFieldDecorator('usb_resources', {
                initialValue: [],
                rules: [
                  {
                    validator: this.validateRuntimeResources('usb_enabled', 'Vm.createVm.usbResourcesRequired')
                  }
                ]
              })(
                <Select
                  mode="multiple"
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'Vm.createVm.usbResourcesPlaceholder' })}
                >
                  {(vmCapabilities.usb_resources || []).map(resource => (
                    <Option key={resource} value={resource}>{resource}</Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          )}

          <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.networkMode' })}>
            {getFieldDecorator('network_mode', {
              initialValue: 'random'
            })(
              <Radio.Group>
                <Radio value="random">{formatMessage({ id: 'Vm.createVm.networkRandom' })}</Radio>
                <Radio value="fixed" disabled={(vmCapabilities.network_modes || []).indexOf('fixed') === -1}>
                  {formatMessage({ id: 'Vm.createVm.networkFixed' })}
                </Radio>
              </Radio.Group>
            )}
          </Form.Item>

          {form.getFieldValue('network_mode') === 'fixed' && (
            <Fragment>
              <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.networkName' })}>
                {getFieldDecorator('network_name', {
                  rules: [
                    { required: true, message: formatMessage({ id: 'Vm.createVm.networkNamePlaceholder' }) }
                  ]
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder={formatMessage({ id: 'Vm.createVm.networkNamePlaceholder' })}
                  >
                    {(vmCapabilities.networks || []).map(item => {
                      const value = `${item.namespace}/${item.name}`;
                      return (
                        <Option key={value} value={value}>{value}</Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
              <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.fixedIP' })}>
                {getFieldDecorator('fixed_ip', {
                  rules: [
                    { required: true, message: formatMessage({ id: 'Vm.createVm.fixedIPPlaceholder' }) }
                  ]
                })(
                  <Input placeholder={formatMessage({ id: 'Vm.createVm.fixedIPPlaceholder' })} />
                )}
              </Form.Item>
            </Fragment>
          )}

          {showSubmitBtn ? (

            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? this.props.handleServiceBotton(
                  <Tooltip title={!isCreate && formatMessage({ id: 'versionUpdata_6_1.noApp' })}>
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByDockerrunLoading}
                    disabled={!isCreate}
                  >
                    {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                  </Button>
                  </Tooltip>
                  , false
                )
                : !handleType && (
                  <Tooltip placement="top" title={vmShow ? null : <><span>{formatMessage({ id: 'Vm.createVm.unInstall' })}</span><a target='_blank' href={host + 'docs/vm-guide/vm_deploy/'}>{formatMessage({id:'Vm.createVm.doc'})}</a></>} key={vmShow}>
                    <Button
                      onClick={this.handleSubmit}
                      type="primary"
                      loading={createAppByDockerrunLoading}
                      disabled={!vmShow}
                    >
                      {formatMessage({ id: 'teamAdd.create.btn.create' })}
                    </Button>
                  </Tooltip>
                )}
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
        <VMAssetCatalogModal
          visible={this.state.assetCatalogVisible}
          assets={virtualMachineImage || []}
          onCancel={this.closeAssetCatalog}
          onUseAsset={this.handleUseAsset}
          onDelete={this.handleDeleteAsset}
        />
      </Fragment>
    );
  }
}
