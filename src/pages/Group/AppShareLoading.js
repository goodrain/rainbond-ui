/* eslint-disable no-const-assign */
/* eslint-disable react/sort-comp */
/* eslint-disable react/no-multi-comp */
import { Button, Card, Icon, List, notification, Progress } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import ConfirmModal from '../../components/ConfirmModal';
import Result from '../../components/Result';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import cloud from '../../utils/cloud';
import globalUtil from '../../utils/global';
import regionUtil from '../../utils/region';
import userUtil from '../../utils/user';
import { openInNewTab } from '../../utils/utils';
import LogShow from '../Component/component/LogShow';
import styles from './Index.less';

@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  loading
}))
class ShareEvent extends React.Component {
  constructor(props) {
    super(props);
    const { data, currUser } = this.props;
    this.state = {
      data: data || {},
      eventId: (data && data.event_id) || '',
      status: (data && data.event_status) || 'not_start',
      openedEventId: false
    };
    this.mount = false;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(currUser, teamName, regionName);
    if (region) {
      this.socketUrl = regionUtil.getEventWebSocketUrl(region);
    }
  }
  componentDidMount = () => {
    this.mount = true;
    this.checkStatus();
  };
  checkStatus = () => {
    const { receiveStartShare } = this.props;
    const { status } = this.state;
    if (status === 'not_start' && receiveStartShare) {
      receiveStartShare(this.startShareEvent);
    }
    this.handleStatus();
  };
  componentWillUnmount = () => {
    this.mount = false;
  };

  reStart = () => {
    this.setState({ eventId: '' });
    this.startShareEvent();
  };

  fetchParams = () => {
    const { shareId } = this.props;
    const { data } = this.state;
    return {
      team_name: globalUtil.getCurrTeamName(),
      share_id: shareId,
      event_id: data && data.ID
    };
  };

  getShareStatus = () => {
    const { dispatch } = this.props;
    const { status, data } = this.state;

    if (status !== 'start' || !this.mount) return;
    // 查询发布状态
    let dispatchtype = 'application/getShareStatus';
    if (data && data.type === 'plugin') {
      // 共享插件状态
      dispatchtype = 'application/getPluginShareEventInShareApp';
    }
    dispatch({
      type: dispatchtype,
      payload: this.fetchParams(),
      callback: res => {
        if (res && res.bean) {
          this.setState(
            {
              status: res.bean.event_status
            },
            () => {
              this.handleSendStatus();
              setTimeout(() => {
                this.getShareStatus();
              }, 5000);
            }
          );
        }
      }
    });
  };
  handleStatus = () => {
    const { status } = this.state;
    if (status === 'start') {
      this.getShareStatus();
    } else {
      this.handleSendStatus();
    }
  };
  handleSendStatus = () => {
    const { status } = this.state;
    const { onSuccess, onFail } = this.props;
    if (status === 'success' && onSuccess) {
      onSuccess();
    }
    if (status === 'failure' && onFail) {
      onFail(this);
    }
  };
  startShareEvent = () => {
    const { data, dispatch, onStartSuccess } = this.props;
    // 开始分享事件
    let dispatchtype = 'application/startShareEvent';
    if (data.type === 'plugin') {
      // 在共享应用中启动插件共享事件
      dispatchtype = 'application/startPluginShareEventInShareApp';
    }

    dispatch({
      type: dispatchtype,
      payload: this.fetchParams(),
      callback: res => {
        if (res && res.bean) {
          this.setState(
            {
              eventId: res.bean.event_id,
              status: res.bean.event_status
            },
            () => {
              // 共享发布状态
              this.getShareStatus();
              if (onStartSuccess) {
                onStartSuccess();
              }
            }
          );
        }
      }
    });
  };
  renderStatus = () => {
    const { status } = this.state;
    if (status === 'success') {
      return (
        <Icon
          type="check-circle"
          style={{
            color: '#52c41a'
          }}
        />
      );
    }
    if (status === 'failure') {
      return <Icon type="close-circle" style={{ color: 'red' }} />;
    }
    return <Icon type="sync" className="roundloading" />;
  };
  handleOpenedEventId = openedEventId => {
    this.setState({ openedEventId });
  };
  handleCancel = () => {
    this.setState({ openedEventId: false });
  };

  render() {
    const { openedEventId, data, status, eventId } = this.state;
    const datas = data || {};
    const isSuccess = status && status === 'success';
    const isShowSocket = !isSuccess;
    const isLogs = !isSuccess && eventId;
    return (
      <div>
        <List.Item>
          <Card style={{ width: '100%' }} hoverable>
            <List.Item.Meta
              title={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ marginRight: '10px' }}>
                      {this.renderStatus()}
                    </span>
                    {datas.type === 'plugin'
                      ? `${formatMessage({id:'appPublish.btn.record.makert.publish.pulgin'})} ${datas.plugin_name}`
                      : `${formatMessage({id:'appPublish.btn.record.makert.publish.component'})} ${datas.service_name}`}
                  </div>
                  <div>
                    {isLogs && [
                      <a
                        onClick={() => {
                          this.handleOpenedEventId(eventId);
                        }}
                      >
                        {formatMessage({id:'appPublish.btn.record.makert.publish.log'})}
                      </a>
                    ]}
                  </div>
                </div>
              }
            />
          </Card>
        </List.Item>

        {openedEventId && (
          <LogShow
            title={formatMessage({id:'appPublish.btn.record.makert.publish.log'})}
            width="1000px"
            onOk={this.handleCancel}
            onCancel={this.handleCancel}
            showSocket={isShowSocket}
            EventID={openedEventId}
            socketUrl={this.socketUrl}
            socket={this.props.socket}
          />
        )}
      </div>
    );
  }
}

@connect(({ loading }) => ({ loading }))
export default class shareCheck extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      status: 'checking',
      shareEventList: [],
      successNum: 0,
      startShareCallback: [],
      showDelete: false,
      completeLoading: false
    };
    this.fails = [];
    this.mount = false;
  }
  receiveStartShare = callback => {
    this.state.startShareCallback.push(callback);
    if (!this.state.isStart) {
      this.state.isStart = true;
      callback();
    }
  };
  handleStartShareSuccess = () => {
    this.state.startShareCallback.shift();
    if (this.state.startShareCallback[0]) {
      this.state.startShareCallback[0]();
    }
  };
  componentDidMount() {
    this.mount = true;
    this.getShareEventInfo();
  }

  getShareEventInfo = () => {
    this.props.dispatch({
      type: 'application/getShareEventInfo',
      payload: this.getParams(),
      callback: data => {
        if (data && data.bean) {
          this.setState({
            shareEventList: data.bean.event_list || [],
            status: !data.bean.is_compelte ? 'checking' : 'success'
          });
        }
      }
    });
  };
  getParams = () => ({
    is_plugin: this.props.location.query.isAppPlugin,
    team_name: globalUtil.getCurrTeamName(),
    share_id: this.props.match.params.shareId,
    appID: this.props.match.params.appID
  });
  componentWillUnmount() {
    this.mount = false;
  }
  handleSuccess = () => {
    this.state.successNum++;
    const { successNum, shareEventList } = this.state;
    if (successNum === shareEventList.length) {
      this.setState({ status: 'success' });
    }
  };
  handleFail = com => {
    this.fails.push(com);
    this.setState({ status: 'failure' });
  };

  handleReStart = () => {
    if (!this.fails.length) return;
    this.fails.forEach(item => {
      item.reStart();
    });
    this.fails = [];
    this.setState({ status: 'checking' });
  };
  handleError = err => {
    if (err.data.code === 404) {
      notification.warning({ message: err.data.msg_show });
      this.handJump(`/publish`);
    } else {
      cloud.handleCloudAPIError(err);
    }
  };
  handleCompleteShare = () => {
    this.setState({ completeLoading: true });
    const { dispatch } = this.props;
    
    dispatch({
      type: 'application/completeShare',
      payload: this.getParams(),
      callback: data => {
        if (data && data.app_market_url) {
          openInNewTab(data.app_market_url);
        }
        this.handJump(`/publish`);
      },
      handleError: err => {
        this.handleError(err);
      }
    });
  };
  handleGiveUp = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/giveupShare',
      payload: this.getParams(),
      callback: () => {
        this.hideShowDelete();
        this.handJump('/overview');
      },
      handleError: err => {
        this.handleError(err);
      }
    });
  };

  handJump = (target = '') => {
    const { dispatch } = this.props;
    const params = this.getParams();
    dispatch(
      routerRedux.replace(
        `/team/${
          params.team_name
        }/region/${globalUtil.getCurrRegionName()}/apps/${
          params.appID
        }${target}`
      )
    );
  };
  GetPercent = (num, total) => {
    const nums = parseFloat(num);
    const totals = parseFloat(total);
    return total <= 0 ? 0 : `${Math.round((nums / totals) * 10000) / 100.0}`;
  };
  renderBody = () => {
    const params = this.getParams();
    const { shareEventList, status, completeLoading, successNum } = this.state;
    const shareAll = (shareEventList && shareEventList.length) || 0;
    const extra = (
      <div>
        <List
          grid={{
            gutter: 16,
            column: 3
          }}
          bordered={false}
          loading={false}
          itemLayout="horizontal"
          dataSource={shareEventList || []}
          renderItem={item => (
            <ShareEvent
              receiveStartShare={this.receiveStartShare}
              onStartSuccess={this.handleStartShareSuccess}
              onFail={this.handleFail}
              onSuccess={this.handleSuccess}
              shareId={params.share_id}
              data={item}
            />
          )}
        />
      </div>
    );
    let type = '';
    let title = '';
    let desc = '';
    let actions = [];
    if (status === 'success') {
      type = 'success';
      title = formatMessage({id:'confirmModal.check.appShare.title.success'});
      desc = '';
      actions = [
        <Button onClick={this.showDelete} type="default">
          {formatMessage({id:'button.give_up_release'})}
        </Button>,
        <Button
          loading={completeLoading}
          onClick={this.handleCompleteShare}
          type="primary"
        >
          {formatMessage({id:'button.affirm_publish'})}
        </Button>
      ];
    }
    if (status === 'checking') {
      type = 'ing';
      title = formatMessage({id:'confirmModal.check.appShare.title.loading'});
      desc = formatMessage({id:'confirmModal.component.check.appShare.desc'});
      actions = [
        <Button onClick={this.showDelete} type="default">
          {formatMessage({id:'button.give_up_release'})}
        </Button>
      ];
    }
    if (status === 'failure') {
      type = 'error';
      desc = formatMessage({id:'confirmModal.check.appShare.title.error'});
      actions = [
        <Button onClick={this.handleReStart} type="primary">
          {formatMessage({id:'button.retry'})}
        </Button>,
        <Button onClick={this.showDelete} type="default">
          {formatMessage({id:'button.give_up_release'})}
        </Button>
      ];
    }
    return (
      <Result
        className={styles.lists}
        type={type}
        title={title}
        extra={extra}
        actions={actions}
        description={
          <div>
            {desc}
            {status !== 'success' && (
              <Progress
                style={{ padding: '24px 40px' }}
                percent={
                  successNum === shareAll
                    ? 100
                    : this.GetPercent(successNum, shareAll)
                }
                status={status === 'failure' ? 'exception' : 'line'}
              />
            )}
          </div>
        }
      />
    );
  };
  showDelete = () => {
    this.setState({ showDelete: true });
  };
  hideShowDelete = () => {
    this.setState({ showDelete: false });
  };
  render() {
    const { loading } = this.props;
    const { shareEventList, showDelete } = this.state;
    if (!shareEventList.length) return null;
    return (
      <Card>
        <Card bordered={false}>{this.renderBody()}</Card>
        {showDelete && (
          <ConfirmModal
            disabled={loading.effects['application/giveupShare']}
            onOk={this.handleGiveUp}
            onCancel={this.hideShowDelete}
            title={formatMessage({id:'button.give_up_release'})}
            desc={formatMessage({id:'confirmModal.component.abandon.publish.title'})}
          />
        )}
      </Card>
    );
  }
}
