/* eslint-disable react/sort-comp */
/* eslint-disable react/no-array-index-key */
/* eslint-disable eqeqeq */
/* eslint-disable react/no-string-refs */
import { Button, Form, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent, memo } from 'react';
import moment from 'moment';
import Ansi from '../../components/Ansi/index';
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
      started: true,
      pod_name: instances && instances.length > 0 && instances[0].pod_name,
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

  onChangePod = value => {
    if (this.eventSourceLogs) {
      this.eventSourceLogs.close();
    }
    this.setState(
      {
        pod_name: value,
        containerLog: []
      },
      () => {
        this.fetchContainerLog();
      }
    );
  };
  downloadLogs = () => {
    const time = Date.parse(new Date());
    const timestamp = moment(time).locale('zh-cn').format('YYYY-MM-DD');
    download(`${apiConfig.baseUrl}/console/enterprise/download/goodrain_log`, `${timestamp}`);
  };

  render() {
    const { logs, containerLog, started } = this.state;
    const { instances, type } = this.props;
    return (
      <div className={styles.logContainer}>
        <div className={styles.logHeader}>
          {!type && (
            started ? (
              <Button onClick={this.handleStop}>
                <FormattedMessage id='componentOverview.body.tab.log.push' />
              </Button>
            ) : (
              <Button onClick={this.handleStart}>
                <FormattedMessage id='componentOverview.body.tab.log.startPushing' />
              </Button>
            )
          )}
          {type && (
            <Button onClick={this.downloadLogs} icon='download' type='primary'>
              {formatMessage({ id: 'LogEnterprise.download' })}
            </Button>
          )}
        </div>
        <div className={styles.logBody}>
          {!type && (
            <Form layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item label={formatMessage({ id: 'LogEnterprise.node' })}>
                <Select
                  defaultValue={instances && instances.length > 0 && instances[0].pod_name}
                  placeholder={formatMessage({ id: 'LogEnterprise.find' })}
                  style={{ width: 340 }}
                  onChange={this.onChangePod}
                >
                  {instances && instances.length > 0 && instances.map((item, index) => {
                    const { node_name, pod_name: podName } = item;
                    return <Option key={index} value={podName}>{podName}（{node_name}）</Option>;
                  })}
                </Select>
              </Form.Item>
            </Form>
          )}
          <div className={styles.logStyle} ref="box">
            {containerLog && containerLog.length > 0 &&
              containerLog.map((item, index) => (
                <LogItem key={index} item={item} index={index} isContainer={true} />
              ))
            }
            {logs && logs.length > 0 &&
              logs.map((log, index) => (
                <LogItem key={index} log={log} index={index} isContainer={false} />
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

const LogItem = memo(({ item, log, index, isContainer }) => {
  if (isContainer) {
    return (
      <div className={styles.logItem}>
        <span className={styles.logIndex}>{index + 1}</span>
        <span className={styles.logContent}>
          <Ansi>{item}</Ansi>
        </span>
      </div>
    );
  }

  const colonIndex = log.indexOf(':');
  const logContent = log.substring(colonIndex + 1);

  return (
    <div className={styles.logItem}>
      <span className={styles.logIndex}>{log === '' ? '' : index + 1}</span>
      <span className={styles.logContent}>
        <Ansi>{logContent}</Ansi>
      </span>
    </div>
  );
});