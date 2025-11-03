/* eslint-disable react/no-redundant-should-component-update */
/* eslint-disable react/no-unused-state */
import { Alert, Form, Input, Modal, notification, Select, Tabs, Radio, Upload, Button, Icon, Checkbox } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ShowRegionKey from '../../../components/ShowRegionKey';
import { getCodeBranch } from '../../../services/app';
import appUtil from '../../../utils/app';
import cookie from '../../../utils/cookie';
import globalUtil from '../../../utils/global';
const { TabPane } = Tabs;
const FormItem = Form.Item;
const { Option } = Select;
// 切换分支组件
@Form.create()
@connect()
export default class ChangeBuildSource extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      branch: this.props.branch || [],
      buildSource: this.props.buildSource || null,
      showUsernameAndPass: this.props.buildSource.user !== '',
      showKey: false,
      isFlag: true,
      tabValue: 'source_code',
      gitUrl: this.props.buildSource.git_url,
      serverType: this.props.buildSource.server_type
        ? this.props.buildSource.server_type
        : 'git',
      showCode: appUtil.isCodeAppByBuildSource(this.props.buildSource),
      showImage: appUtil.isImageAppByBuildSource(this.props.buildSource),
      tabKey: '',
      language: cookie.get('language') === 'zh-CN' ? true : false,
      // tar包镜像上传相关状态
      uploadRecord: {},
      event_id: '',
      fileList: [],
      existFileList: [],
      isDisabledUpload: false,
      tarLoadId: '',
      tarLoadStatus: '', // 'loading' | 'success' | 'failure'
      tarImages: [], // 解析出的镜像列表
      targetImages: {}, // 目标镜像映射
      showUploadModal: false // 控制上传弹窗显示
    };
  }
  componentDidMount() {
    // this.changeURL(this.props.buildSource.git_url||null);
    this.loop = false;
    if (appUtil.isCodeAppByBuildSource(this.state.buildSource)) {
      this.loadBranch();
    }
    const { buildSource } = this.props
    if (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') {
      this.setState({
        tabKey: '2',
        tabValue: 'docker_run'
      })
    } else {
      this.setState({
        tabKey: '1',
        tabValue: 'source_code'
      })
    }

  }
  componentWillUnmount() {
    this.loop = false;
  }
  shouldComponentUpdate() {
    return true;
  }
  getUrlCheck() {
    if (this.state.serverType == 'svn') {
      return /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/)[^\s]+$/gi;
    }
    return /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/)[^\s]+$/gi;
  }
  changeServerType = value => {
    const { form } = this.props;
    const { getFieldValue } = form;
    const userName = getFieldValue('user_name');
    if (value == 'oss') {
      this.setState({ isFlag: false })
    } else {
      this.setState({ isFlag: true })
    }
    this.setState({ serverType: value, showUsernameAndPass: userName !== '' });
  };
  checkURL = (_rule, value, callback) => {
    const urlCheck = this.getUrlCheck();
    if (urlCheck.test(value)) {
      callback();
    } else {
      callback(<FormattedMessage id='componentOverview.body.ChangeBuildSource.Illegal' />);
    }
  }

  checkImage = (_rule, value, callback) => {
    if (/^[^\s]+$/.test(value)) {
      callback();
    } else {
      callback(<FormattedMessage id='componentOverview.body.ChangeBuildSource.Illegal' />);
    }
  };
  loadBranch() {
    getCodeBranch({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias
    }).then(data => {
      if (data) {
        this.setState({ branch: data.list });
      }
    });
  }
  handleSubmit = () => {
    const { form, buildSource } = this.props;
    const { tabValue } = this.state
    const archLegnth = buildSource.arch.length
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.version_type == 'tag') {
        fieldsValue.code_version = 'tag:'.concat(fieldsValue.code_version);
      }
      if(archLegnth && archLegnth != 2 && archLegnth != 0){
        fieldsValue.arch = buildSource.arch[0]
      }
      this.props.dispatch({
        type: 'appControl/putAppBuidSource',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.appAlias,
          service_source: tabValue,
          ...fieldsValue
        },
        callback: () => {
          notification.success({ message: formatMessage({ id: 'notification.success.edit_deploy' }) });
          if (this.props.onOk) {
            this.props.onOk();
          }
        }
      });
    });
  };
  hideShowKey = () => {
    this.setState({ showKey: false });
  };
  handleTabs = (value) => {
    if (value == '2') {
      this.setState({
        tabValue: 'docker_run'
      })
    } else {
      this.setState({
        tabValue: 'source_code'
      })
    }
  }

  // tar包镜像上传相关方法
  // 1. 初始化上传事件
  handleTarImageUpload = () => {
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();

    dispatch({
      type: 'createApp/createJarWarServices',
      payload: {
        region: regionName,
        team_name: teamName,
        component_id: ''
      },
      callback: (res) => {
        if (res && res.status_code === 200) {
          this.setState({
            uploadRecord: res.bean,
            event_id: res.bean.event_id
          }, () => {
            if (res.bean.region !== '') {
              this.loop = true;
              this.handleTarImageUploadStatus();
            }
          });
        }
      }
    });
  };

  // 2. 查询上传状态
  handleTarImageUploadStatus = () => {
    const { dispatch } = this.props;
    const { event_id } = this.state;

    dispatch({
      type: 'createApp/createJarWarUploadStatus',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        event_id: event_id
      },
      callback: (data) => {
        if (data && data.bean && data.bean.package_name && data.bean.package_name.length > 0) {
          this.setState({
            existFileList: data.bean.package_name
          });
        }
        if (this.loop) {
          setTimeout(() => {
            this.handleTarImageUploadStatus();
          }, 3000);
        }
      },
      handleError: () => {}
    });
  };

  // 3. 删除上传文件
  handleTarImageUploadDelete = () => {
    const { event_id } = this.state;
    const { dispatch } = this.props;

    dispatch({
      type: 'createApp/deleteJarWarUploadStatus',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id
      },
      callback: (data) => {
        if (data.bean.res === 'ok') {
          this.setState({
            existFileList: [],
            isDisabledUpload: false,
            fileList: [],
            tarLoadId: '',
            tarLoadStatus: '',
            tarImages: [],
            selectedImages: [],
            showImageSelector: false
          });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          });
          this.handleTarImageUpload();
        }
      }
    });
  };

  // 4. 上传文件变化
  onChangeTarUpload = (info) => {
    let { fileList } = info;
    fileList = fileList.filter((file) => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });

    const { status } = info.file;
    if (status === 'done') {
      notification.success({
        message: formatMessage({ id: 'notification.success.upload_file' })
      });
    }
    this.setState({ fileList, isDisabledUpload: true });
  };

  // 5. 删除上传文件
  onRemoveTarFile = () => {
    this.setState({ fileList: [], isDisabledUpload: false });
  };

  // 6. 开始解析tar包
  handleStartLoadTarImage = () => {
    const { dispatch } = this.props;
    const { event_id, existFileList } = this.state;
    
    if (existFileList.length === 0) {
      notification.warning({
        message: formatMessage({ id: 'componentOverview.body.TarImageUpload.please_upload' })
      });
      return;
    }

    dispatch({
      type: 'teamControl/loadTarImage',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        event_id: event_id,
        region: globalUtil.getCurrRegionName()
      },
      callback: (res) => {
        if (res && res.bean) {
          this.setState({
            tarLoadId: res.bean.load_id,
            tarLoadStatus: 'loading'
          }, () => {
            // 开始轮询解析结果
            this.pollTarLoadResult();
          });
          notification.success({
            message: res.msg_show || formatMessage({ id: 'componentOverview.body.TarImageUpload.start_parse_tar' })
          });
        }
      },
      handleError: (err) => {
        notification.error({
          message: err.data.msg_show || formatMessage({ id: 'componentOverview.body.TarImageUpload.parse_task_failed' })
        });
      }
    });
  };

  // 7. 轮询查询解析结果
  pollTarLoadResult = () => {
    const { dispatch, form } = this.props;
    const { tarLoadId } = this.state;


    const poll = () => {
      dispatch({
        type: 'teamControl/getTarImageLoadResult',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          load_id: tarLoadId,
          region: globalUtil.getCurrRegionName()
        },
        callback: (res) => {
          if (res && res.bean) {
            const { status, images, target_images, message } = res.bean;

            if (status === 'success') {
              // 解析成功后直接使用新地址替换镜像输入框
              this.setState({
                tarLoadStatus: 'success',
                tarImages: images || [],
                targetImages: target_images || {}
              });

              // 获取第一个镜像的新地址并更新表单
              if (images && images.length > 0 && target_images) {
                const firstOldImage = images[0]; // 原始镜像地址
                const newImage = target_images[firstOldImage]; // 新镜像地址

                if (newImage) {
                  form.setFieldsValue({
                    image: newImage
                  });

                  notification.success({
                    message: formatMessage({ id: 'componentOverview.body.TarImageUpload.parse_success' }),
                    description: (
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <strong>{formatMessage({ id: 'componentOverview.body.TarImageUpload.original_address' })}</strong>
                          <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{firstOldImage}</div>
                        </div>
                        <div>
                          <strong>{formatMessage({ id: 'componentOverview.body.TarImageUpload.new_address' })}</strong>
                          <div style={{ color: '#52c41a', fontSize: 12, marginTop: 4 }}>{newImage}</div>
                        </div>
                      </div>
                    ),
                    duration: 6
                  });
                } else {
                  notification.warning({
                    message: formatMessage({ id: 'componentOverview.body.TarImageUpload.parse_complete' }),
                    description: formatMessage({ id: 'componentOverview.body.TarImageUpload.no_target_image' }),
                    duration: 5
                  });
                }
              }

              // 重置状态并关闭弹窗
              this.setState({
                showUploadModal: false,
                tarLoadStatus: '',
                tarLoadId: '',
                fileList: [],
                existFileList: [],
                isDisabledUpload: false
              });
            } else if (status === 'failure') {
              this.setState({
                tarLoadStatus: 'failure',
                showUploadModal: false
              });
              notification.error({
                message: message || formatMessage({ id: 'componentOverview.body.TarImageUpload.parse_failed' })
              });
            } else if (status === 'loading') {
              // 继续轮询
              setTimeout(poll, 3000);
            }
          }
        },
        handleError: (err) => {
          this.setState({
            tarLoadStatus: 'failure',
            showUploadModal: false
          });
          notification.error({
            message: err.data.msg_show || formatMessage({ id: 'componentOverview.body.TarImageUpload.query_result_failed' })
          });
        }
      });
    };

    poll();
  };

  // 8. 打开上传弹窗
  handleOpenUploadModal = () => {
    this.setState({ showUploadModal: true });
    // 初始化上传事件
    if (this.state.event_id === '') {
      this.handleTarImageUpload();
    }
  };

  // 9. 关闭上传弹窗
  handleCloseUploadModal = () => {
    this.setState({
      showUploadModal: false,
      tarLoadStatus: '',
      fileList: [],
      tarLoadId: ''
    });
  };

  render() {
    const { title, onCancel, appBuidSourceLoading, form, archInfo } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const {
      showUsernameAndPass,
      showKey,
      isFlag,
      tabValue,
      buildSource,
      tabKey,
      language,
      uploadRecord,
      fileList,
      existFileList,
      isDisabledUpload,
      tarLoadStatus,
      showUploadModal
    } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 5
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 19
        },
        sm: {
          span: 21
        }
      }
    };
    const en_formItemLayout = {
      labelCol: {
        xs: {
          span: 5
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 10
        },
        sm: {
          span: 16
        }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout
    const gitUrl = getFieldValue('git_url');
    let isHttp = /(http|https):\/\/([\w.]+\/?)\S*/.test(gitUrl || '');
    if (this.state.serverType !== 'git') {
      isHttp = true;
    } else if (this.state.serverType === 'oss') {
      isHttp = true;
    }
    const isSSH = !isHttp;

    const prefixSelector = getFieldDecorator('server_type', {
      initialValue: 'git'
    })(
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        onChange={this.changeServerType}
        style={{ width: 100 }}
      >
        <Option value="git">Git</Option>
        <Option value="svn">Svn</Option>
        <Option value="oss">OSS</Option>
      </Select>
    );
    let codeVersion = this.state.buildSource.code_version;
    let versionType = 'branch';
    if (codeVersion && codeVersion.indexOf('tag:') === 0) {
      versionType = 'tag';
      codeVersion = codeVersion.substr(4, codeVersion.length);
    }
    const versionSelector = getFieldDecorator('version_type', {
      initialValue: versionType
    })(
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        style={{ width: 100 }}
      >
        <Option value="branch"><FormattedMessage id='componentOverview.body.ChangeBuildSource.git_branch' /></Option>
        <Option value="tag">Tag</Option>
      </Select>
    );
    const archLegnth = buildSource.arch.length
    return (
      <>
      <Modal
        width={700}
        title={title}
        confirmLoading={appBuidSourceLoading}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        visible
      >
        <Alert
          message={<FormattedMessage id='componentOverview.body.ChangeBuildSource.creat' />}
          type="warning"
          closable
          size="small"
          style={{ marginBottom: '12px' }}
        // onClose={onClose}
        />
        <Tabs defaultActiveKey={tabKey} onChange={this.handleTabs} >
          <TabPane tab={<FormattedMessage id='componentOverview.body.ChangeBuildSource.Source_code' />} key="1" >
            {tabValue === 'source_code' && (
              <Form onSubmit={this.handleSubmit}>
                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.address' />}
                >
                  {getFieldDecorator('git_url', {
                    initialValue: buildSource.service_source == "source_code" && buildSource.git_url ? buildSource.git_url : '',
                    force: true,
                    rules: [
                      { required: true, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_address' }), },
                      { validator: this.checkURL, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.Illegal_address' }), }
                    ]
                  })(
                    <Input
                      addonBefore={prefixSelector}
                      placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_address' })}
                    />
                  )}
                </Form.Item>
                {isFlag &&
                  <Form.Item
                    {...is_language}
                    label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.version' />}
                  >
                    {getFieldDecorator('code_version', {
                      initialValue: buildSource.service_source == "source_code" && codeVersion ? codeVersion : '',
                      rules: [{ required: true, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_version' }), }]
                    })(
                      <Input
                        addonBefore={versionSelector}
                        placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_version' })}
                      />
                    )}
                  </Form.Item>
                }


                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.name' />}
                >
                  {getFieldDecorator('user_name', {
                    initialValue:
                      // buildSource.user_name ||
                      // buildSource.user ||
                      //   '',
                      (buildSource.service_source == "source_code") &&
                        (buildSource.user_name || buildSource.user) ? (buildSource.user_name || buildSource.user) : '',
                    rules: [{ required: false, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' }), }]
                  })(<Input autoComplete="off" placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' })} />)}
                </Form.Item>
                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.password' />}
                >
                  {getFieldDecorator('password', {
                    initialValue: buildSource.service_source == "source_code" && buildSource.password ? buildSource.password : '',
                    rules: [{ required: false, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' }) }]
                  })(
                    <Input
                      autoComplete="new-password"
                      type="password"
                      placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' })}
                    />
                  )}
                </Form.Item>
                {archLegnth == 2 && 
                <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
                  {getFieldDecorator('arch', {
                    initialValue: archLegnth == 2 ? archInfo : (archLegnth == 1 && buildSource.arch[0]),
                  })(
                    <Radio.Group onChange={this.onChangeCpu}>
                      <Radio value='amd64'>amd64</Radio>
                      <Radio value='arm64'>arm64</Radio>
                    </Radio.Group>
                  )}
                </Form.Item>}
              </Form>
            )}

          </TabPane>
          <TabPane tab={<FormattedMessage id='componentOverview.body.ChangeBuildSource.image' />} key="2">
            {tabValue === 'docker_run' && (
              <Form onSubmit={this.handleSubmit}>
                <FormItem
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.image_name' />}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    {getFieldDecorator('image', {
                      initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') && buildSource.image ? buildSource.image : '',
                      rules: [
                        { required: true, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.image_name_null' }), },
                        {
                          max: 190,
                          message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.max' }),
                        },
                        { validator: this.checkImage, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.Illegal' }), }
                      ],
                    })(
                      <Input
                        style={{ flex: 1 }}
                        placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_image_name' })}
                      />
                    )}
                    <Button
                      type="primary"
                      icon="upload"
                      onClick={this.handleOpenUploadModal}
                    >
                      <FormattedMessage id="componentOverview.body.TarImageUpload.upload_button" />
                    </Button>
                  </div>
                </FormItem>

                <FormItem
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.Start' />}
                >
                  {getFieldDecorator('cmd', {
                    initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source == "docker_run") && buildSource.cmd ? buildSource.cmd : '',
                  })(<Input placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_Start' })} />)}
                </FormItem>

                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.name' />}
                >
                  {getFieldDecorator('user_name', {
                    initialValue:
                      (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') &&
                        (buildSource.user_name || buildSource.user) ? (buildSource.user_name || buildSource.user) : '',
                    rules: [{ required: false, message: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' }), }]
                  })(<Input autoComplete="off" placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_name' })} />)}
                </Form.Item>
                <Form.Item
                  {...is_language}
                  label={<FormattedMessage id='componentOverview.body.ChangeBuildSource.password' />}
                >
                  {getFieldDecorator('password', {
                    initialValue: (buildSource.service_source == "docker_image" || buildSource.service_source == 'docker_run') && buildSource.password ? buildSource.password : '',
                    rules: [{ required: false, essage: formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' }) }]
                  })(
                    <Input
                      autoComplete="new-password"
                      type="password"
                      placeholder={formatMessage({ id: 'componentOverview.body.ChangeBuildSource.input_password' })}
                    />
                  )}
                </Form.Item>
                {archLegnth == 2 && 
                <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
                  {getFieldDecorator('arch', {
                    initialValue: archLegnth == 2 ? archInfo : (archLegnth == 1 && buildSource.arch[0]),
                  })(
                    <Radio.Group onChange={this.onChangeCpu}>
                      <Radio value='amd64'>amd64</Radio>
                      <Radio value='arm64'>arm64</Radio>
                    </Radio.Group>
                  )}
                </Form.Item>}
              </Form>
            )}
          </TabPane>
        </Tabs>
      </Modal>

      {/* 上传镜像包弹窗 */}
      <Modal
        title={formatMessage({ id: 'componentOverview.body.TarImageUpload.modal_title' })}
        visible={showUploadModal}
        onCancel={this.handleCloseUploadModal}
        footer={null}
        width={600}
      >
        <Form>
          <FormItem
            label={formatMessage({ id: 'componentOverview.body.TarImageUpload.upload_file' })}
            extra={formatMessage({ id: 'componentOverview.body.TarImageUpload.file_format_tip' })}
          >
            <Upload
              disabled={existFileList.length === 1}
              fileList={fileList}
              accept=".tar,.tar.gz"
              name="packageTarFile"
              onChange={this.onChangeTarUpload}
              onRemove={this.onRemoveTarFile}
              action={uploadRecord.upload_url}
              maxCount={1}
              multiple={false}
            >
              <Button disabled={isDisabledUpload || existFileList.length === 1}>
                <Icon type="upload" /> <FormattedMessage id="componentOverview.body.TarImageUpload.select_file" />
              </Button>
            </Upload>
          </FormItem>

          <FormItem label={formatMessage({ id: 'componentOverview.body.TarImageUpload.uploaded_files' })}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {existFileList.length > 0 ? (
                  existFileList.map((item, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Icon style={{ marginRight: 6 }} type="file" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>
                    <FormattedMessage id="componentOverview.body.TarImageUpload.no_files" />
                  </span>
                )}
              </div>
              {existFileList.length > 0 && (
                <Button
                  type="danger"
                  icon="delete"
                  size="small"
                  onClick={this.handleTarImageUploadDelete}
                >
                  <FormattedMessage id="componentOverview.body.TarImageUpload.delete" />
                </Button>
              )}
            </div>
          </FormItem>

          {existFileList.length > 0 && (
            <FormItem>
              <Button
                type="primary"
                onClick={this.handleStartLoadTarImage}
                loading={tarLoadStatus === 'loading'}
                block
              >
                {tarLoadStatus === 'loading' ? (
                  <FormattedMessage id="componentOverview.body.TarImageUpload.parsing" />
                ) : (
                  <FormattedMessage id="componentOverview.body.TarImageUpload.start_parse" />
                )}
              </Button>
            </FormItem>
          )}
        </Form>
      </Modal>
    </>
    );
  }
}
