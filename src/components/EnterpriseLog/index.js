/* eslint-disable react/sort-comp */
/* eslint-disable react/no-array-index-key */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-string-refs */
import { Button, Card, Form, Select } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent, memo } from 'react';
import moment from 'moment';
import Ansi from '../../components/Ansi/index';
import NoPermTip from '../../components/NoPermTip';
import appUtil from '../../utils/app';
import handleAPIError from '../../utils/error';
import download from '@/utils/download';
import apiConfig from '../../../config/api.config';
import styles from './Log.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

const { Option } = Select;

@connect()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { instances } = this.props;
    this.state = {
      containerLog: [],
      logs: [],
      instances: [],
      started: true,
      filter: '',
      pod_name: instances && instances.length > 0 && instances[0].pod_name,
      container_name: '',
      refreshValue: 5,
    };
    this.messageBuffer = [];
    this.batchUpdateTimer = null;
    this.MAX_LOGS = 5000;
  }
  componentDidMount() {
    const { type } = this.props;
    if (type) {
      this.fetchConsoleLogs();
    } else {
      this.fetchContainerLog();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      this.refs.box &&
      prevState.logs.length !== this.state.logs.length
    ) {
      this.refs.box.scrollTop = this.refs.box.scrollHeight;
    }
  }
  componentWillUnmount() {
    this.closeTimer();
    if (this.eventSourceLogs) {
      this.eventSourceLogs.close();
    }
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
    }
  }

  debouncedBatchUpdate = () => {
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
    }
    this.batchUpdateTimer = setTimeout(() => {
      this.processBatchMessages();
    }, 100);
  };

  processBatchMessages = () => {
    if (this.messageBuffer.length === 0) return;

    const newMessages = [...this.messageBuffer];
    this.messageBuffer = [];

    this.setState((prevState) => {
      const updatedLogs = [...prevState.containerLog, ...newMessages];
      if (updatedLogs.length > this.MAX_LOGS) {
        return { containerLog: updatedLogs.slice(-this.MAX_LOGS) };
      }
      return { containerLog: updatedLogs };
    });
  };
  fetchConsoleLogs = () => {
    const { dispatch, region } = this.props;
    dispatch({
      type: 'region/fetchConsoleLogs',
      callback: res => {
        if (res) {
          this.setState({ logs: res.bean || [] }, () => {
            this.hanleConsoTimer()
          });
        }
      }
    });
  };
  setLogs = logs => {
    const { filter, pod_name: podName } = this.state;

    let newlogs = logs.filter(item => filter === '' || item.indexOf(filter) !== -1);

    newlogs = newlogs.map(item => {
      if (item.indexOf(filter) !== -1) {
        return item.replace(filter, `\x1b[33m${filter}\x1b[0m`);
      }
      return item;
    });

    if (newlogs.length > this.MAX_LOGS) {
      newlogs = newlogs.slice(-this.MAX_LOGS);
    }

    const upDataInfo = podName ? { containerLog: newlogs } : { logs: newlogs };
    this.setState(upDataInfo);
  };
  hanleTimer = () => {
    const { refreshValue } = this.state;
    this.closeTimer();
    if (!refreshValue) {
      return;
    }
    const ss = setTimeout(() => {
      this.fetchContainerLog();
    }, refreshValue * 1000);
    this.setState({ time: ss });
  };
  hanleConsoTimer = () => {
    this.closeTimer();
    const ss = setTimeout(() => {
      this.fetchConsoleLogs();
    }, 2000);
    this.setState({ time: ss });
  };
  closeTimer = () => {
    const { time } = this.state;
    if (time) {
      clearTimeout(time);
    }
  };
  fetchContainerLog = () => {
    const { pod_name } = this.state;
    const { region } = this.props;
    const url = `/console/sse/v2/proxy-pass/system/logs?region_name=${region}&ns=${'rbd-system'}&name=${pod_name}&lines=${100}`;

    this.eventSourceLogs = new EventSource(url, { withCredentials: true });

    this.eventSourceLogs.onmessage = (event) => {
      const newMessage = event.data;
      this.messageBuffer.push(newMessage);
      this.debouncedBatchUpdate();
    };

    this.eventSourceLogs.onerror = (error) => {
      console.error('SSE error:', error);
      handleAPIError({ data: { msg_show: 'SSE connection error' } });
      this.eventSourceLogs.close();
    };
  };
  canView() {
    return appUtil.canManageAppLog(this.props.appDetail);
  }
  handleStop = () => {
    this.setState({ started: false });
    if (this.eventSourceLogs) {
      this.eventSourceLogs.close();
    }
  };
  handleStart = () => {
    this.setState({ started: true });
    this.fetchContainerLog();
  };

  onChangeCascader = value => {
    this.setState(
      {
        pod_name: value,
        container_name: value[1].slice(3)
      },
      () => {
        this.fetchContainerLog();
      }
    );
  };
  handleChange = value => {
    this.setState({ refreshValue: value }, () => {
      if (value) {
        this.hanleTimer();
      } else {
        this.closeTimer();
      }
    });
  };
  downloadLogs = () => {
    const time = Date.parse(new Date());
    const timestamp = moment(time).locale('zh-cn').format('YYYY-MM-DD');
    download(`${apiConfig.baseUrl}/console/enterprise/download/goodrain_log`, `${timestamp}`);
  };

  render() {
    const {
      logs,
      pod_name,
      containerLog,
      started,
      refreshValue,
      time
    } = this.state;
    const { instances, type, RbdName, region } = this.props;
    return (
      <Card
          style={{ borderBottomLeftRadius: 5, borderBottomRightRadius: 5, marginTop: 24 }}
          title={
            !type && (
              <Fragment>
                {started ? (
                  <Button onClick={this.handleStop}>
                    {/* 暂停推送 */}
                    <FormattedMessage id='componentOverview.body.tab.log.push' />
                  </Button>
                ) : (
                  <Button onClick={this.handleStart}>
                    {/* 开始推送 */}
                    <FormattedMessage id='componentOverview.body.tab.log.startPushing' />
                  </Button>
                )}
              </Fragment>
            )
          }
          extra={
            <Fragment>
              {!type ?
                <></>
                :
                <Button onClick={this.downloadLogs} icon='download' type='primary' >
                  {formatMessage({ id: 'LogEnterprise.download' })}
                </Button>
              }
            </Fragment>
          }
          bodyStyle={{ borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}
        >
          <Form layout="inline" name="logFilter" style={{ marginBottom: '16px', display: type ? 'flex' : "block", justifyContent: "space-between" }}>
            {!type &&
              <Form.Item
                name="container"
                label={formatMessage({ id: 'LogEnterprise.node' })}
                style={{ marginRight: '10px' }}
                className={styles.podCascader}
              >
                <Select defaultValue={instances && instances.length > 0 && instances[0].pod_name} placeholder={formatMessage({ id: 'LogEnterprise.find' })} style={{ width: 340 }} onChange={this.onChangeCascader}>
                  {instances && instances.length > 0 && instances.map(item => {
                    const { node_name, pod_name } = item
                    return <Option value={pod_name}>{pod_name}（{node_name}）</Option>
                  })}
                </Select>
              </Form.Item>
            }
          </Form>
          <div className={styles.logStyle} ref="box">
            {containerLog && containerLog.length > 0 &&
              containerLog.map((item, index) => (
                <LogItem
                  key={index}
                  item={item}
                  index={index}
                  isContainer={true}
                />
              ))
            }
            {logs && logs.length > 0 &&
              logs.map((log, index) => (
                <LogItem
                  key={index}
                  log={log}
                  index={index}
                  isContainer={false}
                  type={type}
                />
              ))
            }
          </div>
        </Card>
    );
  }
}

const LogItem = memo(({ item, log, index, isContainer, type }) => {
  if (isContainer) {
    return (
      <div>
        <span style={{ color: '#666666' }}>
          <span>{index + 1}</span>
        </span>
        <span style={{ width: '100%', color: '#FFF' }}>
          <Ansi>{item}</Ansi>
        </span>
      </div>
    );
  }

  const colonIndex = log.indexOf(':');
  const logContent = log.substring(colonIndex + 1, log.length);

  return (
    <div>
      <span style={{ color: '#666666' }}>
        <span>{log === '' ? '' : `${index + 1}`}</span>
      </span>
      <span style={{ color: '#FFF' }}>
        <Ansi>{logContent}</Ansi>
      </span>
    </div>
  );
});