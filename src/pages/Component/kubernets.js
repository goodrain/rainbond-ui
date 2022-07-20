import { Button, Card, Form, Input, Select, Switch, notification, Icon, Drawer, Row, Col, Empty, message } from 'antd';
import React, { PureComponent } from 'react';
import { addKubernetes, getKubernetes, deleteKubernetes, editKubernetes } from '../../services/app';
import DApvcinput from '../../components/DApvcinput.js';
import DAselect from '../../components/DAseclect';
import DAinputSecret from '../../components/DAinputSecret'
import DAinputPvc from '../../components/DAinputPvc'
import DAinputAffinity from '../../components/DAinputAffinity'
import globalUtil from '../../utils/global';
import CodeMirrorForm from "../../components/CodeCustomForm"
import ConfirmModal from "../../components/ConfirmModal"
import styles from "./kubernets.less"


import CodeMirror from 'react-codemirror';
require('codemirror/lib/codemirror.css');
require('codemirror/theme/seti.css');
require('codemirror/addon/display/fullscreen.css');
require('../../styles/codemirror.less');
require('codemirror/addon/display/panel');
require('codemirror/mode/xml/xml');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/yaml/yaml');
require('codemirror/addon/display/fullscreen');
require('codemirror/addon/edit/matchbrackets');

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
      selectArr: ["nodeSelector", "labels", "volumes", "volumeMounts", "affinity", "tolerations", "serviceAccountName", "privileged"],
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
      if (this.myCodeMirror != (undefined || null)) {
        const xx = this.myCodeMirror.getCodeMirror();
        xx.setValue(val.attribute_value)
      }
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
    const teamName = globalUtil.getCurrTeamName()
    const service_alias = this.props.service_alias || ''
    deleteKubernetes({
      team_name: teamName,
      service_alias: service_alias,
      value_name: val.name
    }).then(res => {
      this.setState({
        showDeletePort:!this.state.showDeletePort,
      })
      notification.success({
        message:'属性删除成功'
      })
      this.handleGetKubernetes()
    })
  }
  cancalDeletePort = () =>{
    this.setState({
      showDeletePort:!this.state.showDeletePort,
    })
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
      if ((selectval == "nodeSelector")) {
        const label = {
          name: selectval,
          save_type: "json",
          attribute_value: value.nodeSelector || []
        }
        this.handelAddOrEdit(label)
      } else if (selectval == "labels") {
        const label = {
          name: selectval,
          save_type: "json",
          attribute_value: value.labels || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "volumeMounts") {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.volumeMounts || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "volumes") {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.volumes || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "affinity") {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.affinity || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "tolerations") {
        const label = {
          name: selectval,
          save_type: "yaml",
          attribute_value: value.tolerations || []
        }
        this.handelAddOrEdit(label)
      } else if (selectval == "serviceAccountName") {
        const label = {
          name: selectval,
          save_type: "string",
          attribute_value: value.serviceAccountName || []
        }
        this.handelAddOrEdit(label)

      } else if (selectval == "privileged") {
        const label = {
          name: selectval,
          save_type: "json",
          attribute_value: value.privileged || []
        }
        this.handelAddOrEdit(label)
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
        notification.success({
          message:'属性添加成功'
        })
        this.handleGetKubernetes()
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
        notification.success({
          message:'属性修改成功'
        })
        this.handleGetKubernetes()
        this.setState({
          visible: false
        })
      })
    }
  }




  checkValue = (_, value, callback) => {
    const { message } = this.props;
    if (value === '' || !value || (value && value.trim() === '')) {
      callback(message);
      return;
    }
    callback();
  }

  render() {
    const { form } = this.props;
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
    const options = {
      mode: { name: "yaml", json: true },
      lineNumbers: true,
      theme: 'seti',
      lineWrapping: true,
      smartIndent: true,
      matchBrackets: true,
      scrollbarStyle: null,
      showCursorWhenSelecting: true,
      readOnly: false
    }
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
                ((selectval == "volumeMounts") || (selectval == "volumes") || (selectval == "affinity") || (selectval == "tolerations")) &&
                <Form.Item  {...formItemLayoutss}>
                  <p>&nbsp;</p>
                  {getFieldDecorator(`${selectval}`, {
                    initialValue: yamlvalue || '',
                    rules: [{ required: false, validator: this.checkValue }]
                  })(<CodeMirror options={options} ref={(c) => this.myCodeMirror = c} />)}
                </Form.Item>
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
                    <Col span={4}>{item.name}:</Col>
                    <Col span={2}><Button onClick={() => this.changeBtn(item, "change", index)}>编 辑</Button></Col>
                    <Col span={1}><Button onClick={this.cancalDeletePort}>删 除</Button></Col>
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

