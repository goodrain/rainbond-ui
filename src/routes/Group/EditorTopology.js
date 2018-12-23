import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Card } from 'antd';
import Yun from "../../../public/images/yun.svg";
import Lx from "../../../public/images/lx.svg";
import globalUtil from '../../utils/global';
import GGEditor, { Flow, RegisterNode, withPropsAPI } from 'gg-editor';

@connect()

class EditorToplogy extends PureComponent {
	constructor(props) {
		super(props);
		this.state={
			data:{}
		}
  }

	componentDidMount() {
    const { propsAPI } = this.props;
		// console.log("propsAPI",propsAPI.save());
		this.loadTopology()
	}

  loadTopology=()=> {
		const { dispatch,group_id } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    dispatch({
      type: "global/fetAllTopology",
      payload: {
        region_name,
        team_name,
        groupId:group_id
      },
      callback: (res) => {
				console.log("数据",res);
				const data=this.goodrainData2scopeData(res)
				this.setState({
					data
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
      edges: [ 
      //   {
      //   source: "49c4880e662f89fa11dde2ebd34d014d",
      //   target: "26f680271941291da1c9db4957005cb8",
      // },
      // {
      //   source: "49c4880e662f89fa11dde2ebd34d014d",
      //   target: "119f8bd12fe94b4d1669867e767308d6",
      // },
    ],
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
        node.shape = "model-lx";
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
        dats.nodes.push(node);
      }
    });

    dats.edges = Array.from(new Set(dats.edges))
    arr = Array.from(new Set(arr))
    let ars =dats.edges.concat(arr)
    dats.edges = ars
    return dats;
  }

	render() {
		const { group_id } = this.props;
		const {data}=this.state;
		return (
			<Card style={{ minHeight: 400 }} bordered={false}>
				修改拓扑图
			<GGEditor>
					<Flow style={{ width: "100%", height: 500 }}  data={data} />

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
            <RegisterNode
              name="model-lx"
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
                      img: Lx,
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
              }}
            />
				</GGEditor>
			</Card>
		)
	}
}

export default withPropsAPI(EditorToplogy);
