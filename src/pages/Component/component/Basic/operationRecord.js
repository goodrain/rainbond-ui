/* eslint-disable camelcase */
import { Card, Col, Form, Icon, Row, Tooltip, Modal } from 'antd';
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
      showSocket: false
    };
  }

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
    const { logVisible, selectEventID, showSocket, showModalArr, showModal } = this.state;
    let showLogEvent = '';
    const statusMap = {
      success: 'logpassed',
      timeout: 'logcanceled',
      failure: 'logfailed'
    };
    return (
      <Card
      title={<FormattedMessage id='componentOverview.body.tab.overview.handle.operationRecord'/>}
      loading={recordLoading}>
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
                        style={{ wordBreak: 'break-word', lineHeight: '17px' }}
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
                        {opt_type === 'Unschedulable' ? (
                          <span>
                            ({message}
                            {(message === "节点CPU不足" || message === "节点内存不足") && (
                              <span
                                style={{color: '#3296fa', cursor: 'pointer'}}
                                onClick={() => this.jumpExpansion(false)}
                              >
                                {formatMessage({id: 'componentOverview.body.tab.overview.handle.stretch'})}
                              </span>
                            )})
                          </span>
                        ) : opt_type === 'INITIATING' ? (
                          this.jumpMessage(message, false)
                        ) : (
                          Messages
                        )}

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
                      <div style={{ position: 'static' }} className="table-wrap">
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
                  <FormattedMessage id='componentOverview.body.tab.overview.handle.handler'/>
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
