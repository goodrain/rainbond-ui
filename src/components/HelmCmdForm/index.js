/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Alert, List, Tooltip, Popover, Table, Radio, Upload, Icon } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { pinyin } from 'pinyin-pro';
import AddGroup from '../../components/AddOrEditGroup';
import AddHelmStore from '../../components/AddHelmStore';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import role from '@/utils/newRole';
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
    createAppByDockerrunLoading:
      loading.effects['createApp/createAppByDockerrun'],
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
      addStoreVisible: false,
      clicked: false,
      HelmwaRehouseList: [],
      radioKey: 'cmd',
      event_id: '',
      fileList: [],
      existFileList: [],
      record: {},
      creatComPermission: {}
    };
  }
  componentDidMount() {
    this.props.onRef(this)
    this.getAppStoreList();
    this.handleJarWarUpload();
    const group_id = globalUtil.getAppID()
    if(group_id){
      this.setState({
        creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${globalUtil.getAppID() || group_id}`)
      })
    }
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
    role.refreshPermissionsInfo(groupId, false, this.callbcak)
    setFieldsValue({ group_id: groupId });
    this.cancelAddGroup();
  };
  callbcak=(val)=>{
    this.setState({ creatComPermission: val })
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, handleType, dispatch } = this.props;
    const { event_id } = this.state
    const isService = handleType && handleType === 'Service' ? 'service' : 'team';
    form.validateFields((err, fieldsValue) => {
      if (err) return;

      const group_id = globalUtil.getAppID();

      // 如果已经有group_id，直接调用Helm创建接口
      if (group_id) {
        if (fieldsValue.imagefrom == 'upload') {
          fieldsValue.event_id = event_id
        }
        onSubmit(fieldsValue, isService);
        return;
      }

      // 如果没有group_id，先创建应用
      const teamName = globalUtil.getCurrTeamName();
      const regionName = globalUtil.getCurrRegionName();

      const k8s_app = this.generateEnglishName(fieldsValue.group_name || '');

      dispatch({
        type: 'application/addGroup',
        payload: {
          region_name: regionName,
          team_name: teamName,
          group_name: fieldsValue.group_name,
          k8s_app: k8s_app,
          note: '',
        },
        callback: (res) => {
          if (res && res.group_id) {
            // 创建应用成功，刷新权限信息
            role.refreshPermissionsInfo(res.group_id, false, (val) => {
              this.setState({ creatComPermission: val });
            });

            // 为Helm接口添加group_id
            fieldsValue.group_id = res.group_id;

            if (fieldsValue.imagefrom == 'upload') {
              fieldsValue.event_id = event_id
            }

            // 调用Helm创建接口
            onSubmit(fieldsValue, isService);
          }
        },
        handleError: () => {
          // 创建应用失败处理
        }
      });
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
  handleChange = (values) => {
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${values}`)
    })
  }

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
    const { language, addStoreVisible, HelmwaRehouseList, radioKey, fileList, existFileList, creatComPermission: {
      isCreate
    } } = this.state;
    const is_language = language ? formItemLayout : formItemLayout;
    const group_id = globalUtil.getAppID()
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
        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Form.Item
            label={formatMessage({ id: 'popover.newApp.appName' })}
            {...formItemLayout}
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
            })(<Input placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })} />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({ id: 'popover.newApp.appEngName' })}>
            {getFieldDecorator('k8s_app', {
              initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
              rules: [
                { required: true, message: formatMessage({ id: 'popover.newApp.appEngName.placeholder' }) },
                { validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({ id: 'popover.newApp.appEngName.placeholder' })} />)}
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
                    <Table rowKey={(record, index) => index} dataSource={HelmwaRehouseList} columns={columns} pagination={false} />
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
                extra={formatMessage({ id: 'teamAdd.create.image.extra_helm_chart' })}
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
                sm: { span: 24, offset: 0 }
              }}
              label=""
            >
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
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
                    <Tooltip title={!isCreate && formatMessage({ id: 'versionUpdata_6_1.noApp' })}>
                      <Button
                        onClick={this.handleSubmit}
                        type="primary"
                        loading={BtnLoading}
                        disabled={!isCreate}
                      >
                        {formatMessage({ id: 'teamAdd.create.btn.create' })}
                      </Button>
                    </Tooltip>
                  )}
              </div>
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
