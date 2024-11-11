/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message, notification, Tooltip } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import AddGroup from '../../components/AddOrEditGroup'
import role from '@/utils/newRole';
import globalUtil from '../../utils/global'
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
      isShowCom: true,
      addGroup: false,
      record: {},
      event_id: '',
      region_name: '',
      team_name: '',
      percents: false,
      existFileList: [],
      groupName: '',
      creatComPermission: {}
    };
  }
  componentWillMount() {
    this.loop = false;
    this.statusloop = false;
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    // roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  componentDidMount() {
    // this.handleJarWarUploadRecord('jwar')
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
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/importMessageYaml?event_id=${event_id}&group_id=${value.group_id}&group_name=${groupName}`
          )
        );
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
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${values}`)
    })
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
    role.refreshPermissionsInfo(groupId, false, this.callbcak)
    this.cancelAddGroup();
  };
  callbcak=(val)=>{
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
          if (data.bean.package_name && data.bean.package_name.length > 0) {
            this.setState({
              existFileList: data.bean.package_name
            });
            notification.success({
              message: formatMessage({ id: 'notification.success.upload_file' })
            })
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
      form: { getFieldDecorator },
      groups
    } = this.props;
    const myheaders = {};
    const { fileList, defaultRadio, isShowCom, addGroup, record, region_name, existFileList, creatComPermission: {
      isCreate
    } } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 9
      },
      wrapperCol: {
        span: 15
      }
    };

    return (
      <>
        <div className={styles.yaml_container}>
          <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            <Form.Item label={formatMessage({ id: 'teamAdd.create.form.appName' })} style={{ display: 'flex' }}>
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
                  showSearch
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  placeholder={formatMessage({ id: 'placeholder.appName' })}
                  style={{
                    display: 'inline-block',
                    width: 276,
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
            <Form.Item
              label={formatMessage({ id: 'teamAdd.create.upload.uploadFiles' })}
              extra={formatMessage({ id: 'teamAdd.create.upload.uploadYaml' })}
            >
              {getFieldDecorator('packageTarFile', {

              })(
                <Dragger
                  fileList={fileList}
                  accept=".yaml,.yml"
                  name="packageTarFile"
                  onChange={this.onChangeUpload}
                  onRemove={this.onRemove}
                  action={record.upload_url}
                  headers={myheaders}
                  multiple={true}
                >
                  <p className="ant-upload-drag-icon">
                    <Icon type="inbox" />
                  </p>
                </Dragger>
              )}
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'teamAdd.create.fileList' })}>
              {existFileList.length > 0 ?
                (<div className={styles.update}>
                  <div className={styles.delete}>
                    <Icon onClick={this.handleJarWarUploadDelete} style={{ marginLeft: '12px', color: 'red', cursor: 'pointer' }} type="close" />
                  </div>
                  {existFileList.map((item) => {
                    return (
                      <div className={styles.fileName}>
                        <Icon style={{ marginRight: '6px' }} type="inbox" />
                        {item}
                      </div>
                    )
                  })}
                </div>
                ) : (
                  <div className={styles.empty}>
                    {formatMessage({ id: 'teamAdd.create.null_data' })}
                  </div>
                )
              }

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
              <Tooltip title={!isCreate && '您没有选择应用或选中的应用没有组件创建权限'}>
                <Button type="primary" htmlType="submit" disabled={!isCreate}>
                  {formatMessage({ id: 'teamAdd.create.btn.create' })}
                </Button>
              </Tooltip>
            </Form.Item>
          </Form>
        </div>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </>
    );
  }
}
