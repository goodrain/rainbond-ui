/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio, Upload, Icon, notification, Tooltip, Checkbox, Row, Col, Spin, Empty } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import AddImage from '../../components/AddImage';
import globalUtil from '../../utils/global';
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
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
  ({ global, loading }) => ({
    groups: global.groups,
    createAppByDockerrunLoading:
      loading.effects['createApp/createAppByDockerrun']
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
      imageNameInfo: '',
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
    this.cancelAddGroup();
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo } = this.props;
    const { radioKey, event_id, checkedValues, warehouseInfo, isHub, imageNameInfo } = this.state
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
        if(fieldsValue.imagefrom == 'address'){
          if(isHub){
            fieldsValue.docker_cmd = fieldsValue.docker_cmd
          } else {
            const cleanedUrl = warehouseInfo.domain.replace(/^(https?:\/\/)/, '');
            fieldsValue.docker_cmd = `${cleanedUrl}/${imageNameInfo}:${checkedValues}`
            fieldsValue.user_name = warehouseInfo.username
            fieldsValue.password = warehouseInfo.password
          }
        }
        onSubmit(fieldsValue);
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
          new Error('镜像名称不能包含空格')
        );
      }
      callback();
    }
  };
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
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
          if (data.bean.package_name.length > 0) {
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
      imageNameInfo: '',
      isHub: true,
    })
    form.resetFields(['docker_cmd'])
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
  // 获取镜像仓库中所有的镜像
  handleGetWarehouseImage = (item) => {
    const { dispatch } = this.props
    dispatch({
      type: 'teamControl/fetchImageNames',
      payload: {
        regionName: globalUtil.getCurrRegionName(),
        domain: item.domain,
        username: item.username,
        password: item.password,
      },
      callback: data => {
        if (data) {
          this.setState({
            warehouseImageList: data.list
          });
        }
      }
    })
  }
  // 获取镜像中所有的tag
  handleGetWarehouseImageTags = (value) => {
    const { dispatch } = this.props
    const { warehouseInfo } = this.state
    dispatch({
      type: 'teamControl/fetchImageTags',
      payload: {
        regionName: globalUtil.getCurrRegionName(),
        repo: value,
        domain: warehouseInfo.domain,
        username: warehouseInfo.username,
        password: warehouseInfo.password,
      },
      callback: data => {
        if (data) {
          this.setState({
            warehouseImageTags: data.list,
            checkedValues: data.list[0] || '',
            tagLoading: false
          });
        }
      },
      handleError: () => {
        this.setState({ tagLoading: false })
      }
    })
  }
  onChangeCheckbox = (e) => {
    this.setState({
      checkedValues: e.target.value
    })
  }
  onChangeRegistry = (value) =>{
    const { warehouseList } = this.state
    const { setFieldsValue } = this.props.form
    setFieldsValue({ docker_cmd: '' });
    if(value == 'DockerHub'){
      this.setState({
        warehouseImageTags: [],
        warehouseInfo: false,
        isHub: true,
        imageNameInfo: undefined,
        checkedValues: ''
      })
    } else {
      this.setState({
        isHub: false,
        warehouseImageTags: [],
        warehouseInfo: false,
        imageNameInfo: undefined,
        checkedValues: ''
      },()=>{
        warehouseList.map(item => {
          if(item.secret_id == value){
            this.setState({
              warehouseInfo: item
            })
            this.handleGetWarehouseImage(item)
          }
        })
      })
    }
  }
  onChangeImageName = (value) => {
    const { warehouseImageList, warehouseInfo, imageNameInfo } = this.state
    const { setFieldsValue } = this.props.form
    this.setState({ tagLoading: true, imageNameInfo: value })
    setFieldsValue({ docker_cmd: value });
    warehouseImageList.map(item => {
      if(item == value && warehouseInfo){
        this.handleGetWarehouseImageTags(value)
      }
    })
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
      archInfo
    } = this.props;

    const { language, fileList, radioKey, existFileList, localValue, localImageTags, warehouseList, isHub, warehouseImageList, warehouseImageTags, tagLoading, imageNameInfo } = this.state;
    const myheaders = {};
    const data = this.props.data || {};
    const disableds = this.props.disableds || [];
    const isService = handleType && handleType === 'Service';
    const is_language = language ? formItemLayout : formItemLayouts;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if (archLegnth == 2) {
      arch = 'amd64'
    } else if (archInfo.length == 1) {
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'placeholder.select' })
                }
              ]
            })(
              <Select
                showSearch
                filterOption={(input, option) => 
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'placeholder.appName' })}
                style={language ? {
                  display: 'inline-block',
                  width: isService ? '' : 276,
                  marginRight: 10, textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                } : {
                  display: 'inline-block',
                  width: isService ? '' : 262,
                  marginRight: 10, textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
                disabled={!!isService}
                onChange={this.fetchComponentNames}
              >
                {(groups || []).map(group => (
                  <Option value={group.group_id}>{group.group_name}</Option>
                ))}
              </Select>
            )}
            {isService ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>{formatMessage({ id: 'teamApply.createApp' })}</Button>
            ) : null}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
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
              initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
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
              <Radio.Group onChange={this.handleChangeImageSource}>
                <Radio value='address'>
                  {formatMessage({ id: 'teamAdd.create.image.address'})}
                </Radio>
                <Radio value='cmd'>
                  {formatMessage({ id: 'teamAdd.create.image.docker_cmd'})}
                </Radio>
                <Radio value='upload'>
                  {formatMessage({ id: 'teamAdd.create.image.upload'})}
                </Radio>
                <Radio value='local'>
                  {formatMessage({ id: 'teamAdd.create.image.local'})}
                </Radio>
              </Radio.Group>
            )}
          </Form.Item>
          {radioKey === 'address' &&
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.mirrorAddress' })}>
              {getFieldDecorator('docker_cmd', {
                initialValue: '',
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.warehouse_not_empty' }) }]
              })(
                <div className={styles.address}>
                  <div className={styles.registryAddress}>
                    {warehouseList.length > 0 ? (
                      <Select defaultValue="DockerHub" onChange={this.onChangeRegistry}>
                        <Option value='DockerHub'>
                            Docker Hub
                        </Option>
                        {warehouseList.map(item => {
                          return (
                            <Option value={item.secret_id}>
                                {item.secret_id}
                            </Option>
                          )
                        })}
                      </Select>
                      ) : (
                        <div className={styles.registry}>
                            Docker Hub
                        </div>
                      )
                    }
                  </div>
                  {isHub ? (
                    <div className={styles.imageName}>
                      <Input placeholder={formatMessage({ id: 'placeholder.docker_cmd' })} />
                    </div>
                  ) : (
                    <div className={styles.imageName}>
                      <Select 
                        placeholder={formatMessage({ id: 'placeholder.warehouse_address' })}
                        showSearch
                        filterOption={(input, option) => 
                          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        value={imageNameInfo}
                        onChange={this.onChangeImageName}
                      >
                      {warehouseImageList.map(item => {
                        return (
                          <Option value={item}>
                            {item}
                          </Option>
                        )
                      })}
                      </Select>
                    </div>
                  )}
                </div>
                )}
            </Form.Item>
          }
          {radioKey === 'address' && !isHub && imageNameInfo &&
            <Form.Item 
              label=''
              wrapperCol={{
                xs: {
                  span: 24,
                  offset: 0
                },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
            >
              {getFieldDecorator('checkout', {
                initialValue: ''
              })(
                <div className={styles.hubCheckbox}> 
                  {tagLoading && 
                    <Spin wrapperClassName={styles.spin} />
                  }
                  {!tagLoading && warehouseImageTags.length == 0 &&
                    <div className={styles.empty}>
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  }
                  {!tagLoading && warehouseImageTags.length > 0 &&
                    <Radio.Group 
                      defaultValue={warehouseImageTags[0]} 
                      className={styles.setCheckbox} 
                      onChange={this.onChangeCheckbox}
                    >
                      <Row span={24}>
                        {(warehouseImageTags || []).map(item => {
                          return (
                            <Radio value={item}>
                              {item}
                            </Radio>
                          )
                        })}
                      </Row>
                    </Radio.Group>
                  }
                </div>
              )}
            </Form.Item>
          }
          {radioKey === 'cmd' &&
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
              {getFieldDecorator('docker_cmd', {
                initialValue: '',
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.dockerRunMsg' }) }]
              })(
                <TextArea placeholder={formatMessage({ id: 'placeholder.dockerRun' })} />
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
          {radioKey === 'cmd' &&
            <div style={{ textAlign: 'right', marginRight: isService ? '80px' : '100px' }}>
              {formatMessage({ id: 'teamAdd.create.image.hint1' })}
              <a
                onClick={() => {
                  this.setState({ showUsernameAndPass: true });
                }}
                href="javascript:;"
              >
                {formatMessage({ id: 'teamAdd.create.image.hint2' })}
              </a>
            </div>
          }
          { radioKey === 'cmd' && <>
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
          {showSubmitBtn ? (
            <Form.Item
              wrapperCol={{
                xs: {
                  span: 24,
                  offset: 0
                },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              {isService && ButtonGroupState
                ? this.props.handleServiceBotton(
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByDockerrunLoading}
                  >
                    {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                  </Button>,
                  false
                )
                : !handleType && (
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByDockerrunLoading}
                  >
                    {formatMessage({ id: 'teamAdd.create.btn.create' })}
                  </Button>
                )}
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
