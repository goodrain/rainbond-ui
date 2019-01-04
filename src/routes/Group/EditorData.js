import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Modal, Checkbox, notification, Radio, Form } from 'antd';


import globalUtil from '../../utils/global';
import { Flow, withPropsAPI, RegisterCommand } from 'gg-editor';
import {
  addRelationedApp,
  removeRelationedApp
} from '../../services/app';
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
      edgeVisible: false,
      list: [],
      name: '',
      id: '',
      foreignType: 0,
      registerData: [],
      edgeData: "",
      edgeTitle: "",
      foreignTypeName: ""
    }
  }
  componentDidMount() {
    this.loadTopology()
  }
  //更新拓扑图
  changeType = () => {
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
    const keyslength = keys.length;
    let dats = {
      nodes: [
        {
          type: "node",
          size: "70*70",
          shape: "The Internet",
          color: "#030303",
          label: "The Internet",
          stack: true,
          stackNum: 1,
          linkable: true,
          rank: 'internet',
          cur_status: 'running',
          x: (document.body.clientWidth / 2) - (keys.length > 0 ? ((keys.length / 2) * 100) : 0),
          y: 15,
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

    keys.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(data.json_data, k)) {
        num++
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
        let sum = (((document.body.clientWidth - 352) - ((keyslength * 100))) / 2)
        let sm = num == 1 ? "" : (num - 1) * 100

        if (item.is_internet) {
          edge.source = "The Internet";
          // edge.sourceAnchor = 2;
          edge.target = k;
          // edge.id = num;
          // edge.index = num;
          dats.edges.push(edge);
        }

        if (data.json_svg[k] && data.json_svg[k].length > 0) {
          for (let o = 0; o < data.json_svg[k].length; o++) {
            edgr = {}
            edgr.source = item.service_id;
            // edgr.sourceAnchor = 2;
            edgr.target = data.json_svg[k][o];
            // edgr.id = num * 999 + o;
            // edgr.index = num * 999 + o;
            node.x = Number(sum + sm)
            node.y = num > 10 ? 250 : num > 20 ? 350 : num > 30 ? 550 : num > 40 ? 650 : num > 50 ? 750 : num > 60 ? 850 : num > 70 ? 950 : 150;

            arr.push(edgr);
          }
        }

        node.x = Number(sum + sm)
        node.y = node.y ? node.y : num > 10 ? 350 : num > 20 ? 450 : num > 30 ? 550 : num > 40 ? 650 : num > 50 ? 750 : num > 60 ? 850 : num > 70 ? 950 : 250;

        dats.registerData.push(item.cur_status)
        dats.nodes.push(node);
      }
    });

    dats.edges = Array.from(new Set(dats.edges))
    arr = Array.from(new Set(arr))
    let ars = dats.edges.concat(arr)
    dats.edges = ars
    dats.nodes[0].x = Number(((document.body.clientWidth - 352) - ((keyslength * 100) / 2)) / 2)
    return dats;
  }

  //处理 多依赖
  handleOk = (e) => {
    e.preventDefault();
    const { name, id, foreignType } = this.state;
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (!err) {
        if (foreignType === 0) {
          addRelationedApp({
            team_name: globalUtil.getCurrTeamName(),
            app_alias: name,
            dep_service_id: id,
            open_inner: true,
            container_port: fieldsValue.container_port
          }).then((res) => {
            if (res && res._code == 200) {
              notification.success({ message: res.msg_show })
              this.setState({ visible: false });
              return
            }
            this.setState({ visible: false });
            this.handleUndo();
          });
        }
        if (foreignType === 1) {
          this.props.dispatch({
            type: 'appControl/openExternalPort',
            payload: {
              team_name: globalUtil.getCurrTeamName(),
              app_alias: name,
              container_port: fieldsValue.container_port,
              open_outer: true
            },
            callback: (res) => {
              if (res && res._code == 200) {
                notification.success({ message: res.msg_show });
                this.setState({ visible: false });
                return
              }
              this.setState({ visible: false });
              this.handleUndo();
            }
          })
        }
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
  handleSubmitAddRelation = (name, id, targetName) => {
    addRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: name,
      dep_service_id: id
    }).then((res) => {
      if (res && res._code == 212) {
        if (res.msg_show == "当前应用已被关联") {
          this.handleUndo();
          return
        }
        this.loadTopology()
        notification.success({ message: res.msg_show });
        return
      }
      if (res && res._code == 201) {
         if (res.list.length == 0) {
            this.handleUndo();
            notification.warning({ message: "暂无端口可用" })
            return
          }
        this.setState({
          visible: true,
          foreignType: 0,
          foreignTypeName: targetName,
          list: res.list || [],
          name,
          id,
        });
        return
      }
      if (res && res._code == 200) {
        this.loadTopology()
        notification.success({ message: res.msg_show });
        return
      }
      this.handleUndo();
    })
  }

  //处理删除依赖接口
  handleDeleteRelationedApp = () => {
    const { edgeData } = this.state;
    if (edgeData) {
      const name = edgeData.source.model.service_alias;
      const names = edgeData.target.model.service_alias
      const id = edgeData.target.id;
      if (name) {
        removeRelationedApp({
          team_name: globalUtil.getCurrTeamName(),
          app_alias: name,
          dep_service_id: id,
        }).then((res) => {
          if (res && res._code == 200) {
            notification.success({ message: res.msg_show });
            this.loadTopology()
            this.setState({
              edgeData: "",
              edgeVisible: false
            })
          }
        });
      } else {
        this.props.dispatch({
          type: 'appControl/openExternalPort',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            app_alias: names,
            close_outer: true
          },
          callback: (res) => {
            if (res && res._code == 200) {
              notification.success({ message: res.msg_show });
              this.loadTopology()
              this.setState({
                edgeData: "",
                edgeVisible: false
              })
            }
          }
        })
      }

    }
  }
  handleUndo = () => {
    setTimeout(() => {
      this.props.propsAPI.executeCommand('undo')
    }, 100);
  }

  //打开对外端口
  handleSubmitOpenExternalPort = (name, nowName) => {
    this.props.dispatch({
      type: 'appControl/openExternalPort',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: name,
        container_port: "",
        open_outer: ""
      },
      callback: (res) => {
        if (res && res._code == 200) {
          if (res.msg_show == "该服务已开启对外端口") {
            this.handleUndo();
            return
          }
          this.loadTopology()
          notification.success({ message: res.msg_show });
          return
        }
        if (res && res._code == 201) {
          if (res.list.length == 0) {
            this.handleUndo();
            notification.warning({ message: "暂无端口可用" })
            return
          }
          this.setState({
            visible: true,
            foreignType: 1,
            foreignTypeName: nowName,
            list: res.list || [],
            name,
          });
          return
        }
        this.handleUndo();
      }
    })
  }
  //保存数据
  onSaveEdgeData = (data) => {
    this.setState({
      edgeData: data,
      edgeTitle: data.source.model.service_alias ? <div>是否取消<a>{data.source.model.label}</a>依赖<a>{data.target.model.label}</a></div> : <div>是否关闭<a>{data.target.model.label}</a>服务的所有对外端口</div>
    })
  }
  //打开弹框
  onEdgeOpen = () => {
    if (this.state.edgeData) {
      this.setState({
        edgeVisible: true
      })
    }
  }
  render() {
    const { data, list, visible, foreignType, edgeVisible, edgeData, edgeTitle, foreignTypeName } = this.state;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <div>
        {visible && <Modal
          title={foreignType === 1 ? <div><a>{foreignTypeName}</a>服务未开启对外端口</div> : <div>要关联的<a>{foreignTypeName}</a>服务暂未开启对内端口，是否打开?</div>}
          visible={visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <Form onSubmit={this.handleOk} layout="horizontal" hideRequiredMark>
            <Form.Item {...formItemLayout} label="选择端口">
              {getFieldDecorator('container_port', {
                initialValue: list[0],
                rules: [
                  {
                    required: true,
                    message: '请选择端口',
                  },
                ],
              })(
                <RadioGroup >
                  {list.map((item, index) => {
                    return <Radio key={index} value={item}>{item}</Radio>
                  })}
                </RadioGroup>
              )}
            </Form.Item>
          </Form>
        </Modal>}

        {edgeVisible && <Modal
          title=""
          visible={edgeVisible}
          onOk={this.handleDeleteRelationedApp}
          onCancel={() => { this.setState({ edgeVisible: false, edgeData: "" }) }}
        >
          <h3>{edgeTitle}</h3>
        </Modal>}

        <RegisterCommand name="delete" config={{ shortcutCodes: [] }} extend="delete" />

        <div>
          <Flow style={{ width: "100%", minHeight: 500 }} data={data} noEndEdge={false}
            onKeyDown={(e) => {
              if (e.domEvent.key == "Backspace") {
                this.onEdgeOpen();
              }
            }}
            onEdgeClick={(e) => {
              this.onSaveEdgeData(e.item);
            }}
            onAfterChange={(e) => {
              const { action, item } = e;

              if (action == 'add') {
                const name = item.source.model.service_alias;
                const names = item.target.model.service_alias
                const sourceType = item.source.id
                const id = item.target.id;
                const targetName = item.target.model.label
                if (sourceType == "The Internet") {
                  this.handleSubmitOpenExternalPort(names, targetName)
                } else if (id == "The Internet") {
                  this.handleUndo()
                }
                else if (name != "The Internet") {
                  this.handleSubmitAddRelation(name, id, targetName)
                }
              }
            }}
          />

        </div>
      </div>
    )
  }
}

export default withPropsAPI(EditorData);
