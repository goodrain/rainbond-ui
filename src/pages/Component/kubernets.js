import { Button, Card, Form, Input, Select, Switch, notification, Icon, Drawer, Row, Col, Empty, message, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import { addKubernetes, getKubernetes, deleteKubernetes, editKubernetes } from '../../services/app';
import DApvcinput from '../../components/DApvcinput';
import globalUtil from '../../utils/global';
import ConfirmModal from "../../components/ConfirmModal"
import styles from "./kubernets.less"
import CodeMirrorForm from '../../components/CodeMirrorForm';

const { Option, OptGroup } = Select;
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      allData: [],
      minArr: {},
      visible: false,
      drawerTitle: "新增属性",
      selectArr: ["nodeSelector", "labels", "volumes", "volumeMounts", "affinity", "tolerations", "serviceAccountName", "privileged",'env'],
      selectVal: undefined,
      havevalArr: [],
      drawerSwitch: "add",
      jsonValue: '',
      yamlValue: '',
      strValue: '',
      showDeletePort: false,
      TooltipValueArr: {
        affinity:'#示例\n#nodeAffinity:\n#      preferredDuringSchedulingIgnoredDuringExecution:\n#      - weight: 1\n#        preference:\n#          matchExpressions:\n#          - key: disktype\n#            operator: In\n#            values:\n#           - ssd\n',
        tolerations:'#示例\n#- key: "test"\n#  operator: "Equal"\n#  value: "yk"\n#  effect: "NoSchedule"\n',
        env:'#示例\n#- name: NGINX_USERNAEM\n#  valueFrom:\n#    secretKeyRef:\n#      key: username\#      name: test-secret\n#      optional: false\n#- name: NGINX_PASSWORD\#  valueFrom:\n#    secretKeyRef:\n#      key: password\n#      name: test-secret\n#      optional: false\n#- name: MY_POD_IP\n#  valueFrom:\n#   fieldRef:\#     fieldPath: status.podIP\n',
        volumes:'#示例\n#- hostPath:\n#    path: /test\n#  name: data\n#- name: mydata\n#  persistentVolumeClaim:\n#    claimName: test-pvc\n#- configMap:\n#    name: test\n#  name: config\n',
        volumeMounts:'#示例\n#- mountPath: /opt\n#  name: data\n#- mountPath: /etc/test/conf/aa\n#  name: mydata\n#  subPath: aa\n#- mountPath: /etc/test/conf/nginx.conf\n#  name: config\n#  subPath: test.conf\n'
      },
      TooltipValue:''
    }
  }

  componentDidMount() {
    this.handleGetKubernetes()
  }
  handleGetKubernetes = () => {
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    getKubernetes({
      team_name: teamName,
      service_alias: service_alias
    }).then(res => {
      const arrs = [];
      const arr = res.list.filter((item, index) => {
        return arrs.push(item.name)
      })
      this.setState({
        allData: res.list,
        havevalArr: arrs
      })

    })
      .catch(err => {
      });
  }
  //抽屉 
  onClose = () => {
    const {drawerSwitch} =this.state
    var str = ''
    if(drawerSwitch == "add"){
      str = "change"
    }else{
      str = "add"
    }
    this.setState({
      visible: false,
      drawerSwitch:str,
    });
  };

  // 新增
  addAttribute = (val) => {
    const { selectArr, havevalArr } = this.state
    this.setState({
      visible: true,
      drawerTitle: "新增属性",
      drawerSwitch: val,
      selectVal: undefined,
      jsonValue: '',
      strValue: ''
    })
  }
  // 修改
  changeBtn = (val, str, index) => {
    const { allData, TooltipValueArr } = this.state
    if (val.save_type == "yaml") {
      this.setState({
        yamlValue: val.attribute_value
      })
    } else if (val.save_type == "json") {
      this.setState({
        jsonValue: val.attribute_value
      })
    } else if (val.save_type == "string") {
      this.setState({
        strValue: val.attribute_value
      })
    }
    this.setState({
      minArr: allData[index],
      visible: true,
      drawerTitle: '修改属性',
      drawerSwitch: str,
      selectVal: val.name,
      TooltipValue: TooltipValueArr.[val.name]
    })
  }

  // 删除
  deleteBtn = (val, str) => {
    const { selectVal } =this.state
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    deleteKubernetes({
      team_name: teamName,
      service_alias: service_alias,
      value_name: selectVal,
    }).then(res => {

      if(res && res.response_data  &&  res.response_data.code == 200){
        this.setState({
          showDeletePort:!this.state.showDeletePort,
        })
        notification.success({
          message:'属性删除成功'
        })
        this.handleGetKubernetes()
      }
      })
      }
      
  
  cancalDeletePort = (item) =>{
    if(item != null){
      this.setState({
        selectVal:item.name,
        showDeletePort:!this.state.showDeletePort,
      })
    }else{
      this.setState({
        showDeletePort:!this.state.showDeletePort,
      })
    }
    
  }
  // 下拉框
  handleChange = (val) => {
      const { selectVal, TooltipValueArr } = this.state
    this.setState({
      selectVal: val,
      yamlValue: TooltipValueArr.[val],
      TooltipValue: TooltipValueArr.[val]
    })
  }

  // 提交
  handleSubmit = (e) => {
    e.preventDefault()
    const { selectVal, drawerSwitch, minArr } = this.state
    const { form, dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    var list = []
    form.validateFields((err, value) => {
      if (selectVal == "nodeSelector" && value.nodeSelector[0].key && value.nodeSelector[0].value) {
        const label = {
          name: selectVal,
          save_type: "json",
          attribute_value: value.nodeSelector || []
        }
        this.handelAddOrEdit(label)
      } else if (selectVal == "labels" && value.labels[0].key && value.labels[0].value) {
        const label = {
          name: selectVal,
          save_type: "json",
          attribute_value: value.labels || []
        }
        this.handelAddOrEdit(label)

      } else if (selectVal == "volumeMounts"&& value.volumeMounts != null && value.volumeMounts.length > 0) {
        const label = {
          name: selectVal,
          save_type: "yaml",
          attribute_value: value.volumeMounts || []
        }
        this.handelAddOrEdit(label)

      } else if (selectVal == "volumes" && value.volumes != null && value.volumes.length > 0) {
        const label = {
          name: selectVal,
          save_type: "yaml",
          attribute_value: value.volumes || []
        }
        this.handelAddOrEdit(label)

      } else if (selectVal == "affinity" && value.affinity != null && value.affinity.length > 0) {
        const label = {
          name: selectVal,
          save_type: "yaml",
          attribute_value: value.affinity || []
        }
        this.handelAddOrEdit(label)

      } else if (selectVal == "tolerations" && value.tolerations != null && value.tolerations.length > 0) {
        const label = {
          name: selectVal,
          save_type: "yaml",
          attribute_value: value.tolerations || []
        }
        this.handelAddOrEdit(label)
      }  else if (selectVal == "env" && value.env != null && value.env.length > 0) {
        const label = {
          name: selectVal,
          save_type: "yaml",
          attribute_value: value.env || []
        }
        this.handelAddOrEdit(label)
      }else if (selectVal == "serviceAccountName" && value.serviceAccountName != null && value.serviceAccountName.length > 0) {
        const label = {
          name: selectVal,
          save_type: "string",
          attribute_value: value.serviceAccountName || []
        }
        this.handelAddOrEdit(label)

      } else if (selectVal == "privileged" && value.privileged != null) {
        const label = {
          name: selectVal,
          save_type: "string",
          attribute_value: `${value.privileged}` || 'false'
        }
        this.handelAddOrEdit(label)
      }else{
        notification.error({
          message:'文件内容不能为空'
        })
      }
    })
  }
// 取消cancel
  handleCancel =() =>{
    this.setState({
      visible: false
    })
  }


  handelAddOrEdit = (list) => {
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    const { selectVal, drawerSwitch } = this.state
    // 判断是新增还是修改
    if (drawerSwitch == "add") {
      addKubernetes({
        team_name: teamName,
        service_alias: service_alias,
        value_name: selectVal,
        attribute: list
      }).then(res => {
        if(res && res.response_data  &&  res.response_data.code == 200){
        notification.success({
          message:'属性添加成功,重启后生效'
        })
        this.handleGetKubernetes()
      }
        this.setState({
          visible: false
        })
      })
    } else if (drawerSwitch == "change") {
      editKubernetes({
        team_name: teamName,
        service_alias: service_alias,
        value_name: selectVal,
        attribute: list
      }).then(res => {
        if(res && res.response_data  &&  res.response_data.code == 200){
        notification.success({
          message:'属性修改成功,重启后生效'
        })
        this.handleGetKubernetes()
      }
        this.setState({
          visible: false
        })
      })
    }
  }
  render() {
    const { form } = this.props;
    const uploadYaml = (
      <svg 
          t="1658480171057" 
          class="icon" 
          viewBox="0 0 1024 1024"
          version="1.1" 
          xmlns="http://www.w3.org/2000/svg" 
          p-id="1600" 
          width="48" 
          height="48"
      >
          <path
              d="M354.40128 0c-87.04 0-157.44 70.55872-157.44 157.59872v275.68128H78.72c-21.6576 0-39.36256 17.69984-39.36256 39.36256v236.31872c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.24128v118.08256c0 87.04 70.4 157.59872 157.44 157.59872h472.63744c87.04 0 157.59872-70.55872 157.59872-157.59872V315.0336c0-41.74848-38.9888-81.93024-107.52-149.27872l-29.11744-29.12256L818.87744 107.52C751.5392 38.9888 711.39328 0 669.59872 0H354.4064z m0 78.72h287.20128c28.35456 7.0912 27.99616 42.1376 27.99616 76.8v120.16128c0 21.6576 17.69984 39.35744 39.36256 39.35744h118.07744c39.38816 0 78.87872-0.0256 78.87872 39.36256v512c0 43.32032-35.55328 78.87872-78.87872 78.87872H354.4064c-43.32544 0-78.72-35.5584-78.72-78.87872v-118.08256h393.91744c21.66272 0 39.36256-17.69472 39.36256-39.35744V472.64256c0-21.66272-17.69984-39.36256-39.36256-39.36256H275.68128V157.59872c0-43.32032 35.39456-78.87872 78.72-78.87872zM261.2736 506.39872h20.16256l65.28 176.64h-23.04l-19.2-54.71744h-65.28l-19.2 54.71744h-23.04l64.31744-176.64z m-181.43744 0.96256h23.99744l40.32 89.27744 41.28256-89.27744h23.99744l-53.76 107.52v68.15744h-22.07744v-67.2l-53.76-108.47744z m290.87744 0h32.64l49.92 143.03744h0.96256l48.95744-143.03744h33.60256v175.67744h-22.08256v-106.55744c0-10.88 0.32256-26.56256 0.96256-47.04256h-0.96256l-52.79744 153.6h-19.2l-52.80256-153.6h-0.95744c1.28 22.4 1.92 38.72256 1.92 48.96256v104.63744h-20.16256V507.36128z m214.08256 0h22.07744v155.52h69.12v20.15744H584.8064V507.36128z m-312.96 23.04c-1.92 8.96-4.80256 18.23744-8.64256 27.83744l-17.28 50.88256h51.84l-18.23744-50.88256c-3.84-10.88-6.4-20.15744-7.68-27.83744z" 
              p-id="1601" 
              data-spm-anchor-id="a313x.7781069.0.i0"
              class="selected" 
              fill="#707070"
          >
          </path>
      </svg>
  )
    const { drawerTitle, selectArr, selectVal, havevalArr, drawerSwitch, type, allData, jsonValue, yamlValue, strValue, boolvalue, TooltipValue } = this.state;
    const { getFieldDecorator, setFieldsValue } = form;
    const isBool = (drawerSwitch == "add") ? true : false
    const addible = [];
    const notAddible = [];
    selectArr.map((item, index) => {
      if (havevalArr.includes(item) == true) {
        addible.push(item)
      }
      return addible
    })
    selectArr.map((item, index) => {
      if (havevalArr.includes(item) == false) {
        notAddible.push(item)
      }
      return notAddible
    })

    const formItemLayoutss = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      }
    };
    const formItemLayouts = {
      labelCol: {
        xs: {
          span: 8
        },
        sm: {
          span: 8
        }
      },
      wrapperCol: {
        xs: {
          span: 16
        },
        sm: {
          span: 16
        }
      }
    };
    return (
      <div>
        <Card
          title="Kubernetes属性"
          style={{ marginBottom: '24px' }}
          extra={<Button onClick={() => this.addAttribute("add")}><Icon type="plus" />新增属性</Button>}
        >
          <Drawer
            title={drawerTitle}
            placement="right"
            closable={false}
            onClose={this.onClose}
            visible={this.state.visible}
            width={500}
          >
            <div className={styles.selectstyle}>
            <Row>
              <Col span={4} >属性名称</Col>
              <Col span={20}>
                <Select
                  style={{ width: 220 }}
                  onChange={this.handleChange}
                  placeholder="请选择属性"
                  disabled={drawerSwitch === "change"}
                  value={selectVal}
                >
                  <OptGroup label="可添加">
                    {notAddible.map((item, index) => {
                      return <Option
                                key={index}
                                value={item}
                              >
                                {item}
                              </Option>
                    })}
                  </OptGroup>
                  <OptGroup label="不可添加">
                    {addible.map((item, index) => {
                      return <Option
                                key={index}
                                value={item}
                                disabled
                              >
                                {item}
                              </Option>
                    })}
                  </OptGroup>
                </Select>
              </Col>
            </Row>
            <Form onSubmit={this.handleSubmit}>
              {selectVal &&
                ((selectVal == "nodeSelector") || (selectVal == "labels")) &&
                <Form.Item {...formItemLayouts}>
                  <p>请输入对应的key,value</p>
                  <div className={styles.nodeSelector_sytle}>
                  {getFieldDecorator(`${selectVal}`, {
                    initialValue: jsonValue || [],
                    rules: [{ required: false, message: `请输入${selectVal}` }]
                  })(<DApvcinput />)}
                  </div>
                </Form.Item>
              }
              {
                selectVal &&
                ((selectVal == "volumeMounts") || (selectVal == "volumes") || (selectVal == "affinity") || (selectVal == "tolerations") || (selectVal == "env")) &&
                <>
                  <p>&nbsp;</p>
                  <CodeMirrorForm
                    setFieldsValue={setFieldsValue}
                    formItemLayout={formItemLayoutss}
                    Form={Form}
                    style={{ marginBottom: '20px' }}
                    getFieldDecorator={getFieldDecorator}
                    name={selectVal}
                    message="请编辑内容"
                    data={yamlValue || ''}
                    mode={'yaml'}
                    bool = { isBool }
                    TooltipValue={ TooltipValue }
                  />
              </>
              }
              {
                selectVal &&
                selectVal == "serviceAccountName" &&
                <Form.Item  {...formItemLayouts}>
                  <p>请输入serviceAccountName属性</p>
                  <div className={styles.accountName_style}>
                  {getFieldDecorator(`${selectVal}`, {
                    initialValue: strValue || '',
                    rules: [{ required: false, message: '请输入ServiceAccountName' }]
                  })(<Input placeholder='请输入ServiceAccountName' />)}
                  </div>
                </Form.Item>
              }
              {
                selectVal &&
                selectVal == "privileged" &&
                <Form.Item  {...formItemLayouts}>
                  <p>是否开启privileged属性</p>
                  {getFieldDecorator(`${selectVal}`, {
                    initialValue: boolvalue || false,
                    rules: [{ required: false }]
                  })(<Switch style={{margin:"20px 0  0 50px"}}/>)}
                </Form.Item>
              }
            </Form>
            </div>
            <div className={styles.handleBtn_style}>
            <Button
                style={{marginRight:"10px"}}
                onClick={this.handleCancel}
              >
                取 消
              </Button>
              <Button
                type="primary"
                onClick={this.handleSubmit}
              >
                确 认
              </Button>
            </div>
          </Drawer>
          <div className={styles.pageValue_style}>
            {
              allData &&
                allData.length > 0 ? (
                allData.map((item, index) => {
                  return <Row key={index}>
                            {(item.name == "volumes" || item.name =="volumeMounts" ||  item.name =="affinity" || item.name =="tolerations" || item.name =="env") ? (
                              <Col span={3} className={styles.yamlTitle_style}>{item.name}:</Col>
                            ):(
                              <Col span={3}>{item.name}:</Col>
                            )}
                              <Col span={18}>{
                                  item.name &&
                                  (item.name == "nodeSelector" || item.name =="labels") && 
                                  item.attribute_value.length > 0 && 
                                  item.attribute_value.map( (ele,index) =>{
                                    return <Tooltip key={index} placement="top" title={<div><p>Key: {ele.key}</p><p>Value: {ele.value}</p></div>}>
                                              <div className={styles.tipText_style}>
                                                  <span>{ele.key}</span>
                                                  <span>{ele.value}</span>
                                                </div>
                                            </Tooltip>
                                  })
                                }
                                {item.name &&
                                (item.name == "volumes" || item.name =="volumeMounts" ||  item.name =="affinity" || item.name =="tolerations" || item.name =="env")  &&
                                item.attribute_value.length > 0 &&
                                <div className={styles.yamlValue_style}>
                                  {uploadYaml} &nbsp;&nbsp;&nbsp;&nbsp;该配置以yaml文件形式存储,请点击右侧编辑按钮进行查看或修改。
                                </div>
                                }
                                {item.name &&
                                (item.name == "serviceAccountName")  &&
                                item.attribute_value.length > 0 &&
                                <div style={{ padding: "10px 15px",backgroundColor: "#f0f4f8",borderRadius: "10px"}}>
                                  <Tooltip key={index} placement="top" title={item.attribute_value}>
                                  {item.attribute_value}
                                  </Tooltip>
                                </div>
                                }
                                {item.name &&
                                (item.name == "privileged")  &&
                                item.attribute_value.length > 0 &&
                                <span style={{paddingTop:"6px"}}>当前状态：{item.attribute_value == "true" ? "已开启 ": "已关闭"}</span>
                                }
                              </Col>
                              <Col span={2}><span onClick={() => this.changeBtn(item, "change", index)}>编辑</span>&nbsp;&nbsp;&nbsp;&nbsp;<span onClick={()=>this.cancalDeletePort(item)}>删除</span></Col>
                         </Row>
                })
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            }
          </div>
          {this.state.showDeletePort && (
          <ConfirmModal
            title="属性删除"
            desc="确定要删除此属性吗？"
            subDesc="此操作不可恢复"
            onOk={this.deleteBtn}
            onCancel={this.cancalDeletePort}
          />
        )}
        </Card>
      </div>
    );
  }
}

export default Index;