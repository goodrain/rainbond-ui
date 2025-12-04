/* eslint-disable react/no-string-refs */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */

import Ansi from '@/components/Ansi';
import { Icon, Modal, Button } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from './Log.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

@connect(null, null, null, { withRef: true })
/** 
 * 用途：显示历史日志的Modal组件
 * 
 * 功能：
 * - 在Modal中显示历史日志
 * - 通过props传递region和RbdName参数
 * - 根据region和RbdName获取历史日志信息
 * - 支持显示loading状态和日志内容
 * - 支持点击日志条目高亮显示相关内容
 * 
 * 传参：
 * - region: string，地区信息
 * - RbdName: string，Rbd名称
 * - onCancel: function，取消Modal时的回调函数
 * 
 * State状态：
 * - list: array，日志列表
 * - loading: boolean，加载状态
 * - showHighlighted: string，当前高亮显示的日志关键字
 */
export default class History1000Log extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: true,
      showHighlighted: '',
    };
    this.eventSources = {};
  }

  componentDidMount() {
    this.initializeEventSources();
  }
  componentWillUnmount() {
    if (this.eventSources) {
      this.closeAllEventSources();
    }
  }
  closeEventSource(podsName) {
    if (this.eventSources[podsName]) {
      this.eventSources[podsName].close();
      console.log(`${podsName} EventSource closed.`);
      delete this.eventSources[podsName]; // 从对象中移除引用
    }
  }

  // 如果需要，可以添加更多管理方法，比如关闭所有实例
  closeAllEventSources() {
    if (this.eventSources) {
      Object.keys(this.eventSources).forEach(podsName => {
        this.closeEventSource(podsName);
      });
    }
  }

  initializeEventSources() {
    const { podName, region, teamName, instances } = this.props;
    instances.forEach(pod => {
      if (pod.pod_name) {
        const url = `/console/sse/v2/tenants/${teamName}/services/${podName}/pods/${pod.pod_name}/logs?region_name=${region}&lines=${1000}`;
        this.eventSources[pod.pod_name] = new EventSource(url, { withCredentials: true });
        this.eventSources[pod.pod_name].onmessage = (event) => {
          const newMessage = event.data;
          this.setState((prevState) => ({
            list: [...prevState.list, newMessage],
          }));
        };
        this.eventSources[pod.pod_name].onerror = (error) => {
          console.error(`${pod.pod_name} EventSource failed:`, error);
          this.closeEventSource(pod.pod_name); // 出错时关闭EventSource实例
        };
      }
    });
  }
  handleExportLogs = () => {
    // 前端导出.txt文件，内容是list里面的值
    const { list } = this.state;
    
    // 如果日志列表为空，直接返回
    if (!list || list.length === 0) {
      return;
    }
  
    // 将日志数组转换为文本内容，每条日志占一行
    const content = list.join('\n');
    
    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    
    // 设置文件名（使用当前时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadLink.download = `logs-${timestamp}.txt`;
    
    // 添加链接到文档
    document.body.appendChild(downloadLink);
    
    // 触发下载
    downloadLink.click();
    
    // 清理：移除链接并释放URL对象
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
  }
  render() {
    const { loading, list, showHighlighted } = this.state;
    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.tab.log.History1000Log.title' />}
        visible
        width={1024}
        bodyStyle={{ background: '#222222', color: '#fff' }}
        className={styles.logModal}
        onCancel={this.props.onCancel}
        footer={[
          <Button onClick={this.handleExportLogs}>
            导出日志
          </Button>
        ]}
      >
      <div
        style={{
          padding: '20px 0',
          maxHeight: 500,
          overflowY: 'auto',
          background: '#212121',
        }}
      >
        {list.length > 0 ? (
          <div className={styles.History1000Log}>
            {list.map((log, index) => {
              return (
                <div key={index}>
                  <span
                    style={{
                      color:
                        showHighlighted ===
                          log.substring(0, log.indexOf(':'))
                          ? '#FFFF91'
                          : '#666666',
                    }}
                  >
                    <b>{/* <Icon type="caret-right" /> */}</b>
                    <span>{log === '' ? '' : `${index + 1}`}</span>
                  </span>
                  <span
                    ref="texts"
                    style={{
                      color:
                        showHighlighted ==
                          log.substring(0, log.indexOf(':'))
                          ? '#FFFF91'
                          : '#FFF',
                    }}
                  >
                    <Ansi>{ log }</Ansi>
                  </span>

                  {list.length === 1 ? (
                    <span
                      style={{
                        color:
                          showHighlighted ===
                            log.substring(0, log.indexOf(':'))
                            ? '#FFFF91'
                            : '#bbb',
                        cursor: 'pointer',
                        backgroundColor: log.substring(0, log.indexOf(':'))
                          ? '#666'
                          : '',
                      }}
                      onClick={() => {
                        this.setState({
                          showHighlighted:
                            showHighlighted ==
                              log.substring(0, log.indexOf(':'))
                              ? ''
                              : log.substring(0, log.indexOf(':')),
                        });
                      }}
                    >
                      <Ansi>{log.substring(0, log.indexOf(':'))}</Ansi>{' '}
                    </span>
                  ) : list.length > 1 &&
                    index >= 1 &&
                    log.substring(0, log.indexOf(':')) ==
                    list[index <= 0 ? index + 1 : index - 1].substring(
                      0,
                      list[index <= 0 ? index + 1 : index - 1].indexOf(
                        ':'
                      )
                    ) ? (
                    ''
                  ) : (
                    <span
                      style={{
                        color:
                          showHighlighted ==
                            log.substring(0, log.indexOf(':'))
                            ? '#FFFF91'
                            : '#bbb',
                        cursor: 'pointer',
                        backgroundColor:
                          index == 0 && log.substring(0, log.indexOf(':'))
                            ? '#666'
                            : log.substring(0, log.indexOf(':')) ==
                              list[
                                index <= 0 ? index + 1 : index - 1
                              ].substring(
                                0,
                                list[
                                  index <= 0 ? index + 1 : index - 1
                                ].indexOf(':')
                              )
                              ? ''
                              : '#666',
                      }}
                      onClick={() => {
                        this.setState({
                          showHighlighted:
                            showHighlighted ==
                              log.substring(0, log.indexOf(':'))
                              ? ''
                              : log.substring(0, log.indexOf(':')),
                        });
                      }}
                    >
                      <Ansi>{log.substring(0, log.indexOf(':'))}</Ansi>{' '}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p
            style={{ textAlign: 'center', marginBottom: 0, color: '#999' }}
          >
            {/* 暂无日志 */}
            <FormattedMessage id='componentOverview.body.tab.log.History1000Log.null' />
          </p>
        )}
      </div>
      </Modal>
    );
  }
}
