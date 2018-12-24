import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Card, Modal, Checkbox, notification, Radio, Form } from 'antd';
import Yun from "../../../public/images/yun.svg";
import Running from "../../../public/images/running.svg";
import Undeploy from "../../../public/images/undeploy.svg";
import Closed from "../../../public/images/closed.svg";
import Starting from "../../../public/images/starting.svg";
import Stopping from "../../../public/images/stopping.svg";
import Unusual from "../../../public/images/unusual.svg";
import Upgrade from "../../../public/images/upgrade.svg";
import Building from "../../../public/images/building.svg";

import globalUtil from '../../utils/global';
import  { Flow, RegisterNode, withPropsAPI } from 'gg-editor';
import {
  addRelationedApp,
} from '../../services/app';
import { Button } from 'antd/lib/radio';
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};
@Form.create()
@connect()
class EditorData extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      visible: false,
      list: [],
      name: '',
      id: '',
      foreignType: 0,
      registerData: [],
      colorDataType: ["running", "closed", "undeploy", "starting", "checking", "stoping", "upgrade", "unusual", "Owed", "expired", "Expired",
        "internet", "The Internet", "Unknow", "unknow", "stopping", "abnormal", "some_abnormal", "building", "build_failure"]
    }
  }
  componentDidMount() {
    this.loadTopology()
  }
  //更新拓扑图
  changeType = ()=>{
    this.props.changeType("shape");
  }
  //获取拓扑图数据
  loadTopology = () => {
    const { dispatch, group_id } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    dispatch({
      type: "global/fetAllTopology",
      payload: {
        region_name,
        team_name,
        groupId: group_id
      },
      callback: (res) => {
        const data = this.goodrainData2scopeData(res)
        this.setState({
          data,
          registerData: data.registerData
        })
      }
    })
  }
  // 转换好雨云的数据到weaveScope的数据
  goodrainData2scopeData(data = {}) {
    const keys = Object.keys(data.json_data);
    let node = {};
    let item = {};
    let edge = {};
    let edgr = {};
    let dats = {
      nodes: [
        {
          type: "node",
          size: "70*70",
          shape: "model-card",
          color: "#030303",
          label: "The Internet",
          stack: true,
          stackNum: 1,
          linkable: true,
          rank: 'internet',
          cur_status: 'running',
          x: (document.body.clientWidth / 2) - (keys.length > 0 ? ((keys.length / 2) * 100) : 0),
          y: 55,
          id: "The Internet",
          index: 0
        },
      ],
      edges: [],
      registerData: []
    }  //定义传入的数据
    let arr = [];
    if (!keys.length) {
      window.parent && window.parent.onNodesEmpty && window.parent.onNodesEmpty();
    }
    function getStackNum(item) {
      if (item.cur_status !== 'running') {
        return 1;
      }
      item.node_num = item.node_num || 1;
      return item.node_num > 3 ? 3 : item.node_num;
    }
    let num = 0;
    let nums = -1;

    keys.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(data.json_data, k)) {
        num++
        nums++
        node = {};
        edge = {}
        item = data.json_data[k];
        node.type = "node";
        node.size = "70*70";
        node.shape = item.cur_status;
        node.color = "#030303";
        node.label = item.service_cname;

        node.cur_status = item.cur_status;
        node.service_alias = item.service_alias;
        node.id = item.service_id;
        node.lineTip = item.lineTip;
        node.labelMinor = '';
        //根据状态改变颜色用
        node.rank = node.cur_status;
        // node.shape = 'hexagon';
        node.stack = true;
        node.stackNum = getStackNum(item);
        node.linkable = item.cur_status === 'running' ? 1 : 0;
        node.adjacency = data.json_svg[k] || [];
        node.x = document.body.clientWidth / 2 - 100 * num;
        node.y = 150;
        if (item.is_internet) {
          edge.source = "The Internet";
          // edge.sourceAnchor = 2;
          edge.target = k;
          // edge.id = num;
          // edge.index = num;
          dats.edges.push(edge);
        }
        if (data.json_svg[k] && data.json_svg[k].length > 0) {
          // console.log("data.json_svg[k]", data.json_svg[k])
          for (let o = 0; o < data.json_svg[k].length; o++) {
            edgr = {}
            edgr.source = item.service_id;
            // edgr.sourceAnchor = 2;
            edgr.target = data.json_svg[k][o];
            // edgr.id = num * 999 + o;
            // edgr.index = num * 999 + o;
            node.x = document.body.clientWidth / 2 - 100 * num;
            node.y = num > 10 ? 350 : num > 20 ? 450 : num > 30 ? 550 : num > 40 ? 650 : num > 50 ? 750 : num > 60 ? 850 : num > 70 ? 950 : 250;
            arr.push(edgr);
          }
        }
        dats.registerData.push(item.cur_status)
        dats.nodes.push(node);
      }
    });

    dats.edges = Array.from(new Set(dats.edges))
    arr = Array.from(new Set(arr))
    let ars = dats.edges.concat(arr)
    dats.edges = ars
    return dats;
  }

  //处理 多依赖
  handleOk = (e) => {
    e.preventDefault();
    const { name, id,foreignType } = this.state;
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      console.log("fieldsValue", fieldsValue)
      if (!err) {
        if(foreignType===0){
          addRelationedApp({
            team_name: globalUtil.getCurrTeamName(),
            app_alias: name,
            dep_service_id: id,
            open_inner: true,
            container_port: fieldsValue.container_port
          }).then((res) => {
            console.log("处理 多依赖00", res)
            if (res&&res._code == 200) {
              notification.success({ message: res.msg_show })
            //   this.props.propsAPI.executeCommand('undo');
            //  this.props.changeType();
            }
          });
        }
        if(foreignType===1){
          this.props.dispatch({
            type: 'appControl/openExternalPort',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              app_alias: name,
              container_port: fieldsValue.container_port,
              open_outer:true
            },
            callback: (res) => {
            console.log("处理 多依赖11", res)
              if (res && res._code == 200) {
                notification.success({ message: res.msg_show });
                // this.props.propsAPI.executeCommand('undo');
                // this.props.changeType();
              }
            }
          })
        }
        this.setState({ visible: false });
      };
    })
  }

  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
    this.handleUndo();
  }

  //处理依赖接口
  handleSubmitAddRelation = (name, id) => {
    addRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: name,
      dep_service_id: id
    }).then((res) => {
      console.log("处理依赖接口", res)
      if (res && res._code == 212) {
        this.handleUndo();
        notification.success({ message: res.msg_show });
        return
      }
      if (res && res._code == 201) {
        this.setState({
          visible: true,
          foreignType:0,
          list: res.list.join().split(),
          name,
          id,
        });
      }
      if (res && res._code == 200) {
        notification.success({ message: res.msg_show });
        this.handleUndo();
        return
      }
    })
  }
  handleUndo=()=>{
    console.log("set")
    setTimeout(()=>{
        this.props.propsAPI.executeCommand('undo')
    },100);
  }
  onChange = (e) => {
    console.log("e", e.target.value)
  }
  //配置拓扑图
  config = (type) => {
    return {
      draw(item) {
        const group = item.getGraphicGroup();
        const model = item.getModel();
        const width = 15;
        const height = 15;
        const x = -width / 2;
        const y = -height / 2;
        const borderRadius = 6;
        const keyShape = group.addShape("rect", {
          attrs: {
            x: x + 25,
            y: y + 28,
            width: 10,
            height: 10,
            radius: borderRadius,
            stroke: "#030303",
            fill: "#030303"
          }
        });
        // 类型 logo
        group.addShape("image", {
          attrs: {
            img: type == "running" ? Running : type == "closed" ? Closed : type == "undeploy" ? Undeploy : type == "starting" ? Starting : type == "checking" ? Starting : type == "stoping" ? Starting : type == "upgrade" ? Upgrade : type == "unusual" ? Unusual : type == "Owed" ? Unusual : type == "expired" ? Unusual : type == "Expired" ? Unusual : type == "Unknow" ? Unusual : type == "unknow" ? Unusual : type == "stopping" ? Stopping : type == "abnormal" ? Unusual : type == "some_abnormal" ? Unusual : type == "building" ? Building : type == "build_failure" ? Unusual : "",
            x: x,
            y: y,
            width: 60,
            height: 70
          }
        });
        // 名称文本
        const label = model.label ? model.label : this.label;

        group.addShape("text", {
          attrs: {
            text: label,
            x: x + 10,
            y: y + 70,
            textAlign: "start",
            textBaseline: "top",
            fill: "rgba(0,0,0,0.65)"
          }
        });
        return keyShape;
      },
      // 设置锚点
      anchor: [
        [0.5, 0], // 上面边的中点
        [0.5, 1] // 下边边的中点
      ]
    }
  }

  //打开对外端口
  handleSubmitOpenExternalPort = (name) => {
    this.props.dispatch({
        type: 'appControl/openExternalPort',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: name,
          container_port: "",
          open_outer:""
        },
        callback: (res) => {
          console.log("打开对外端口",res)
          if (res && res._code == 200) {
            notification.success({ message: res.msg_show });
            this.props.propsAPI.executeCommand('undo');
            return
          }
          if (res && res._code == 201) {
              this.setState({
                visible: true,
                foreignType:1,
                list: res.list.join().split(),
                name,
              });
          }
        }
      })
  }
  render() {
    const { group_id } = this.props;
    const { data, list, colorDataType, visible,foreignType } = this.state;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <div>
        {visible && <Modal
          title={foreignType===1?"该服务未开启对外端口":"要关联的服务暂未开启对内端口，是否打开"}
          visible={visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <Form onSubmit={this.handleOk} layout="horizontal" hideRequiredMark>
            <Form.Item {...formItemLayout} label="选择端口">
              {getFieldDecorator('container_port', {
                rules: [
                  {
                    required: true,
                    message: '请选择端口',
                  },
                ],
              })(
                <RadioGroup onChange={this.onChange}>
                  {list.map((items, index) => {
                    return <Radio key={index} value={items}>{items}</Radio>
                  })}
                </RadioGroup>
              )}
            </Form.Item>
          </Form>
        </Modal>}

        <div>
          <Flow style={{ width: "100%", height: 500 }} data={data} noEndEdge={false}
          onBeforeItemSelected={((ev)=>{
            console.log("ev",ev)
            ev.cancel = true
          })}
          onAfterItemSelected={((ev)=>{
            console.log("ev",ev)
            ev.cancel = true
          })}
            onAfterChange={(e) => {
              const { action, item } = e;
              // const model = item.getModel();
              // if (action == 'add') {
              // this.props.propsAPI.executeCommand('undo')
              //   return;
              // }
              // console.log(" this.props.propsAPI", this.props.propsAPI.read())
              // const parent = item.getParent();

              // const parentModel = parent.getModel();
              
              if (action == 'add') {
                const name = item.source.model.service_alias;
                const names = item.target.model.service_alias
                const sourceType = item.source.id
                console.log("item", item)
                console.log("name", name)
                console.log("names", names)
                const id = item.target.id;
                if (sourceType == "The Internet") {
                  this.handleSubmitOpenExternalPort(names)
                } else if (id=="The Internet"){
                    console.log("22")
                    this.handleUndo()
                }
                else if(name != "The Internet") {
                  this.handleSubmitAddRelation(name, id)
                }
              }
            }}
          />

          <RegisterNode
            name="model-card"
            config={{
              draw(item) {
                const group = item.getGraphicGroup();
                const model = item.getModel();
                const width = 15;
                const height = 15;
                const x = -width / 2;
                const y = -height / 2;
                const borderRadius = 6;
                const keyShape = group.addShape("rect", {
                  attrs: {
                    x: x + 30,
                    y: y + 35,
                    width: 10,
                    height: 10,
                    radius: borderRadius,
                    stroke: "#030303",
                    fill: "#030303"
                    //  stroke: 'rgba(0,0,0,0)',
                    // fill: 'rgba(0,0,0,0)'
                  }
                });

                // 类型 logo
                group.addShape("image", {
                  attrs: {
                    img: Yun,
                    x: x,
                    y: y,
                    width: 70,
                    height: 70
                  }
                });

                // 名称文本
                const label = model.label ? model.label : this.label;

                group.addShape("text", {
                  attrs: {
                    text: label,
                    x: x + 10,
                    y: y + 70,
                    textAlign: "start",
                    textBaseline: "top",
                    fill: "rgba(0,0,0,0.65)"
                  }
                });
                return keyShape;
              },
              // 设置锚点
              anchor: [
                [0.5, 0], // 上面边的中点
                [0.5, 1] // 下边边的中点
              ]
            }}
          />
          {colorDataType.map((itemq, index) => {
            return <RegisterNode
              key={index}
              name={colorDataType[index]}
              config={this.config(colorDataType[index])}
            />
          })}
        </div>
      </div>
    )
  }
}

export default withPropsAPI(EditorData);
