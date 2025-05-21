/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message, notification, Tooltip, Divider } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup'
import roleUtil from '../../utils/newRole'
import globalUtil from '../../utils/global'
import cookie from '../../utils/cookie';
import styles from './index.less';
import { getUploadInformation } from '../../services/app';
import { pinyin } from 'pinyin-pro';
const { Dragger } = Upload;
const { Option } = Select;

@Form.create()
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
      isDisabledUpload: false
    };
  }
  componentWillMount() {
    this.loop = false;
    this.statusloop = false;
  }
  componentDidMount() {
    this.handleJarWarUpload()
    const group_id = globalUtil.getGroupID()
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
    const group_id = globalUtil.getGroupID()
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
      archInfo
    } = this.props;
    const myheaders = {};
    const { fileList, defaultRadio, addGroup, record, region_name, existFileList, language, creatComPermission: { isCreate }, isDisabledUpload } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 7
      },
      wrapperCol: {
        span: 15
      }
    };
    const en_formItemLayout = {
      labelCol: {
        span: 7
      },
      wrapperCol: {
        span: 15
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if (archLegnth == 2) {
      arch = 'amd64'
    } else if (archInfo.length == 1) {
      arch = archInfo && archInfo[0]
    }
    const group_id = globalUtil.getGroupID()
    return (
      <>
        <div className={styles.yaml_container}>
          <Form onSubmit={this.handleSubmit}>
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
            <Form.Item
              wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: {
                  span: is_language.wrapperCol.span,
                  offset: is_language.labelCol.span
                }
              }}
            >
              <Button type="primary" htmlType="submit">
                {formatMessage({ id: 'teamAdd.create.btn.create' })}
              </Button>
            </Form.Item>
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
