import React, { PureComponent } from 'react';
import { Button, Empty, Icon, Input, Select, Switch } from 'antd';
import { formatMessage } from '@/utils/intl';
import { getPodLogsStreamUrl } from '../../../services/teamResource';
import styles from '../detail.less';

const { Option } = Select;
const STREAM_CONNECT_TIMEOUT = 3000;

class PodLogStream extends PureComponent {
  state = {
    logs: [],
    selectedContainer: '',
    lines: 200,
    connecting: false,
    autoScroll: true,
    error: '',
  };

  componentDidMount() {
    this.syncContainer();
    this.openStream();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevContainers = (prevProps.containers || []).join(',');
    const nextContainers = (this.props.containers || []).join(',');
    if (prevContainers !== nextContainers) {
      this.syncContainer();
      return;
    }
    if (
      prevProps.active !== this.props.active ||
      prevProps.podName !== this.props.podName ||
      prevProps.teamName !== this.props.teamName ||
      prevProps.regionName !== this.props.regionName ||
      prevState.selectedContainer !== this.state.selectedContainer ||
      prevState.lines !== this.state.lines
    ) {
      this.openStream();
    }
    if (this.state.autoScroll && this.logRef) {
      this.logRef.scrollTop = this.logRef.scrollHeight;
    }
  }

  componentWillUnmount() {
    this.closeStream();
  }

  syncContainer = () => {
    const containers = this.props.containers || [];
    const selectedContainer = containers[0] || '';
    this.setState({ selectedContainer });
  };

  closeStream = () => {
    if (this.connectingTimer) {
      clearTimeout(this.connectingTimer);
      this.connectingTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  };

  openStream = () => {
    const { active, teamName, regionName, podName } = this.props;
    const { selectedContainer, lines } = this.state;
    this.closeStream();
    if (!active || !teamName || !regionName || !podName) {
      return;
    }
    this.setState({ connecting: true, error: '', logs: [] });
    const url = getPodLogsStreamUrl({
      team: teamName,
      region: regionName,
      pod_name: podName,
      container: selectedContainer,
      lines,
    });
    const source = new EventSource(url, { withCredentials: true });
    this.connectingTimer = setTimeout(() => {
      if (this.eventSource === source) {
        this.setState({ connecting: false });
      }
    }, STREAM_CONNECT_TIMEOUT);
    source.onopen = () => {
      if (this.connectingTimer) {
        clearTimeout(this.connectingTimer);
        this.connectingTimer = null;
      }
      this.setState({ connecting: false, error: '' });
    };
    source.onmessage = event => {
      if (this.connectingTimer) {
        clearTimeout(this.connectingTimer);
        this.connectingTimer = null;
      }
      const nextLogs = [...this.state.logs, event.data].slice(-1000);
      this.setState({ logs: nextLogs, connecting: false });
    };
    source.onerror = () => {
      if (this.connectingTimer) {
        clearTimeout(this.connectingTimer);
        this.connectingTimer = null;
      }
      this.setState({
        connecting: false,
        error: this.state.logs.length > 0 ? '' : formatMessage({ id: 'resourceCenter.logs.disconnected', defaultMessage: '日志流连接已断开，请刷新重试' }),
      });
      this.closeStream();
    };
    this.eventSource = source;
  };

  render() {
    const { podName, containers, title } = this.props;
    const { logs, selectedContainer, lines, connecting, autoScroll, error } = this.state;

    if (!podName) {
      return (
        <div className={styles.emptyPanel}>
          <Empty description={formatMessage({ id: 'resourceCenter.logs.noPod', defaultMessage: '当前没有可查看日志的实例' })} />
        </div>
      );
    }

    return (
      <div className={styles.logPanel}>
        <div className={styles.logToolbar}>
          <div className={styles.logTitle}>
            <Icon type="file-text" />
            <span>{title || formatMessage({ id: 'resourceCenter.common.logs' })}</span>
          </div>
          <div className={styles.logActions}>
            <Select
              value={selectedContainer}
              style={{ width: 180 }}
              size="small"
              onChange={value => this.setState({ selectedContainer: value })}
            >
              {(containers || []).map(container => (
                <Option key={container} value={container}>{container}</Option>
              ))}
            </Select>
            <Input
              value={String(lines)}
              size="small"
              style={{ width: 88 }}
              onChange={e => this.setState({ lines: Number(e.target.value) || 200 })}
            />
            <span className={styles.logSwitchLabel}>{formatMessage({ id: 'resourceCenter.logs.autoScroll', defaultMessage: '自动滚动' })}</span>
            <Switch size="small" checked={autoScroll} onChange={checked => this.setState({ autoScroll: checked })} />
            <Button size="small" onClick={this.openStream}>{formatMessage({ id: 'resourceCenter.common.refresh' })}</Button>
            <Button size="small" onClick={() => this.setState({ logs: [] })}>{formatMessage({ id: 'resourceCenter.logs.clear', defaultMessage: '清空' })}</Button>
          </div>
        </div>

        <div
          className={styles.logConsole}
          ref={ref => {
            this.logRef = ref;
          }}
        >
          {connecting && logs.length === 0 && (
            <div className={styles.logPlaceholder}>{formatMessage({ id: 'resourceCenter.logs.connecting', defaultMessage: '正在连接日志流...' })}</div>
          )}
          {!connecting && error && logs.length === 0 && (
            <div className={styles.logPlaceholder}>{error}</div>
          )}
          {logs.length > 0 && (
            <pre>{logs.join('\n')}</pre>
          )}
          {!connecting && !error && logs.length === 0 && (
            <div className={styles.logPlaceholder}>{formatMessage({ id: 'resourceCenter.logs.empty', defaultMessage: '暂无日志输出' })}</div>
          )}
        </div>
      </div>
    );
  }
}

export default PodLogStream;
