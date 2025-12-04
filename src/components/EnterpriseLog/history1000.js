/* eslint-disable react/no-string-refs */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */

import Ansi from '@/components/Ansi';
import { Icon, Modal } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { getServiceLog } from '../../services/app';
import globalUtil from '../../utils/global';
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
  }
  componentDidMount() {
    this.fetchClusterLogInfoSingle();
  }
  componentWillUnmount() {
    if (this.eventSources) {
      this.eventSources.close();
    }
  }

  fetchClusterLogInfoSingle = () => {
    const { dispatch, region, podName } = this.props;
    const url = `/sse/console/sse/v2/proxy-pass/system/logs?region_name=${region}&ns=${'rbd-system'}&name=${podName}&lines=${1000}`;
    this.eventSources = new EventSource(url, {withCredentials: true});
    const messages = [];
    this.eventSources.onmessage = (event) => {
      const newMessage = event.data;
      messages.push(newMessage);
      if (messages.length >= 10) {  // 每收到10条消息更新一次
        this.setState((prevState) => ({
          loading: false,
          list: [...prevState.list, ...messages],
        }));
        messages.length = 0;  // 清空数组
      }
    };
    this.eventSources.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSources.close();
    };
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
        footer={null}
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
