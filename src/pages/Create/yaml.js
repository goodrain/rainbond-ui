/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Input, Radio, Upload, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import roleUtil from '../../utils/role';
import styles from './yaml.less';

const { Option } = Select;

@Form.create()
@connect(
  ({ teamControl, global, enterprise }) => ({
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
  state = { fileList: [], defaultRadio: 'jwar', isShowCom: true };
  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }

  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, value) => {
      if (err) return;
      console.log(value, 'value');
    });
  };
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
    console.log(values,'values')
  }
  render() {
    const {
      form: { getFieldDecorator }
    } = this.props;
    const { fileList, defaultRadio, isShowCom } = this.state;
    const props = {
      name: 'file',
      action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // 后端图片地址
      headers: {
        authorization: 'authorization-text' // token 可以不传
      },
      // 上传时触发
      onChange: ({ fileList, file }) => {
        fileList = fileList.map(file => {
          if (file.response) {
            file.url = file.response.url;
          }
          return file;
        });
        this.setState({ fileList });
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
              <Form.Item label="应用名称">
                {getFieldDecorator('app_name', {
                  rules: [
                    {
                      required: true,
                      message: '请输入应用名称'
                    }
                  ]
                })(
                  <Select style={{ width: 200 }} onChange={this.handleChange}>
                    <Option value="jack">Jack</Option>
                    <Option value="lucy">Lucy</Option>
                    <Option value="Yiminghe">yiminghe</Option>
                  </Select>
                )}
                <Button style={{marginLeft:'4px'}}>新建应用</Button>
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
                  {getFieldDecorator('component_name', {
                    rules: [
                      {
                        required: true,
                        message: '请输入组件名称'
                      }
                    ]
                  })(<Input placeholder="请输入" />)}
                </Form.Item>
              )}

              <Form.Item
                label="上传文件"
                extra="支持Jar、War、yaml格式上传文件"
              >
                {getFieldDecorator('files', {
                  rules: [
                    {
                      required: true,
                      message: '请上传文件'
                    }
                  ]
                })(
                  <Upload {...props} fileList={fileList}>
                    <Button>
                      <Icon type="upload" /> 上传文件
                    </Button>
                  </Upload>
                )}
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
                  点击创建
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      </PageHeaderLayout>
    );
  }
}
