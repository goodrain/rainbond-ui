import React, { PureComponent } from "react";
import { List,Form } from "antd";
import WaterWave from "../Charts/WaterWave";
import style from "./index.less";

class InstanceList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      list: this.props.list,
    };
  }
  componentDidMount() {}
  showName = (podName) => {
    const num = podName.split("-")[1];
    return `实例${num}`;
  };
  
  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 12,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 8,
        },
      },
    };
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
        dataSource={this.props.list}
        renderItem={item => (
          <List.Item className={style.item} key={item.pod_name}>
            <WaterWave
              className={style.instance}
              height={120}
              title="运行内存"
              percent={(item.container[0] && item.container[0].usage_rate) || 0}
            />
            <a
              onClick={() => {
                this.props.handlePodClick(item.pod_name, item.manage_name);
              }}
              href="javascript:;"
              className={style.instancename}
            >
              {this.showName(item.pod_name)}
            </a>
            <br/>
            <a href="javascript:;" style={{color:"#000"}}>
              {statusObj[item.pod_status]}
            </a>
          </List.Item>
        )}
      />
    );
  }
}

export default InstanceList;
