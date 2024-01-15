/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Alert, List, Tooltip, Popover, Table, Radio, Upload, Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import AddHelmStore from '../../components/AddHelmStore';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
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
      addStoreVisible: false,
      clicked: false,
      HelmwaRehouseList: [],
      radioKey: 'cmd',
      event_id: '',
      fileList: [],
      existFileList: [],
      record: {}

    };
  }
  componentDidMount() {
    this.props.onRef(this)
    this.getAppStoreList();
    this.handleJarWarUpload();
  }
  getAppStoreList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'market/HelmwaRehouseList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
      callback: res => {
        this.setState({
          HelmwaRehouseList: res.list,
        })
      },
      handleError: err => {
      }
    });
  };
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
    const { form, onSubmit, handleType } = this.props;
    const { event_id } = this.state
    const isService = handleType && handleType === 'Service' ? 'service' : 'team';
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if(fieldsValue.imagefrom == 'upload'){
          fieldsValue.event_id = event_id
        }
        onSubmit(fieldsValue, isService);
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
  showStoreMoudle = () => {
    this.setState({
      addStoreVisible: !this.state.addStoreVisible,
      clicked: false
    })
  }
  onlyShowStoreMoudle = () => {
    this.setState({
      addStoreVisible: !this.state.addStoreVisible,
    })
  }
  handleClickChange = (val) => {
    if (val == false) {
      this.setState({
        clicked: false
      })
    } else {
      this.setState({
        clicked: !this.state.clicked
      })
    }
  }
  // 切换 Helm 安装方式
  handleChangeHelm = (key) => {
    const { form } = this.props
    this.setState({
      radioKey: key.target.value
    })
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
      BtnLoading,
      errorShow,
      description
    } = this.props;
    const { getFieldDecorator } = form;
    const data = this.props.data || {};
    const myheaders = {};
    const isService = handleType && handleType === 'Service';
    const { language, addStoreVisible, HelmwaRehouseList, radioKey, fileList, existFileList } = this.state;
    const is_language = language ? formItemLayout : formItemLayout;
    const columns = [
      {
        title: formatMessage({ id: 'teamAdd.create.helm.store_name' }),
        dataIndex: 'repo_name',
        key: 'repo_name',
      },
      {
        title: formatMessage({ id: 'teamAdd.create.helm.store_url' }),
        dataIndex: 'repo_url',
        key: 'repo_url',
      }
    ];
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
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
          <Form.Item {...is_language} label={formatMessage({ id: 'Vm.createVm.from' })}>
            {getFieldDecorator('imagefrom', {
              initialValue: 'cmd',
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group onChange={this.handleChangeHelm}>
                <Radio value='cmd'>{formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}</Radio>
                <Radio value='upload'>{formatMessage({ id: 'teamAdd.create.image.upload' })}</Radio>
              </Radio.Group>
            )}
          </Form.Item>
          {/* 已对接商店地址 */}
          {radioKey == 'cmd' &&
            <Form.Item {...is_language} label={formatMessage({ id: 'teamAdd.create.image.docker_cmd' })}>
              {getFieldDecorator('helm_cmd', {
                initialValue: data.docker_cmd || '',
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.helmCmdMsg' }) }]
              })(
                <TextArea style={{ minHeight: '200px' }} placeholder={formatMessage({ id: 'placeholder.helm_cmd' })} />
              )}
              <Popover
                content={
                  <>
                    <Table rowKey={(record,index) => index} dataSource={HelmwaRehouseList} columns={columns} pagination={false} />
                    <Button type="link" onClick={this.showStoreMoudle}>{formatMessage({ id: 'teamAdd.create.helm.Add' })}</Button>
                  </>
                }
                title={formatMessage({ id: 'teamAdd.create.helm.list' })}
                placement="bottomRight"
                trigger="click"
                visible={this.state.clicked}
                onVisibleChange={() => this.handleClickChange(true)}
              >
                <p className={styles.storeList}>{formatMessage({ id: 'teamAdd.create.helm.store' })}</p>
              </Popover>
            </Form.Item>
          }
          {radioKey == 'upload' &&
            <>
              <Form.Item
                {...is_language}
                label={formatMessage({ id: 'Vm.createVm.imgUpload' })}
                extra={formatMessage({ id: 'teamAdd.create.image.extra_helm_chart'})}
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
                        {formatMessage({ id: 'teamAdd.create.image.upload_helm_chart' })}
                      </Button>
                    </Upload>
                  </>
                )}
              </Form.Item>
              <Form.Item
                labelCol={language ? { span: 5 } : { span: 5 }}
                wrapperCol={language ? { span: 19 } : { span: 19 }}
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
          {errorShow &&
            <Alert
              message={formatMessage({ id: 'teamOther.HelmCmdForm.msg' })}
              description={description}
              type="error"
              closable
              style={{ width: 350, margin: 'auto', marginBottom: 20 }}
            />
          }
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
                ?
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={BtnLoading}
                >
                  {formatMessage({ id: 'teamAdd.create.btn.createComponent' })}
                </Button>


                : !handleType && (
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={BtnLoading}
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
        {addStoreVisible &&
          <AddHelmStore handleCancel={this.showStoreMoudle} visible={addStoreVisible} RefreshList={this.getAppStoreList} onOk={this.handleClickChange} />
        }
      </Fragment>
    );
  }
}
