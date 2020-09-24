/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { Form, Modal, Select, Input, Alert, Table, notification } from 'antd';
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
    this.fetchServiceNameList();
  }

  onPageChange = page => {
    this.setState({ page }, () => {
      // this.handleGovernancemode();
    });
  };

  setK8sServiceNames = value => {
    const { dispatch, appID, onCancel } = this.props;
    dispatch({
      type: 'global/setCheckK8sServiceName',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID,
        k8s_service_names: value
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
    form.validateFields((err, value) => {
      if (!err) {
        this.handleGovernancemode(value);
      }
    });
  };

  handleSubmitk8sServiceNames = () => {
    const { form } = this.props;
    form.validateFields((err, value) => {
      if (!err) {
        this.checkK8sServiceName(value);
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
        if (value.governance_mode === 'BuiltInServiceMesh') {
          notification.success({
            message: '切换成功',
            duration: '3'
          });
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
            ServiceNameList: res.bean.k8s_service_names
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
        if (res && res.bean && res.bean.is_valid) {
          this.setK8sServiceNames();
        }
      }
    });
  };

  render() {
    const list = [
      { key: 'KubernetesNativeService', name: 'Kubernetes原生 service 模式' },
      { key: 'BuiltInServiceMesh', name: '内置 ServiceMesh 模式' }
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
                    {data.service_alias}/{data.port}
                  </div>
                )
              },
              {
                title: '别名',
                dataIndex: 'k8s_service_name',
                render: (val, data) => (
                  <Form onSubmit={this.handleSubmitk8sServiceNames}>
                    <Form.Item>
                      {form.getFieldDecorator(
                        `${data.service_alias}_${data.b2cSalesOrdItemId}`,
                        {
                          initialValue: val,
                          rules: [
                            {
                              required: true,
                              // pattern: REG_ONLY_INTEGER,
                              message: '不能为空'
                            }
                          ]
                        }
                      )(<Input maxLength="6" size="small" />)}
                    </Form.Item>
                  </Form>
                )
              }
            ]}
          />
        ) : (
          <Form onSubmit={this.handleSubmit}>
            <FormItem {...formItemLayout} label="治理模式选择">
              {getFieldDecorator('governance_mode', {
                initialValue: 'KubernetesNativeService',
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
                    required: true,
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
