import { Button, Card, Form, Input, Select, Switch, notification, Icon, Drawer, Row, Col, Empty, message, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import { addKubernetes, getKubernetes, deleteKubernetes, editKubernetes } from '../../services/app';
import DApvcinput from '../../components/DApvcinput.js';
import DAselect from '../../components/DAseclect';
import DAinputSecret from '../../components/DAinputSecret'
import DAinputPvc from '../../components/DAinputPvc'
import DAinputAffinity from '../../components/DAinputAffinity'
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
      selectval: undefined,
      havevalArr: [],
      drawerswitch: "add",
      jsonvalue: '',
      yamlvalue: '',
      strvalue: '',
      showDeletePort:false

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
    this.setState({
      visible: false,
    });
  };

  // 新增
  addAttribute = (val) => {
    const { selectArr, havevalArr } = this.state
    this.setState({
      visible: true,
      drawerTitle: "新增属性",
      drawerswitch: val,
      selectval: undefined,
      jsonvalue: '',
      yamlvalue: '',
      strvalue: ''
    })
  }
  // 修改
  changeBtn = (val, str, index) => {
    const { allData } = this.state
    if (val.save_type == "yaml") {
      this.setState({
        yamlvalue: val.attribute_value
      })
    } else if (val.save_type == "json") {
      this.setState({
        jsonvalue: val.attribute_value
      })
    } else if (val.save_type == "string") {
      this.setState({
        strvalue: val.attribute_value
      })
    }
    this.setState({
      minArr: allData[index],
      visible: true,
      drawerTitle: '修改属性',
      drawerswitch: str,
      selectval: val.name,
    })
  }

  // 删除
  deleteBtn = (val, str) => {
    const { selectval } =this.state
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    deleteKubernetes({
      team_name: teamName,
      service_alias: service_alias,
      value_name: selectval,
    }).then(res => {

      if(res.response_data.code == 200){
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
        selectval:item.name,
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
    this.setState({
      selectval: val
    })
  }

  // 提交
  handleSubmit = (e) => {
    e.preventDefault()
    const { selectval, drawerswitch, minArr } = this.state
    const { form, dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    var list = []
    form.validateFields((err, value) => {
      if (selectval == "nodeSelector" && value.nodeSelector[0].key && value.nodeSelector[0].value) {
        const label = {
          name: selectval,
          save_type: "json",
          attribute_value: value.nodeSelector || []
        }
        this.handelAddOrEdit(label)
      } else if (selectval == "labels" && value.labels[0].key && value.labels[0].value) {
        const label = {
          name: selectval,
          save_type: "json",
          attribute_value: value.labels || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "volumeMounts"&& value.volumeMounts != null && value.volumeMounts.length > 0) {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.volumeMounts || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "volumes" && value.volumes != null && value.volumes.length > 0) {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.volumes || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "affinity" && value.affinity != null && value.affinity.length > 0) {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.affinity || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "tolerations" && value.tolerations != null && value.tolerations.length > 0) {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.tolerations || []
        }
        this.handelAddOrEdit(label)
      }  else if (selectval == "env" && value.env != null && value.env.length > 0) {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.env || []
        }
        this.handelAddOrEdit(label)
      }else if (selectval == "serviceAccountName" && value.serviceAccountName != null && value.serviceAccountName.length > 0) {
        const label = {
          name: selectval,
          save_type: "string",
          attribute_value: value.serviceAccountName || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "privileged" && value.privileged != null) {
        const label = {
          name: selectval,
          save_type: "string",
          attribute_value: `${value.privileged}` || 'false'
        }
        this.handelAddOrEdit(label)
      }else{
        notification.error({
          message:'属性值不能为空'
        })
      }
    })
  }
// 取消cancel
  handlecancel =() =>{
    this.setState({
      visible: false
    })
  }


  handelAddOrEdit = (list) => {
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    const { selectval, drawerswitch } = this.state
    // 判断是新增还是修改
    if (drawerswitch == "add") {
      addKubernetes({
        team_name: teamName,
        service_alias: service_alias,
        value_name: selectval,
        attribute: list
      }).then(res => {
        if(res.response_data.code == 200){
        notification.success({
          message:'属性添加成功'
        })
        this.handleGetKubernetes()
      }
        this.setState({
          visible: false
        })
      })
    } else if (drawerswitch == "change") {
      editKubernetes({
        team_name: teamName,
        service_alias: service_alias,
        value_name: selectval,
        attribute: list
      }).then(res => {
        if(res.response_data.code == 200){
        notification.success({
          message:'属性修改成功'
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
    const uploadYaml = globalUtil.fetchSvg('uploadYaml');
    const { drawerTitle, selectArr, selectval, havevalArr, drawerswitch, type, allData, jsonvalue, yamlvalue, strvalue, boolvalue } = this.state;
    const { getFieldDecorator, setFieldsValue } = form;
    const trueArr = [];
    const falseArr = [];
    selectArr.map((item, index) => {
      if (havevalArr.includes(item) == true) {
        trueArr.push(item)
      }
      return trueArr
    })
    selectArr.map((item, index) => {
      if (havevalArr.includes(item) == false) {
        falseArr.push(item)
      }
      return falseArr
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
                  disabled={drawerswitch === "change"}
                  value={selectval}
                >
                  <OptGroup label="可添加">
                    {falseArr.map((item, index) => {
                      return <Option
                        key={index}
                        value={item}
                      >
                        {item}
                      </Option>
                    })}
                  </OptGroup>
                  <OptGroup label="不可添加">
                    {trueArr.map((item, index) => {
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
              {selectval &&
                ((selectval == "nodeSelector") || (selectval == "labels")) &&

                <Form.Item {...formItemLayouts}>
                  <p>请输入对应的key,value</p>
                  <div className={styles.inputsytle}>
                  {getFieldDecorator(`${selectval}`, {
                    initialValue: jsonvalue || [],
                    rules: [{ required: false, message: `请输入${selectval}` }]
                  })(<DApvcinput />)}
                  </div>
                </Form.Item>
              }
              {
                selectval &&
                ((selectval == "volumeMounts") || (selectval == "volumes") || (selectval == "affinity") || (selectval == "tolerations") || (selectval == "env")) &&
                <>
                  <p>&nbsp;</p>
                <CodeMirrorForm
                setFieldsValue={setFieldsValue}
                formItemLayout={formItemLayoutss}
                Form={Form}
                style={{ marginBottom: '20px' }}
                getFieldDecorator={getFieldDecorator}
                name={selectval}
                message="请编辑内容"
                data={yamlvalue || ''}
                mode={'yaml'}
                />
              </>
              }
              {
                selectval &&
                selectval == "serviceAccountName" &&
                <Form.Item  {...formItemLayouts}>
                  <p>请输入serviceAccountName属性</p>
                  <div className={styles.accountNamestyle}>
                  {getFieldDecorator(`${selectval}`, {
                    initialValue: strvalue || '',
                    rules: [{ required: false, message: '请输入ServiceAccountName' }]
                  })(<Input placeholder='请输入ServiceAccountName' />)}
                  </div>
                </Form.Item>
              }
              {
                selectval &&
                selectval == "privileged" &&
                <Form.Item  {...formItemLayouts}>
                  <p>是否开启privileged属性</p>
                  {getFieldDecorator(`${selectval}`, {
                    initialValue: boolvalue || false,
                    rules: [{ required: false }]
                  })(<Switch />)}
                </Form.Item>
              }
            </Form>
            </div>
            <div className={styles.bottomstyle}>
            <Button
                style={{marginRight:"10px"}}
                onClick={this.handlecancel}
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
          <div className={styles.rowstyles}>
            {
              allData &&
                allData.length > 0 ? (
                allData.map((item, index) => {
                  return <Row key={index}>
                    {(item.name == "volumes" || item.name =="volumeMounts" ||  item.name =="affinity" || item.name =="tolerations" || item.name =="env") ? (
                      <Col span={3} className={styles.yamlTitle}>{item.name}:</Col>
                    ):(
                      <Col span={3}>{item.name}:</Col>
                    )}

                    <Col span={18}>{
                      item.name &&
                      (item.name == "nodeSelector" || item.name =="labels") && 
                      item.attribute_value.length > 0 && 
                      item.attribute_value.map( (ele,index) =>{
                        return <Tooltip key={index} placement="top" title={<div><span>Key: {ele.key}</span><span style={{marginLeft:'12px'}}>Value: {ele.value}</span></div>}>
                                   <div className={styles.divstyle}>
                                      <span>{ele.key}</span>
                                      <span>{ele.value}</span>
                                    </div>
                                </Tooltip>
                      })
                    }
                    {item.name &&
                    (item.name == "volumes" || item.name =="volumeMounts" ||  item.name =="affinity" || item.name =="tolerations" || item.name =="env")  &&
                    item.attribute_value.length > 0 &&
                    <div className={styles.yamlstyle}>
                      {uploadYaml} &nbsp;&nbsp;&nbsp;&nbsp;该配置以yaml文件形式存储,请点击右侧进行查看或修改。
                    </div>
                    }
                    {item.name &&
                    (item.name == "serviceAccountName")  &&
                    item.attribute_value.length > 0 &&
                    <div style={{ padding: "6px 10px",backgroundColor: "#f0f4f8",borderRadius: "10px"}}>
                      {item.attribute_value}
                    </div>
                    }
                    {item.name &&
                    (item.name == "privileged")  &&
                    item.attribute_value.length > 0 &&
              
                    <span>当前状态：{item.attribute_value == "true" ? "已开启 ": "已关闭"}</span>
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

