/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
import { Button, Form, Input, Select, Upload, Icon, notification, message } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import AddGroup from '../../components/AddOrEditGroup';
import globalUtil from '../../utils/global'
import styles from './index.less'
const { Option } = Select;
const { Dragger } = Upload;
const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
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
    };
  }
  componentWillMount() {
    this.loop = false;
  }
  componentDidMount() {
    this.handleJarWarUploadRecord('yaml')
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
        }else{
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
            notification.success({
              message:formatMessage({id:'notification.success.upload_file'})
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
        if(data.bean.res == 'ok'){
          this.setState({ 
            existFileList: []
           });
          notification.success({
            message: formatMessage({id:'notification.success.delete_file'})
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
    const { form, onSubmit } = this.props;
    const { event_id } = this.state
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue, event_id);
      }
    });
  };
  handleValiateNameSpace = (_, value, callback) => {
    if (!value) {
      return callback(new Error('请输入组件英文名称'));
    }
    if (value && value.length <= 32) {
      const Reg = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (!Reg.test(value)) {
        return callback(
          new Error('只支持小写字母、数字或“-”，并且必须以字母开始、以数字或字母结尾')
        );
      }
      callback();
    }
    if (value.length > 32) {
      return callback(new Error('不能大于32个字符'));
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const {
      groups,
      createAppByDockerrunLoading,
      handleType,
      ButtonGroupState,
      groupId,
      showSubmitBtn = true,
      showCreateGroup = true
    } = this.props;
    const {fileList, defaultRadio, isShowCom, addGroup, record, region_name, existFileList} = this.state
    const data = this.props.data || {};
    const disableds = this.props.disableds || [];
    const isService = handleType && handleType === 'Service';
    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_id', {
              initialValue: isService ? Number(groupId) : data.group_id,
              rules: [
                {
                  required: true,
                  message: '请选择'
                }
              ]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder="请选择要所属应用"
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
                {formatMessage({id:'popover.newApp.title'})}
              </Button>
            ) : null}
          </Form.Item>
          <Form.Item
                label="上传文件"
                extra="支持yaml、yml格式上传文件"
                {...formItemLayout}
            >
                {getFieldDecorator('packageTarFile', {
                rules: [
                    {
                    required: false,
                    message: '请上传文件'
                    }
                ]
                })(
                <Dragger
                    fileList={fileList} 
                    accept=".yaml,.yml"
                    name="packageTarFile"
                    onChange={this.onChangeUpload}
                    onRemove={this.onRemove}
                    action={record.upload_url}
                    multiple={true}
                >
                    <p className="ant-upload-drag-icon">
                      <Icon type="inbox" />
                    </p>
                </Dragger>
                )}
            </Form.Item>
            <Form.Item
                {...formItemLayout}
            >
                {existFileList.length > 0 &&existFileList.map((item) => {
                    return (
                    <div style={{marginLeft:'100px'}}>
                        <Icon style={{marginRight:'6px'}} type="inbox" />
                        {item}
                        <Icon onClick={this.handleJarWarUploadDelete} style={{marginLeft:'12px', color:'red', cursor:'pointer'}} type="delete" /> 
                    </div>
                    )
                })}         
              </Form.Item>
            <Form.Item
              wrapperCol={{
                xs: {
                  span: 24,
                  offset: 0
                },
                sm: {
                  span: formItemLayout.wrapperCol.span,
                  offset: formItemLayout.labelCol.span
                }
              }}
              label=""
            >
              
                <Button
                    onClick={this.handleSubmit}
                    type="primary"
                    loading={createAppByDockerrunLoading}
                >
                    确认创建
                </Button>
            </Form.Item>
        </Form>
        {this.state.addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </Fragment>
    );
  }
}
