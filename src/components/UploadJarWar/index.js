/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Upload, Icon, notification, message, Radio } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global'
import { pinyin } from 'pinyin-pro';
import cookie from '../../utils/cookie';
import styles from './index.less'
const { Option } = Select;

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};
const en_formItemLayout = {
  labelCol: {
    span: 7
  },
  wrapperCol: {
    span: 17
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
      fileList: [],
      isShowCom: true,
      record: {},
      event_id: '',
      region_name: '',
      team_name: '',
      percents: false,
      existFileList: [],
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentWillMount() {
    this.loop = false;
  }
  componentDidMount() {
    this.handleJarWarUploadRecord('jwar')
  }
  componentWillUnmount() {
    this.loop = false;
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
        component_id: '',
        file_type: fileType
      },
      callback: data => {
        if (data.bean && data.bean.source_dir && data.bean.source_dir.length > 0) {
          this.setState({
            existFileList: data.bean.source_dir,
            event_id: data.bean.event_id
          })
        } else {
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
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit, archInfo } = this.props;
    const { event_id } = this.state
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        if(archInfo && archInfo.length != 2 && archInfo.length != 0){
          fieldsValue.arch = archInfo[0]
        }
        onSubmit(fieldsValue, event_id);
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error(formatMessage({ id: 'otherApp.UploadYaml.name_en' })));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error(formatMessage({ id: 'otherApp.UploadYaml.only' }))
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error(formatMessage({ id: 'otherApp.UploadYaml.max' })));
    }
  };
  render() {
    const { form } = this.props;
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
    const { fileList, defaultRadio, isShowCom, addGroup, record, region_name, existFileList, language } = this.state
    const data = this.props.data || {};
    const disableds = this.props.disableds || [];
    const isService = handleType && handleType === 'Service';
    const is_language = language ? formItemLayout : en_formItemLayout;
    let arch = 'amd64'
    let archLegnth = archInfo.length
    if(archLegnth == 2){
      arch = 'amd64'
    }else if(archInfo.length == 1){
      arch = archInfo && archInfo[0]
    }
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...is_language} label={formatMessage({ id: 'otherApp.UploadYaml.name' })}>
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'otherApp.UploadYaml.app' })
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'otherApp.UploadYaml.app' })}
                style={{
                  display: 'inline-block',
                  width: isService ? '' : 292,
                  marginRight: 15
                }}
                disabled={!!isService}
              >
                {(groups || []).map(group => (
                  <Option value={group.group_id}>{group.group_name}</Option>
                ))}
              </Select>
            )}
            {isService ? null : showCreateGroup ? (
              <Button onClick={this.onAddGroup}>
                {formatMessage({ id: 'popover.newApp.title' })}
              </Button>
            ) : null}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'otherApp.UploadJarWar.name' })}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'otherApp.UploadJarWar.input_name' })
                },
                {
                  max: 24,
                  message: formatMessage({ id: 'otherApp.UploadJarWar.max' })
                }
              ]
            })(
              <Input
                disabled={disableds.indexOf('service_cname') > -1}
                placeholder={formatMessage({ id: 'otherApp.UploadJarWar.placese' })}
              />
            )}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({ id: 'otherApp.UploadJarWar.en_name' })}>
            {getFieldDecorator('k8s_component_name', {
              initialValue: form.getFieldValue('service_cname') && pinyin(form.getFieldValue('service_cname'), {toneType: 'none'}).replace(/\s/g, ''),
              rules: [
                { required: true, validator: this.handleValiateNameSpace }
              ]
            })(<Input placeholder={formatMessage({ id: 'otherApp.UploadJarWar.input_en_name' })} />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({ id: 'otherApp.UploadYaml.up' })}
            extra={formatMessage({ id: 'otherApp.UploadJarWar.jar' })}

            {...is_language}
          >
            {getFieldDecorator('packageTarFile', {
              rules: [
                {
                  required: false,
                  message: formatMessage({ id: 'otherApp.UploadYaml.placese_up' })
                }
              ]
            })(
              <Upload
                fileList={fileList}
                name="packageTarFile"
                onChange={this.onChangeUpload}
                onRemove={this.onRemove}
                action={record.upload_url}
                multiple={true}
              >
                <Button>
                  <Icon type="upload" /> {formatMessage({ id: 'otherApp.UploadYaml.up' })}
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
            {archLegnth == 2 &&
            <Form.Item {...is_language} label={formatMessage({id:'enterpriseColony.mgt.node.framework'})}>
            {getFieldDecorator('arch', {
              initialValue: arch,
              rules: [{ required: true, message: formatMessage({ id: 'placeholder.code_version' }) }]
            })(
              <Radio.Group onChange={this.onChangeCpu} value={this.state.value}>
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
                  span: is_language.wrapperCol.span,
                  offset: is_language.labelCol.span
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
                    {formatMessage({ id: 'otherApp.UploadJarWar.new' })}
                  </Button>,
                  false
                )
                : !handleType && (
                  <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByDockerrunLoading}
                  >
                    {formatMessage({ id: 'otherApp.UploadYaml.creat' })}
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
