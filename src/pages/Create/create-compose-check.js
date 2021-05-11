import { Button, Card, Form, Icon, Modal } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import CodeMirror from 'react-codemirror';
import ConfirmModal from '../../components/ConfirmModal';
import LogProcress from '../../components/LogProcress';
import Result from '../../components/Result';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  getComposeByComposeId,
  getComposeCheckuuid,
  getCreateComposeCheckInfo,
  getCreateComposeCheckResult
} from '../../services/createApp';
import globalUtil from '../../utils/global';
import rainbondUtil from '../../utils/rainbond';
import regionUtil from '../../utils/region';
import userUtil from '../../utils/user';

require('codemirror/mode/yaml/yaml');
require('codemirror/lib/codemirror.css');
require('../../styles/codemirror.less');

/* 修改compose内容 */

@Form.create()
class ModifyCompose extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      compose: ''
    };
  }
  componentDidMount() {
    getComposeByComposeId({
      team_name: globalUtil.getCurrTeamName(),
      compose_id: this.props.compose_id
    }).then(data => {
      if (data && data.bean) {
        this.setState({ compose: data.bean.compose_content });
      }
    });
  }
  handleSubmit = e => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const data = this.props.data || {};
    const options = {
      lineNumbers: true,
      theme: 'monokai',
      mode: 'yaml'
    };

    if (!this.state.compose) {
      return null;
    }

    return (
      <Modal
        visible
        title="修改compose内容"
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item>
            {getFieldDecorator('yaml_content', {
              initialValue: this.state.compose || '',
              rules: [
                {
                  required: true,
                  message: '请输入内容'
                }
              ]
            })(<CodeMirror options={options} placeholder="" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    rainbondInfo: global.rainbondInfo
  }),
  null,
  null,
  { withRef: true }
)
export default class CreateCheck extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // failure、checking、success
      status: '',
      check_uuid: '',
      group_id: '',
      compose_id: '',
      errorInfo: [],
      serviceInfo: [],
      showEdit: false,
      showDelete: false,
      modifyCompose: false
    };
    this.mount = false;
    this.socketUrl = '';
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

  componentDidMount(loopStatus) {
    const team_name = globalUtil.getCurrTeamName();
    this.getCheckuuid();
    this.mount = true;
    this.bindEvent();
  }
  getCheckuuid = () => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    const params = this.getParams();
    getComposeCheckuuid({
      team_name,
      ...params
    }).then(data => {
      if (data) {
        if (!data.bean.check_uuid) {
          this.startCheck();
        } else {
          this.state.check_uuid = data.bean.check_uuid;
          this.loopStatus();
        }
      }
    });
  };
  startCheck = loopStatus => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    const params = this.getParams();
    getCreateComposeCheckInfo(
      {
        team_name,
        app_alias: appAlias,
        ...params
      },
      res => {
        if (res.status === 404) {
          this.props.dispatch(
            routerRedux.replace(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
            )
          );
        }
      }
    ).then(data => {
      if (data) {
        this.state.check_uuid = data.bean.check_uuid;
        this.setState({
          eventId: data.bean.check_event_id,
          appDetail: data.bean
        });
        if (loopStatus !== false) {
          this.loopStatus();
        }
      }
    });
  };
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  loopStatus = () => {
    if (!this.mount) return;
    const params = this.getParams();
    const team_name = globalUtil.getCurrTeamName();
    getCreateComposeCheckResult({
      team_name,
      check_uuid: this.state.check_uuid,
      ...params
    })
      .then(data => {
        if (data && this.mount) {
          const status = data.bean.check_status;
          const error_infos = data.bean.error_infos || [];
          const serviceInfo = data.bean.service_info || [];
          this.setState({
            status,
            errorInfo: error_infos,
            serviceInfo
          });
        }
      })
      .finally(() => {
        if (this.mount && this.state.status === 'checking') {
          setTimeout(() => {
            this.loopStatus();
          }, 5000);
        }
      });
  };
  componentWillUnmount() {
    this.mount = false;
    this.unbindEvent();
  }
  getParams() {
    return {
      group_id: this.props.match.params.appID,
      compose_id: this.props.match.params.composeId
    };
  }
  handleCreate = () => {
    const appAlias = this.getAppAlias();
  };
  showModifyCompose = () => {
    this.setState({ modifyCompose: true });
  };
  renderError = () => {
    const errorInfo = this.state.errorInfo;
    const extra = (
      <div>
        {errorInfo.map(item => {
          return (
            <div
              style={{
                marginBottom: 16
              }}
            >
              <Icon
                style={{
                  color: '#f5222d',
                  marginRight: 8
                }}
                type="close-circle-o"
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: `<span>${item.error_info || ''} ${item.solve_advice ||
                    ''}</span>`
                }}
              />
            </div>
          );
        })}
      </div>
    );
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
        title="组件检测未通过"
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
  handleSetting = () => {
    const params = this.getParams();
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-compose-setting/${
          params.group_id
        }/${params.compose_id}`
      )
    );
  };
  handleBuild = () => {
    const team_name = globalUtil.getCurrTeamName();
    const appDetail = this.state.appDetail;
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/buildCompose',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...params
      },
      callback: () => {
        this.props.dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name
          }
        });
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
              params.group_id
            }`
          )
        );
      }
    });
  };
  renderSuccessInfo = item => {
    if (item.value) {
      if (typeof item.value === 'string') {
        return (
          <div
            style={{
              paddingLeft: 32
            }}
          >
            <span
              style={{
                verticalAlign: 'top',
                display: 'inline-block',
                fontWeight: 'bold'
              }}
            >
              {item.key}：
            </span>
            {item.value}
          </div>
        );
      }
      return (
        <div
          style={{
            paddingLeft: 32
          }}
        >
          <span
            style={{
              verticalAlign: 'top',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            {item.key}：
          </span>
          <div
            style={{
              display: 'inline-block'
            }}
          >
            {(item.value || []).map(item => {
              return (
                <p
                  style={{
                    marginBottom: 0
                  }}
                >
                  {item}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
  };
  renderSuccess = () => {
    const { rainbondInfo } = this.props;
    const serviceInfo = this.state.serviceInfo || [];
    const extra = (
      <div>
        {serviceInfo.map(item => {
          return (
            <div
              style={{
                marginBottom: 16
              }}
            >
              <p>组件名称：{item.service_cname}</p>
              {(item.service_info || []).map(item => {
                return (
                  <div
                    style={{
                      marginBottom: 16
                    }}
                  >
                    {this.renderSuccessInfo(item)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
    const actions = [
      <Button onClick={this.handleBuild} type="primary">
        {' '}
        构建组件{' '}
      </Button>,
      <Button type="default" onClick={this.handleSetting}>
        高级设置
      </Button>,
      <Button onClick={this.showDelete} type="default">
        {' '}
        放弃创建{' '}
      </Button>
    ];
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    return (
      <Result
        type="success"
        title="组件检测通过"
        description={
          <div>
            <div>组件检测通过仅代表平台可以检测到代码语言类型和代码源。</div>
            90%以上的用户在检测通过后可部署成功，
            {(platform_url && (
              <span>
                如遇部署失败，可参考
                <a
                  href={`${platform_url}docs/user-manual/app-creation/language-support/`}
                  target="_blank"
                >
                  平台文档
                </a>
              </span>
            )) ||
              ''}{' '}
            对代码包进行调整。
          </div>
        }
        extra={extra}
        actions={actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  renderChecking = () => {
    const actions = (
      <Button onClick={this.showDelete} type="default">
        放弃创建
      </Button>
    );

    const extra = (
      <div>
        {this.state.eventId && (
          <LogProcress
            socketUrl={this.socketUrl}
            eventId={this.state.eventId}
          />
        )}
      </div>
    );
    return (
      <Result
        type="ing"
        title="组件构建源检测中..."
        extra={extra}
        description="此过程可能比较耗时，请耐心等待"
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };
  recheck = () => {
    this.setState(
      {
        status: 'checking'
      },
      () => {
        this.startCheck();
      }
    );
  };
  cancelModifyCompose = () => {
    this.setState({ modifyCompose: false });
  };
  handleClick = e => {
    let parent = e.target;

    while (parent) {
      if (parent === document.body) {
        return;
      }
      const actionType = parent.getAttribute('action_type');
      if (actionType === 'modify_compose') {
        this.setState({ modifyCompose: true });
        return;
      }
      parent = parent.parentNode;
    }
  };
  handleModifyCompose = vals => {
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/editAppCreateCompose',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: params.group_id,
        compose_content: vals.yaml_content
      },
      callback: data => {
        this.cancelModifyCompose();
      }
    });
  };
  handleCancelEdit = () => {
    this.setState({ showEdit: false });
  };
  handleCancelShowKey = () => {
    this.setState({ showKey: false });
  };
  bindEvent = () => {
    document.addEventListener('click', this.handleClick, false);
  };
  unbindEvent = () => {
    document.removeEventListener('click', this.handleClick);
  };
  handleDelete = () => {
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/deleteCompose',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...params
      },
      callback: () => {
        this.props.dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });

        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
          )
        );
      }
    });
  };
  showDelete = () => {
    this.setState({ showDelete: true });
  };
  render() {
    const status = this.state.status;
    const params = this.getParams();
    return (
      <PageHeaderLayout>
        <Card bordered={false}>
          <div
            style={{
              minHeight: 400
            }}
          >
            {status === 'checking' ? this.renderChecking() : null}
            {status === 'success' ? this.renderSuccess() : null}
            {status === 'failure' ? this.renderError() : null}
          </div>
        </Card>
        {this.state.modifyCompose ? (
          <ModifyCompose
            compose_id={params.compose_id}
            onSubmit={this.handleModifyCompose}
            onCancel={this.cancelModifyCompose}
          />
        ) : null}
        {this.state.showDelete && (
          <ConfirmModal
            onOk={this.handleDelete}
            title="放弃创建"
            subDesc="此操作不可恢复"
            desc="确定要放弃创建此组件吗？"
            onCancel={() => {
              this.setState({ showDelete: false });
            }}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
