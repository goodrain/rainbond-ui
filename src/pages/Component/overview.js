/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import { Button, Card, notification } from 'antd';
import { connect } from 'dva';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import LogProcress from '../../components/LogProcress';
import { getActionLogDetail } from '../../services/app';
import appAcionLogUtil from '../../utils/app-action-log-util';
import dateUtil from '../../utils/date-util';
import globalUtil from '../../utils/global';
import LogSocket from '../../utils/logSocket';
import regionUtil from '../../utils/region';
import teamUtil from '../../utils/team';
import userUtil from '../../utils/user';
import Basic from './component/Basic/index';
import OperationRecord from './component/Basic/operationRecord';
import BuildHistory from './component/BuildHistory/index';
import Instance from './component/Instance/index';
import styles from './Index.less';

const ButtonGroup = Button.Group;

@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail
}))
class LogItem extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      status: '',
      resultStatus: '',
      opened: false,
      logType: 'info',
      logs: []
    };
  }
  static contextTypes = {
    isActionIng: PropTypes.func,
    appRolback: PropTypes.func
  };
  showLogType = () => {
    if (this.state.status === 'ing') {
      return 'none';
    }

    if (this.state.opened === false) {
      return 'none';
    }
    return '';
  };

  componentDidMount() {
    const { data } = this.props;
    if (data) {
      if (this.ref) {
        this.ref.querySelector(
          '.actioncn'
        ).innerHTML = appAcionLogUtil.getActionCN(data);
        if (appAcionLogUtil.isSuccess(data)) {
          this.onSuccess();
        }
        if (appAcionLogUtil.isFail(data)) {
          this.onFail(data);
        }
        if (appAcionLogUtil.isTimeout(data)) {
          this.onTimeout(data);
        }
        if (appAcionLogUtil.isActioning(data)) {
          this.setState({ status: 'ing' });
          this.ref.querySelector('.actionresultcn').innerHTML = <FormattedMessage id='componentOverview.body.tab.LogItem.hand'/>;
          this.context.isActionIng(true);
        }
        this.ref.querySelector(
          '.action-user'
        ).innerHTML = `@${appAcionLogUtil.getActionUser(data)}`;
      }
    }
  }

  loadLog() {
    getActionLogDetail({
      app_alias: this.props.appAlias,
      level: this.state.logType,
      team_name: globalUtil.getCurrTeamName(),
      event_id: this.props.data.event_id
    }).then(data => {
      if (data) {
        this.setState({
          logs: data.list || []
        });
      }
    });
  }
  getSocketUrl = () => {
    const currTeam = userUtil.getTeamByTeamName(
      this.props.currUser,
      globalUtil.getCurrTeamName()
    );
    const currRegionName = globalUtil.getCurrRegionName();

    if (currTeam) {
      const region = teamUtil.getRegionByName(currTeam, currRegionName);

      if (region) {
        return regionUtil.getEventWebSocketUrl(region);
      }
    }
    return '';
  };
  createSocket() {
    const { data } = this.props;
    const socketUrls = this.getSocketUrl();
    if (socketUrls) {
      const isThrough = dateUtil.isWebSocketOpen(socketUrls);
      if (isThrough && isThrough === 'through') {
        this.socket = new LogSocket({
          url: this.getSocketUrl(),
          eventId: data.event_id,
          onMessage: data => {
            const { logs } = this.state;
            logs.unshift(data);
            this.setState({
              logs: [].concat(logs)
            });
          }
        });
      }
    }
  }
  onClose = () => {
    this.isDoing = false;
  };
  onSuccess = data => {
    this.setState({ resultStatus: 'success' });
    this.ref.querySelector('.actionresultcn').innerHTML = <FormattedMessage id='componentOverview.body.tab.LogItem.complete'/>;
  };
  onTimeout = data => {
    this.setState({ resultStatus: 'timeout' });
    this.ref.querySelector('.actionresultcn').innerHTML = <FormattedMessage id='componentOverview.body.tab.LogItem.timeout'/>;

    this.ref.querySelector(
      '.action-error-msg'
    ).innerHTML = `(${appAcionLogUtil.getFailMessage(data)})`;
  };
  onFail = data => {
    this.setState({ resultStatus: 'fail' });
    this.ref.querySelector('.actionresultcn').innerHTML = <FormattedMessage id='componentOverview.body.tab.LogItem.fail'/>;

    this.ref.querySelector(
      '.action-error-msg'
    ).innerHTML = `(${appAcionLogUtil.getFailMessage(data)})`;
  };
  onComplete = data => {
    this.setState({ status: '' });
    this.context.isActionIng(false);
    this.close();
  };
  getLogContHeight() {
    const { status, opened } = this.state;
    if (status === 'ing' && !opened) {
      return 15;
    }

    if (opened) {
      return 'auto';
    }

    return 0;
  }
  open = () => {
    this.setState(
      {
        opened: true,
        logType: 'info'
      },
      () => {
        this.loadLog();
      }
    );
  };
  close = () => {
    this.setState({ opened: false });
  };
  changeLogType = type => {
    if (type === this.state.logType) {
      return;
    }
    this.setState(
      {
        logType: type,
        logs: []
      },
      () => {
        this.loadLog();
      }
    );
  };
  saveRef = ref => {
    this.ref = ref;
  };
  getResultClass() {
    const { data } = this.props;
    if (this.state.resultStatus === 'fail') {
      return styles.fail;
    }

    if (this.state.resultStatus === 'success') {
      return styles.success;
    }
    return '';
  }
  handleRollback = () => {
    this.context.appRolback(
      appAcionLogUtil.getRollbackVersion(this.props.data)
    );
  };
  render() {
    const { status, opened, logType, logs } = this.state;
    const { data } = this.props;
    const box = document.getElementById('box');
    if (!data) {
      return null;
    }

    return (
      <div
        ref={this.saveRef}
        className={`${styles.logItem} ${this.getResultClass()}`}
      >
        <div className={styles.logItemDate}>
          <span className={styles.time}>
            {appAcionLogUtil.getActionTime(data)}
          </span>
          <span className={styles.date}>
            {dateUtil.dateToCN(
              appAcionLogUtil.getActionDateTime(data),
              'yyyy-MM-dd'
            )}
          </span>
        </div>
        <div className={styles.logItemMain}>
          <div className={styles.hd}>
            <label className={styles.tit}>
              <span className="actioncn" />
              <span className="actionresultcn" />
              <span className="action-error-msg" />
              <span className="action-user" />
            </label>
            <div className={styles.btns}>
              {!opened ? (
                <span onClick={this.open} className={styles.btn}>
                  <FormattedMessage id='componentOverview.body.tab.LogItem.details'/>
                </span>
              ) : (
                <span onClick={this.close} className={styles.btn}>
                  <FormattedMessage id='componentOverview.body.tab.LogItem.put'/>
                </span>
              )}
            </div>
          </div>
          {appAcionLogUtil.isShowCommitInfo(data) ? (
            <div className={styles.codeVersion}>
              <div className={styles.versionInfo}>
                <FormattedMessage id='componentOverview.body.tab.LogItem.information'/> {appAcionLogUtil.getCommitLog(data)}
              </div>
              <div className={styles.versionAuthor}>
                #{appAcionLogUtil.getCodeVersion(data)}
                by {appAcionLogUtil.getCommitUser(data)}
              </div>
            </div>
          ) : (
            ''
          )}

          <ButtonGroup
            style={{
              display: this.showLogType()
            }}
            size="small"
            className={styles.logTypeBtn}
          >
            <Button
              onClick={() => {
                this.changeLogType('info');
              }}
              className={logType === 'info' ? 'active' : ''}
              type="dashed"
            >
              <FormattedMessage id='componentOverview.body.tab.LogItem.info'/>
            </Button>
            <Button
              onClick={() => {
                this.changeLogType('debug');
              }}
              className={logType === 'debug' ? 'active' : ''}
              type="dashed"
            >
              <FormattedMessage id='componentOverview.body.tab.LogItem.debug'/>
            </Button>
            <Button
              onClick={() => {
                this.changeLogType('error');
              }}
              className={logType === 'error' ? 'active' : ''}
              type="dashed"
            >
              <FormattedMessage id='componentOverview.body.tab.LogItem.error'/>
            </Button>
          </ButtonGroup>
          <div
            style={{
              height: this.getLogContHeight(),
              maxHeight: 350,
              overflowY: 'auto'
            }}
            className={`${styles.logContent} logs-cont`}
          >
            {/* 动态日志 */}
            {status === 'ing' ? (
              <LogProcress
                resover
                onClose={this.onClose}
                onComplete={this.onComplete}
                onSuccess={this.onSuccess}
                onTimeout={this.onTimeout}
                onFail={this.onFail}
                socketUrl={this.getSocketUrl()}
                eventId={data.event_id}
                opened={opened}
                list={this.state.logs}
              />
            ) : (
              <div>
                {logs &&
                  logs.length > 0 &&
                  logs.map((item, index) => (
                    <p key={index}>
                      <span
                        style={{
                          marginRight: 10
                        }}
                      >
                        {dateUtil.format(item.time, 'hh:mm:ss')}
                      </span>
                      <span>{item.message}</span>
                    </p>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
class LogList extends PureComponent {
  render() {
    const { list } = this.props;
    return (
      <div className={styles.logs}>
        {list.map(item => (
          <LogItem
            appDetail={this.props.appDetail}
            key={item.event_id}
            appAlias={this.props.appAlias}
            data={item}
          />
        ))}
      </div>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    appRequest: appControl.appRequest,
    appRequestRange: appControl.appRequestRange,
    requestTime: appControl.requestTime,
    requestTimeRange: appControl.requestTimeRange,
    appDisk: appControl.appDisk,
    appMemory: appControl.appMemory
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      logList: [],
      recordLoading: true,
      page: 1,
      page_size: 6,
      // 安装的性能分析插件
      disk: 0,
      memory: 0,
      resourcesLoading: true,
      beanData: null,
      dataList: [],
      runLoading: true,
      new_pods: null,
      old_pods: null,
      more: false,
      current_version: null,
      pages: 1,
      pageSize: 10,
      total: 0,
      status: '',
      isopenLog: false,
      buildSource: null,
      componentTimers: this.props.timers
    };
    this.inerval = 5000;
  }
  static contextTypes = {
    isActionIng: PropTypes.func,
    appRolback: PropTypes.func
  };
  componentDidMount() {
    this.mounted = true;
    this.loadBuildSourceInfo();
    this.fetchAppDiskAndMemory();
    this.getVersionList();
    this.load();
  }

  componentWillReceiveProps(nextProps) {
    const { status: newStatus, timers: newTimers } = nextProps;
    const { status, timers } = this.props;
    if (newStatus !== status) {
      // eslint-disable-next-line react/no-unused-state
      this.setState({ status: newStatus });
    }
    if (newTimers !== timers) {
      this.setState({ componentTimers: newTimers }, () => {
        if (newTimers) {
          this.load();
        } else {
          this.closeTimer();
        }
      });
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.closeTimer();
  }
  load = () => {
    this.fetchPods(true);
    this.fetchOperationLog(true);
  };
  closeTimer = () => {
    if (this.fetchOperationLogTimer) {
      clearInterval(this.fetchOperationLogTimer);
    }
    if (this.fetchPodsTimer) {
      clearInterval(this.fetchPodsTimer);
    }
  };

  fetchAppDiskAndMemory() {
    this.props.dispatch({
      type: 'appControl/getAppResource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data && data.bean) {
          this.setState({
            disk: data.bean.disk || 0,
            memory: data.bean.memory || 0
          });
        }
        this.handleResourcesLoading();
      },
      handleError: err => {
        this.handleResourcesLoading();
        this.handleError(err);
      }
    });
  }
  handleResourcesLoading = () => {
    this.setState({
      resourcesLoading: false
    });
  };

  fetchOperationLog = (isCycle, isopenLog = false) => {
    this.props.dispatch({
      type: 'appControl/fetchOperationLog',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        target: 'service',
        page: this.state.page,
        page_size: this.state.page_size
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              isopenLog,
              has_next: res.has_next || false,
              logList: res.list || [],
              recordLoading: false
            },
            () => {
              if (isCycle) {
                this.handleTimers(
                  'fetchOperationLogTimer',
                  () => {
                    this.fetchOperationLog(true);
                  },
                  5000
                );
              }
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          'fetchOperationLogTimer',
          () => {
            this.fetchOperationLog(true);
          },
          10000
        );
      }
    });
  };

  handleError = err => {
    const { componentTimers } = this.state;
    if (!componentTimers) {
      return null;
    }
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: formatMessage({id:'notification.warn.error'}),
        description: err.data.msg_show
      });
    }
  };
  handleTimers = (timerName, callback, times) => {
    const { componentTimers } = this.state;
    if (!componentTimers) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };

  handleNextPage = () => {
    this.setState(
      {
        page: 1,
        page_size: this.state.page_size * (this.state.page + 1)
      },
      () => {
        this.fetchOperationLog(false);
      }
    );
  };
  getStartTime() {
    return new Date().getTime() / 1000 - 60 * 60;
  }
  getStep() {
    return 60;
  }

  handleRollback = data => {
    this.context.appRolback(data);
  };

  onAction = action => {
    this.fetchOperationLog(false);
    this.getVersionList();
  };
  onLogPush = isopen => {
    this.fetchOperationLog(false, isopen);
  };

  handleDel = item => {
    this.props.dispatch({
      type: 'appControl/delAppVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias,
        version_id: item.build_version
      },
      callback: res => {
        if (res) {
          notification.success({
            message: formatMessage({id:'notification.success.delete'})
          });
          this.getVersionList();
        }
      }
    });
  };
  onPageChange = pages => {
    this.setState(
      {
        pages
      },
      () => {
        this.getVersionList();
      }
    );
  };
  onShowSizeChange = (pages, pageSize) => {
    this.setState(
      {
        pages,
        pageSize
      },
      () => {
        this.getVersionList();
      }
    );
  };
  getVersionList = update => {
    const { setShowUpgrade, appAlias, dispatch } = this.props;
    update && setShowUpgrade();

    const { pages, pageSize } = this.state;
    dispatch({
      type: 'appControl/getAppVersionList',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: appAlias,
        page_num: pages,
        page_size: pageSize
      },
      callback: data => {
        if (data && data.bean && data.list) {
          // eslint-disable-next-line no-shadow
          const { bean, list, total = 0 } = data;
          let beanobj = null;
          list.length > 0 &&
            list.map(item => {
              if (item.build_version === bean.current_version) {
                beanobj = item;
              }
            });
          this.setState({
            current_version: bean.current_version,
            beanData: beanobj,
            dataList: list,
            // eslint-disable-next-line react/no-unused-state
            total
          });
        }
      }
    });
  };

  loadBuildSourceInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/getAppBuidSource',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({
            buildSource:
              data.bean && data.bean.service_source && data.bean.service_source
          });
        }
      }
    });
  };

  fetchPods = isCycle => {
    const { appAlias, dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              new_pods: res.list.new_pods,
              old_pods: res.list.old_pods,
              runLoading: false
            },
            () => {
              if (isCycle) {
                this.handleTimers(
                  'fetchPodsTimer',
                  () => {
                    this.fetchPods(true);
                  },
                  5000
                );
              }
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          'fetchPodsTimer',
          () => {
            this.fetchPods(true);
          },
          10000
        );
      }
    });
  };

  handleMore = more => {
    this.setState({
      more
    });
  };

  render() {
    const { status, componentPermissions, socket, appDetail, method } = this.props;
    const {
      resourcesLoading,
      logList,
      memory,
      beanData,
      dataList,
      new_pods,
      old_pods,
      runLoading,
      more,
      disk,
      buildSource,
      isopenLog,
      recordLoading,
      has_next,
      current_version,
      pages,
      pageSize,
      total
    } = this.state;
    return (
      <Fragment>
        <Basic
          isThird={appDetail && appDetail.is_third}
          buildSource={buildSource}
          beanData={beanData}
          resourcesLoading={resourcesLoading}
          memory={memory}
          disk={disk}
          dataList={dataList}
          status={status}
          onPageChange={this.onPageChange}
          handleMore={this.handleMore}
          more={more}
          socket={socket && socket}
          method={method}
        />
        
        {more && (
          <BuildHistory
            componentPermissions={componentPermissions}
            beanData={beanData}
            current_version={current_version}
            dataList={dataList}
            onPageChange={this.onPageChange}
            onShowSizeChange={this.onShowSizeChange}
            handleDel={this.handleDel}
            onRollback={this.handleRollback}
            socket={socket && socket}
            pages={pages}
            pageSize={pageSize}
            total={total}
          />
        )}
        {!more && (
          <Card
            // bordered={0}
            loading={runLoading}
            title={<FormattedMessage id='componentOverview.body.tab.overview.instance.title'/>}
            style={{ margin: '20px 0', minHeight: '170px' }}
            bodyStyle={{ padding: '0', background: '#F0F2F5' }}
          >
            <Instance
              status={status}
              runLoading={runLoading}
              new_pods={new_pods}
              old_pods={old_pods}
              appAlias={this.props.appAlias}
              socket={socket && socket}
              podType={appDetail && appDetail.service && appDetail.service.extend_method}
            />
          </Card>
        )}
        {!more && (
          <OperationRecord
            socket={socket && socket}
            isopenLog={isopenLog}
            onLogPush={this.onLogPush}
            has_next={has_next}
            logList={logList}
            recordLoading={recordLoading}
            handleNextPage={this.handleNextPage}
          />
        )}
      </Fragment>
    );
  }
}
