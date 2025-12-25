/* eslint-disable camelcase */
import { Card, Col, Form, Icon, Row, Tooltip, Modal, Spin } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { routerRedux } from 'dva/router';
import globalUtil from '../../../../utils/global';
import LogShow from '../LogShow';
import styles from './operation.less';
// eslint-disable-next-line import/first
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      logVisible: false,
      selectEventID: '',
      showSocket: false,
      isLoadingMore: false
    };
    this.sentinelRef = React.createRef();
    this.observer = null;
    this.debounceTimer = null;
  }

  componentDidMount() {
    this.setupObserver();
  }

  componentDidUpdate(prevProps) {
    const { logList, has_next } = this.props;
    // 当列表数据更新后，重置加载状态并重新设置观察器
    if (prevProps.logList !== logList) {
      if (this.state.isLoadingMore) {
        this.setState({ isLoadingMore: false });
      }
      // 数据更新后重新设置观察器
      setTimeout(() => this.setupObserver(), 100);
    }
    // 当 has_next 变化时重新设置观察器
    if (prevProps.has_next !== has_next) {
      this.setupObserver();
    }
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // 设置 IntersectionObserver
  setupObserver = () => {
    const { has_next } = this.props;

    // 清除旧的观察器
    if (this.observer) {
      this.observer.disconnect();
    }

    // 如果没有更多数据，不需要观察
    if (!has_next || !this.sentinelRef.current) return;

    this.observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    this.observer.observe(this.sentinelRef.current);
  };

  // 防抖加载更多
  loadMore = () => {
    const { has_next, handleNextPage } = this.props;
    const { isLoadingMore } = this.state;

    if (!has_next || isLoadingMore) return;

    // 防抖处理
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.setState({ isLoadingMore: true });
      if (handleNextPage) {
        handleNextPage();
      }
    }, 200);
  };

  handleMore = () => {
    const { handleMore } = this.props;
    if (handleMore) {
      handleMore(true);
    }
  };

  showLogModal = (event_id, showSocket, opt_type = '') => {
    const { isopenLog, onLogPush } = this.props;
    if (
      opt_type === 'AbnormalExited' ||
      opt_type === 'EventTypeAbnormalExited' ||
      opt_type === 'CrashLoopBackOff'
    ) {
      this.props.dispatch(
        routerRedux.push(
          // `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${globalUtil.getComponentID()}/log`
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${globalUtil.getSlidePanelComponentID()}&tab=log`
        )
      );
    } else if (isopenLog && onLogPush) {
      onLogPush(false);
    }
    this.setState({
      logVisible: true,
      selectEventID: event_id,
      showSocket
    });
  };

  handleCancel = () => {
    this.setState({
      logVisible: false
    });
  };

  showUserName = UserName => {
    if (UserName === 'system') {
      return (
        <FormattedMessage id="componentOverview.body.tab.overview.handle.system" />
      );
    }
    if (UserName) {
      return `@${UserName}`;
    }
    return '';
  };
  jumpExpansion = (bool = false, service_alias) => {
    if (!bool) {
      this.props.dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${globalUtil.getSlidePanelComponentID()}&tab=expansion`
        )
      );
    } else {
      this.props.dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${service_alias}&tab=overview`
        )
      );
    }
  };
  jumpMessage = (val, bool) => {
    const regex = /\[([\s\S]*)\]/;
    const match = val.match(regex);
    const msgregex = /(.+)(?=\[)/;
    const message = val.match(msgregex);
    const messageText = message?.[1] || '';

    if (bool) {
      return messageText;
    }

    let arr = [];
    if (match && match.length > 1) {
      arr = JSON.parse(match[0]);
    }

    if (!arr || arr.length === 0) {
      return <>({messageText})</>;
    }

    if (arr.length > 3) {
      return (
        <>
          ({messageText}
          <span
            style={{ color: '#3296fa', cursor: 'pointer' }}
            onClick={() => this.showJumpModal(arr)}
          >
            {formatMessage({ id: 'componentOverview.body.tab.overview.handle.Dependent' })}
          </span>
          )
        </>
      );
    }

    return (
      <>
        ({messageText}
        {arr.map((item, index) => (
          <span
            key={index}
            style={{ color: '#3296fa', cursor: 'pointer' }}
            onClick={() => this.jumpExpansion(true, item.service_alias)}
          >
            {item.service_cname}
          </span>
        ))}
        )
      </>
    );
  };
  showJumpModal = (arr) => {
    this.setState({
      showModal: true,
      showModalArr: arr
    });
  };

  hideModal = () => {
    this.setState({
      showModal: false
    });
  };
  render() {
    const { logList, has_next, recordLoading, isopenLog } = this.props;
    const { logVisible, selectEventID, showSocket, showModalArr, showModal, isLoadingMore } = this.state;
    let showLogEvent = '';
    const statusMap = {
      success: 'logpassed',
      timeout: 'logcanceled',
      failure: 'logfailed'
    };
    return (
      <Card
      title={<FormattedMessage id='componentOverview.body.tab.overview.handle.operationRecord'/>}
      loading={recordLoading}
      className={styles.operationCard}
      >
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            {logList &&
              logList.map(item => {
                const {
                  status,
                  final_status,
                  user_name,
                  opt_type,
                  reason,
                  message,
                  end_time,
                  syn_type,
                  event_id,
                  create_time
                } = item;
                if (
                  isopenLog &&
                  final_status === '' &&
                  opt_type &&
                  opt_type.indexOf('build') > -1 &&
                  showLogEvent === ''
                ) {
                  showLogEvent = event_id;
                }
                const UserNames = this.showUserName(user_name);
                const Messages = globalUtil.fetchMessageLange(message, status, opt_type);
                return (
                  <div
                    key={event_id}
                    className={`${styles.loginfo} ${
                      styles[statusMap[status] || 'logfored']
                    }`}
                  >
                    <Tooltip
                      title={moment(create_time)
                        .locale('zh-cn')
                        .format('YYYY-MM-DD HH:mm:ss')}
                    >
                      <div
                        style={{ wordBreak: 'break-word', lineHeight: '16px' }}
                      >
                        {globalUtil.fetchdayTime(create_time)}
                      </div>
                    </Tooltip>

                    <div>
                      <Tooltip title={ opt_type === 'INITIATING' ? this.jumpMessage(message,true): Messages}>
                        <span
                          style={{
                            color: globalUtil.fetchAbnormalcolor(opt_type)
                          }}
                        >
                          {globalUtil.fetchStateOptTypeText(opt_type)}
                          &nbsp;
                        </span>
                        {globalUtil.fetchOperation(final_status, status)}
                        &nbsp;

                        {status === 'failure' && globalUtil.fetchReason(reason)}


                        {status === 'failure' &&
                        <Tooltip
                          title={message}
                        >
                          <span style={{color:'#A8A8A8'}}>
                            ({message})
                          </span>
                        </Tooltip>
                        }

                      </Tooltip>
                    </div>
                    <div className={styles.nowarpText}>
                      <span>
                        <Tooltip title={UserNames}>{UserNames}</Tooltip>
                      </span>
                    </div>
                    <div>
                      <span className={styles.alcen}>
                        {end_time &&
                          create_time &&
                          globalUtil.fetchSvg('runTime')}
                        <span>
                          {end_time && create_time
                            ? globalUtil.fetchTime(
                                new Date(end_time).getTime()
                                  ? new Date(end_time).getTime() -
                                      new Date(create_time).getTime()
                                  : ''
                              )
                            : ''}
                        </span>
                      </span>
                    </div>
                      {/* <div style={{ position: 'static' }} className="table-wrap">
                      { opt_type !== 'Unschedulable' && opt_type !== 'INITIATING' &&
                      syn_type === 0 && (
                        <Tooltip
                          visible={final_status === ''}
                          placement="top"
                          arrowPointAtCenter
                          autoAdjustOverflow={false}
                            title={
                              <FormattedMessage id="componentOverview.body.tab.overview.handle.lookLog" />
                            }
                            getPopupContainer={() =>
                              document.querySelector('.table-wrap')
                            }
                          >
                          <div
                            style={{
                              width: '16px'
                            }}
                            onClick={() => {
                              this.showLogModal(event_id, final_status === '', opt_type);
                            }}
                          >
                            {globalUtil.fetchSvg('logs', status === 'failure' && opt_type === 'build-service' ? '#CE0601':'#cccccc')}
                          </div>
                        </Tooltip>
                      )
                    }
                    </div> */}
                  </div>
                );
              })}
            {showLogEvent && this.showLogModal(showLogEvent, true)}
            {!logList ||
              (logList && logList.length === 0 && (
                <div
                  style={{
                    background: '#fff',
                    paddingBottom: '10px',
                    textAlign: 'center'
                  }}
                >
                  <FormattedMessage id='componentOverview.body.tab.overview.handle.handler'/>
                </div>
              ))}
            {/* 哨兵元素：当滚动到这里时触发加载更多 */}
            {has_next && (
              <div
                ref={this.sentinelRef}
                style={{ height: 1, marginBottom: 10 }}
              />
            )}
            {isLoadingMore && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <Spin size="small" />
              </div>
            )}
            {/* 已到底提示 */}
            {!has_next && logList && logList.length > 0 && (
              <div style={{ textAlign: 'center', padding: '10px 0', color: '#999', fontSize: 12 }}>
                <FormattedMessage id="componentOverview.body.tab.overview.handle.noMore" defaultMessage="没有更多了" />
              </div>
            )}
          </Col>
        </Row>
        {logVisible && (
          <LogShow
            title={<FormattedMessage id='componentOverview.body.tab.overview.handle.log'/>}
            width="90%"
            onOk={this.handleCancel}
            onCancel={this.handleCancel}
            showSocket={showSocket}
            EventID={selectEventID}
            socket={this.props.socket}
          />
        )}
        <Modal
          title={formatMessage({id:'componentOverview.body.tab.overview.handle.DependentCom'})}
          visible={showModal}
          onCancel={this.hideModal}
          footer={null}
        >
          <div>
            {showModalArr && showModalArr.length > 0 && showModalArr.map((item, index) => (
              <p
                key={index}
                style={{color: '#3296fa', cursor: 'pointer'}}
                onClick={() => this.jumpExpansion(true, item.service_alias)}
              >
                {item.service_cname}
              </p>
            ))}
          </div>
        </Modal>
      </Card>
    );
  }
}

export default Index;
