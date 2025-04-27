/*
  挂载共享目录组件
*/

import React, { PureComponent } from 'react';
import { Link } from 'dva/router';
import {
  Input,
  Table,
  Modal,
  notification,
  Tabs,
  Tooltip,
  Form,
  Radio,
  Button,
  Row,
  Col,
  Upload,
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { getMnt } from '../../services/app';
import globalUtil from '../../utils/global';
import { getVolumeTypeShowName } from '../../utils/utils';
import apiconfig from '../../../config/api.config';
import cookie from '../../utils/cookie';
import pluginUtil from '../../utils/plugin';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { TextArea } = Input;
const TabPane = Tabs.TabPane;

@Form.create()
export default class AddVolumes extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      list: [],
      total: 0,
      current: 1,
      pageSize: 6,
      localpaths: {},
      configurationShow: !!(
        this.props.data &&
        this.props.data.volume_type &&
        this.props.data.volume_type == 'config-file'
      ),
      configuration_content: '',
    };
  }

  componentDidMount() {
    this.loadUnMntList();
  }

  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({ message: formatMessage({id:'notification.warn.catalogue'}) });
      return;
    }

    let res = [];
    res = this.state.selectedRowKeys.map(index => {
      const data = this.state.list[index];
      return {
        id: data.dep_vol_id,
        path: this.state.localpaths[data.dep_vol_id],
      };
    });
    res = res.filter(item => !!item.path);

    if (!res.length) {
      notification.warning({ message: formatMessage({id:'notification.warn.fillIn'}) });
      return;
    }

    this.props.onSubmit && this.props.onSubmit(res);
  };
  checkMountPath = (_, value, callback) => {
    if (value === '' || !value) {
      callback('请输入挂载路径');
      return;
    }

    if (pluginUtil.isMountPath(value)) {
      callback('挂载路径为系统保留路径，请更换其他路径');
      return;
    }

    callback();
  };
  handleTableChange = (page, pageSize) => {
    this.setState(
      {
        current: page,
        pageSize,
      },
      () => {
        this.loadUnMntList();
      }
    );
  };

  loadUnMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: this.state.current,
      page_size: this.state.pageSize,
      type: 'unmnt',
    }).then(data => {
      if (data) {
        this.setState({
          list: data.list || [],
          total: data.total,
        });
      }
    });
  };

  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };

  isDisabled = (data, index) =>
    this.state.selectedRowKeys.indexOf(index) === -1;

  handleChange = (value, data, index) => {
    const local = this.state.localpaths;
    local[data.dep_vol_id] = value;
    this.setState({ localpaths: local });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { data, appBaseInfo } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
    };
    const token = cookie.get('token');

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          selectedRowKeys,
        });
      },
    };
    const { total, current, pageSize } = this.state;

    const pagination = {
      onChange: this.handleTableChange,
      total,
      pageSize,
      current,
    };

    return (
      <Modal
        title="挂载共享目录"
        width={1150}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Tab 1" key="1">
            <Form onSubmit={this.handleSubmit}>
              <FormItem {...formItemLayout} label="名称">
                {getFieldDecorator('volume_name', {
                  initialValue: data.volume_name || '',
                  rules: [
                    {
                      required: true,
                      message: '请输入存储名称',
                    },
                  ],
                })(
                  <Input
                    placeholder="请输入存储名称"
                    disabled={!!this.props.editor}
                  />
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="挂载路径">
                {getFieldDecorator('volume_path', {
                  initialValue: data.volume_path || '',
                  rules: [
                    {
                      required: true,
                      message: '请输入挂载路径',
                      validator: this.checkMountPath,
                    },
                  ],
                })(<Input placeholder="请输入挂载路径" />)}
              </FormItem>
              <FormItem {...formItemLayout} label="类型">
                {getFieldDecorator('volume_type', {
                  initialValue: 'config-file',
                  rules: [
                    {
                      required: true,
                      message: '请选择存储类型',
                    },
                  ],
                })(
                  <RadioGroup onChange={this.handleChange}>
                    <Radio value="config-file" disabled={!!this.props.editor}>
                      <Tooltip title="编辑或上传您的配置文件内容">
                        配置文件
                      </Tooltip>
                    </Radio>
                  </RadioGroup>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="文件内容"
                style={{ textAlign: 'right' }}
              >
                {getFieldDecorator('file_content', {
                  initialValue: data.file_content || undefined,
                  rules: [{ required: true, message: '请编辑内容!' }],
                })(
                  <TextArea
                    rows={8}
                    style={{ backgroundColor: '#02213f', color: '#fff' }}
                  />
                )}
              </FormItem>
              <Row>
                <Col style={{ marginTop: '-7%' }} span={4} offset={4}>
                  <FormItem>
                    {getFieldDecorator('configuration_check', {
                      rules: [{ validator: this.checkFile }],
                    })(
                      <Upload
                        action={`${apiconfig.baseUrl}/console/enterprise/team/certificate`}
                        showUploadList={false}
                        withCredentials
                        headers={{ Authorization: `GRJWT ${token}` }}
                        beforeUpload={this.beforeUpload}
                      >
                        <Button size="small">上传</Button>
                      </Upload>
                    )}
                  </FormItem>
                </Col>
              </Row>
            </Form>
          </TabPane>
          <TabPane tab="Tab 2" key="2">
            <Table
              pagination={pagination}
              rowKey={(record,index) => index}
              dataSource={this.state.list}
              rowSelection={rowSelection}
              style={{ width: '100%', overflowX: 'auto' }}
              columns={[
                {
                  title: '本地挂载路径',
                  dataIndex: 'localpath',
                  key: '1',
                  width: '20%',
                  render: (localpath, data, index) => (
                    <Input
                      onChange={e => {
                        this.handleChange(e.target.value, data, index);
                      }}
                      disabled={this.isDisabled(data, index)}
                    />
                  ),
                },
                {
                  title: '目标存储名称',
                  dataIndex: 'dep_vol_name',
                  key: '2',
                  width: '15%',
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word',
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  title: '目标挂载路径',
                  dataIndex: 'dep_vol_path',
                  key: '3',
                  width: '15%',
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: 'break-all',
                          wordWrap: 'break-word',
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  title: '目标存储类型',
                  dataIndex: 'dep_vol_type',
                  key: '4',
                  width: '15%',
                  render: (text, record) => {
                    return (
                      <Tooltip title={text}>
                        <span
                          style={{
                            wordBreak: 'break-all',
                            wordWrap: 'break-word',
                          }}
                        >
                          {getVolumeTypeShowName(null, text)}
                        </span>
                      </Tooltip>
                    );
                  },
                },
                {
                  title: '目标所属组件',
                  dataIndex: 'dep_app_name',
                  key: '5',
                  width: '15%',
                  render: (v, data) => {
                    return (
                      <Tooltip title={v}>
                        <Link
                          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                            data.dep_group_id
                          }/overview?type=components&componentID=${data.dep_app_alias}&tab=overview`}
                        >
                          <span
                            style={{
                              wordBreak: 'break-all',
                              wordWrap: 'break-word',
                            }}
                          >
                            {v}
                          </span>
                        </Link>
                      </Tooltip>
                    );
                  },
                },
                {
                  title: '目标组件所属应用',
                  dataIndex: 'dep_app_group',
                  key: '6',
                  width: '15%',
                  render: (v, data) => {
                    return (
                      <Tooltip title={v}>
                        <Link
                          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                            data.dep_group_id
                          }/overview`}
                        >
                          <span
                            style={{
                              wordBreak: 'break-all',
                              wordWrap: 'break-word',
                            }}
                          >
                            {v}
                          </span>
                        </Link>
                      </Tooltip>
                    );
                  },
                },
              ]}
            />
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}
