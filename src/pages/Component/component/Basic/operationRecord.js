/* eslint-disable camelcase */
import { Card, Col, Form, Icon, Row, Tooltip, Modal } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { routerRedux } from 'dva/router';
import globalUtil from '../../../../utils/global';
import LogShow from '../LogShow';
import styles from './operation.less';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';


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
    if(OptType == 'AbnormalExited' || OptType == 'EventTypeAbnormalExited' || OptType =='CrashLoopBackOff'){
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
      return <FormattedMessage id='componentOverview.body.tab.overview.handle.system'/>;
    }
    if (UserName) {
      return `@${UserName}`;
    }
    return '';
  };
  jumpExpansion =(bool = false, serivce_alias)=>{
    if(!bool){
      this.props.dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${globalUtil.getComponentID()}/expansion`
        )
      )
    }else{
      this.props.dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${serivce_alias}/overview`
        )
      )
    }
    
  }
  jumpMessage = (val,bool) =>{
    const regex = /\[([\s\S]*)\]/; 
    const match = val.match(regex);
    const msgregex = /(.+)(?=\[)/; 
    const message = val.match(msgregex);
    if(bool){
      return message[1] || ''
    }
    var arr = []
    if (match && match.length > 1) {
      const arrayStr = match[0];
       arr = JSON.parse(arrayStr);
    }
    return <>
              ({message[1]} 
              {arr && arr.length > 0 && arr.map((item,index) =>{
                if(arr.length > 3){
                  return <span style={{color:'#3296fa',cursor: "pointer"}} onClick={()=>{this.showJumpModal(arr)}}>{formatMessage({id:'componentOverview.body.tab.overview.handle.Dependent'})}</span>
                }else{ 
                  return <span style={{color:'#3296fa',cursor: "pointer"}} onClick={()=>{this.jumpExpansion(true,item.serivce_alias)}}>{item.service_cname}</span>
                }
              })})
           </>
  }
  showJumpModal = (arr) =>{
    this.setState({
      showModal: true,
      showModalArr: arr
    })
  }
  hideModal = () =>{
    this.setState({
      showModal: false,
    })
  }
  render() {
    const { logList, has_next, recordLoading, isopenLog } = this.props;
    const { logVisible, selectEventID, showSocket, showModalArr, showModal } = this.state;
    const logsvg = globalUtil.fetchSvg('logs', '#cccccc');
    let showLogEvent = '';
    const statusMap = {
      success: 'logpassed',
      timeout: 'logcanceled',
      failure: 'logfailed'
    };
    return (
      <Card 
      // bordered={false} 
      title={<FormattedMessage id='componentOverview.body.tab.overview.handle.operationRecord'/>} 
      loading={recordLoading}>
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
                const Messages = globalUtil.fetchMessageLange(Message,Status,OptType)
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
                      <Tooltip title={ OptType == 'INITIATING' ? this.jumpMessage(Message,true): Messages}>
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
                        {OptType == 'Unschedulable' ? 
                        <span>
                          ({Message}
                          {(Message == "节点CPU不足" || Message =="节点内存不足") &&
                              <span style={{color:'#3296fa',cursor: "pointer"}} onClick={()=>this.jumpExpansion(false)}>{formatMessage({id:'componentOverview.body.tab.overview.handle.stretch'})}
                              </span> 
                          })
                        </span>
                        :
                        OptType == 'INITIATING' ?
                        this.jumpMessage(Message,false)
                        :
                        Messages
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
                      { OptType != 'Unschedulable' && OptType != 'INITIATING' &&
                      SynType === 0 && (
                        <Tooltip
                          visible={FinalStatus === ''}
                          placement="top"
                          arrowPointAtCenter
                          autoAdjustOverflow={false}
                          // title="查看日志"
                          title={<FormattedMessage id='componentOverview.body.tab.overview.handle.lookLog'/>} 
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
                            {globalUtil.fetchSvg('logs', Status == 'failure' && OptType == 'build-service' ? '#CE0601':'#cccccc')}
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
                  {/* 暂无操作记录 */}
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
            // title="日志"
            title={<FormattedMessage id='componentOverview.body.tab.overview.handle.log'/>} 
            width="1000px"
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
          {showModalArr && showModalArr.length > 0 && showModalArr.map((item,index) =>{
            return <p style={{color:'#3296fa',cursor: "pointer"}} onClick={()=>{this.jumpExpansion(true,item.service_alias)}}>{item.service_cname}</p>
          })}
          </div>
        </Modal>
      </Card>
    );
  }
}

export default Index;
