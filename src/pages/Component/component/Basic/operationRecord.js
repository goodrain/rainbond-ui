/* eslint-disable camelcase */
import { Card, Col, Form, Icon, Row, Tooltip } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { routerRedux } from 'dva/router';
import globalUtil from '../../../../utils/global';
import LogShow from '../LogShow';
import styles from './operation.less';

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      logVisible: false,
      selectEventID: '',
      showSocket: false
    };
  }
  componentDidMount() {}

  handleMore = () => {
    const { handleMore } = this.props;
    if (handleMore) {
      handleMore(true);
    }
  };

  showLogModal = (EventID, showSocket, OptType = '') => {
    const { isopenLog, onLogPush, dispatch } = this.props;
    if(OptType == 'AbnormalExited' || OptType == 'EventTypeAbnormalExited' || OptType == 'AbnormalShtdown'){
      this.props.dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${globalUtil.getComponentID()}/log`
        )
      )
    }else{
      if (isopenLog && onLogPush) {
        onLogPush(false);
      }
    }

    this.setState({
      logVisible: true,
      selectEventID: EventID,
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
      return '@系统';
    }
    if (UserName) {
      return `@${UserName}`;
    }
    return '';
  };

  render() {
    const { logList, has_next, recordLoading, isopenLog } = this.props;
    const { logVisible, selectEventID, showSocket } = this.state;
    const logsvg = globalUtil.fetchSvg('logs', '#cccccc');
    let showLogEvent = '';
    const statusMap = {
      success: 'logpassed',
      timeout: 'logcanceled',
      failure: 'logfailed'
    };
    return (
      <Card bordered={false} title="操作记录" loading={recordLoading}>
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            {logList &&
              logList.map(item => {
                const {
                  Status,
                  FinalStatus,
                  UserName,
                  OptType,
                  Reason,
                  Message,
                  EndTime,
                  SynType,
                  EventID,
                  create_time
                } = item;
                if (
                  isopenLog &&
                  FinalStatus === '' &&
                  OptType &&
                  OptType.indexOf('build') > -1 &&
                  showLogEvent === ''
                ) {
                  showLogEvent = EventID;
                }
                const UserNames = this.showUserName(UserName);
                const Messages =
                  Status !== 'success' &&
                  globalUtil.fetchAbnormalcolor(OptType) ===
                    'rgba(0,0,0,0.65)' &&
                  Message;
                return (
                  <div
                    key={EventID}
                    className={`${styles.loginfo} ${
                      styles[statusMap[Status] || 'logfored']
                    }`}
                  >
                    <Tooltip
                      title={moment(create_time)
                        .locale('zh-cn')
                        .format('YYYY-MM-DD HH:mm:ss')}
                    >
                      <div
                        style={{ wordBreak: 'break-word', lineHeight: '17px' }}
                      >
                        {globalUtil.fetchdayTime(create_time)}
                      </div>
                    </Tooltip>

                    <div>
                      <Tooltip title={Messages}>
                        <span
                          style={{
                            color: globalUtil.fetchAbnormalcolor(OptType)
                          }}
                        >
                          {globalUtil.fetchStateOptTypeText(OptType)}
                          &nbsp;
                        </span>
                        {globalUtil.fetchOperation(FinalStatus, Status)}
                        &nbsp;
                        {Status === 'failure' && globalUtil.fetchReason(Reason)}
                        {Messages}
                      </Tooltip>
                    </div>
                    <div className={styles.nowarpText}>
                      <span>
                        <Tooltip title={UserNames}>{UserNames}</Tooltip>
                      </span>
                    </div>
                    <div>
                      <span className={styles.alcen}>
                        {EndTime &&
                          create_time &&
                          globalUtil.fetchSvg('runTime')}
                        <span>
                          {EndTime && create_time
                            ? globalUtil.fetchTime(
                                new Date(EndTime).getTime()
                                  ? new Date(EndTime).getTime() -
                                      new Date(create_time).getTime()
                                  : ''
                              )
                            : ''}
                        </span>
                      </span>
                    </div>
                    <div style={{ position: 'static' }} className="table-wrap">
                      {SynType === 0 && (
                        <Tooltip
                          visible={FinalStatus === ''}
                          placement="top"
                          arrowPointAtCenter
                          autoAdjustOverflow={false}
                          title="查看日志"
                          getPopupContainer={() =>
                            document.querySelector('.table-wrap')
                          }
                        >
                          <div
                            style={{
                              width: '16px'
                            }}
                            onClick={() => {
                              this.showLogModal(EventID, FinalStatus === '', OptType);
                            }}
                          >
                            {logsvg}
                          </div>
                        </Tooltip>
                      )}
                    </div>
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
                  暂无操作记录
                </div>
              ))}
            {has_next && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 30
                }}
              >
                <Icon
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={this.props.handleNextPage}
                  type="down"
                />
              </p>
            )}
          </Col>
        </Row>
        {logVisible && (
          <LogShow
            title="日志"
            width="1000px"
            onOk={this.handleCancel}
            onCancel={this.handleCancel}
            showSocket={showSocket}
            EventID={selectEventID}
            socket={this.props.socket}
          />
        )}
      </Card>
    );
  }
}

export default Index;
