/* eslint-disable react/sort-comp */
/* eslint-disable no-unused-expressions */
import { List } from 'antd';
import React, { PureComponent } from 'react';
import WaterWave from '../Charts/WaterWave';
import style from './index.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

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
  componentDidMount() {}
  showName = podName => {
    const arr =podName && podName.split('-')
    const num = arr[arr.length -1];
    return <FormattedMessage id='componentOverview.body.Expansion.InstanceList.example' values={{num:num}}/>;

  };
  getContainerMem = containers => {
    let memRate = 0;
    containers &&
      containers.map(c => {
        if (c.container_name === this.props.k8s_component_name) {
          memRate = c.usage_rate;
        }
      });
    return memRate;
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
    const statusObj = {
      Running: formatMessage({id:'componentOverview.body.Expansion.InstanceList.normal'}),
      Pending: formatMessage({id:'componentOverview.body.Expansion.InstanceList.starting'}),
      Succeeded: formatMessage({id:'componentOverview.body.Expansion.InstanceList.successfully'}),
      Failed: formatMessage({id:'componentOverview.body.Expansion.InstanceList.failed'}),
      Unknown: formatMessage({id:'componentOverview.body.Expansion.InstanceList.unknown'})
    };
    return (
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={this.state.list}
        renderItem={item => (
          <List.Item className={style.cen} key={item.pod_name}>
            <WaterWave
              className={style.instance}
              height={120}
              title={<FormattedMessage id='componentOverview.body.Expansion.InstanceList.memory'/>}
              percent={this.getContainerMem(item.container)}
              memorySum={this.getMemorySum(item.container)}
            />
            <div>{this.showName(item.pod_name)}</div>
            <div>{statusObj[item.pod_status]}</div>
          </List.Item>
        )}
      />
    );
  }
}

export default InstanceList;
