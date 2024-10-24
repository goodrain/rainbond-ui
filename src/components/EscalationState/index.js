import { connect } from 'dva';
import moment from 'moment';
import { Card, Progress, Badge, Popover, Alert, Collapse, Button, Spin } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Result from '../Result'
import global from '@/utils/global';
import styles from './index.less';
const { Panel } = Collapse;


@connect()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.timer = null;
    this.state = {
      clusters: [],
      clusterLoadings: true,
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.loadClusters()
    }, 5000)
  }

  componentWillUnmount() {
    this.clearAllTimers();
  }

  // 清理所有定时器
  clearAllTimers = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  // 关闭指定定时器
  closeTimer = (timerName) => {
    if (this[timerName]) {
      clearInterval(this[timerName]);
    }
  };

  // 设置定时器处理函数，动态生成定时器名称，避免覆盖
  handleTimers = (timerName, callback, times) => {
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };

  showLog = () => {
    // 显示日志逻辑，这里可以根据需求补充
  };

  // 定时循环更新集群信息
  cyclicQueryUpdateInfo = () => {
    const { clusters } = this.state;
    clusters.forEach((item, index) => {
      this.updatePlatform(item.region_name, index);
    });
    this.handleTimers(`timer`, () => this.cyclicQueryUpdateInfo(), 2000);
  };

  // 加载集群信息
  loadClusters = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: global.getCurrEnterpriseId(),
      },
      callback: (res) => {
        if (res && res.list && res.list.length > 0) {
          const clusters = res.list.map((item) => ({
            region_alias: item.region_alias,
            region_name: item.region_name,
            updateInfo: [], // 修正拼写错误
          }));
          this.setState({ clusters, clusterLoadings: false }, () => {
            this.cyclicQueryUpdateInfo();
            this.checkUpdataStatus()
          });
        } else {
          this.setState({ clusters: [], clusterLoadings: false });
        }
      },
    });
  };

  // 更新平台信息
  updatePlatform = (region_name, index) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/updatePlatform',
      payload: {
        region_name,
      },
      callback: (res) => {
        if (res && res.list) {
          this.setState((prevState) => {
            const clusters = [...prevState.clusters];
            const cluster = clusters[index];
            if (cluster && cluster.region_name === region_name) {
              cluster.updateInfo = res.list;
            }
            this.checkUpdataStatus(clusters)
            return { clusters };
          });
        }
      },
    });
  };
  computeSchedule = (list, type = false) => {
    let num = 0;
    list.forEach(item => {
      if (item.status === 'Completed') {
        num += 1;
      }
    });
    if (!type) {
      return `(${num}/${list.length})`;
    } else {
      return num === list.length
    }
  };
  checkUpdataStatus = (clusters) => {
    let bool = false
    clusters && clusters.length > 0 && clusters.forEach((item) => {
      bool = this.computeSchedule(item.updateInfo, true)
    })
    this.setState({
      isShowComplete: bool
    })
  }

  render() {
    const { complete, } = this.props
    const { clusterLoadings, clusters, isShowComplete } = this.state
    return (
      <div>
        <Result
          type={!isShowComplete ? 'ing' : 'success'}
          title={!isShowComplete ? formatMessage({id:'platformUpgrade.EscalationState.updataing'}) : formatMessage({id:'platformUpgrade.EscalationState.updatasuccess'})}
          description={!isShowComplete && formatMessage({id:'platformUpgrade.EscalationState.img'})}
          style={{
            marginTop: 48,
            marginBottom: 16
          }}
          actions={!isShowComplete ? <></> : <Button type='primary' onClick={() => complete && complete()} style={{ marginRight: 16 }}>{formatMessage({id:'platformUpgrade.EscalationState.back'})}</Button>}
        />
        {!clusterLoadings &&
          <Collapse defaultActiveKey={['1']} expandIconPosition='right'>
            {clusters.map((item, index) => {
              const { region_alias, updateInfo, region_name } = item
              return <Panel
                header={<div className={styles.PanelHeader}>{region_alias} <p>{formatMessage({id:'platformUpgrade.EscalationState.loading'})}<span>{updateInfo && updateInfo.length > 0 && this.computeSchedule(updateInfo)}</span></p></div>}
                key={region_name}
              >
                <div className={styles.clusterBox}>
                  {updateInfo && updateInfo.length > 0 ? updateInfo.map((item, index) => {
                    const { name, status, progress, message } = item
                    return <div className={styles.podBox}>
                      <div>
                        <Badge status={status == 'Completed' ? "success" : "processing"} />
                        <div>
                          {name}
                        </div>
                        <div>
                          {status != 'Completed' &&
                            <Popover content={message || formatMessage({id:'platformUpgrade.EscalationState.nolog'})} title={formatMessage({id:'platformUpgrade.EscalationState.loginfo'})} style={{width: 200}}>
                              <span onClick={this.showLog}>{formatMessage({id:'platformUpgrade.EscalationState.log'})}</span>
                            </Popover>
                          }
                        </div>
                      </div>
                      <div>
                        <Progress percent={progress} status={progress == 100 ? "" : "active"} />
                      </div>
                    </div>
                  })
                    :
                    <Spin />
                  }
                </div>
              </Panel>
            })}

          </Collapse>}

      </div>
    );
  }
}

export default Index;
