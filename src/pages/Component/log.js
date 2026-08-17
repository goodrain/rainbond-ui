import { Button, Card, Cascader, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import axios from 'axios';
import React, { Fragment, PureComponent, memo } from 'react';
import Ansi from '../../components/Ansi/index';
import NoPermTip from '../../components/NoPermTip';
import { getContainerLog, getServiceLog } from '../../services/app';
import appUtil from '../../utils/app';
import globalUtil from '../../utils/global';
import HistoryLog from './component/Log/history';
import {
  buildRuntimeLogReplayBudget,
  rememberRuntimeLogMessage,
  shouldAppendRuntimeLogMessage
} from './runtimeLogReplayHelpers';
import apiconfig from '../../../config/api.config';
import styles from './Log.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import PulginUtiles from '../../utils/pulginUtils'


const { Option } = Select;

@connect(
  ({ user, teamControl, kubeblocks }) => ({
    currUser: user.currentUser,
    pluginList: teamControl.pluginsList,
    clusterDetail: kubeblocks.clusterDetail
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  formRef = React.createRef();
  boxRef = React.createRef();
  constructor(arg) {
    super(arg);
    this.state = {
      containerLog: [],
      logs: [],
      instances: [],
      started: true,
      showHistoryLog: false,
      showHighlighted: '',
      filter: '',
      pod_name: '',
      container_name: '',
      refreshValue: 5,
      messages: [],
      isHistoryLogs: false,
      lokiUrl: '',
      previousPodNames: []
    };
    this.eventSources = {};
    this.runtimeLogReplayBudgets = {};
    this.recentRuntimeLogMessages = [];
    this.messageBuffer = [];
    this.batchUpdateTimer = null;
    this.MAX_LOGS = 1000;
    this.unmounted = false;
  }
  componentDidMount() {
    if (!this.canView()) return;

    const { appDetail, dispatch, appAlias } = this.props;
    const isKubeBlocks = appDetail?.service?.extend_method === 'kubeblocks_component';

    // KubeBlocks component，获取 clusterDetail
    if (isKubeBlocks) {
      dispatch({
        type: 'kubeblocks/getClusterDetail',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: appAlias
        }
      });
    }

    this.fetchInstanceInfo();


    this.setState({
      isHistoryLogs: PulginUtiles.isInstallPlugin(this.props.pluginList, 'rainbond-enterprise-logs'),
    });

    this.intervalTimer = setInterval(() => {
      this.fetchInstanceInfo();

      if (isKubeBlocks) {
        dispatch({
          type: 'kubeblocks/getClusterDetail',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            service_alias: appAlias
          }
        });
      }
    }, 5000);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.boxRef.current &&
      prevState.logs.length !== this.state.logs.length &&
      this.state.showHighlighted === ''
    ) {
      this.boxRef.current.scrollTop = this.boxRef.current.scrollHeight;
    }
  }
  componentWillUnmount() {
    this.unmounted = true;
    if (this.eventSources) {
      this.closeAllEventSources();
    }
    this.closeTimer();
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
    }
  }

  initializeEventSources(pods, lines) {
    this.closeAllEventSources();
    const { appAlias, regionName, teamName } = this.props;
    pods.forEach(pod => {
      if (pod.pod_name) {
        const podName = pod.pod_name;
        const url = `/console/sse/v2/tenants/${teamName}/services/${appAlias}/pods/${podName}/logs?region_name=${regionName}&lines=${lines}`;
        const eventSource = new EventSource(url, { withCredentials: true });
        this.eventSources[podName] = eventSource;
        eventSource.onopen = () => {
          if (this.eventSources[podName] !== eventSource) {
            return;
          }
          this.runtimeLogReplayBudgets[podName] = buildRuntimeLogReplayBudget(
            this.recentRuntimeLogMessages,
            podName,
            lines
          );
        };
        eventSource.onmessage = event => {
          if (this.eventSources[podName] !== eventSource) {
            return;
          }
          const newMessage = event.data;
          if (
            !shouldAppendRuntimeLogMessage(
              newMessage,
              this.runtimeLogReplayBudgets[podName]
            )
          ) {
            return;
          }
          rememberRuntimeLogMessage(
            this.recentRuntimeLogMessages,
            podName,
            newMessage,
            this.MAX_LOGS
          );
          this.messageBuffer.push(newMessage);
          this.debouncedBatchUpdate();
        };
        eventSource.onerror = (error) => {
          if (this.eventSources[podName] !== eventSource) {
            return;
          }
          console.error(`${podName} EventSource failed:`, error);
        };
      }
    });
  }

  closeEventSource(podsName) {
    const eventSource = this.eventSources[podsName];
    if (eventSource) {
      eventSource.onopen = null;
      eventSource.onmessage = null;
      eventSource.onerror = null;
      eventSource.close();
      delete this.eventSources[podsName];
    }
    delete this.runtimeLogReplayBudgets[podsName];
  }

  closeAllEventSources() {
    if (this.eventSources) {
      Object.keys(this.eventSources).forEach(podsName => {
        this.closeEventSource(podsName);
      });
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
      const updatedLogs = [...prevState.logs, ...newMessages];
      if (updatedLogs.length > this.MAX_LOGS) {
        return { logs: updatedLogs.slice(-this.MAX_LOGS) };
      }
      return { logs: updatedLogs };
    });
  };

  comparePodNames = (currentPodNames, previousPodNames) => {
    if (currentPodNames.length !== previousPodNames.length) {
      return false;
    }

    const sortedCurrent = [...currentPodNames].sort();
    const sortedPrevious = [...previousPodNames].sort();

    return sortedCurrent.every((name, index) => name === sortedPrevious[index]);
  };

  fetchInstanceInfo = () => {
    const { dispatch, appAlias, appDetail, clusterDetail } = this.props;
    const isKubeBlocks = appDetail?.service?.extend_method === 'kubeblocks_component';

    dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: res => {
        if (this.unmounted) {
          return;
        }
        let list = [];
        if (res && res.list) {
          const new_pods =
            (res.list.new_pods &&
              res.list.new_pods.length &&
              res.list.new_pods) ||
            [];
          const old_pods =
            (res.list.old_pods &&
              res.list.old_pods.length &&
              res.list.old_pods) ||
            [];
          list = [...new_pods, ...old_pods];
        }

        if (list && list.length > 0) {
          list.map(item => {
            item.name = `实例：${item.pod_name}`;
            item.container.map(items => {
              items.name = `容器：${items.container_name}`;
            });
          });
        }

        if (isKubeBlocks && clusterDetail && clusterDetail.basic && clusterDetail.basic.replicas) {
          const replicas = clusterDetail.basic.replicas;
          list = replicas.map(replica => {
            // 从 replica.containers 提取容器信息并转换格式
            const containers = (replica.containers || []).map(container => ({
              container_name: container.name,
              name: `容器：${container.name}`
            }));

            return {
              pod_name: replica.name,
              name: `实例：${replica.name}`,
              pod_status: replica.status,
              ready: replica.ready,
              container: containers
            };
          });
        }

        list.push({
          name: formatMessage({ id: 'componentOverview.body.tab.log.allLogs' })
        });

        const currentPodNames = list
          .filter(item => item.pod_name)
          .map(item => item.pod_name);

        const { previousPodNames } = this.state;
        const podsChanged = !this.comparePodNames(currentPodNames, previousPodNames);

        this.setState({
          instances: list,
          previousPodNames: currentPodNames
        }, () => {
          if (podsChanged) {
            const { instances, started, pod_name, filter } = this.state;
            this.closeAllEventSources();
            if (started && !pod_name && filter === '') {
              this.initializeEventSources(instances, 100);
            }
          }
        });
      }
    });
  };


  canView() {
    return appUtil.canManageAppLog(this.props.appDetail);
  }
  handleStop = () => {
    this.setState({ started: false });
    if (this.eventSources) {
      this.closeAllEventSources();
    }
  };
  handleStart = () => {
    const { instances } = this.state;
    this.setState({ started: true });
    this.initializeEventSources(instances, 100);
  };
  onChangeCascader = value => {
    const { instances } = this.state;
    if (value && value.length > 1) {
      this.setState(
        {
          pod_name: value[0].slice(3),
          container_name: value[1].slice(3)
        },
        () => {
          this.closeTimer();
          this.closeAllEventSources();
          this.fetchContainerLog();
        }
      );
    } else {
      this.setState(
        {
          pod_name: '',
          container_name: '',
          containerLog: []
        },
        () => {
          this.closeTimer();
          this.initializeEventSources(instances, 100);
        }
      );
    }
  };

  hanleTimer = () => {
    const { refreshValue } = this.state;
    this.closeTimer();
    if (!refreshValue) {
      return null;
    }
    this.timer = setTimeout(() => {
      this.fetchContainerLog();
    }, refreshValue * 1000);
  };

  closeTimer = () => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  fetchContainerLog = () => {
    const { pod_name, container_name } = this.state;
    getContainerLog({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      pod_name,
      container_name
    }).then(data => {
      if (
        this.unmounted ||
        this.state.pod_name !== pod_name ||
        this.state.container_name !== container_name
      ) {
        return;
      }
      if (
        data &&
        data.status_code &&
        data.status_code === 200 &&
        data.response_data
      ) {
        const raw = typeof data.response_data === 'string'
          ? data.response_data
          : (data.response_data.data || '');
        const arr = typeof raw === 'string' ? raw.split('\n') : [];
        this.setState(
          {
            containerLog: arr || []
          },
          () => {
            if (
              !this.unmounted &&
              this.state.pod_name === pod_name &&
              this.state.container_name === container_name
            ) {
              this.hanleTimer();
            }
          }
        );
      }
    });
  };

  onFinish = value => {
    this.setState({ filter: value }, () => {
      const { logs } = this.state;
      if (value === '') {
        this.handleStart();
      } else {
        this.closeAllEventSources();
        this.setLogs(logs);
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
    if (newlogs.length > 5000) {
      newlogs = newlogs.slice(logs.length - 5000, logs.length);
    }
    if (!podName) {
      this.recentRuntimeLogMessages = [];
      this.runtimeLogReplayBudgets = {};
    }
    const updateInfo = podName ? { containerLog: newlogs } : { logs: newlogs };
    this.setState(updateInfo);
  };

  showHistoryLogs = () => {
    this.setState({ showHistoryLog: true });
  };

  hideHistoryLogs = () => {
    this.setState({ showHistoryLog: false });
  };

  handleHighlightClick = (highlightId) => {
    const { showHighlighted } = this.state;
    this.setState({
      showHighlighted: showHighlighted === highlightId ? '' : highlightId
    });
  };

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { appAlias } = this.props;
    const {
      logs,
      pod_name,
      containerLog,
      showHighlighted,
      instances,
      started,
      showHistoryLog,
      lokiUrl
    } = this.state;
    return (
      <div className={styles.logContainer}>
        <div className={styles.logHeader}>
          <div className={styles.logHeaderLeft}>
            <div className={styles.logStatus}>
              <span className={`${styles.statusDot} ${started ? styles.statusActive : styles.statusInactive}`} />
              <span className={styles.statusText}>
                {started
                  ? <FormattedMessage id='componentOverview.body.tab.log.streaming' defaultMessage="实时推送中" />
                  : <FormattedMessage id='componentOverview.body.tab.log.paused' defaultMessage="已暂停" />
                }
              </span>
            </div>
            {started ? (
              <Button type="default" size="small" onClick={this.handleStop} className={styles.controlBtn}>
                <FormattedMessage id='componentOverview.body.tab.log.push' />
              </Button>
            ) : (
              <Button type="primary" size="small" onClick={this.handleStart} className={styles.controlBtn}>
                <FormattedMessage id='componentOverview.body.tab.log.startPushing' />
              </Button>
            )}
          </div>
          <div className={styles.logHeaderRight}>
            {this.state.isHistoryLogs && (
              <Button type="link" onClick={this.showHistoryLogs} className={styles.historyBtn}>
                <FormattedMessage id='componentOverview.body.tab.log.history' />
              </Button>
            )}
          </div>
        </div>

        <div className={styles.logToolbar}>
          <div className={styles.toolbarItem}>
            <span className={styles.toolbarLabel}>
              <FormattedMessage id='componentOverview.body.tab.log.text' />
            </span>
            <Input.Search
              className={styles.searchInput}
              placeholder={formatMessage({ id: 'componentOverview.body.tab.log.filtertext' })}
              onSearch={this.onFinish}
              allowClear
            />
          </div>
          <div className={styles.toolbarItem}>
            <span className={styles.toolbarLabel}>
              <FormattedMessage id='componentOverview.body.tab.log.container' />
            </span>
            <Cascader
              className={styles.cascaderInput}
              defaultValue={[`${formatMessage({ id: 'componentOverview.body.tab.log.allLogs' })}`]}
              fieldNames={{
                label: 'name',
                value: 'name',
                children: 'container'
              }}
              options={instances}
              onChange={this.onChangeCascader}
              placeholder={formatMessage({ id: 'componentOverview.body.tab.log.select' })}
            />
          </div>
        </div>

        <div className={styles.logContent}>
          <div className={styles.logsss} ref={this.boxRef}>
            {(containerLog &&
              containerLog.length > 0 &&
              containerLog.map((item, index) => {
                return (
                  <LogItem
                    key={index}
                    item={item}
                    index={index}
                    isContainer={true}
                  />
                );
              })) ||
              (logs &&
                logs.length > 0 &&
                logs.map((log, index) => {
                  return (
                    <LogItem
                      key={index}
                      log={log}
                      index={index}
                      logs={logs}
                      showHighlighted={showHighlighted}
                      onHighlightClick={this.handleHighlightClick}
                      isContainer={false}
                    />
                  );
                }))}
          </div>
        </div>

        {showHistoryLog && (
          <HistoryLog onCancel={this.hideHistoryLogs} appAlias={appAlias} url={lokiUrl} />
        )}
      </div>
    );
  }
}

const LogItem = memo(({ item, log, index, logs, showHighlighted, onHighlightClick, isContainer }) => {
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
  const highlightId = log.substring(colonIndex - 12, colonIndex);
  const isHighlighted = showHighlighted === highlightId;
  const logContent = log.substring(colonIndex + 1, log.length);
  const logPrefix = log.substring(0, colonIndex);

  const shouldShowPrefix = logs.length === 1 ||
    (index >= 1 &&
     highlightId !== logs[index - 1]?.substring(
       logs[index - 1].indexOf(':') - 12,
       logs[index - 1].indexOf(':')
     ));

  return (
    <div>
      <span style={{ color: isHighlighted ? '#FFFF91' : '#666666' }}>
        <span>{log === '' ? '' : `${index + 1}`}</span>
      </span>
      <span style={{ color: isHighlighted ? '#FFFF91' : '#FFF' }}>
        <Ansi>{logContent}</Ansi>
      </span>
      {shouldShowPrefix && (
        <span
          style={{
            color: isHighlighted ? '#FFFF91' : '#bbb',
            cursor: 'pointer',
            backgroundColor: highlightId ? '#666' : ''
          }}
          onClick={() => onHighlightClick(highlightId)}
        >
          <Ansi>{logPrefix}</Ansi>
        </span>
      )}
    </div>
  );
});
