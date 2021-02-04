/* eslint-disable react/sort-comp */
/* eslint-disable react/no-multi-comp */
import { Button, Card, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import LogProcress from '../../components/LogProcress';
import Result from '../../components/Result';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import regionUtil from '../../utils/region';
import userUtil from '../../utils/user';
import { openInNewTab } from '../../utils/utils';

@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  loading
}))
class ShareEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data || {},
      eventId: this.props.data.event_id || '',
      status: this.props.data.event_status || 'not_start'
    };
    this.mount = false;
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(
      this.props.currUser,
      teamName,
      regionName
    );
    if (region) {
      this.socketUrl = regionUtil.getEventWebSocketUrl(region);
    }
  }
  componentDidMount = () => {
    this.mount = true;
    this.checkStatus();
  };
  checkStatus = () => {
    const { status } = this.state;
    if (status === 'not_start' && this.props.receiveStartShare) {
      this.props.receiveStartShare(this.startShareEvent);
    }
    if (status === 'start') {
      this.getShareStatus();
    }
    if (status === 'success') {
      this.onSuccess();
    }

    if (status === 'failure') {
      this.onFail();
    }
  };
  componentWillUnmount = () => {
    this.mount = false;
  };
  onSuccess = () => {
    this.props.onSuccess && this.props.onSuccess();
  };
  onFail = () => {
    this.props.onFail && this.props.onFail(this);
  };
  reStart = () => {
    this.setState({ eventId: '' });
    this.startShareEvent();
  };
  getShareStatus = () => {
    if (this.state.status !== 'start' || !this.mount) return;
    let dispatchtype = 'application/getShareStatus';
    if (this.state.data.type === 'plugin') {
      dispatchtype = 'application/getPluginShareEventInShareApp';
    }
    this.props.dispatch({
      type: dispatchtype,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: this.props.share_id,
        event_id: this.state.data.ID
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              status: data.bean.event_status
            },
            () => {
              if (this.state.status === 'success') {
                this.onSuccess();
              }
              if (this.state.status === 'failure') {
                this.onFail();
              }
              setTimeout(() => {
                this.getShareStatus();
              }, 5000);
            }
          );
        }
      }
    });
  };
  startShareEvent = () => {
    const event = this.props.data;
    let dispatchtype = 'application/startShareEvent';
    if (event.type === 'plugin') {
      dispatchtype = 'application/startPluginShareEventInShareApp';
    }
    this.props.dispatch({
      type: dispatchtype,
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: this.props.share_id,
        event_id: event.ID
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              eventId: data.bean.event_id,
              status: data.bean.event_status
            },
            () => {
              this.getShareStatus();
              if (this.props.onStartSuccess) {
                this.props.onStartSuccess();
              }
            }
          );
        }
      }
    });
  };
  renderStatus = () => {
    if (this.state.status === 'start') {
      return <Icon type="sync" className="roundloading" />;
    }
    if (this.state.status === 'success') {
      return (
        <Icon
          type="check-circle"
          style={{
            color: '#52c41a'
          }}
        />
      );
    }
    if (this.state.status === 'failure') {
      return <Icon type="close-circle" />;
    }
    return null;
  };
  render() {
    const data = this.state.data || {};
    const { eventId, opened } = this.state;
    return (
      <div
        style={{
          marginBottom: 24
        }}
      >
        <div style={{ padding: '16px', background: '#f2f4f5' }}>
          {data.type === 'plugin'
            ? `插件: ${data.plugin_name}`
            : `组件: ${data.service_name}`}
          {`  `}
          {this.renderStatus()}
          <div style={{ float: 'right' }}>
            {!opened ? (
              <a
                onClick={() => {
                  this.setState({ opened: true });
                }}
              >
                <Icon type="down" />
              </a>
            ) : (
              <a
                onClick={() => {
                  this.setState({ opened: false });
                }}
              >
                <Icon type="up" />
              </a>
            )}
          </div>
        </div>
        <div style={{ padding: '16px', background: '#f2f4f5' }}>
          {eventId && (
            <LogProcress
              opened={opened}
              socketUrl={this.socketUrl}
              eventId={eventId}
            />
          )}
        </div>
      </div>
    );
  }
}

@connect(({ loading }) => ({ loading }))
export default class shareCheck extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // failure、checking、success
      status: 'checking',
      shareEventList: [],
      successNum: 0,
      showDelete: false,
      startShareCallback: [],
      completeLoading: false,
      isStart: false
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
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/getShareEventInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: params.shareId
      },
      callback: data => {
        if (data) {
          this.setState({
            shareEventList: data.bean.event_list || [],
            status: !data.bean.is_compelte ? 'checking' : 'success'
          });
        }
      }
    });
  };
  getParams = () => ({
    shareId: this.props.match.params.shareId,
    appID: this.props.match.params.appID
  });
  componentWillUnmount() {
    this.mount = false;
  }
  handleSuccess = () => {
    this.state.successNum++;
    if (this.state.successNum === this.state.shareEventList.length) {
      this.setState({ status: 'success' });
    }
  };
  handleFail = com => {
    this.fails.push(com);
    this.setState({ status: 'failure' });
  };
  renderChecking = () => {};
  renderError = () => {
    const extra = <div />;
    const actions = [
      <Button onClick={this.showDelete} type="default">
        {' '}
        放弃创建{' '}
      </Button>,
      <Button onClick={this.recheck} type="primary">
        重新检测
      </Button>
    ];

    return (
      <Result
        type="error"
        title="应用发布失败"
        description="请核对并修改以下信息后，再重新检测。"
        extra={extra}
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };
  renderSuccess = () => {
    const extra = <div />;
    const actions = [
      <Button onClick={this.handleBuild} type="primary">
        {' '}
        构建应用{' '}
      </Button>,
      <Button type="default" onClick={this.handleSetting}>
        高级设置
      </Button>,
      <Button onClick={this.showDelete} type="default">
        {' '}
        放弃创建{' '}
      </Button>
    ];
    return (
      <Result
        type="success"
        title="应用发布成功"
        description="您可以执行以下操作"
        extra={extra}
        actions={actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  handleReStart = () => {
    if (!this.fails.length) return;
    this.fails.forEach(item => {
      item.reStart();
    });
    this.fails = [];
    this.setState({ status: 'checking' });
  };
  handleCompleteShare = () => {
    this.setState({ completeLoading: true });
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/completeShare',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: params.shareId
      },
      callback: data => {
        if (data && data.app_market_url) {
          openInNewTab(data.app_market_url);
        }
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
              params.appID
            }/publish`
          )
        );
      }
    });
  };
  handleGiveUp = () => {
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/giveupShare',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: params.shareId
      },
      callback: () => {
        this.hideShowDelete();
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
              params.appID
            }`
          )
        );
      }
    });
  };
  renderBody = () => {
    const params = this.getParams();
    const eventList = this.state.shareEventList;
    const { status } = this.state;
    const { completeLoading } = this.state;
    const extra = (
      <div>
        {(eventList || []).map(item => (
          <ShareEvent
            receiveStartShare={this.receiveStartShare}
            onStartSuccess={this.handleStartShareSuccess}
            onFail={this.handleFail}
            onSuccess={this.handleSuccess}
            share_id={params.shareId}
            data={item}
          />
        ))}
      </div>
    );
    let type = '';
    let title = '';
    let desc = '';
    let actions = [];
    if (status === 'success') {
      type = 'success';
      title = '应用同步成功';
      desc = '';
      actions = [
        <Button onClick={this.showDelete} type="default">
          放弃发布
        </Button>,
        <Button
          loading={completeLoading}
          onClick={this.handleCompleteShare}
          type="primary"
        >
          {' '}
          确认发布{' '}
        </Button>
      ];
    }
    if (status === 'checking') {
      type = 'ing';
      title = '应用同步中';
      desc = '此过程可能比较耗时，请耐心等待';
      actions = [
        <Button onClick={this.showDelete} type="default">
          放弃发布
        </Button>
      ];
    }
    if (status === 'failure') {
      type = 'error';
      desc = '请查看以下日志确认问题后重新同步';
      actions = [
        <Button onClick={this.handleReStart} type="primary">
          {' '}
          重新同步{' '}
        </Button>,
        <Button onClick={this.showDelete} type="default">
          放弃发布
        </Button>
      ];
    }
    return (
      <Result
        type={type}
        title={title}
        extra={extra}
        description={desc}
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
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
    const { shareEventList } = this.state;
    if (!shareEventList.length) return null;
    return (
      <PageHeaderLayout>
        <Card bordered={false}>
          {this.renderBody()}
          {status === 'checking' && this.renderChecking()}
          {status === 'success' && this.renderSuccess()}
          {status === 'failure' && this.renderError()}
        </Card>
        {this.state.showDelete && (
          <ConfirmModal
            disabled={loading.effects['application/giveupShare']}
            onOk={this.handleGiveUp}
            onCancel={this.hideShowDelete}
            title="放弃发布"
            desc="确定要放弃此次发布吗?"
          />
        )}
      </PageHeaderLayout>
    );
  }
}
