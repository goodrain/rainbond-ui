/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Radio, Upload, Icon, Tooltip, notification } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import styles from './index.less';


const { Option } = Select;
const { TextArea } = Input;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 14
  }
};
const formItemLayouts = {
  labelCol: {
    span: 10
  },
  wrapperCol: {
    span: 14
  }
};

@connect(
  ({ global, loading, user }) => ({
    currUser: user.currentUser,
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
      radioKey: 'address',
      fileList: [],
      percents: false,
      vmShow: false,
      existFileList: [],
    };
  }
  componentDidMount() {
    this.fetchPipePipeline();
    this.handleJarWarUpload();
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
              // notification.success({
              //   message: formatMessage({id:'notification.success.upload_file'})
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
    const { event_id } = this.state
    const { form, onSubmit, archInfo } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if (archInfo && archInfo.length != 2 && archInfo.length != 0) {
          fieldsValue.arch = archInfo[0]
        }
        onSubmit(fieldsValue, event_id);
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
  handleChangeImageSource = (key) => {
    this.setState({
      radioKey: key.target.value
    })
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
      virtualMachineImage
    } = this.props;
    const { getFieldDecorator } = form;
    const myheaders = {};
    const data = this.props.data || {};
    const isService = handleType && handleType === 'Service';
    const { language, radioKey, fileList, vmShow, existFileList } = this.state;
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
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'placeholder.appName' })}
                style={language ? {
                  display: 'inline-block',
                  width: isService ? '' : 250,
                  marginRight: 10
                } : {
                  display: 'inline-block',
                  width: isService ? '' : 264,
                  marginRight: 10
                }}
                disabled={!!isService}
              >
                {(groups || []).map(group => {
                  return (
                    <Option value={group.group_id}>{group.group_name}</Option>
                  );
                })}
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
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.k8s_component_name' })} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id:'Vm.createVm.from'})}>
            {getFieldDecorator('imagefrom', {
              initialValue: 'address',
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group onChange={this.handleChangeImageSource}>
                <Radio value='address'>{formatMessage({id:'Vm.createVm.add'})}</Radio>
                <Radio value='upload'>{formatMessage({id:'Vm.createVm.upload'})}</Radio>
                {virtualMachineImage && virtualMachineImage.length > 0 && <Radio value='ok'>{formatMessage({id:'Vm.createVm.have'})}</Radio>}
                {/* <Radio value='ok'>已有镜像</Radio> */}
              </Radio.Group>
            )}
          </Form.Item>
          {radioKey != 'ok' ? (
            <>
              {radioKey == 'address' &&
                <Form.Item {...is_language} label={formatMessage({id:'Vm.createVm.install'})} extra={formatMessage({id:'Vm.createVm.packageInstall'})}>
                  {getFieldDecorator('vm_url', {
                    rules: [
                      { required: true }
                    ]
                  })(<Input placeholder={formatMessage({id:'Vm.createVm.InputInstall'})} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
                </Form.Item>
              }
              {radioKey == 'upload' &&
              <>
                <Form.Item
                  {...is_language}
                  label={formatMessage({id:'Vm.createVm.imgUpload'})}
                  extra={formatMessage({id:'Vm.createVm.package'})}
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
                          {formatMessage({id:'Vm.createVm.imgUpload'})}
                        </Button>
                      </Upload>
                    </>
                  )}
                </Form.Item>
                <Form.Item
              labelCol={language ? { span: 5 } : { span: 9 }}
              wrapperCol={language ? { span: 19 } : { span: 15 }}
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
              <Form.Item {...is_language} label={formatMessage({id:'Vm.createVm.imgName'})} >
                {getFieldDecorator('image_name', {
                  rules: [
                    { required: true }
                  ]
                })(<Input placeholder={formatMessage({id:'Vm.createVm.saveName'})} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} />)}
              </Form.Item>
            </>
          ) : (
            <Form.Item {...is_language} label={formatMessage({id:'Vm.createVm.img'})}>
              {getFieldDecorator('image_name', {
                rules: [
                  { required: true, }
                ]
              })(<Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({id:'Vm.createVm.selectImg'})}
              >
                {(virtualMachineImage || []).map(image => {
                  return (
                    <Option value={image.name}>{image.name}</Option>
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
                        <Button
                          onClick={this.handleSubmit}
                          type="primary"
                          loading={createAppByDockerrunLoading}
                        >
                          {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                        </Button>                      
                      ,false
                    )
                : !handleType && (
                  <Tooltip placement="top" title={vmShow ? null : formatMessage({id:'Vm.createVm.unInstall'})} key={vmShow}>
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
      </Fragment>
    );
  }
}
