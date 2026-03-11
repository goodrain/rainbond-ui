/* eslint-disable react/no-multi-comp */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import { Button, Card, Form, Icon, Modal, Tooltip } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import CodeMirror from 'react-codemirror';
import ConfirmModal from '../../components/ConfirmModal';
import LogProcress from '../../components/LogProcress';
import Result from '../../components/Result';
import ComposeCheckInfo from '../../components/ComposeCheckInfo';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import role from '../../utils/newRole'
import pageheaderSvg from '../../utils/pageHeaderSvg';

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
import handleAPIError from '../../utils/error';

import 'codemirror/mode/yaml/yaml';
import 'codemirror/lib/codemirror.css';

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
    }).catch(err => {
      handleAPIError(err);
    });
  }
  handleSubmit = e => {
    e.preventDefault();
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (!err && onSubmit) {
        onSubmit(fieldsValue);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
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
        title={formatMessage({ id: 'confirmModal.compose.update.title' })}
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
                  message: formatMessage({ id: 'placeholder.input_content' })
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
  ({ user }) => ({
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
      errorInfo: [],
      serviceInfo: [],
      showDelete: false,
      modifyCompose: false,
      // 上传状态
      uploadStatus: {
        isAllUploaded: false,
        pendingCount: 0,
        totalCount: 0
      }
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

  componentDidMount() {
    this.getCheckuuid();
    this.mount = true;
    this.bindEvent();
    role.refreshPermissionsInfo('', true)
  }
  componentWillUnmount() {
    this.mount = false;
    this.unbindEvent();
  }
  getCheckuuid = () => {
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
          this.setState({ check_uuid: data.bean.check_uuid }, () => {
            this.loopStatus();
          });
        }
      }
    }).catch(err => {
      handleAPIError(err);
    });
  };
  getParams() {
    return {
      group_id: this.props.match.params.appID,
      compose_id: this.props.match.params.composeId
    };
  }
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
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
        this.setState({
          check_uuid: data.bean.check_uuid,
          eventId: data.bean.check_event_id,
          appDetail: data.bean
        }, () => {
          if (loopStatus !== false) {
            this.loopStatus();
          }
        });
      }
    }).catch(err => {
      handleAPIError(err);
    });
  };

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
          // 检测成功后，获取应用列表并匹配 service_alias，然后获取 volumes
          if (status === 'success') {
            this.matchServiceAliasAndFetchVolumes(serviceInfo, data.list);
          }
        }
      })
      .catch(err => {
        handleAPIError(err);
      })
      .finally(() => {
        if (this.mount && this.state.status === 'checking') {
          setTimeout(() => {
            this.loopStatus();
          }, 5000);
        }
      });
  };

  matchServiceAliasAndFetchVolumes = (serviceInfo, list) => {
    const team_name = globalUtil.getCurrTeamName();
    const params = this.getParams();
    const appList = list || [];
    // 匹配 service_cname，添加 service_alias
    const matchedServiceInfo = serviceInfo.map(info => {
      const matchedApp = appList.find(app => app.service_cname === info.service_cname);
      if (matchedApp) {
        return {
          ...info,
          service_alias: matchedApp.service_alias,
          appid: params.group_id
        };
      }
      return info;
    });
    this.fetchVolumesForServices(matchedServiceInfo);
  };

  fetchVolumesForServices = (serviceInfo) => {
    const team_name = globalUtil.getCurrTeamName();
    let completedCount = 0;
    const results = [...serviceInfo];

    serviceInfo.forEach((info, index) => {
      if (info.service_alias) {
        this.props.dispatch({
          type: 'appControl/fetchVolumes',
          payload: {
            team_name,
            app_alias: info.service_alias,
            is_config: true
          },
          callback: (data) => {
            results[index] = {
              ...info,
              volumes: data?.list || []
            };
            completedCount++;
            if (completedCount === serviceInfo.length) {
              this.setState({ serviceInfo: results }, () => {
              });
            }
          },
          handleError: () => {
            results[index] = {
              ...info,
              volumes: []
            };
            completedCount++;
            if (completedCount === serviceInfo.length) {
              this.setState({ serviceInfo: results });
            }
          }
        });
      } else {
        results[index] = { ...info, volumes: [] };
        completedCount++;
        if (completedCount === serviceInfo.length) {
          this.setState({ serviceInfo: results });
        }
      }
    });
  };

  showModifyCompose = () => {
    this.setState({ modifyCompose: true });
  };
  showDelete = () => {
    this.setState({ showDelete: true });
  };

  handleSetting = () => {
    const params = this.getParams();
    const { location } = this.props;
    const app_name = location && location.query && location.query.app_name;

    let url = `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-compose-setting/${params.group_id}/${params.compose_id}`;

    // 携带 app_name 参数
    if (app_name) {
      url += `?app_name=${encodeURIComponent(app_name)}`;
    }

    this.props.dispatch(routerRedux.push(url));
  };
  handleBuild = () => {
    const team_name = globalUtil.getCurrTeamName();
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
          },
          handleError: err => {
            handleAPIError(err);
          }
        });
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${params.group_id
            }/overview`
          )
        );
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  handleDelete = () => {
    const params = this.getParams();
    this.props.dispatch({
      type: 'application/deleteCompose',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_name: this.props.location && this.props.location.query && this.props.location.query.app_name,
        ...params
      },
      callback: () => {
        this.props.dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          },
          handleError: err => {
            handleAPIError(err);
          }
        });

        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
          )
        );
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  unbindEvent = () => {
    document.removeEventListener('click', this.handleClick);
  };
  bindEvent = () => {
    document.addEventListener('click', this.handleClick, false);
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
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  renderChecking = () => {
    const actions = (
      <Button onClick={this.showDelete} type="default">
        {formatMessage({ id: 'button.abandon_create' })}
      </Button>
    );

    const extra = (
      <div>
        {this.state.eventId && (
          <LogProcress
            opened
            socketUrl={this.socketUrl}
            eventId={this.state.eventId}
          />
        )}
      </div>
    );
    return (
      <Result
        type="ing"
        title={formatMessage({ id: 'confirmModal.component.check.title.loading' })}
        extra={extra}
        description={formatMessage({ id: 'confirmModal.component.check.appShare.desc' })}
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };
  // 处理上传状态变化
  handleUploadStatusChange = (uploadStatus) => {
    this.setState({ uploadStatus });
  };

  renderSuccess = () => {
    const { rainbondInfo } = this.props;
    const { serviceInfo, errorInfo, uploadStatus } = this.state;
    const params = this.getParams();

    // 判断是否可以构建：所有配置文件都已上传
    const canBuild = uploadStatus.isAllUploaded;

    const extra = (
      <ComposeCheckInfo
        serviceInfo={serviceInfo}
        errorInfo={errorInfo}
        appID={params.group_id}
        onUploadSuccess={() => this.fetchVolumesForServices(serviceInfo)}
        onUploadStatusChange={this.handleUploadStatusChange}
      />
    );

    // 构建按钮，根据上传状态显示提示
    const buildButton = (
      <Button
        onClick={this.handleBuild}
        type="primary"
        disabled={!canBuild}
        style={{marginRight:12}}
      >
        {formatMessage({ id: 'button.build_component' })}
      </Button>
    );

    const actions = [
      !canBuild ? (
          <Tooltip
            key="build"
            title={formatMessage({ id: 'composeCheckInfo.build_disabled_tip' }, { count: uploadStatus.pendingCount })}
          >
            {buildButton}
          </Tooltip>
      ) : (
        buildButton
      ),
      <Button type="default" onClick={this.handleSetting}>
        {formatMessage({ id: 'button.advanced_setup' })}
      </Button>,
      <Button onClick={this.showDelete} type="default">
        {' '}
        {formatMessage({ id: 'button.abandon_create' })}{' '}
      </Button>
    ];
    const platform_url = rainbondUtil.documentPlatform_url(rainbondInfo);
    return (
      <Result
        type="success"
        title={formatMessage({ id: 'confirmModal.component.check.title.success.component_check' })}
        description={
          <div>
            <div>{formatMessage({ id: 'componentCheck.tooltip.title.p3' })}</div>
            {formatMessage({ id: 'componentCheck.tooltip.title.p4' })}
            {formatMessage({ id: 'componentCheck.tooltip.title.p9' })}
            {(platform_url && (
              <span>
                <a
                  href={`${platform_url}docs/how-to-guides/app-deploy/source-code/`}
                  target="_blank"
                >
                  {formatMessage({ id: 'componentCheck.tooltip.title.p8' })}
                </a>
              </span>
            )) ||
              ''}{' '}
            {formatMessage({ id: 'componentCheck.tooltip.title.p6' })}
          </div>
        }
        extra={extra}
        actions={actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  renderError = () => {
    const { errorInfo } = this.state;
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
        {formatMessage({ id: 'button.abandon_create' })}
      </Button>,
      <Button onClick={this.recheck} type="primary">
        {formatMessage({ id: 'button.retest_check' })}
      </Button>
    ];

    return (
      <Result
        type="error"
        title={formatMessage({ id: 'confirmModal.component.check.title.error.component_check' })}
        description={formatMessage({ id: 'confirmModal.component.check.title.error.description' })}
        extra={extra}
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };
  render() {
    const { status, modifyCompose, showDelete } = this.state;
    const params = this.getParams();
    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'versionUpdata_6_1.check' })}
        content={formatMessage({ id: 'versionUpdata_6_1.content4' })}
        titleSvg={pageheaderSvg.getPageHeaderSvg("check", 18)}
      >
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
        {modifyCompose ? (
          <ModifyCompose
            compose_id={params.compose_id}
            onSubmit={this.handleModifyCompose}
            onCancel={this.cancelModifyCompose}
          />
        ) : null}
        {showDelete && (
          <ConfirmModal
            onOk={this.handleDelete}
            title={formatMessage({ id: 'confirmModal.abandon_create.create_check.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.create_check.desc' })}
            onCancel={() => {
              this.setState({ showDelete: false });
            }}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
