/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Form, Icon, Input, Upload, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup'
import role from '@/utils/newRole';
import globalUtil from '../../utils/global'
import handleAPIError from '../../utils/error';
import styles from './index.less';
import { pinyin } from 'pinyin-pro';
import {
  getGroupNameRules,
  getK8sAppNameRules
} from './validations';
const { Dragger } = Upload;

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
      addGroup: false,
      record: {},
      event_id: '',
      existFileList: [],
      creatComPermission: {}
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
        creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${globalUtil.getAppID() || group_id}`)
      })
    }
  }
  componentWillUnmount() {
    this.loop = false;
    this.statusloop = false;
  }
  // 表单提交
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    const group_id = globalUtil.getAppID();
    const { event_id, existFileList } = this.state;

    form.validateFields((err, value) => {
      if (err) return;

      // 设置应用分组 ID
      if (group_id) {
        value.group_id = group_id;
      }

      // 检查是否有上传文件
      if (existFileList.length > 0) {
        onSubmit(value, event_id);
      } else {
        this.loop = true;
        this.handleJarWarUploadStatus();
        notification.error({
          message: formatMessage({ id: 'notification.error.notDetected' })
        });
      }
    });
  };

  // 生成英文名
  generateEnglishName = (name) => {
    if (!name) {
      return '';
    }

    const { comNames } = this.state;
    const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    const cleanedPinyinName = pinyinName.toLowerCase();

    // 检查名称是否已存在
    if (comNames && comNames.length > 0) {
      const isExist = comNames.some(item => item === cleanedPinyinName);
      if (isExist) {
        const random = Math.floor(Math.random() * 10000);
        return `${cleanedPinyinName}${random}`;
      }
    }

    return cleanedPinyinName;
  };

  handleChange = (values) => {
    this.setState({
      creatComPermission: role.queryPermissionsInfo(this.props.currentTeamPermissionsInfo?.team, 'app_overview', `app_${values}`)
    })
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
    role.refreshPermissionsInfo(groupId, false, this.handlePermissionCallback);
    this.cancelAddGroup();
  };

  handlePermissionCallback = (val) => {
    this.setState({ creatComPermission: val });
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
            event_id: res.bean.event_id
          }, () => {
            if (res.bean.region !== '') {
              this.loop = true;
              this.handleJarWarUploadStatus();
            }
          })
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
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
      handleError: err => {
        handleAPIError(err);
      }
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
        if (data.bean.res === 'ok') {
          this.setState({
            existFileList: []
          });
          notification.success({
            message: formatMessage({ id: 'notification.success.delete_file' })
          })
          this.handleJarWarUpload()
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  }
  // 上传
  onChangeUpload = info => {
    let { fileList } = info;
    fileList = fileList.filter(file => {
      if (file.response) {
        return file.response.msg === 'success';
      }
      return true;
    });
    this.setState({ fileList });
  };
  //删除
  onRemove = () => {
    this.setState({ fileList: [] });
  };
  render() {
    const {
      form: { getFieldDecorator },
      groups,
      showSubmitBtn = true
    } = this.props;
    const myheaders = {};
    const { fileList, addGroup, record, existFileList } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const group_id = globalUtil.getAppID()
    return (
      <>
        <div className={styles.yaml_container}>
          <Form {...formItemLayout} layout="vertical" onSubmit={this.handleSubmit}>
            {!group_id && <>
              <Form.Item
                label={formatMessage({ id: 'popover.newApp.appName' })}
                {...formItemLayout}
              >
                {getFieldDecorator('group_name', {
                  initialValue: this.props.form.getFieldValue('service_cname') || '',
                  rules: getGroupNameRules()
                })(<Input placeholder={formatMessage({ id: 'popover.newApp.appName.placeholder' })} />)}
              </Form.Item>
              <Form.Item {...formItemLayout} label={formatMessage({ id: 'popover.newApp.appEngName' })}>
                {getFieldDecorator('k8s_app', {
                  initialValue: this.generateEnglishName(this.props.form.getFieldValue('group_name') || ''),
                  rules: getK8sAppNameRules()
                })(<Input placeholder={formatMessage({ id: 'popover.newApp.appEngName.placeholder' })} />)}
              </Form.Item>
            </>}
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
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </>
    );
  }
}
