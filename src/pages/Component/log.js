/* eslint-disable react/sort-comp */
/* eslint-disable react/no-array-index-key */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-string-refs */
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
import apiconfig from '../../../config/api.config';
import styles from './Log.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PulginUtiles from '../../utils/pulginUtils'


const { Option } = Select;

@connect(
  ({ user, teamControl }) => ({
    currUser: user.currentUser,
    pluginList: teamControl.pluginsList
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  formRef = React.createRef();
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
    this.messageBuffer = [];
    this.batchUpdateTimer = null;
    this.MAX_LOGS = 1000;
  }
  componentDidMount() {
    if (!this.canView()) return;
    this.fetchInstanceInfo();
    this.setState({
      // 历史日志展示
      isHistoryLogs: PulginUtiles.isInstallPlugin(this.props.pluginList,'rainbond-enterprise-base'),
    },()=>{
      if(this.state.isHistoryLogs){
        this.props.pluginList.forEach(item =>{
          if(item.name == 'rainbond-enterprise-base'){            
            this.setState({
              lokiUrl: item.backend
            })
          }
        })        
      }
    });
    
    // 设置定时器每5秒执行fetchInstanceInfo
    this.intervalTimer = setInterval(() => {
      this.fetchInstanceInfo();
    }, 5000);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.refs.box &&
      prevState.logs.length !== this.state.logs.length &&
      this.state.showHighlighted === ''
    ) {
      this.refs.box.scrollTop = this.refs.box.scrollHeight;
    }
  }
  componentWillUnmount() {
    if (this.eventSources) {
      this.closeAllEventSources();
    }
    // 清理定时器
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
    }
  }

  initializeEventSources(pods, lines) {
    const { appAlias, regionName, teamName } = this.props;
    pods.forEach(pod => {
      if (pod.pod_name) {
        const url = `/console/sse/v2/tenants/${teamName}/services/${appAlias}/pods/${pod.pod_name}/logs?region_name=${regionName}&lines=${lines}`;
        this.eventSources[pod.pod_name] = new EventSource(url, { withCredentials: true });
        this.eventSources[pod.pod_name].onmessage = (event) => {
          const newMessage = event.data;
          this.messageBuffer.push(newMessage);
          this.debouncedBatchUpdate();
        };
        this.eventSources[pod.pod_name].onerror = (error) => {
          console.error(`${pod.pod_name} EventSource failed:`, error);
          this.closeEventSource(pod.pod_name); // 出错时关闭EventSource实例
        };
      }
    });
  }

  closeEventSource(podsName) {
    if (this.eventSources[podsName]) {
      this.eventSources[podsName].close();
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

  // 比较两个pod_name数组是否相同
  comparePodNames = (currentPodNames, previousPodNames) => {
    if (currentPodNames.length !== previousPodNames.length) {
      return false;
    }
    
    const sortedCurrent = [...currentPodNames].sort();
    const sortedPrevious = [...previousPodNames].sort();
    
    return sortedCurrent.every((name, index) => name === sortedPrevious[index]);
  }

  fetchInstanceInfo = () => {
    const { dispatch, appAlias } = this.props;
    dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: res => {
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
        list.push({
          name: formatMessage({ id: 'componentOverview.body.tab.log.allLogs' }),
        });

        // 提取当前的pod_name数组
        const currentPodNames = list
          .filter(item => item.pod_name)
          .map(item => item.pod_name);
        
        const { previousPodNames } = this.state;
        
        // 比较pod_name是否发生变化
        const podsChanged = !this.comparePodNames(currentPodNames, previousPodNames);

        this.setState({
          instances: list,
          previousPodNames: currentPodNames
        }, () => {
          // 只有当pod_name发生变化时才重新初始化EventSources
          if (podsChanged) {
            const { instances } = this.state;
            this.closeAllEventSources();
            this.initializeEventSources(instances, 100);
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
      this.closeAllEventSources()
    }
  };
  handleStart = () => {
    const { instances } = this.state
    this.setState({ started: true });
    this.initializeEventSources(instances, 100)
  };
  onChangeCascader = value => {
    const { instances } = this.state
    if (value && value.length > 1) {
      this.setState(
        {
          pod_name: value[0].slice(3),
          container_name: value[1].slice(3)
        },
        () => {
          this.fetchContainerLog();
          this.closeEventSource()
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
          this.initializeEventSources(instances, 100)
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
      clearInterval(this.timer);
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
        data &&
        data.status_code &&
        data.status_code === 200 &&
        data.response_data
      ) {
        const arr = data.response_data.split('\n');
        this.setState(
          {
            containerLog: arr || []
          },
          () => {
            this.hanleTimer();
          }
        );
      }
    });
  };

  onFinish = value => {
    this.setState({ filter: value }, () => {
      const { logs, pod_name: podName } = this.state;
      if (value === '') {
        this.handleStart()
      } else {
        this.closeAllEventSources()
        this.setLogs(logs);
      }
    });
  };
  setLogs = logs => {
    const { filter, pod_name: podName } = this.state;
    let newlogs = logs;
    newlogs = logs.filter(item => {
      if (filter == '' || item.indexOf(filter) != -1) {
        return true;
      }
      return false;
    });
    newlogs = newlogs.map(item => {
      if (item.indexOf(filter) != -1) {
        const newitem = item.replace(filter, `\x1b[33m${filter}\x1b[0m`);
        return newitem;
      }
      return item;
    });
    if (newlogs.length > 5000) {
      newlogs = newlogs.slice(logs.length - 5000, logs.length);
    }
    const upDataInfo = podName ? { containerLog: newlogs } : { logs: newlogs };
    this.setState(upDataInfo);
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
    const { appAlias, regionName, teamName } = this.props;
    const {
      logs,
      pod_name,
      containerLog,
      showHighlighted,
      instances,
      started,
      refreshValue,
      showHistoryLog,
      messages,
      lokiUrl
    } = this.state;
    return (
      <Card
        title={
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
        }
        extra={
          <Fragment>
            {this.state.isHistoryLogs && <a onClick={this.showHistoryLogs}>
              {/* 历史日志 */}
              <FormattedMessage id='componentOverview.body.tab.log.history' />
            </a>}
          </Fragment>
        }
      >
        <Form layout="inline" name="logFilter" style={{ marginBottom: '16px' }}>
          <Form.Item
            name="filter"
            label={<FormattedMessage id='componentOverview.body.tab.log.text' />}
            style={{ marginRight: '10px' }}
          >
            <Input.Search
              style={{ width: '300px' }}
              // placeholder="请输入过滤文本"
              placeholder={formatMessage({ id: 'componentOverview.body.tab.log.filtertext' })}
              onSearch={this.onFinish}
            />
          </Form.Item>
          <Form.Item
            name="container"
            label={<FormattedMessage id='componentOverview.body.tab.log.container' />}
            style={{ marginRight: '10px' }}
            className={styles.podCascader}
          >
            <Cascader
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
          </Form.Item>
        </Form>
        <div className={styles.logsss} ref="box">
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
        {showHistoryLog && (
          <HistoryLog onCancel={this.hideHistoryLogs} appAlias={appAlias} url={lokiUrl} />
        )}
      </Card>
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
