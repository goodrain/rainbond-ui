/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message, notification, Tooltip, Divider, Progress } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent, Fragment } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup'
import roleUtil from '../../utils/newRole'
import globalUtil from '../../utils/global'
import cookie from '../../utils/cookie';
import ChunkUploader from '../../utils/ChunkUploader';
import styles from './index.less';
import { getUploadInformation } from '../../services/app';
import { pinyin } from 'pinyin-pro';
const { Dragger } = Upload;
const { Option } = Select;

@connect(
  ({ teamControl, global, enterprise }) => ({
    groups: global.groups,
    rainbondInfo: global.rainbondInfo,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    enterprise: global.enterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
  }),
  null,
  null,
  { pure: false }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fileList: [],
      defaultRadio: 'jwar',
      addGroup: false,
      record: {},
      event_id: '',
      region_name: '',
      team_name: '',
      percents: false,
      existFileList: [],
      groupName: '',
      language: cookie.get('language') === 'zh-CN' ? true : false,
      comNames: [],
      creatComPermission: {},
      isDisabledUpload: false,
      uploadMode: 'normal', // 'normal' 或 'chunk'
      chunkUploadProgress: 0,
      isChunkUploading: false,
      currentFile: null,
      chunkUploader: null
    };
  }
  componentWillMount() {
    this.loop = false;
    this.statusloop = false;
  }
  componentDidMount() {
    this.handleJarWarUpload()
    const group_id = globalUtil.getAppID()
    if (group_id) {
      this.setState({
        creatComPermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${globalUtil.getAppID() || group_id}`)
      })
    }
  }
  componentWillUnmount() {
    this.loop = false;
    this.statusloop = false;
  }
  //表单提交
  handleSubmit = e => {
    e.preventDefault();
    const { form, dispatch, archInfo, onSubmit } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const regionName = globalUtil.getCurrRegionName()
    const group_id = globalUtil.getAppID()
    const { event_id, existFileList, groupName } = this.state
    form.validateFields((err, value) => {
      if (err) return;
      if (archInfo && archInfo.length != 2 && archInfo.length != 0) {
        value.arch = archInfo[0]
      }
      if (group_id) {
        value.group_id = group_id
      }
      if (!value.k8s_app || !value.group_name) {
        value.group_name = value.service_cname
        value.k8s_app = this.generateEnglishName(value.service_cname)
      }
      if (existFileList.length > 0) {
        onSubmit(value, event_id)
      } else {
        this.loop = true
        this.handleJarWarUploadStatus()
        notification.error({
          message: formatMessage({ id: 'notification.error.notDetected' })
        })
      }
    });
  };
  handleChange = (values) => {
    this.fetchComponentNames(values)
    const { dispatch, groups } = this.props;
    for (let index = 0; index < groups.length; index++) {
      if (groups[index].group_id === values) {
        this.setState({
          groupName: groups[index].group_name
        })
        break;
      }

    }
  }
  //新建应用
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
  handleAddGroup = groupId => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({ group_id: groupId });
    roleUtil.refreshPermissionsInfo(groupId, false, this.callbcak)
    this.cancelAddGroup();
  };
  callbcak = (val) => {
    this.setState({ creatComPermission: val })
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
          if (data.bean.package_name && data.bean.package_name.length > 0) {
            this.setState({
              existFileList: data.bean.package_name
            });
            // notification.success({
            //   message: formatMessage({ id: 'notification.success.upload_file' })
            // })
            // this.loop = false
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
            existFileList: [],
            isDisabledUpload: false
          });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          })
          this.handleJarWarUpload()
        }
      },
    });
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
    this.setState({ fileList, isDisabledUpload: true });
  };
  //删除
  onRemove = () => {
    this.setState({ fileList: [], isDisabledUpload: false });
  };

  // 切换上传方式
  onUploadModeChange = (e) => {
    this.setState({ uploadMode: e.target.value });
  };

  // 处理分片上传文件选择
  handleChunkFileSelect = (file) => {
    const { event_id, record } = this.state;

    // 检查文件类型
    const allowedTypes = ['.jar', '.war', '.zip', '.tar'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      message.error(formatMessage({ id: 'teamAdd.create.upload.fileTypeJarWar' }));
      return false;
    }

    this.setState({ currentFile: file });

    // 创建 ChunkUploader 实例
    const uploader = new ChunkUploader(file, event_id, {
      uploadUrl: record.upload_url, // 使用后端返回的 upload_url
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
        isDisabledUpload: true,
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
  // 获取当前选取的app的所有组件的英文名称
  fetchComponentNames = (group_id) => {
    const { dispatch } = this.props;
    this.setState({
      creatComPermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${group_id}`)
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
  handleDisabledUpload = () => {
    this.setState({
      isDisabledUpload: true
    })
  }
  render() {
    const {
      form,
      form: { getFieldDecorator },
      groups,
      archInfo,
      showSubmitBtn = true
    } = this.props;
    const myheaders = {};
    const { fileList, defaultRadio, addGroup, record, region_name, existFileList, language, creatComPermission: { isCreate }, isDisabledUpload } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const en_formItemLayout = {
      labelCol: {
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
    let arch = 'amd64'
    let archLegnth = archInfo?.length || 0
    if (archLegnth == 2) {
      arch = 'amd64'
    } else if (archLegnth == 1) {
      arch = archInfo && archInfo[0]
    }
    const group_id = globalUtil.getAppID()
    return (
      <>
        <div className={styles.yaml_container}>
          <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.service_cname' })}>
              {getFieldDecorator('service_cname', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.component_cname' })
                  }
                ]
              })(<Input placeholder={formatMessage({ id: 'placeholder.component_cname' })} />)}
            </Form.Item>
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.k8s_component_name' })}>
              {getFieldDecorator('k8s_component_name', {
                initialValue: this.generateEnglishName(form.getFieldValue('service_cname')),
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.k8s_component_name' })
                  }
                ]
              })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} />)}
            </Form.Item>
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
                label={formatMessage({ id: 'teamAdd.create.upload.uploadFiles' })}
                extra={formatMessage({ id: 'teamAdd.create.upload.uploadJWar' })}
              >
                {getFieldDecorator('packageTarFile', {
                  rules: [

                  ]
                })(
                  <Upload
                    disabled={existFileList.length === 1}
                    fileList={fileList}
                    accept=".jar,.war,.zip,.tar"
                    name="packageTarFile"
                    onChange={this.onChangeUpload}
                    onRemove={this.onRemove}
                    action={record.upload_url}
                    headers={myheaders}
                    maxCount={1}
                    multiple={false}
                  >
                    <Button disabled={isDisabledUpload || existFileList.length === 1}>
                      <Icon type="upload" />
                      {formatMessage({ id: 'teamAdd.create.upload.uploadFiles' })}
                    </Button>
                  </Upload>
                )}
              </Form.Item>
            ) : (
              <Fragment>
                <Form.Item
                  {...is_language}
                  label={formatMessage({ id: 'teamAdd.create.upload.uploadFiles' })}
                  extra={formatMessage({ id: 'teamAdd.create.upload.uploadJWar' })}
                >
                  {getFieldDecorator('packageTarFile', {
                    rules: [
                    ]
                  })(
                    <>
                      <Upload
                        disabled={existFileList.length === 1}
                        accept=".jar,.war,.zip,.tar"
                        beforeUpload={this.handleChunkFileSelect}
                        maxCount={1}
                        showUploadList={false}
                      >
                        <Button disabled={existFileList.length === 1}>
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
              </Fragment>
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
                    className={styles.deleteButton}
                  >
                    <Icon onClick={this.handleJarWarUploadDelete} type="delete" />
                  </div>
                }
              </div>
            </Form.Item>
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
                  {formatMessage({ id: 'teamAdd.create.advancedOptions' })} {this.state.showAdvanced ? <span style={{ fontSize: 16 }}>&#94;</span> : <span style={{ fontSize: 16 }}>&#8964;</span>}
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
            {showSubmitBtn && (
              <Form.Item
                wrapperCol={{
                  xs: { span: 24, offset: 0 },
                  sm: { span: 24, offset: 0 }
                }}
              >
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Button type="primary" htmlType="submit">
                    {formatMessage({ id: 'teamAdd.create.btn.create' })}
                  </Button>
                </div>
              </Form.Item>
            )}
          </Form>
        </div>
        {/* </Card> */}
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </>
    );
  }
}
