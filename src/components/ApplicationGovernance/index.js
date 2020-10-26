/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import {
  Form,
  Modal,
  Select,
  Input,
  Alert,
  Table,
  notification,
  Button
} from 'antd';
import { connect } from 'dva';
import globalUtil from '../../utils/global';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;

/* 转移到其他应用组 */

@Form.create()
@connect()
export default class ApplicationGovernance extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      page: 1,
      page_size: 6,
      total: 0,
      step: false,
      ServiceNameList: []
    };
  }

  componentDidMount() {
    // this.fetchServiceNameList();
  }

  onPageChange = page => {
    this.setState({ page }, () => {
      // this.handleGovernancemode();
    });
  };

  setK8sServiceNames = value => {
    const { dispatch, appID, onCancel } = this.props;
    const arr = [];
    const apps = this.getSelected();
    apps.map(item => {
      const {
        service_id: id,
        port_alias: alias,
        service_cname: serviceCname,
        k8s_service_name: name,
        port
      } = item;
      const setAlias = `${id}/${alias}`;
      const k8ServiceName = `${id}/${name}`;
      if (setAlias && k8ServiceName) {
        arr.push({
          service_cname: serviceCname,
          service_id: id,
          port,
          port_alias: value[setAlias],
          k8s_service_name: value[k8ServiceName]
        });
      }
    });
    dispatch({
      type: 'global/setCheckK8sServiceName',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID,
        arr
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            ServiceNameList: res.bean.k8s_service_names
          });
          onCancel();
        }
      }
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    const { step } = this.state;
    form.validateFields((err, value) => {
      console.log('value', value);
      if (!err) {
        if (step) {
          // this.checkK8sServiceName({ k8s_service_name: 'graca965_80' });
          this.setK8sServiceNames(value);
        } else {
          this.handleGovernancemode(value);
        }
      }
    });
  };

  handleGovernancemode = value => {
    const { dispatch, appID, onCancel } = this.props;
    dispatch({
      type: 'global/setgovernancemode',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID,
        governance_mode: value.governance_mode
      },
      callback: () => {
        notification.success({
          message: '切换成功',
          duration: '3'
        });
        if (value.governance_mode === 'BUILD_IN_SERVICE_MESH') {
          onCancel();
        } else {
          this.fetchServiceNameList();
        }
      }
    });
  };

  fetchServiceNameList = () => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'global/fetchServiceNameList',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID
      },
      callback: res => {
        if (res && res.bean) {
          this.setState({
            step: true,
            ServiceNameList: res.list
          });
        }
      }
    });
  };
  checkK8sServiceName = value => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'global/checkK8sServiceName',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID,
        service_alias: value.service_alias,
        k8s_service_name: value.k8s_service_name
      },
      callback: res => {
        if (res && res.bean && !res.bean.is_valid) {
          this.setK8sServiceNames();
        }
      }
    });
  };

  getSelected() {
    const key = this.state.selectedRowKeys;
    const res = key.map(item => this.state.ServiceNameList[item]);
    return res;
  }

  isDisabled = () => {
    const app = this.getSelected();
    return app.length > 0;
  };

  checkServiceName = (rule, value, callback) => {
    const { dispatch, appID } = this.props;
    const { ServiceNameList } = this.stata;
    console.log('valuevalue', value);
    try {
      dispatch({
        type: 'global/checkK8sServiceName',
        payload: {
          tenantName: globalUtil.getCurrTeamName(),
          group_id: appID,
          service_alias: ServiceNameList[0].service_alias,
          k8s_service_name: ServiceNameList[0].k8s_service_name
        },
        callback: res => {
          if (res && res.bean && !res.bean.is_valid) {
            callback(); // +
          } else {
            throw new Error('格式错误!');
          }
        }
      });
    } catch (err) {
      callback(err);
      return; // +
    }
    callback(); // +
  };

  render() {
    const list = [
      { key: 'KUBERNETES_NATIVE_SERVICE', name: 'Kubernetes原生 service 模式' },
      { key: 'BUILD_IN_SERVICE_MESH', name: '内置 ServiceMesh 模式' }
    ];
    const { loading = false, onCancel, form } = this.props;
    const { step, ServiceNameList } = this.state;
    const { getFieldDecorator } = form;
    const rowSelection = {
      onChange: selectedRowKeys => {
        this.setState({ selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys
    };
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 19
        }
      }
    };
    return (
      <Modal
        title="应用治理模式切换"
        visible
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        width={800}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button
            type="primary"
            disabled={step && !this.isDisabled()}
            onClick={this.handleSubmit}
          >
            确定
          </Button>
        ]}
      >
        <Alert
          style={{ marginBottom: '20px' }}
          message="应用治理模式主要指组件见通信模式，目前支持内置ServiceMesh模式和Kubernetes原生Service模式"
          type="info"
          showIcon
        />
        {step ? (
          <Table
            size="middle"
            pagination={{
              current: this.state.page,
              pageSize: this.state.page_size,
              total: this.state.total,
              onChange: this.onPageChange
            }}
            dataSource={ServiceNameList || []}
            rowSelection={rowSelection}
            columns={[
              {
                title: '组件名称/端口',
                dataIndex: 'service_alias',
                render: (_, data) => (
                  <div>
                    {data.service_cname}/{data.port}
                  </div>
                )
              },
              {
                title: '别名',
                dataIndex: 'port_alias',
                render: (val, data) => (
                  <Form.Item style={{ marginBottom: 0 }}>
                    {form.getFieldDecorator(
                      `${data.service_id}/${data.port_alias}`,
                      {
                        initialValue: val || '',
                        rules: [
                          {
                            required: true,
                            message: '不能为空'
                          }
                        ]
                      }
                    )(<Input  size="small" />)}
                  </Form.Item>
                )
              },
              {
                title: '内部域名',
                dataIndex: 'k8s_service_name',
                render: (val, data) => (
                  <Form.Item style={{ marginBottom: 0 }}>
                    {form.getFieldDecorator(
                      `${data.service_id}/${data.k8s_service_name}`,
                      {
                        initialValue: val || '',
                        rules: [
                          {
                            required: true,
                            message: '不能为空'
                          },
                          {
                            validator: this.checkServiceName
                          }
                        ]
                      }
                    )(<Input  size="small" />)}
                  </Form.Item>
                )
              }
            ]}
          />
        ) : (
          <Form onSubmit={this.handleSubmit}>
            <FormItem {...formItemLayout} label="治理模式选择">
              {getFieldDecorator('governance_mode', {
                initialValue: 'KUBERNETES_NATIVE_SERVICE',
                rules: [
                  {
                    required: true,
                    message: '不能为空!'
                  }
                ]
              })(
                <Select>
                  {list.map(item => {
                    return (
                      <Option key={item.key} value={item.key}>
                        {item.name}
                      </Option>
                    );
                  })}
                </Select>
              )}
            </FormItem>
            <FormItem {...formItemLayout} label="模式说明">
              {getFieldDecorator('volume_path', {
                initialValue: '',
                rules: [
                  {
                    required: false,
                    message: '请输入模式说明'
                  }
                ]
              })(<TextArea placeholder="请输入模式说明" />)}
            </FormItem>
          </Form>
        )}
      </Modal>
    );
  }
}
