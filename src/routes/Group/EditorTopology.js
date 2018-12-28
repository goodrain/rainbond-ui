import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card,  } from 'antd';

import GGEditor ,{RegisterNode} from 'gg-editor';
import EditorData from './EditorData'
import Yun from "../../../public/images/yun.svg";
import Running from "../../../public/images/running.svg";
import Undeploy from "../../../public/images/undeploy.svg";
import Closed from "../../../public/images/closed.svg";
import Starting from "../../../public/images/starting.svg";
import Stopping from "../../../public/images/stopping.svg";
import Unusual from "../../../public/images/unusual.svg";
import Upgrade from "../../../public/images/upgrade.svg";
import Building from "../../../public/images/building.svg";

@connect()
class EditorToplogy extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      colorDataType: ["The Internet", "Unknow", "running", "closed", "undeploy", "starting", "checking", "stoping", "upgrade", "unusual", "Owed", "expired", "Expired",
        "internet", "unknow", "stopping", "abnormal", "some_abnormal", "building", "build_failure"],
    }
  }
  //配置拓扑图
  config = (type) => {
    const setAnchor = type == "The Internet" ? [[0.5, 2.5]] : [
      [0.5, -2.1], // 上面边的中点
      [0.5, 3.1] // 下边边的中点
    ]
    return {
      draw(item) {
        const group = item.getGraphicGroup();
        const model = item.getModel();
        const width = 15;
        const height = 15;
        const x = -width / 2;
        const y = -height / 2;
        const borderRadius = 6;
        const xnums = type == "The Internet" ? 30 : 25;
        const ynums = type == "The Internet" ? 35 : 28;
        const keyShape = group.addShape("rect", {
          attrs: {
            x: x + xnums,
            y: y + ynums,
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
            img: type == "The Internet" ? Yun : type == "running" ? Running : type == "closed" ? Closed : type == "undeploy" ? Undeploy : type == "starting" ? Starting : type == "checking" ? Starting : type == "stoping" ? Starting : type == "upgrade" ? Upgrade : type == "unusual" ? Unusual : type == "Owed" ? Unusual : type == "expired" ? Unusual : type == "Expired" ? Unusual : type == "Unknow" ? Unusual : type == "unknow" ? Unusual : type == "stopping" ? Stopping : type == "abnormal" ? Unusual : type == "some_abnormal" ? Unusual : type == "building" ? Building : type == "build_failure" ? Unusual : "",
            x: x,
            y: y,
            width: type == "The Internet" ? 70 : 60,
            height: 70
          }
        });
        // 名称文本
        const label = model.label ? model.label : this.label;
        const xnum = label.length >= 3 ? 0 : 10;
        group.addShape("text", {
          attrs: {
            text: label,
            x: x + xnum,
            y: y + 70,
            textAlign: "start",
            textBaseline: "top",
            fill: "rgba(0,0,0,0.65)",
          }
        });
        return keyShape;
      },
      // 设置锚点
      anchor: setAnchor,
    }
  }
  render() {
    const {colorDataType}=this.state
    return (
      <Card style={{ minHeight: 400 }} bordered={false}>
        <GGEditor>
        {colorDataType.map((itemq, index) => {
          return <RegisterNode
            key={index}
            name={colorDataType[index]}
            config={this.config(colorDataType[index])}
          />
        })}
          <EditorData  {...this.props}/>
        </GGEditor>
      </Card>
    )
  }
}

export default EditorToplogy;
