/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable prettier/prettier */
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Table
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect(({ loading }) => ({
  checkK8sLoading: loading.effects['application/setCheckK8sServiceName'],
  governanceLoading: loading.effects['application/setgovernancemode']
}))
export default class ApplicationGovernance extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      step: false,
      ServiceNameList: [],
      btnConfig: false,
      list: [],
      governName: this.props.mode || '',
      isFlag: (this.props.mode == 'KUBERNETES_NATIVE_SERVICE' || this.props.mode == 'BUILD_IN_SERVICE_MESH') ? true : false,
      action: '',
      newFlag: false,
    };
  }

  componentDidMount(){
    this.handleGovernanceModelList()
  }
  //获取治理模式列表
  handleGovernanceModelList = value => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'application/getGovernancemodeList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: appID,
      },
      callback: res => {
        this.setState({
          list: res.list
        })
      },
      handleError: err => {
        
      }
    });
  };
  setK8sServiceNames = value => {
    const { dispatch, appID, onCancel } = this.props;
    const { ServiceNameList } = this.state;
    const arr = [];
    ServiceNameList.map(item => {
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
      type: 'application/setCheckK8sServiceName',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID,
        arr
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.handleNotification();
          onCancel();
        }
      }
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    const { step, isFlag, action, newFlag } = this.state;
    form.validateFields((err, value) => {
      if (!err) {
        if (step) {
          this.setK8sServiceNames(value);
        } else {
          this.handleGovernancemode(value);
        }
      }
    });
  };

  handleGovernancemode = value => {
    const { dispatch, appID, onCancel, onOk } = this.props;
    const { action } = this.state
    dispatch({
      type: 'application/setgovernancemode',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID,
        governance_mode: value.governance_mode,
        action: action,
      },
      callback: (res) => {
        if(res.bean.governance_cr && action == 'create'){
          this.handleCreateKubernetes(res.bean.governance_cr)
        }else if(res.bean.governance_cr && action == 'update'){
          this.handleUpdateKubernetes(res.bean.governance_cr)
        }else{
          this.handleDeleteKubernetes()
        }
        onOk();
        if (value.governance_mode !== 'BUILD_IN_SERVICE_MESH') {
          this.fetchServiceNameList();
        } else {
          this.handleNotification();
          onCancel();
        }
      }
    });
  };
  handleNotification = () => {
    notification.success({
      message: formatMessage({id: 'notification.hint.component.change'}),
      duration: '3'
    });
  };
  fetchServiceNameList = () => {
    const { dispatch, appID, onCancel } = this.props;
    dispatch({
      type: 'application/fetchServiceNameList',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: appID
      },
      callback: res => {
        if (res && res.bean) {
          if (res.list && res.list.length > 0) {
            this.setState({
              step: true,
              ServiceNameList: res.list
            });
          } else {
            this.handleNotification();
            onCancel();
          }
        }
      }
    });
  };
  checkK8sServiceName = value => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'application/checkK8sServiceName',
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

  checkServiceName = (rule, value, callback) => {
    const { dispatch, appID } = this.props;
    const { ServiceNameList } = this.stata;
    try {
      dispatch({
        type: 'application/checkK8sServiceName',
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
            throw new Error(formatMessage({id: 'placeholder.govern.is_valid'}));
          }
        }
      });
    } catch (err) {
      callback(err);
      return; // +
    }
    callback(); // +
  };
  rowKey = (record, index) => index;
  handleOnCancel = () => {
    const { onCancel } = this.props;
    if (this.state.step) {
      this.handleNotification();
    }
    onCancel();
  };
  // 切换治理模式
  handleChange = value => {
    const { dispatch, appID, mode } = this.props;
    this.setState({
      governName: value
    })
    if(value == 'BUILD_IN_SERVICE_MESH' || value == 'KUBERNETES_NATIVE_SERVICE'){
      this.setState({
        newFlag: true
      },()=>{
        const { isFlag, newFlag} = this.state
        if(isFlag){
          if(isFlag == newFlag){
            this.setState({
              action: ''
            },()=>{
              this.getActionValue()
            })
          }else{
            this.setState({
              action: 'create'
            },()=>{
              this.getActionValue()
            })
          }
        }else{
          if(isFlag == newFlag){
            this.setState({
              action: 'update'
            },()=>{
              this.getActionValue()
            })
          }else{
            this.setState({
              action: 'delete'
            },()=>{
              this.getActionValue()
            })
          }
        }
      })
    }else{
      this.setState({
        newFlag: false
      },()=>{
        const { isFlag, newFlag} = this.state
        if(isFlag){
          if(isFlag == newFlag){
            this.setState({
              action: 'update'
            },()=>{
              this.getActionValue()
            })
          }else{
            this.setState({
              action: 'create'
            },()=>{
              this.getActionValue()
            })
          }
        }else{
          if(isFlag == newFlag){
            this.setState({
              action: 'update'
            },()=>{
              this.getActionValue()
            })
          }else{
            this.setState({
              action: 'delete'
            },()=>{
              this.getActionValue()
            })
          }
        }
      })
    }
  };

  // 获取action value
  getActionValue = () => {
    const { action } = this.state
    return action
  }

  // 创建 k8s 资源
  handleCreateKubernetes = yamlValue => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'application/createKubernetesVal',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: appID,
        governance_cr: yamlValue,
      },
      callback: res => {
        
      },
      handleError: err => {
        
      }
    });
  };
  // 更新 k8s 资源
  handleUpdateKubernetes = yamlValue => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'application/updateKubernetesVal',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: appID,
        governance_cr: yamlValue,
      },
      callback: res => {
        
      },
      handleError: err => {
        
      }
    });
  };
  // 删除 k8s 资源
  handleDeleteKubernetes = () => {
    const { dispatch, appID } = this.props;
    dispatch({
      type: 'application/deleteKubernetesVal',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_id: appID,
      },
      callback: res => {
        
      },
      handleError: err => {
        
      }
    });
  };

  handleFindDesc = (governName) => {
    const { list } = this.state
    return (
      <div style={{ marginTop: '10px' }}>
      {list.map((item)=>{
        return item.name == governName ? item.description : ''
      })}
      </div>
    )
  }
  blurInput = (e, id) =>{
    const { ServiceNameList } = this.state;
    const arr = [];
    ServiceNameList.map((item,index)=>{
      if(item.service_id == id){
        item.k8s_service_name = e.target.value
        arr.push(item)
      }else{
        arr.push(item)
      }
    })
    this.setState({
      ServiceNameList: arr
    })
  }
  render() {
    const {
      loading = false,
      onCancel,
      form,
      checkK8sLoading,
      governanceLoading,
      mode
    } = this.props;
    const { step, ServiceNameList, btnConfig, list, action, governName } = this.state;
    const { getFieldDecorator, getFieldValue } = form;
    return (
      <Modal
        title={formatMessage({id: 'confirmModal.app.govern.title'})}
        visible
        confirmLoading={loading || checkK8sLoading || governanceLoading}
        onOk={this.handleSubmit}
        onCancel={this.handleOnCancel}
        width={800}
        footer={[
          <Button onClick={this.handleOnCancel}> 
          {formatMessage({id: 'popover.cancel'})}
          </Button>,
          <Button
            type="primary"
            disabled={btnConfig}
            loading={loading || checkK8sLoading || governanceLoading}
            onClick={this.handleSubmit}
          >
            {formatMessage({id: 'popover.confirm'})}
          </Button>
        ]}
      >
        <Alert
          style={{ marginBottom: '20px' }}
          message={formatMessage({id: 'confirmModal.app.govern.alert.msg'})}
          type="info"
          showIcon
        />
        <Form onSubmit={this.handleSubmit}>
          {step ? (
            <Table
              size="middle"
              rowKey={this.rowKey}
              pagination={false}
              dataSource={ServiceNameList || []}
              columns={[
                {
                  title: formatMessage({id: 'confirmModal.app.govern.label.name_port'}),
                  dataIndex: 'service_alias',
                  width: 200,
                  render: (_, data) => (
                    <div>
                      {data.service_cname}/{data.port}
                    </div>
                  )
                },
                {
                  title: formatMessage({id: 'confirmModal.app.govern.label.alias'}),
                  dataIndex: 'port_alias',
                  width: 200,
                  render: (val, data) => (
                    <FormItem style={{ marginBottom: 0 }}>
                      {getFieldDecorator(
                        `${data.service_id}/${data.port_alias}`,
                        {
                          initialValue: val || '',
                          rules: [
                            {
                              required: true,
                              message: formatMessage({id: 'placeholder.copy.not_null'})
                            }
                          ]
                        }
                      )(<Input size="small" />)}
                    </FormItem>
                  )
                },
                {
                  title: formatMessage({id: 'confirmModal.app.govern.label.DNS'}),
                  dataIndex: 'k8s_service_name',
                  width: 200,
                  render: (val, data) => (
                    <FormItem style={{ marginBottom: 0 }}>
                      {getFieldDecorator(
                        `${data.service_id}/${data.k8s_service_name}`,
                        {
                          initialValue: val || '',
                          rules: [
                            {
                              required: true,
                              message: formatMessage({id: 'placeholder.copy.not_null'})
                            },
                            {
                              max: 63,
                              message: formatMessage({id: 'placeholder.max63'})
                            },
                            {
                              pattern: /^[a-z]([-a-z0-9]*[a-z0-9])?$/,
                              message: formatMessage({id: 'placeholder.k8s_service_name.msg'})
                            }
                          ]
                        }
                        )(<Input size="small" onBlur={(e)=>{this.blurInput(e, data.service_id)}}/>)}
                    </FormItem>
                  )
                }
              ]}
            />
          ) : (
            <div>
              <FormItem
                labelCol={{
                  xs: {
                    span: 14
                  },
                  sm: {
                    span: 8
                  }
                }}
                wrapperCol={{
                  xs: { span: 14, offset: 0 },
                  sm: { span: 8 }
                }}
                label={formatMessage({id: 'confirmModal.app.govern.label.change'})}
              >
                {getFieldDecorator('governance_mode', {
                  initialValue: mode || 'KUBERNETES_NATIVE_SERVICE',
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id: 'placeholder.copy.not_null'})
                    }
                  ]
                })(
                  <Select
                    style={{ width: '357px' }}
                    onChange={this.handleChange}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                  >
                    {list.map(item => {
                      return (
                        <Option key={item.name} value={item.name}>
                          {(item.name === 'BUILD_IN_SERVICE_MESH' || item.name === 'KUBERNETES_NATIVE_SERVICE') ? globalUtil.fetchGovernanceMode(item.name) : item.name}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
              <div
                style={{
                  width: '468px',
                  margin: '0 auto',
                  border: '1px solid #ccc',
                  padding: '10px',
                  borderRadius: '8px'
                }}
              >
                <label
                  htmlFor="governance_mode"
                  className="ant-form-item-required"
                  title={formatMessage({id: 'confirmModal.app.govern.label.mode'})}
                >
                  {formatMessage({id: 'confirmModal.app.govern.label.mode'})}
                </label>

                
                  {/* {type === 'KUBERNETES_NATIVE_SERVICE'
                    ? formatMessage({id: 'confirmModal.app.govern.label.service'})
                    : type === 'BUILD_IN_SERVICE_MESH'
                    ? formatMessage({id: 'confirmModal.app.govern.label.serviceMesh'})
                    : '-'} */}
                    {this.handleFindDesc(governName)}
                
              </div>
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}
