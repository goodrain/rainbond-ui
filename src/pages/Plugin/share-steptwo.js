import { Button, Card, Icon } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ConfirmModal from '../../components/ConfirmModal';
import LogProcress from '../../components/LogProcress';
import Result from '../../components/Result';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import regionUtil from '../../utils/region';
import userUtil from '../../utils/user';

@connect(({ user, appControl, loading }) => ({
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
    const { data } = this.state;
    const { status } = this.state;
    if (status === 'not_start') {
      this.props.receiveStartShare &&
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
    this.props.dispatch({
      type: 'plugin/getShareOneEventInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        shareId: this.props.share_id,
        eventId: this.state.data.ID
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
    this.props.dispatch({
      type: 'plugin/startShareOneEvent',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        shareId: this.props.share_id,
        eventId: this.state.data.ID
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
              this.props.onStartSuccess && this.props.onStartSuccess();
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
    const { eventId } = this.state;
    return (
      <div
        style={{
          marginBottom: 24
        }}
      >
        <h4>
          插件名称: {data.plugin_name}
          {this.renderStatus()}
        </h4>
        <div>
          {eventId && (
            <LogProcress socketUrl={this.socketUrl} eventId={eventId} />
          )}
        </div>
      </div>
    );
  }
}

@connect(({ user, appControl, loading }) => ({ loading }))
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
      type: 'plugin/getShareEventInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        shareId: params.shareId
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
  getParams = () => {
    return {
      shareId: this.props.match.params.shareId,
      groupId: this.props.match.params.appID
    };
  };
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
        title="插件发布失败"
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
        完成发布流程{' '}
      </Button>,
      <Button onClick={this.showDelete} type="default">
        {' '}
        放弃创建{' '}
      </Button>
    ];
    return (
      <Result
        type="success"
        title="插件发布成功"
        description="您可以执行以下操作"
        extra={extra}
        actions={actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  handleReStart = () => {
    if (!this.fails.length) return;
    this.fails.forEach((item, index) => {
      item.reStart();
    });
    this.fails = [];
    this.setState({ status: 'checking' });
  };
  handleCompleteShare = () => {
    const params = this.getParams();
    const list = this.state.shareEventList;
    this.props.dispatch({
      type: 'global/complatePluginShare',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: params.shareId
      },
      callback: data => {
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source/plugin/${encodeURIComponent(
              list[0].plugin_name
            )}`
          )
        );
      }
    });
  };
  handleGiveup = () => {
    const { pluginId } = this.props.match.params;
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/giveupSharePlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        share_id: this.props.match.params.shareId
      },
      callback: data => {
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${pluginId}`
          )
        );
      }
    });
  };
  renderBody = () => {
    const params = this.getParams();
    const eventList = this.state.shareEventList;
    const { status } = this.state;
    const { loading } = this.props;
    const extra = (
      <div>
        {(eventList || []).map(item => {
          return (
            <ShareEvent
              receiveStartShare={this.receiveStartShare}
              onStartSuccess={this.handleStartShareSuccess}
              onFail={this.handleFail}
              onSuccess={this.handleSuccess}
              share_id={params.shareId}
              data={item}
            />
          );
        })}
      </div>
    );
    let type = '';
    let title = '';
    let desc = '';
    let actions = [];
    if (status === 'success') {
      type = 'success';
      title = '插件发布成功';
      desc = '';
      actions = [
        <Button onClick={this.handleCompleteShare} type="primary">
          {' '}
          确认发布{' '}
        </Button>
      ];
    }
    if (status === 'checking') {
      type = 'ing';
      title = '插件发布中';
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
          重新发布{' '}
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
          {status === 'failure' && this.renderSuccess()}
          {status === 'failure' && this.renderError()}
        </Card>
        {this.state.showDelete && (
          <ConfirmModal
            disabled={loading.effects['application/giveupShare']}
            onOk={this.handleGiveup}
            onCancel={this.hideShowDelete}
            title={formatMessage({ id: 'confirmModal.give_up_release.delete.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.give_up_release.desc' })}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
