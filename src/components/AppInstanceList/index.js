/* eslint-disable react/sort-comp */
/* eslint-disable no-unused-expressions */
import { List, Progress, Empty } from 'antd';
import React, { PureComponent } from 'react';
import WaterWave from '../Charts/WaterWave';
import style from './index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

class InstanceList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      list: this.props.list
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.list !== this.props.list) {
      this.setState({
        list: nextProps.list
      });
    }
  }
  componentDidMount() { }
  showName = podName => {
    const arr = podName && podName.split('-')
    const num = arr[arr.length - 1];
    return `${formatMessage({ id: 'componentOverview.body.Expansion.InstanceList.example' }, { num: num })}`;

  };
  getContainerMem = (containers, type) => {
    const { method } = this.props
    let memRate = 0;
    if (method === 'vm') {
      containers &&
        containers.map(c => {
          if (c.container_name === "compute") {
            memRate = c.usage_rate;
          }
        });
    } else {
      containers &&
        containers.map(c => {
          if (c.container_name === this.props.k8s_component_name) {
            memRate = c.usage_rate;
          }
        });
    }
    if(type){
      return  memRate
    }
    return memRate + '%';
  };
  getMemorySum = containers => {
    let memorySum = 0;
    containers &&
      containers.map(c => {
        memorySum += c.memory_usage;
      });
    return memorySum.toFixed(2);
  };
  render() {
    const { list } = this.state
    const statusObj = {
      Running: formatMessage({ id: 'componentOverview.body.Expansion.InstanceList.normal' }),
      Pending: formatMessage({ id: 'componentOverview.body.Expansion.InstanceList.starting' }),
      Succeeded: formatMessage({ id: 'componentOverview.body.Expansion.InstanceList.successfully' }),
      Failed: formatMessage({ id: 'componentOverview.body.Expansion.InstanceList.failed' }),
      Unknown: formatMessage({ id: 'componentOverview.body.Expansion.InstanceList.unknown' })
    };
    return (
      <>
        {list.length > 0 && list.map((item) => {
          return <>
            <div className={style.card}> 
              <h1>{this.showName(item.pod_name)}</h1>
              <h2>{this.getContainerMem(item.container)}</h2>
              <h3>运行内存</h3>
              <div>
              <Progress percent={this.getContainerMem(item.container, true)} size="small" showInfo={false}strokeColor='#161616'/>
              </div>
            </div>
          </>
        })}
        {list.length === 0 && <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      </>

    );
  }
}

export default InstanceList;
