import { Button, Card, Form, Input, Select, Switch, notification } from 'antd';
import React, { PureComponent } from 'react';
import { addKubernetes, getKubernetes } from '../../services/app';
import DApvcinput from '../../components/DApvcinput.js';
import DAselect from '../../components/DAseclect';
import DAinputSecret from '../../components/DAinputSecret'
import DAinputPvc from '../../components/DAinputPvc'
import DAinputAffinity from '../../components/DAinputAffinity'
import globalUtil from '../../utils/global';

const { Option } = Select;
@Form.create()
class Index extends PureComponent {
  constructor(props){
    super(props)
    this.state = {
      nodeSelectorList: [],
      labelList: [],
      secretList: [],
      pvcList: [],
      tolerationsList: [],
      ServiceAccountNameList: [],
      privilegedList: [],
      nodeAffinitylist: []
    }
  }
  handleSwitchOnChange = () => {};
  componentDidMount(){
    this.handleGetKubernetes()
  }
  handleGetKubernetes = () => {
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    getKubernetes({
      team_name: teamName,
      service_alias: service_alias
    }).then(res => {
        if(res.list.length > 0 ){
          this.setState({
            nodeSelectorList: res.list[0],
            labelList: res.list[1],
            secretList: res.list[2],
            pvcList: res.list[3],
            tolerationsList: res.list[4],
            ServiceAccountNameList: res.list[5],
            privilegedList: res.list[6],
            nodeAffinitylist: res.list[7],
          })
        }
      })
      .catch(err => {
        handleAPIError(err);
      });
  }
  handleSubmit = (e) => {
    e.preventDefault();
    const { form, dispatch } = this.props;
    const { nodeSelectorList } = this.state
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    const list = []
    form.validateFields((err, value) => {
      const tolerations = {
        name: "tolerations",
        save_type: "json",
        attribute_fields: "key,operator,value,effect",
        attribute_value: value.tolerations || []
  
      }
      const nodeSelector = {
        name: "nodeSelector",
        save_type: "json",
        attribute_fields: "key,value",
        attribute_value: value.nodeSelector || []
      }
      const label = {
        name: "label",
        save_type: "json",
        attribute_fields: "key,value",
        attribute_value: value.label || []
      }
      const secret = {
        name: "secret",
        save_type: "json",
        attribute_fields: "name,mountPath,key",
        attribute_value: value.secret || []
      }
      const pvc = {
        name: "persistentVolumeClaim",
        save_type: "json",
        attribute_fields: "name,mountPath,claimName,subPath",
        attribute_value: value.persistentVolumeClaim || []
      }
      const nodeAffinity = {
        name: "nodeAffinity",
        save_type: "json",
        attribute_fields: "key,operator,value",
        attribute_value: value.nodeAffinity || []
      }
      const ServiceAccountName = {
        name: "serviceAccountName",
        save_type: "string",
        attribute_fields: "",
        attribute_value: value.serviceAccountName || []
      }
      const privileged = {
        name: "privileged",
        save_type: "string",
        attribute_fields: "",
        attribute_value: "true"
      }
      list.push(nodeSelector)
      list.push(label)
      list.push(secret)
      list.push(pvc)
      list.push(tolerations)
      list.push(ServiceAccountName)
      list.push(privileged)
      list.push(nodeAffinity)
     
      if (err) return;
      addKubernetes({
        team_name: teamName,
        service_alias: service_alias,
        list:list
      }).then(res => {
        notification.success({
          message: '数据保存成功'
        });
        this.handleGetKubernetes()
      })
      .catch(err => {
        handleAPIError(err);
      });
    });
  }
  render() {
    const {
      form: { getFieldDecorator }
    } = this.props;
    const { nodeSelectorList, labelList, secretList, pvcList, tolerationsList, ServiceAccountNameList, privilegedList, nodeAffinitylist } = this.state
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 4
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 9
        },
        sm: {
          span: 9
        }
      }
    };
    const formItemLayouts = {
      labelCol: {
        xs: {
          span: 4
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 20
        },
        sm: {
          span: 20
        }
      }
    };
    return (
      <div>
        <Card title="Kubernetes属性" style={{ marginBottom: '24px' }}>
          <Form onSubmit={this.handleSubmit}>
            <Form.Item label="nodeSelector" {...formItemLayouts}>
              {getFieldDecorator('nodeSelector', {
                initialValue: nodeSelectorList.attribute_value || [],
                rules: [{ required: false, message: '请输入NodeSelector' }]
              })(<DApvcinput />)}
            </Form.Item>
            <Form.Item label="label" {...formItemLayouts}>
              {getFieldDecorator('label', {
                initialValue: labelList.attribute_value || [],
                rules: [{ required: false, message: '请输入label' }]
              })(<DApvcinput />)}
            </Form.Item>
            <Form.Item label="secret" {...formItemLayouts}>
              {getFieldDecorator('secret', {
                initialValue: secretList.attribute_value || [],
                rules: [{ required: false, message: '请输入secret' }]
              })(<DAinputSecret />)}
            </Form.Item>
            <Form.Item label="nodeAffinity" {...formItemLayouts}>
              {getFieldDecorator('nodeAffinity', {
                initialValue: nodeAffinitylist.attribute_value || [],
                rules: [{ required: false, message: '请输入nodeAffinity' }]
              })(<DAinputAffinity />)}
            </Form.Item>
            <Form.Item label="pvc" {...formItemLayouts}>
              {getFieldDecorator('persistentVolumeClaim', {
                initialValue: pvcList.attribute_value || [],
                rules: [{ required: false, message: '请输入Pvc' }]
              })(<DAinputPvc />)}
            </Form.Item>
            <Form.Item label="Tolerations" {...formItemLayouts}>
              {getFieldDecorator('tolerations', {
                initialValue: tolerationsList.attribute_value || [],
                rules: [{ required: false, message: '请输入label' }]
              })(<DAselect />)}
            </Form.Item>
            <Form.Item
              label="ServiceAccountName"
              labelCol={{
                xs: {
                  span: 4
                },
                sm: {
                  span: 4
                }
              }}
              wrapperCol={{
                xs: {
                  span: 4
                },
                sm: {
                  span: 4
                }
              }}
            >
              {getFieldDecorator('serviceAccountName', {
                initialValue: ServiceAccountNameList.attribute_value || '',
                rules: [{ required: false, message: '请输入ServiceAccountName' }]
              })(
                <Input />
              )}
            </Form.Item>
            <Form.Item
              label="Privileged"
              labelCol={{
                xs: {
                  span: 4
                },
                sm: {
                  span: 4
                }
              }}
              wrapperCol={{
                xs: {
                  span: 2
                },
                sm: {
                  span: 2
                }
              }}
            >
              {getFieldDecorator('privileged', {
                // initialValue: true,
                rules: [{}]
              })(
                <Switch defaultChecked onChange={this.handleSwitchOnChange} />
              )}
            </Form.Item>
            <Form.Item
              wrapperCol={{
                xs: {
                  span: 4,
                  offset: 4
                },
                sm: {
                  span: 4,
                  offset: 4
                }
              }}
            >
              <Button type="primary" htmlType="submit">保存</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }
}

export default Index;
