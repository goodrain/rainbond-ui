/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio, Upload, Icon, notification, Tooltip, Checkbox, Row, Col, Spin, Empty, Divider, Progress, message } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import AddImage from '../../components/AddImage';
import globalUtil from '../../utils/global';
import PluginUtil from '../../utils/pulginUtils'
import { pinyin } from 'pinyin-pro';
import role from '@/utils/newRole';
import cookie from '../../utils/cookie';
import ChunkUploader from '../../utils/ChunkUploader';
import styles from './index.less';
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
      addImage: false,
      warehouseList: [],
      isHub: true,
      warehouseImageList: [],
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
    const { dispatch } = this.props
    dispatch({
      type: 'global/fetchPlatformImageHub',
      callback: data => {
        if (data) {
          this.setState({
            warehouseList: data.list
          });
        }
      }
    })
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
    role.refreshPermissionsInfo(groupId, false,this.callbcak)
    this.cancelAddGroup();
  };
  callbcak=(val)=>{
    this.setState({ creatComPermission: val })
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo, imgRepostoryList, secretId, isPublic = true, pluginsList } = this.props;
    const { radioKey, event_id, checkedValues, warehouseInfo, isHub } = this.state
    const group_id = globalUtil.getAppID()
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if (archInfo && archInfo.length != 2 && archInfo.length != 0) {
          fieldsValue.arch = archInfo[0]
        }
        if (fieldsValue.docker_image && fieldsValue.image_tag) {
          fieldsValue.docker_cmd = `${fieldsValue.docker_image}:${fieldsValue.image_tag}`
        }
        if (fieldsValue.imagefrom == 'upload') {
          fieldsValue.docker_cmd = `event ${event_id}`
        }
        if(!isPublic){
          const secretObj = imgRepostoryList && imgRepostoryList.find(item => item.secret_id === secretId)
          if(secretObj){
            fieldsValue.user_name = secretObj.username
            fieldsValue.password = secretObj.password
          }
        }
        const isCloudProxy = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill');
        if(fieldsValue.imagefrom == 'address' && isCloudProxy){
          fieldsValue.docker_cmd = this.processImageProxy(fieldsValue.docker_cmd)
        }
        if(group_id){
          fieldsValue.group_id = group_id
        }
        if(!fieldsValue.k8s_app || !fieldsValue.group_name){
          fieldsValue.group_name = fieldsValue.service_cname
          fieldsValue.k8s_app = this.generateEnglishName(fieldsValue.service_cname)
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
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
    }
  };

  handleValiateCmd = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'placeholder.docker_cmd' })));
    }
    if (value) {
      const Reg = /^[^\s]*$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({ id: 'mirror.name.space' }))
        );
      }
      callback();
    }
  };
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
    if (name != undefined) {
      const { comNames } = this.state;
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      const cleanedPinyinName = pinyinName.toLowerCase();
      if (comNames && comNames.length > 0) {
        const isExist = comNames.some(item => item === cleanedPinyinName);
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
          if (data?.bean?.package_name && data?.bean?.package_name.length > 0) {
            this.setState({
              existFileList: data.bean.package_name
            });
            this.loop = false
          }
        }
        if (this.loop) {
          setTimeout(() => {
            this.handleJarWarUploadStatus();
          }, 3000);
        }
      },
      handleError: () => { }
    });
  };
  //删除上传文件
  handleJarWarUploadDelete = () => {
    const { event_id } = this.state
    const { dispatch } = this.props
    dispatch({
      type: "createApp/deleteJarWarUploadStatus",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: (data) => {
        if (data.bean.res == 'ok') {
          this.setState({
            existFileList: []
          });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          })
          this.handleJarWarUpload()
        }
      },
    });
  }
  // 切换镜像来源
  handleChangeImageSource = (key) => {
    const { form } = this.props
    this.setState({
      radioKey: key.target.value,
      warehouseImageTags: [],
      checkedValues: '',
      isHub: true,
      warehouseInfo: false,
      domain: '',
      showUsernameAndPass: false
    })
    form.resetFields(['docker_cmd', 'user_name', 'password'])
  }
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
      message.error('只支持 .tar 格式的文件');
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
      message.warning('请先选择文件');
      return;
    }

    if (!chunkUploader) {
      message.error('上传器初始化失败');
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
      message.error('上传失败: ' + (error.message || '未知错误'));
      this.setState({ isChunkUploading: false });
    }
  };

  // 暂停分片上传
  handlePauseChunkUpload = () => {
    const { chunkUploader } = this.state;
    if (chunkUploader) {
      chunkUploader.pause();
      this.setState({ isChunkUploading: false });
      message.info('上传已暂停');
    }
  };

  // 继续分片上传（断点续传）
  handleResumeChunkUpload = async () => {
    const { chunkUploader } = this.state;

    if (!chunkUploader) {
      message.error('未找到上传任务');
      return;
    }

    this.setState({ isChunkUploading: true });

    try {
      await chunkUploader.resume((progress) => {
        this.setState({ chunkUploadProgress: progress });
      });

      notification.success({
        message: '断点续传完成'
      });

      this.setState({
        isChunkUploading: false,
        chunkUploadProgress: 100
      });

      // 刷新上传状态
      this.handleJarWarUploadStatus();
    } catch (error) {
      console.error('断点续传失败:', error);
      message.error('续传失败: ' + (error.message || '未知错误'));
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
      message.info('上传已取消');
    }
  };
  // 获取本地列表选择的镜像
  handleChangeLocalValue = (value) => {
    this.setState({
      localValue: value
    }, () => {
      this.handleGetImageTags(value)
    })
  }
  // 获取本地镜像的Tags
  handleGetImageTags = (imageValue) => {
    const { dispatch } = this.props
    dispatch({
      type: 'createApp/getImageTags',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        repository: imageValue,
      },
      callback: data => {
        if (data) {
          this.setState({
            localImageTags: data.list
          });
        }
      }
    })
  }

  // 获取镜像中所有的tag
  handleGetWarehouseImageTags = (value) => {
    const { dispatch } = this.props
    const { warehouseInfo, isHub, checkedValues, domain } = this.state
    dispatch({
      type: 'teamControl/fetchImageTags',
      payload: {
        regionName: globalUtil.getCurrRegionName(),
        repo: value,
        domain: isHub ? (domain || 'docker.io') : warehouseInfo.domain,
        username: warehouseInfo.username,
        password: warehouseInfo.password,
      },
      callback: data => {
        if (data) {
          if(checkedValues && data.bean.tags.length > 0){
            const resItem = data.bean.tags.some((item)=>{
              return item == checkedValues && item
            })
            this.setState({
              warehouseImageTags: resItem ? [checkedValues] : [],
              checkedValues: checkedValues,
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
      handleError: (err) => {
        this.setState({ 
          tagLoading: false,
          warehouseImageTags: [],
          checkedValues: '',
        })
      }
    })
  }
  onChangeCheckbox = (e) => {
    this.setState({
      checkedValues: e.target.value
    })
  }
  onChangeRegistry = (value) => {
    const { warehouseList } = this.state
    const { setFieldsValue } = this.props.form
    if(value == 'DockerHub'){
      this.setState({
        warehouseImageTags: [],
        warehouseInfo: false,
        isHub: true,
        checkedValues: ''
      })
    } else {
      this.setState({
        isHub: false,
        warehouseImageTags: [],
        warehouseInfo: false,
        checkedValues: ''
      },()=>{
        warehouseList.map(item => {
          if(item.secret_id == value){
            this.setState({
              warehouseInfo: item
            })
          }
        })
      })
    }
  }

  onQueryImageName = (e) => {
    const { setFieldsValue } = this.props.form
    const { isHub } = this.state
    this.setState({ tagLoading: true })
    const values = e.target.value
    const url = values.match(/([\w\.-]+)\/([\w\\/-]+)/)
    const colonIndex = values.indexOf(':');
    if(url && isHub){
      if (colonIndex !== -1) {
        const resultString = values.substring(0, colonIndex);
        const tag = values.substring(colonIndex + 1);
        this.setState({
          checkedValues: tag,
          domain: url[1]
        },() => {
          this.handleGetWarehouseImageTags(url[2])
        })
      } else {
        this.setState({
          checkedValues: '',
          domain: url[1]
        },() => {
          this.handleGetWarehouseImageTags(url[2])
        })
      }
    } else {
      if (colonIndex !== -1) {
        const resultString = values.substring(0, colonIndex);
        const tag = values.substring(colonIndex + 1);
        this.setState({
          checkedValues: tag,
          domain: ''
        },() => {
          this.handleGetWarehouseImageTags(resultString)
        })
      } else {
        this.setState({
          checkedValues: '',
          domain: ''
        },() => {
          this.handleGetWarehouseImageTags(values)
        })
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
    const { language, fileList, radioKey, existFileList, localValue, localImageTags, warehouseList, isHub, warehouseImageList, warehouseImageTags, tagLoading, checkedValues,      creatComPermission: {
      isCreate
    } } = this.state;
    const group_id = globalUtil.getAppID()
    const myheaders = {};
    const data = this.props.data || {};
    const disableds = this.props.disableds || [];
    const isService = handleType && handleType === 'Service';
    const is_language = language ? formItemLayout : formItemLayouts;
    const isImageProxy = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-bill')
    let arch = 'amd64'
    let archLegnth = archInfo?.length || 0
    if (archLegnth == 2) {
      arch = 'amd64'
    } else if (archLegnth == 1) {
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || (selectedImage && selectedImage.name)  || '',
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
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.from' })}>
            {getFieldDecorator('imagefrom', {
              initialValue: 'address',
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
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
                rules: [
                  { required: true, message: formatMessage({ id: 'placeholder.warehouse_not_empty' }) },
                  // 长度255
                  { max: 255, message: formatMessage({ id: 'mirror.length.limit' }) },
                  // 不允许输入中文、空格
                  { pattern: /^[^\u4e00-\u9fa5\s]*$/, message: formatMessage({ id: 'mirror.input.rule' }) }
                ]
              })(
                <Input onPressEnter={this.onQueryImageName} placeholder={formatMessage({ id: 'placeholder.docker_cmd' })} disabled={!isPublic} />
                )}
            </Form.Item>
          }
          {radioKey === 'cmd' &&
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
              {getFieldDecorator('docker_cmd', {
                initialValue: '',
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.dockerRunMsg' }) }]
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
                label="上传方式"
              >
                <Radio.Group onChange={this.onUploadModeChange} value={this.state.uploadMode}>
                  <Radio value="normal">普通上传</Radio>
                  <Radio value="chunk">断点续传</Radio>
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
                          <Icon type="upload" /> 选择文件
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
                                开始上传
                              </Button>
                            )}
                            {this.state.isChunkUploading && (
                              <Button onClick={this.handlePauseChunkUpload}>
                                暂停
                              </Button>
                            )}
                            {!this.state.isChunkUploading && this.state.chunkUploadProgress > 0 && this.state.chunkUploadProgress < 100 && (
                              <Button type="primary" onClick={this.handleResumeChunkUpload}>
                                继续上传
                              </Button>
                            )}
                            <Button style={{ marginLeft: 8 }} onClick={this.handleCancelChunkUpload}>
                              取消
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
                rules: [{ required: false, message: formatMessage({ id: 'placeholder.username_1' }) }]
              })(<Input autoComplete="off" placeholder={formatMessage({ id: 'placeholder.username_1' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
            </Form.Item>
            <Form.Item
              style={{ display: this.state.showUsernameAndPass ? '' : 'none' }}
              {...is_language}
              label={formatMessage({ id: 'teamAdd.create.form.password' })}
            >
              {getFieldDecorator('password', {
                initialValue: data.password || '',
                rules: [{ required: false, message: formatMessage({ id: 'placeholder.password_1' }) }]
              })(
                <Input
                  autoComplete="new-password"
                  type="password"
                  placeholder={formatMessage({ id: 'placeholder.password_1' })}
                />
              )}
            </Form.Item>
          </>}

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
          {!group_id && <>
            <Divider />
            <div className="advanced-btn" style={{ justifyContent: 'flex-start', marginLeft: 2 }}>
              <Button type="link" style={{ fontWeight: 500, fontSize: 18, padding: 0 }} onClick={() => this.setState({ showAdvanced: !this.state.showAdvanced })}>
                高级选项 {this.state.showAdvanced ? <span style={{ fontSize: 16 }}>&#94;</span> : <span style={{ fontSize: 16 }}>&#8964;</span>}
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
                    rules: [
                      { required: true, message: formatMessage({ id: 'popover.newApp.appName.placeholder' }) },
                      {
                        max: 24,
                        message: formatMessage({ id: 'placeholder.max24' })
                      }
                    ]
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
                    rules: [
                      { required: true, message: formatMessage({ id: 'placeholder.k8s_component_name' }) },
                      { validator: this.handleValiateNameSpace }
                    ]
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
