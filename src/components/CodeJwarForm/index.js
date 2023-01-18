/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import AddGroup from '../../components/AddOrEditGroup'
import roleUtil from '../../utils/role'
import globalUtil from '../../utils/global'
import cookie from '../../utils/cookie';
import styles from './index.less';
import { getUploadInformation } from '../../services/app';
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
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentWillMount() {
    this.loop = false;
    this.statusloop = false;
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  componentDidMount() {
    this.handleJarWarUploadRecord('jwar')
  }
  componentWillUnmount() {
    this.loop = false;
    this.statusloop = false;
  }
  //表单提交
  handleSubmit = e => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const regionName = globalUtil.getCurrRegionName()
    const { event_id, existFileList, groupName } = this.state
    form.validateFields((err, value) => {
      if (err) return;
      if (existFileList.length > 0) {
        dispatch({
          type: "createApp/createJarWarFormSubmit",
          payload: {
            region_name: regionName,
            team_name: teamName,
            event_id,
            ...value
          },
          callback: (data) => {
            const appAlias = data && data.bean.service_alias
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${regionName}/create/create-check/${appAlias}?event_id=${event_id}`
              )
            );
          },
        });
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
    this.cancelAddGroup();
  };
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
  //查询上传记录
  handleJarWarUploadRecord = (fileType) => {
    const {
      dispatch
    } = this.props;
    dispatch({
      type: 'createApp/createJarWarUploadRecord',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        file_type: fileType,
        component_id: '',
      },
      callback: data => {
        if (data.bean && data.bean.source_dir && data.bean.source_dir.length > 0) {
          this.setState({
            existFileList: data.bean.source_dir,
            event_id: data.bean.event_id
          })
        } else {
          this.setState({
            existFileList: []
          })
          this.handleJarWarUpload()
        }
      },
      handleError: () => { }
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
      form: { getFieldDecorator },
      groups
    } = this.props;
    const myheaders = {};
    const { fileList, defaultRadio, addGroup, record, region_name, existFileList, language } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 15
      }
    };
    const en_formItemLayout = {
      labelCol: {
        span: 9
      },
      wrapperCol: {
        span: 15
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
    return (
      <>
        <div className={styles.yaml_container}>
          <Form onSubmit={this.handleSubmit}>
            <Form.Item  {...is_language} label={formatMessage({ id: 'teamAdd.create.form.appName' })} style={{ display: 'flex' }}>
              {getFieldDecorator('group_id', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.group_name' })
                  }
                ]
              })(
                <Select
                  onChange={this.handleChange}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'placeholder.appName' })}
                  style={{
                    display: 'inline-block',
                    width: language ? 276 : 289,
                    marginRight: 10
                  }}
                >
                  {(groups || []).map(group => (
                    <Option value={group.group_id}>{group.group_name}</Option>
                  ))}
                </Select>
              )}
              <Button onClick={this.onAddGroup}>{formatMessage({ id: 'teamApply.createApp' })}</Button>
            </Form.Item>
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
                  fileList={fileList}
                  // accept=".jar,.war,.md"
                  name="packageTarFile"
                  onChange={this.onChangeUpload}
                  onRemove={this.onRemove}
                  action={record.upload_url}
                  headers={myheaders}
                  multiple={true}
                >
                  <Button>
                    <Icon type="upload" />
                    {formatMessage({ id: 'teamAdd.create.upload.uploadFiles' })}
                  </Button>
                </Upload>
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
            <Form.Item
              wrapperCol={{
                xs: {
                  span: 7,
                  offset: 7
                },
                sm: {
                  span: 9,
                  offset: 9
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
      //   </PageHeaderLayout>
    );
  }
}
