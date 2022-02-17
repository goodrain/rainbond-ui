import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Divider, } from 'antd';

import GGEditor, { RegisterNode } from 'gg-editor';
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
import Third_party from "../../../public/images/third_party.svg";

@connect()
class EditorToplogy extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      colorDataType: [
        "The Internet",
        "Unknow",
        "Unknown",
        "unknown",
        "running",
        "closed",
        "undeploy",
        "starting",
        "checking",
        "stoping",
        "upgrade",
        "unusual",
        "Owed",
        "expired",
        "Expired",
        "internet",
        "unknow",
        "stopping",
        "abnormal",
        "some_abnormal",
        "building",
        "build_failure",
        "creating",
        'third_party',
      ],
    }
  }
  //配置拓扑图
  config = (type) => {
    const setAnchor = type == "The Internet" ? [[0.5, 2.5]] : [
      [0.5, -2.5], // 上面边的中点
      [0.5, 3.5] // 下边边的中点
    ]
    return {
      draw(item) {
        const group = item.getGraphicGroup();
        const model = item.getModel();
        const width = 10;
        const height = 10;
        const x = -width / 2;
        const y = -height / 2;
        const borderRadius = 3;
        const xnums = type == "The Internet" ? 23 : 16;
        const ynums = type == "The Internet" ? 22 : 20;
        const keyShape = group.addShape("rect", {
          attrs: {
            x: x + xnums,
            y: y + ynums,
            width: 6,
            height: 6,
            radius: borderRadius,
            stroke: "#000000",
            fill: "#000000"
          }
        });
        // 类型 logo
        group.addShape("image", {
          attrs: {
            img: type == "third_party" ? Third_party : type == "The Internet" ? Yun : type == "running" ? Running : type == "closed" ? Closed : type == "undeploy" ? Undeploy : type == "starting" ? Starting : type == "checking" ? Starting : type == "stoping" ? Starting : type == "creating" ? Building : type == "upgrade" ? Upgrade : type == "unusual" ? Unusual : type == "Owed" ? Unusual : type == "expired" ? Unusual : type == "Expired" ? Unusual : type == "Unknown" ? Unusual : type == "unknown" ? Unusual : type == "Unknow" ? Unusual : type == "unknow" ? Unusual : type == "stopping" ? Stopping : type == "abnormal" ? Unusual : type == "some_abnormal" ? Unusual : type == "building" ? Building : type == "build_failure" ? Unusual : "",
            x: x,
            y: y,
            width: type == "The Internet" ? 53 : 38,
            height: type == "The Internet" ? 45 : 48,
          }
        });
        // 名称文本
        const label = model.label ? model.label : this.label;
        const xnum = label.length >= 3 ? 0 : 10;
        group.addShape("text", {
          attrs: {
            text: label,
            x: x + xnum,
            y: y + 46,
            textAlign: "left",
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
    const { colorDataType } = this.state
    const { flagHeight } = this.props
    return (
      <div style={{ minHeight: 700, background:'#fff' }} bordered={false}>
        <GGEditor>
          {colorDataType.map((itemq, index) => {
            return <RegisterNode
              key={index}
              name={colorDataType[index]}
              config={this.config(colorDataType[index])}
            />
          })}
          <EditorData  {...this.props} />
        </GGEditor>
      </div>
    )
  }
}

export default EditorToplogy;
