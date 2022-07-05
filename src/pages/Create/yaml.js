/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select, message } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import AddGroup from '../../components/AddOrEditGroup'
import roleUtil from '../../utils/role';
import globalUtil from '../../utils/global'
import styles from './yaml.less';
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
      addGroup:false,
      record: {},
      event_id: '',
      region_name: '',
      team_name: '',
      percents: false,
      existFileList: []

    };
  }
  componentWillMount() {
    this.loop = false;
    this.statusloop = false;
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  componentDidMount(){
    this.loop = true;
    this.handleJarWarUpload()
    this.handleJarWarUploadRecord()
  }
  //表单提交
  handleSubmit = e => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    const { event_id, region_name, team_name } = this.state
    form.validateFields((err, value) => {
      if (err) return;
      console.log(value, 'value');
      dispatch({
        type: "createApp/createJarWarFormSubmit",
        payload: {
          region_name,
          team_name,
          event_id,
          ...value
        },
        callback: (data) => {
          console.log(data,'data')
          const appAlias = data && data.bean.service_alias
          dispatch(
            routerRedux.push(
              `/team/${team_name}/region/${region_name}/create/create-check/${appAlias}`
            )
          );
        },
      });
    });
  };
  // 更换上传方式
  handleChangeUpType = e => {
    if (e.target.value === 'yaml') {
      this.setState({
        isShowCom: false,
        defaultRadio: e.target.value
      });
    } else {
      this.setState({
        isShowCom: true
      });
    }
  };
  handleChange = (values) => {
    console.log(values, 'values')
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
  getPdfURL = () => {
    
    const props = {
      name: 'file',
      // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // 后端图片地址
      // 上传时触发
      onChange: ({ fileList, file }) => {
        fileList = fileList.map(file => {
          if (file.response) {
            file.url = file.response.url;
          }
          return file;
        });
        this.setState({ fileList });
        console.log('触发这个方法')
        // console.log(info, 'info');
        // console.log(file, 'file');
        // console.log(fileList, 'fileList');
        
      },
      onRemove: info => {
        // console.log(info, 'info');
        // console.log('删除时触发');
        // console.log(fileList, 'fileList');
        // this.setState({ fileList: [] });
      }
    };
    return props
  }
  handleJarWarUpload = () => {
    const { dispatch } = this.props
    //获取上传事件
    dispatch({
      type: "createApp/createJarWarServices",
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        component_id:'',
      },
      callback: (res) => {
        console.log(res,'data')
        if (res && res.status_code === 200) {
          this.setState({
            record: res.bean,
            event_id: res.bean.event_id,
            region_name: res.bean && res.bean.region,
            team_name: res.bean && res.bean.team_name
          },() => {
            if (res.bean.region !== '') {
              // this.openQueryImportStatus();
              this.handleJarWarUploadStatus();
            }
          })
        }
      },
    });
  }
  //查询上传记录
  handleJarWarUploadRecord = () => {
    const {
      dispatch
    } = this.props;
    dispatch({
      type: 'createApp/createJarWarUploadRecord',
      payload: {
        region: globalUtil.getCurrRegionName(),
        team_name: globalUtil.getCurrTeamName(),
        component_id:'',
      },
      callback: data => {
        if (data) {
          console.log(data,'data')
        }
      },
      handleError: () => {}
    });
  }
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
        event_id
      },
      callback: data => {
        if (data) {
          this.setState({ existFileList: data.list });
          console.log(data,'data')
        }
        if (this.loop) {
          setTimeout(() => {
            this.handleJarWarUploadStatus();
          }, 6000);
        }
      },
      handleError: () => {}
    });
  };
  //上传
  onChangeUpload = info => {
    console.log(info,'info')
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
    const { fileList, defaultRadio, isShowCom, addGroup, record, region_name } = this.state;
   
    // const props = {
    //   name: 'file',
    //   multiple: true,
    //   action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    //   onChange(info) {
    //     // fileList = fileList.map(file => {
    //     //   if (file.response) {
    //     //     file.url = file.response.url;
    //     //   }
    //     //   return file;
    //     // });
    //     const { status } = info.file;
    //     if (status !== 'uploading') {
    //       console.log(info.file, info.fileList);
    //     }
    //     if (status === 'done') {
    //       message.success(`${info.file.name} file uploaded successfully.`);
    //     } else if (status === 'error') {
    //       message.error(`${info.file.name} file upload failed.`);
    //     }
    //   },
    //   // onRemove: info => {
    //   //   // console.log(info, 'info');
    //   //   // console.log('删除时触发');
    //   //   // console.log(fileList, 'fileList');
    //   //   // this.setState({ fileList: [] });
    //   // }
    // };
    const formItemLayout = {
      labelCol: {
        xs: { span: 9 },
        sm: { span: 9 }
      },
      wrapperCol: {
        xs: { span: 5 },
        sm: { span: 5 }
      }
    };

    return (
      <PageHeaderLayout
        title="上传文件创建"
        content={
          <p>
            第三方组件，即运行于平台集群外的组件，在平台中创建组件即可以将其与
            平台网关无缝对接，同时也可以被平台内服务访问。满足用户通过平台可以对各类组件进行统一的监控和管理需要。
          </p>
        }
      >
        <Card>
          <div className={styles.yaml_container}>
            <Form {...formItemLayout} onSubmit={this.handleSubmit}>
              <Form.Item label="应用名称" style={{display:'flex'}}>
                {getFieldDecorator('group_id', {
                  rules: [
                    {
                      required: true,
                      message: '请输入应用名称'
                    }
                  ]
                })(
                  <Select 
                    onChange={this.handleChange}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    placeholder="请选择要所属应用"
                  >
                    {(groups || []).map(group => (
                      <Option value={group.group_id}>{group.group_name}</Option>
                    ))}
                  </Select>
                )}
                <Button style={{ marginLeft: '4px' }} onClick={this.onAddGroup}>新建应用</Button>
              </Form.Item>
              <Form.Item label="上传格式">
                {getFieldDecorator('up_type', {
                  initialValue: 'jwar'
                })(
                  <Radio.Group
                    value={defaultRadio}
                    onChange={this.handleChangeUpType}
                  >
                    <Radio value="jwar">Jar、War</Radio>
                    <Radio value="yaml">Yaml</Radio>
                  </Radio.Group>
                )}
              </Form.Item>
              {isShowCom && (
                <Form.Item label="组件名称">
                  {getFieldDecorator('service_cname', {
                    rules: [
                      {
                        required: true,
                        message: '请输入组件名称'
                      }
                    ]
                  })(<Input placeholder="请输入" />)}
                </Form.Item>
              )}
              {isShowCom && (
                <Form.Item label="组件英文名称">
                  {getFieldDecorator('k8s_component_name', {
                    rules: [
                      {
                        required: true,
                        message: '请输入组件英文名称'
                      }
                    ]
                  })(<Input placeholder="请输入" />)}
                </Form.Item>
              )}
              {isShowCom ? (
                <Form.Item
                  label="上传文件"
                  extra="支持Jar、War格式上传文件"
                >
                  {getFieldDecorator('packageTarFile', {
                    rules: [
                      {
                        required: true,
                        message: '请上传文件'
                      }
                    ]
                  })(
                    <Upload  
                      // {...this.getPdfURL()}
                      fileList={fileList} 
                      accept=".jar,.war"
                      name="packageTarFile"
                      onChange={this.onChangeUpload}
                      onRemove={this.onRemove}
                      action={record.upload_url}
                      showUploadList={true}
                      headers={myheaders}
                      disabled={region_name === ''}
                    >
                      <Button>
                        <Icon type="upload" /> 上传文件
                      </Button>
                    </Upload>
                  )}
                </Form.Item>
              ) : (
                <Form.Item
                  label="上传文件"
                  extra="只支持yaml格式上传多文件"
                >
                  {getFieldDecorator('packageTarFile', {
                    rules: [
                      {
                        required: true,
                        message: '请上传文件'
                      }
                    ]
                  })(
                    <Upload fileList={fileList} accept=".yaml">
                      <Dragger>
                        <p className="ant-upload-drag-icon">
                          <Icon type="inbox" />
                        </p>
                      </Dragger>
                    </Upload>
                  )}
                </Form.Item>
              )}

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
                  点击创建
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
        {addGroup && (
          <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
        )}
      </PageHeaderLayout>
    );
  }
}
