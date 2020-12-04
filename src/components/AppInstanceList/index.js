/* eslint-disable react/sort-comp */
/* eslint-disable no-unused-expressions */
import { List } from "antd";
import React, { PureComponent } from "react";
import WaterWave from "../Charts/WaterWave";
import style from "./index.less";

class InstanceList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      list: this.props.list,
    }
  }
  componentWillReceiveProps(nextProps){
    if(nextProps.list!==this.props.list){
      this.setState({
        list:nextProps.list
      })
    }
  }
  componentDidMount() {}
  showName = (podName) => {
    const num = podName.split("-")[1];
    return `实例${num}`;
  };
  getContainerMem = (containers)=> {
    let memRate = 0
    containers && containers.map(c=>{
      if (c.container_name === this.props.serviceID) {
        memRate = c.usage_rate
      }
    })
    return memRate
  }
  render() {
    const statusObj = {
      "Running":"正常运行",
      "Pending":"启动中",
      "Succeeded":"运行成功",
      "Failed":"运行失败",
      "Unknown":"未知",
    }
    return (
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={this.state.list}
        renderItem={item => (
          <List.Item className={style.item} key={item.pod_name}>
            <WaterWave
              className={style.instance}
              height={120}
              title="运行内存"
              percent={this.getContainerMem(item.container)}
            />
             <a className={style.instancename} href="javascript:;">
              {this.showName(item.pod_name)}
            </a>
            <br />
            <a href="javascript:;" style={{ color: '#000' }}>
              {statusObj[item.pod_status]}
            </a>
          </List.Item>
        )}
      />
    );
  }
}

export default InstanceList;
