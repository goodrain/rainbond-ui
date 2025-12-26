/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio, Upload, Icon, notification, Tooltip, Checkbox, Divider } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global';
import PluginUtil from '../../utils/pulginUtils';
import { pinyin } from 'pinyin-pro';
import role from '@/utils/newRole';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import ChunkUploader from '../../utils/ChunkUploader';
import styles from './index.less';
import {
  validateServiceName,
  validateK8sComponentName,
  getServiceNameRules,
  getK8sComponentNameRules,
  getImageSourceRules,
  getImageAddressRules,
  getDockerRunCmdRules,
  getUsernameRules,
  getPasswordRules,
  getArchRules,
  getAppNameRules
} from './validations';
const { Option } = Select;
const { TextArea } = Input;
const formItemLayout = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};
const formItemLayouts = {
  labelCol: {
    span: 24
  },
  wrapperCol: {
    span: 24
  }
};

@connect(
  ({ global, loading, teamControl }) => ({
    groups: global.groups,
    createAppByDockerrunLoading: loading.effects['createApp/createAppByDockerrun'],
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    pluginsList: teamControl.pluginsList,
    rainbondInfo: global.rainbondInfo,
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
      comNames: [],
      radioKey: 'address',
      fileList: [],
      existFileList: [],
      localValue: null,
      localImageTags: [],
      event_id: '',
      record: {},
      warehouseList: [],
      isHub: true,
      warehouseInfo: false,
      tagLoading: false,
      warehouseImageTags: [],
      checkedValues: '',
      domain: '',
      creatComPermission: {},
      showAdvanced: false,
      uploadMode: 'normal', // 'normal' 或 'chunk'
      chunkUploadProgress: 0,
      isChunkUploading: false,
      currentFile: null,
      chunkUploader: null
    };
  }
  componentWillMount() {
    this.loop = false;
  }
  componentWillUnmount() {
    this.loop = false;
  }
  componentDidMount() {
    this.handleJarWarUpload();
    this.handleGetWarehouse();
    const { handleType, groupId } = this.props;
    const group_id = globalUtil.getAppID()
    if(group_id){
      this.setState({
        creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
      })
    }
    if (handleType && handleType === 'Service') {
      this.fetchComponentNames(Number(groupId));
    }
  }
  handleGetWarehouse = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchPlatformImageHub',
      callback: data => {
        if (data) {
          this.setState({
            warehouseList: data.list
          });
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
    role.refreshPermissionsInfo(groupId, false, this.handlePermissionCallback);
    this.cancelAddGroup();
  };

  handlePermissionCallback = (val) => {
    this.setState({ creatComPermission: val });
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo, imgRepostoryList, secretId, isPublic = true, pluginsList } = this.props;
    const { event_id } = this.state;
    const group_id = globalUtil.getAppID();

    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        // 处理架构信息
        if (archInfo && archInfo.length !== 2 && archInfo.length !== 0) {
          fieldsValue.arch = archInfo[0];
        }

        // 处理本地镜像
        if (fieldsValue.docker_image && fieldsValue.image_tag) {
          fieldsValue.docker_cmd = `${fieldsValue.docker_image}:${fieldsValue.image_tag}`;
        }

        // 处理上传镜像
        if (fieldsValue.imagefrom === 'upload') {
          fieldsValue.docker_cmd = `event ${event_id}`;
        }

        // 处理私有镜像仓库凭证
        if (!isPublic) {
          const secretObj = imgRepostoryList && imgRepostoryList.find(item => item.secret_id === secretId);
          if (secretObj) {
            fieldsValue.user_name = secretObj.username;
            fieldsValue.password = secretObj.password;
          }
        }

        // 处理镜像代理
        const isCloudProxy = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');
        if (fieldsValue.imagefrom === 'address' && isCloudProxy) {
          fieldsValue.docker_cmd = this.processImageProxy(fieldsValue.docker_cmd);
        }

        // 设置应用组 ID
        if (group_id) {
          fieldsValue.group_id = group_id;
        }

        // 设置应用组名称和 K8s 应用名
        if (!fieldsValue.k8s_app || !fieldsValue.group_name) {
          fieldsValue.group_name = fieldsValue.service_cname;
          fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname);
        }

        onSubmit(fieldsValue);
      }
    });
  };

  processImageProxy = (inputImage) => {
    if (!inputImage) return inputImage; // 空值处理
  
    // 定义代理域名常量
    const PROXY_DOMAIN = 'dockerhub.rainbond.cn';
    const OFFICIAL_REPO = 'library';
  
    // 先判断是否包含斜杠
    if (inputImage.includes('/')) {
      // 如果有斜杠，取第一个斜杠前的内容判断是否是域名
      const firstPart = inputImage.split('/')[0];
      
      // 如果是docker.io，直接替换成dockerhub.rainbond.cn
      if (firstPart === 'docker.io') {
        return inputImage.replace('docker.io', PROXY_DOMAIN);
      }
      
      const isDomain = /^([a-zA-Z0-9]+\.[a-zA-Z]+)|([a-zA-Z0-9]+:[0-9]+)|localhost/.test(firstPart);
      if (isDomain) return inputImage;
    }

    // 拆分镜像名称和标签
    const [imagePart, ...tagParts] = inputImage.split(':');
    const tag = tagParts.length > 0 ? `:${tagParts.join(':')}` : ':latest';
    
    // 处理不同层级的镜像名称
    const parts = imagePart.split('/');
    switch (parts.length) {
      case 1: // 无命名空间（如 nginx）
        return `${PROXY_DOMAIN}/${OFFICIAL_REPO}/${imagePart}${tag}`;
      case 2: // 包含命名空间（如 rainbond/nginx）
        return `${PROXY_DOMAIN}/${imagePart}${tag}`;
      default: // 多级路径视为自定义仓库
        return `${inputImage}`;
    }
  }
  
  
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
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
            comNames: res.bean.component_names && res.bean.component_names.length > 0 ? res.bean.component_names : []
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  // 生成英文名
  generateEnglishName = (name) => {
    if (name === undefined) {
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
  }

  handleJarWarUpload = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    // 获取上传事件
    dispatch({
      type: 'createApp/createJarWarServices',
      payload: {
        region: regionName,
        team_name: teamName,
        component_id: ''
      },
      callback: res => {
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
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }
  // 查询上传状态
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
        if (data) {
          if (data?.bean?.package_name && data?.bean?.package_name.length > 0) {
            this.setState({
              existFileList: data.bean.package_name
            });
            this.loop = false;
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
        this.loop = false;
      }
    });
  };
  // 删除上传文件
  handleJarWarUploadDelete = () => {
    const { event_id } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'createApp/deleteJarWarUploadStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: data => {
        if (data.bean.res === 'ok') {
          this.setState({
            existFileList: []
          });
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
  }
  // 切换镜像来源
  handleChangeImageSource = (e) => {
    const { form } = this.props;
    this.setState({
      radioKey: e.target.value,
      warehouseImageTags: [],
      checkedValues: '',
      isHub: true,
      warehouseInfo: false,
      domain: '',
      showUsernameAndPass: false
    });
    form.resetFields(['docker_cmd', 'user_name', 'password']);
  }
  // 上传文件
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

  // 删除文件
  onRemove = () => {
    this.setState({ fileList: [] });
  };

  // 切换上传方式
  onUploadModeChange = (e) => {
    this.setState({ uploadMode: e.target.value });
  };

  // 处理分片上传文件选择
  handleChunkFileSelect = (file) => {
    const { event_id, record } = this.state;

    // 检查文件类型
    const allowedTypes = ['.tar'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.fileTypeTar' }));
      return false;
    }

    this.setState({ currentFile: file });

    // 创建 ChunkUploader 实例
    const uploader = new ChunkUploader(file, event_id, {
      uploadUrl: record.upload_url,
      chunkSize: 5 * 1024 * 1024, // 5MB
      concurrency: 5
    });

    this.setState({ chunkUploader: uploader });

    // 阻止默认上传行为
    return false;
  };

  // 开始分片上传
  handleStartChunkUpload = async () => {
    const { chunkUploader, currentFile } = this.state;
    const { form } = this.props;

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

      // 设置虚拟文件列表，与普通上传保持一致
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

      // 设置表单字段值，与普通上传保持一致
      form.setFieldsValue({
        packageTarFile: virtualFileList
      });

      // 刷新上传状态
      this.handleJarWarUploadStatus();
    } catch (error) {
      console.error('分片上传失败:', error);
      message.error(formatMessage({ id: 'teamAdd.create.upload.uploadFailed' }) + ': ' + (error.message || 'Unknown error'));
      this.setState({ isChunkUploading: false });
    }
  };

  // 暂停分片上传
  handlePauseChunkUpload = () => {
    const { chunkUploader } = this.state;
    if (chunkUploader) {
      chunkUploader.pause();
      this.setState({ isChunkUploading: false });
      message.info(formatMessage({ id: 'teamAdd.create.upload.pauseSuccess' }));
    }
  };

  // 继续分片上传（断点续传）
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

      // 刷新上传状态
      this.handleJarWarUploadStatus();
    } catch (error) {
      console.error('断点续传失败:', error);
      message.error(formatMessage({ id: 'teamAdd.create.upload.resumeFailed' }) + ': ' + (error.message || 'Unknown error'));
      this.setState({ isChunkUploading: false });
    }
  };

  // 取消分片上传
  handleCancelChunkUpload = async () => {
    const { chunkUploader } = this.state;

    if (chunkUploader) {
      await chunkUploader.cancel();
      this.setState({
        isChunkUploading: false,
        chunkUploadProgress: 0,
        currentFile: null,
        chunkUploader: null
      });
      message.info(formatMessage({ id: 'teamAdd.create.upload.cancelSuccess' }));
    }
  };
  // 获取本地列表选择的镜像
  handleChangeLocalValue = (value) => {
    this.setState({
      localValue: value
    }, () => {
      this.handleGetImageTags(value);
    });
  }
  // 获取本地镜像的Tags
  handleGetImageTags = (imageValue) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'createApp/getImageTags',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        repository: imageValue
      },
      callback: data => {
        if (data) {
          this.setState({
            localImageTags: data.list
          });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }

  // 获取镜像中所有的tag
  handleGetWarehouseImageTags = (value) => {
    const { dispatch } = this.props;
    const { warehouseInfo, isHub, checkedValues, domain } = this.state;
    dispatch({
      type: 'teamControl/fetchImageTags',
      payload: {
        regionName: globalUtil.getCurrRegionName(),
        repo: value,
        domain: isHub ? (domain || 'docker.io') : warehouseInfo.domain,
        username: warehouseInfo.username,
        password: warehouseInfo.password
      },
      callback: data => {
        if (data) {
          if (checkedValues && data.bean.tags.length > 0) {
            const resItem = data.bean.tags.some(item => item == checkedValues);
            this.setState({
              warehouseImageTags: resItem ? [checkedValues] : [],
              checkedValues,
              tagLoading: false
            });
          } else {
            this.setState({
              warehouseImageTags: data.bean.tags,
              checkedValues: data.bean.tags[0] || '',
              tagLoading: false
            });
          }
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({
          tagLoading: false,
          warehouseImageTags: [],
          checkedValues: ''
        });
      }
    });
  }
  onChangeCheckbox = (e) => {
    this.setState({
      checkedValues: e.target.value
    });
  }

  onChangeRegistry = (value) => {
    const { warehouseList } = this.state;
    if (value === 'DockerHub') {
      this.setState({
        warehouseImageTags: [],
        warehouseInfo: false,
        isHub: true,
        checkedValues: ''
      });
    } else {
      this.setState({
        isHub: false,
        warehouseImageTags: [],
        warehouseInfo: false,
        checkedValues: ''
      }, () => {
        const selectedWarehouse = warehouseList.find(item => item.secret_id === value);
        if (selectedWarehouse) {
          this.setState({
            warehouseInfo: selectedWarehouse
          });
        }
      });
    }
  }

  onQueryImageName = (e) => {
    const { isHub } = this.state;
    this.setState({ tagLoading: true });

    const values = e.target.value;
    const url = values.match(/([\w\.-]+)\/([\w\\/-]+)/);
    const colonIndex = values.indexOf(':');

    if (url && isHub) {
      if (colonIndex !== -1) {
        const tag = values.substring(colonIndex + 1);
        this.setState({
          checkedValues: tag,
          domain: url[1]
        }, () => {
          this.handleGetWarehouseImageTags(url[2]);
        });
      } else {
        this.setState({
          checkedValues: '',
          domain: url[1]
        }, () => {
          this.handleGetWarehouseImageTags(url[2]);
        });
      }
    } else {
      if (colonIndex !== -1) {
        const resultString = values.substring(0, colonIndex);
        const tag = values.substring(colonIndex + 1);
        this.setState({
          checkedValues: tag,
          domain: ''
        }, () => {
          this.handleGetWarehouseImageTags(resultString);
        });
      } else {
        this.setState({
          checkedValues: '',
          domain: ''
        }, () => {
          this.handleGetWarehouseImageTags(values);
        });
      }
    }
  }
  render() {
    const { form, localList } = this.props;
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      createAppByDockerrunLoading,
      handleType,
      ButtonGroupState,
      groupId,
      showSubmitBtn = true,
      showCreateGroup = true,
      archInfo,
      isPublic = true,
      selectedImage = false,
      imageUrl = false,
      tag = false,
      rainbondInfo,
      pluginsList
    } = this.props;
    const {
      language,
      fileList,
      radioKey,
      existFileList,
      localValue,
      localImageTags,
      warehouseList,
      isHub,
      warehouseImageTags,
      tagLoading,
      checkedValues,
      creatComPermission: { isCreate }
    } = this.state;
    const group_id = globalUtil.getAppID();
    const myheaders = {};
    const data = this.props.data || {};
    const disableds = this.props.disableds || [];
    const isService = handleType && handleType === 'Service';
    const is_language = language ? formItemLayout : formItemLayouts;
    const isImageProxy = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');

    let arch = 'amd64';
    const archLength = archInfo?.length || 0;
    if (archLength === 2) {
      arch = 'amd64';
    } else if (archLength === 1) {
      arch = archInfo && archInfo[0];
    }
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || (selectedImage && selectedImage.name)  || '',
              rules: getServiceNameRules()
            })(
              <Input
                disabled={disableds.indexOf('service_cname') > -1}
                placeholder={formatMessage({ id: 'placeholder.service_cname' })}
                style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              />
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname') || ''),
              rules: getK8sComponentNameRules()
            })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.from' })}>
            {getFieldDecorator('imagefrom', {
              initialValue: 'address',
              rules: getImageSourceRules()
            })(
              isPublic ? (
                <Radio.Group onChange={this.handleChangeImageSource}>
                  <Radio value='address'>
                    {formatMessage({ id: 'teamAdd.create.image.address'})}
                </Radio>
                <Radio value='cmd'>
                  {formatMessage({ id: 'teamAdd.create.image.docker_cmd'})}
                </Radio>
                {!isImageProxy &&
                <>
                  <Radio value='upload'>
                    {formatMessage({ id: 'teamAdd.create.image.upload'})}
                  </Radio>
                  <Radio value='local'>
                    {formatMessage({ id: 'teamAdd.create.image.local'})}
                  </Radio>
                </>}
                </Radio.Group>
              ) : (
                <Radio.Group onChange={this.handleChangeImageSource}>
                  <Radio value='address'>
                    {formatMessage({ id: 'teamAdd.create.image.private'})}
                  </Radio>
                </Radio.Group>
              )
            )}
          </Form.Item>
          {radioKey === 'address' &&
            <Form.Item
              {...is_language}
              label={formatMessage({ id: 'teamAdd.create.image.mirrorAddress' })}
              extra={isImageProxy ? '默认启用DockerHub镜像加速' : ''}
            >
              {getFieldDecorator('docker_cmd', {
                initialValue: imageUrl || '',
                rules: getImageAddressRules()
              })(
                <Input onPressEnter={this.onQueryImageName} placeholder={formatMessage({ id: 'placeholder.docker_cmd' })} disabled={!isPublic} />
                )}
            </Form.Item>
          }
          {radioKey === 'cmd' &&
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
              {getFieldDecorator('docker_cmd', {
                initialValue: '',
                rules: getDockerRunCmdRules()
              })(
                <TextArea placeholder={formatMessage({ id: 'placeholder.dockerRun' })}/>
              )}
            </Form.Item>
          }
          {radioKey === 'local' &&
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.change_image'})}>
              <Form.Item style={{ display: 'inline-block', width: 'calc(70% - 8px)' }}>
                {getFieldDecorator('docker_image', {
                  initialValue: '',
                  rules: [{ required: true, message: formatMessage({ id: 'placeholder.dockerRunMsg' }) }]
                })(
                  <Select onChange={this.handleChangeLocalValue}>
                    {(localList || []).map(item => (
                      <Option value={item}>
                        <Tooltip title={item}>
                          {item}
                        </Tooltip>
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
              <div style={{ display: 'inline-block', width: '16px', textAlign: 'center' }}>:</div>

              <Form.Item style={{ display: 'inline-block', width: 'calc(30% - 8px)' }}>
                {getFieldDecorator('image_tag', {
                  initialValue: '',
                  rules: [{ required: true, message: formatMessage({ id: 'placeholder.dockerRunMsg' }) }]
                })(
                  <Select disabled={!localValue}>
                    {(localImageTags || []).map(item => (
                      <Option value={item}>
                        <Tooltip title={item}>
                          {item}
                        </Tooltip>
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Form.Item>
          }
          {radioKey === 'upload' &&
            <>
              <Form.Item
                {...is_language}
                label={formatMessage({ id: 'teamAdd.create.upload.mode' })}
              >
                <Radio.Group onChange={this.onUploadModeChange} value={this.state.uploadMode}>
                  <Radio value="normal">{formatMessage({ id: 'teamAdd.create.upload.mode.normal' })}</Radio>
                  <Radio value="chunk">{formatMessage({ id: 'teamAdd.create.upload.mode.chunk' })}</Radio>
                </Radio.Group>
              </Form.Item>

              {this.state.uploadMode === 'normal' ? (
                <Form.Item
                  {...is_language}
                  label={formatMessage({ id: 'Vm.createVm.imgUpload' })}
                  extra={formatMessage({ id: 'teamAdd.create.image.extra_image'})}
                >
                  {getFieldDecorator('packageTarFile', {
                    rules: [
                    ]
                  })(
                    <>
                      <Upload
                        fileList={fileList}
                        accept='.tar'
                        name="packageTarFile"
                        onChange={this.onChangeUpload}
                        onRemove={this.onRemove}
                        action={this.state.record.upload_url}
                        headers={myheaders}
                        multiple={true}
                      >

                        <Button>
                          <Icon type="upload" />
                          {formatMessage({ id: 'Vm.createVm.imgUpload' })}
                        </Button>
                      </Upload>
                    </>
                  )}
                </Form.Item>
              ) : (
                <Form.Item
                  {...is_language}
                  label={formatMessage({ id: 'Vm.createVm.imgUpload' })}
                  extra={formatMessage({ id: 'teamAdd.create.image.extra_image'})}
                >
                  {getFieldDecorator('packageTarFile', {
                    rules: [
                    ]
                  })(
                    <>
                      <Upload
                        accept=".tar"
                        beforeUpload={this.handleChunkFileSelect}
                        maxCount={1}
                        showUploadList={false}
                      >
                        <Button>
                          <Icon type="upload" /> {formatMessage({ id: 'teamAdd.create.upload.selectFile' })}
                        </Button>
                      </Upload>
                      {this.state.currentFile && (
                        <div style={{ marginTop: 10 }}>
                          <div>
                            <Icon type="file" style={{ marginRight: 8 }} />
                            {this.state.currentFile.name}
                            <span style={{ marginLeft: 8, color: '#999' }}>
                              ({(this.state.currentFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <Progress
                              percent={Math.floor(this.state.chunkUploadProgress)}
                              status={this.state.isChunkUploading ? 'active' : 'normal'}
                            />
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {!this.state.isChunkUploading && this.state.chunkUploadProgress === 0 && (
                              <Button type="primary" onClick={this.handleStartChunkUpload}>
                                {formatMessage({ id: 'teamAdd.create.upload.startUpload' })}
                              </Button>
                            )}
                            {this.state.isChunkUploading && (
                              <Button onClick={this.handlePauseChunkUpload}>
                                {formatMessage({ id: 'teamAdd.create.upload.pause' })}
                              </Button>
                            )}
                            {!this.state.isChunkUploading && this.state.chunkUploadProgress > 0 && this.state.chunkUploadProgress < 100 && (
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
                    </>
                  )}
                </Form.Item>
              )}
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
          {(radioKey === 'cmd' || radioKey === 'address') && isPublic &&
            <Form.Item {...is_language}>
              <Checkbox
                checked={this.state.showUsernameAndPass}
                onChange={(e) => {
                  this.setState({ showUsernameAndPass: e.target.checked });
                }}
              >
                {formatMessage({ id: 'teamAdd.create.image.hint1' })} {formatMessage({ id: 'teamAdd.create.image.hint2' })}
              </Checkbox>
            </Form.Item>
          }
          {(radioKey === 'cmd' || radioKey === 'address') && isPublic && <>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...is_language}
              label={formatMessage({ id: 'teamAdd.create.form.user' })}
            >
              {getFieldDecorator('user_name', {
                initialValue: data.user_name || '',
                rules: getUsernameRules()
              })(<Input autoComplete="off" placeholder={formatMessage({ id: 'placeholder.username_1' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...is_language}
              label={formatMessage({ id: 'teamAdd.create.form.password' })}
            >
              {getFieldDecorator('password', {
                initialValue: data.password || '',
                rules: getPasswordRules()
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  placeholder={formatMessage({ id: 'placeholder.password_1' })}
                />
              )}
            </Form.Item>
          </>}

          {archLength === 2 &&
            <Form.Item {...is_language} label={formatMessage({ id: 'enterpriseColony.mgt.node.framework' })}>
              {getFieldDecorator('arch', {
                initialValue: arch,
                rules: getArchRules()
              })(
                <Radio.Group>
                  <Radio value='amd64'>amd64</Radio>
                  <Radio value='arm64'>arm64</Radio>
                </Radio.Group>
              )}
            </Form.Item>}
          {!group_id && <>
            <Divider />
            <div className="advanced-btn" style={{ marginBottom: 16 }}>
              <Button
                type="link"
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  // color: '#1890ff'
                }}
                onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}
              >
                <Icon type={this.state.showAdvanced ? "up" : "down"} style={{ marginRight: 6 }} />
                {formatMessage({ id: 'kubeblocks.database.create.form.advanced.title' })}
              </Button>
            </div>
            {this.state.showAdvanced && (
              <div
                className="userpass-card"
                style={{
                  margin: '24px 0',
                  background: '#fafbfc',
                  border: '1px solid #e6e6e6',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px #f0f1f2',
                  padding: 24,
                }}>
                <div className="advanced-divider" style={{ margin: '0 0 16px 0' }} />
                <Form.Item
                  label={formatMessage({ id: 'popover.newApp.appName' })}
                  colon={false}
                  {...formItemLayout}
                  style={{ marginBottom: 18 }}
                >
                  {getFieldDecorator('group_name', {
                    initialValue: this.props.form.getFieldValue('service_cname') || '',
                    rules: getAppNameRules()
                  })(<Input
                    placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })}
                    style={{
                      borderRadius: 6,
                      height: 40,
                      fontSize: 15,
                      boxShadow: '0 1px 3px #f0f1f2',
                      border: '1px solid #e6e6e6',
                      transition: 'border 0.2s, box-shadow 0.2s'
                    }}
                  />
                  )}
                </Form.Item>
                <Form.Item {...formItemLayout} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
                  {getFieldDecorator('k8s_app', {
                    initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                    rules: getK8sComponentNameRules()
                  })(<Input
                    placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })}
                    style={{
                      borderRadius: 6,
                      height: 40,
                      fontSize: 15,
                      boxShadow: '0 1px 3px #f0f1f2',
                      border: '1px solid #e6e6e6',
                      transition: 'border 0.2s, box-shadow 0.2s'
                    }}
                  />
                  )}
                </Form.Item>
              </div>
            )}
          </>}
          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: {
                  span: 24,
                  offset: 0
                },
                sm: {
                  span: 24,
                  offset: 0
                }
              }}
              label=""
            >
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {isService && ButtonGroupState
                  ? this.props.handleServiceBotton(
                      <Button
                        onClick={this.handleSubmit}
                        type="primary"
                        loading={createAppByDockerrunLoading}
                      >
                       {formatMessage({id: 'teamAdd.create.btn.createComponent'})}
                      </Button>,
                      false
                    )
                  : !handleType && (
                      <Button
                        onClick={this.handleSubmit}
                        type="primary"
                        loading={createAppByDockerrunLoading}
                      >
                        {formatMessage({id: 'teamAdd.create.btn.create'})}
                      </Button>
                    )}
              </div>
            </Form.Item>
          ) : null}
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}
