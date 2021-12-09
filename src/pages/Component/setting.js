/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable react/sort-comp */
import {
  Button,
  Card,
  Form,
  Modal,
  notification,
  Popconfirm,
  Radio,
  Switch,
  Tag
} from 'antd';
import { connect } from 'dva';
import React, { Fragment } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import NoPermTip from '../../components/NoPermTip';
import SetMemberAppAction from '../../components/SetMemberAppAction';
import appProbeUtil from '../../utils/appProbe-util';
import appStatusUtil from '../../utils/appStatus-util';
import globalUtil from '../../utils/global';
import AddTag from './setting/add-tag';
import EditHealthCheck from './setting/edit-health-check';
import EditRunHealthCheck from './setting/edit-run-health-check';
import AddVarModal from './setting/env';
import ViewHealthCheck from './setting/health-check';
import EditActions from './setting/perm';
import ViewRunHealthCheck from './setting/run-health-check';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    // tags: appControl.tags,
    appDetail: appControl.appDetail,
    teamControl,
    appControl
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      isShow: false,
      showAddVar: false,
      showEditVar: null,
      deleteVar: null,
      transfer: null,
      viewStartHealth: null,
      editStartHealth: null,
      viewRunHealth: null,
      editRunHealth: null,
      addTag: false,
      tabData: [],
      showAddMember: false,
      toEditAction: null,
      memberslist: null,
      showMarketAppDetail: false,
      showApp: {},
      // appStatus: null,
      visibleAppSetting: false,
      tags: [],
      page: 1,
      page_size: 5,
      env_name: '',
      loading: false
    };
  }
  componentDidMount() {
    if (!this.canView()) return;
    this.props.dispatch({ type: 'teamControl/fetchAllPerm' });
    this.fetchInnerEnvs();
    this.fetchStartProbe();
    this.fetchRunningProbe();
    this.fetchPorts();
    this.fetchBaseInfo();
    this.fetchTags();
    this.loadMembers();
    // this.loadBuildSourceInfo();
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: 'appControl/clearTags' });
    dispatch({ type: 'appControl/clearPorts' });
    dispatch({ type: 'appControl/clearInnerEnvs' });
    dispatch({ type: 'appControl/clearStartProbe' });
    dispatch({ type: 'appControl/clearRunningProbe' });
    dispatch({ type: 'appControl/clearMembers' });
  }

  onTransfer = data => {
    this.setState({ transfer: data });
  };

  onDeleteVar = data => {
    this.setState({ deleteVar: data });
  };
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchBaseInfo',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  fetchPorts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  fetchTags = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchTags',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ tags: data.used_labels });
        }
      }
    });
  };
  // 变量信息
  fetchInnerEnvs = () => {
    const { page, page_size, env_name } = this.state;
    this.props.dispatch({
      type: 'appControl/fetchInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        page,
        page_size,
        env_name
      }
    });
  };
  fetchStartProbe() {
    this.props.dispatch({
      type: 'appControl/fetchStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  }
  fetchRunningProbe() {
    this.props.dispatch({
      type: 'appControl/fetchRunningProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: code => {}
    });
  }
  loadMembers = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: 'teamControl/fetchMember',
      payload: {
        team_name,
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ memberslist: data.list });
        }
      }
    });
  };

  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };
  handleAddMember = values => {
    this.props.dispatch({
      type: 'appControl/setMemberAction',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...values
      },
      callback: () => {
        this.loadMembers();
        this.hideAddMember();
      }
    });
  };
  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: 'appControl/addInnerEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.handleCancelAddVar();
        this.fetchInnerEnvs();
      }
    });
  };
  // 是否可以浏览当前界面
  canView() {
    const {
      componentPermissions: { isDeploytype, isCharacteristic, isHealth }
    } = this.props;
    return isDeploytype || isCharacteristic || isHealth;
  }
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  cancelTransfer = () => {
    this.setState({ transfer: null });
  };

  handleDeleteVar = () => {
    this.props.dispatch({
      type: 'appControl/deleteEnvs',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: this.state.deleteVar.ID
      },
      callback: () => {
        this.cancelDeleteVar();
        this.fetchInnerEnvs();
        notification.success({ message: '操作成功' });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleTransfer = () => {
    const { transfer } = this.state;
    this.props.dispatch({
      type: 'appControl/putTransfer',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: transfer.ID,
        scope: transfer.scope == 'inner' ? 'outer' : 'inner'
      },
      callback: () => {
        this.cancelTransfer();
        this.fetchInnerEnvs();
        notification.success({ message: '操作成功' });
      }
    });
  };

  onEditVar = data => {
    this.setState({ showEditVar: data });
  };
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleEditVar = vals => {
    const { showEditVar } = this.state;
    this.props.dispatch({
      type: 'appControl/editEvns',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.cancelEditVar();
        this.fetchInnerEnvs();
      }
    });
  };
  handleStartProbeStart = isUsed => {
    const { startProbe } = this.props;
    this.props.dispatch({
      type: 'appControl/editStartProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...startProbe,
        is_used: isUsed
      },
      callback: res => {
        if (res && res.status_code) {
          if (res.status_code === 200) {
            this.fetchStartProbe();
            if (isUsed) {
              notification.success({ message: '启用成功,请更新组件后生效' });
            } else {
              notification.success({ message: '禁用成功,请更新组件后生效' });
            }
          }
        }
      }
    });
  };
  handleRunProbeStart = isUsed => {
    const { runningProbe } = this.props;
    this.props.dispatch({
      type: 'appControl/editRunProbe',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...runningProbe,
        is_used: isUsed
      },
      callback: () => {
        this.fetchRunningProbe();
      }
    });
  };
  handleEditHealth = vals => {
    const { startProbe } = this.props;
    this.setState({
      loading: true
    });
    if (appProbeUtil.isStartProbeUsed(this.state.editStartHealth)) {
      this.props.dispatch({
        type: 'appControl/editStartProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals,
          old_mode: startProbe.mode
        },
        callback: res => {
          if (res && res.status_code && res.status_code === 200) {
            this.onCancelEditStartProbe();
            this.fetchStartProbe();
            notification.success({ message: '编辑成功,请更新组件后生效!' });
          }
        }
      });
    } else {
      this.props.dispatch({
        type: 'appControl/addStartProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: res => {
          if (res && res.status_code && res.status_code === 200) {
            this.onCancelEditStartProbe();
            this.fetchStartProbe();
            notification.success({ message: '添加成功' });
            notification.info({ message: '需要更新后才能生效' });
          }
        }
      });
    }
  };
  handleEditRunHealth = vals => {
    if (appProbeUtil.isRunningProbeUsed(this.state.editRunHealth)) {
      this.props.dispatch({
        type: 'appControl/editRunProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        }
      });
    } else {
      this.props.dispatch({
        type: 'appControl/addRunProbe',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        }
      });
    }
  };
  showViewStartHealth = data => {
    this.setState({ viewStartHealth: data });
  };
  hiddenViewStartHealth = () => {
    this.setState({ viewStartHealth: null });
  };
  showViewRunningHealth = data => {
    this.setState({ viewRunHealth: data });
  };
  hiddenViewRunningHealth = () => {
    this.setState({ viewRunHealth: null });
  };
  onCancelEditStartProbe = () => {
    this.setState({ editStartHealth: null, loading: false });
  };
  onCancelEditRunProbe = () => {
    this.setState({ editRunHealth: null });
  };
  handleRemoveTag = tag => {
    this.props.dispatch({
      type: 'appControl/deleteTag',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        label_id: tag.label_id
      },
      callback: () => {
        notification.success({ message: '删除成功' });
        this.fetchTags();
      }
    });
  };
  onAddTag = () => {
    this.props.dispatch({
      type: 'appControl/getTagInformation',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({
            addTag: true,
            tabData: data.list
          });
        }
      }
    });
  };
  cancelAddTag = () => {
    this.setState({ addTag: false, tabData: [] });
  };
  handleAddTag = tags => {
    this.props.dispatch({
      type: 'appControl/addTag',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        label_ids: tags
      },
      callback: () => {
        this.cancelAddTag();
        notification.success({ message: '添加成功需重启或更新才能生效' });
        this.fetchTags();
        this.setState({ tabData: [] });
      }
    });
  };
  onEditAction = member => {
    this.setState({ toEditAction: member });
  };
  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };
  handleEditAction = value => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'appControl/editMemberAction',
      payload: {
        team_name,
        user_id: this.state.toEditAction.user_id,
        app_alias: this.props.appAlias,
        ...value
      },
      callback: () => {
        this.loadMembers();
        this.hideEditAction();
      }
    });
  };

  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  updateComponentDetail = () => {
    const { teamName } = this.props.match.params;
    const { appAlias } = this.props;
    this.props.dispatch({
      type: 'appControl/fetchDetail',
      payload: {
        team_name: teamName,
        app_alias: appAlias
      },
      callback: appDetail => {
        this.setState({ currentComponent: appDetail.service });
      }
    });
  };
  setupAttribute = () => {
    if (appStatusUtil.canVisit(this.props.status)) {
      notification.warning({ message: '请先关闭组件后再更改状态' });
      return;
    }
    this.setState({
      visibleAppSetting: true
    });
  };
  handleOk_AppSetting = () => {
    const { dispatch } = this.props;

    this.props.form.validateFields((err, values) => {
      if (!err) {
        dispatch({
          type: 'appControl/updateComponentDeployType',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            app_alias: this.props.appAlias,
            extend_method: values.extend_method
          },
          callback: data => {
            if (data) {
              notification.success({ message: data.msg_show || '修改成功' });
              this.setState(
                {
                  visibleAppSetting: false,
                  isShow: false
                },
                () => {
                  this.fetchBaseInfo();
                  this.updateComponentDetail();
                }
              );
            }
          }
        });
      }
    });
  };
  handleChange = checked => {
    const { onChecked } = this.props;
    if (onChecked) {
      onChecked(checked);
      setTimeout(() => {
        this.fetchBaseInfo();
      }, 1000);
    }
  };
  handleCancel_AppSetting = () => {
    this.setState({
      visibleAppSetting: false,
      isShow: false
    });
  };

  onChange1 = e => {
    const show =
      e.target.value !=
      (this.props.baseInfo.extend_method || 'stateless_multiple');
    this.setState({
      isShow: show
    });
  };

  handleState = data => {
    if (appProbeUtil.isStartProbeUsed(data)) {
      if (appProbeUtil.isStartProbeStart(data)) {
        return '已启用';
      }
      return '已禁用';
    }
    return '未设置';
  };

  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  handleSearch = env_name => {
    this.setState(
      {
        page: 1,
        env_name
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  render() {
    if (!this.canView()) return <NoPermTip />;
    const {
      startProbe,
      ports,
      baseInfo,
      teamControl,
      form,
      componentPermissions: { isDeploytype, isCharacteristic, isHealth }
    } = this.props;
    const { viewStartHealth, tags, tabData, isShow, loading } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };
    const appsetting_formItemLayout = {
      wrapperCol: {
        span: 24
      }
    };
    const radioStyle = {
      display: 'block',
      height: '30px',
      lineHeight: '30px'
    };

    if (typeof baseInfo.build_upgrade !== 'boolean') {
      return null;
    }
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24
          }}
          title="基础信息"
        >
          <Form>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="创建时间"
            >
              {baseInfo.create_time || ''}
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="组件部署类型"
            >
              {globalUtil.getComponentType(baseInfo.extend_method)}
              {isDeploytype && (
                <Button
                  onClick={this.setupAttribute}
                  size="small"
                  style={{ marginLeft: '10px' }}
                >
                  更改
                </Button>
              )}
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="组件特性"
            >
              {(tags || []).map((tag, i) => (
                <Tag
                  key={`tag${i}`}
                  closable
                  onClose={e => {
                    e.preventDefault();
                    this.handleRemoveTag(tag);
                  }}
                >
                  {tag.label_alias}
                </Tag>
              ))}
              {isCharacteristic && (
                <Button onClick={this.onAddTag} size="small">
                  添加特性
                </Button>
              )}
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="组件构建后自动升级"
            >
              <Switch
                defaultChecked={baseInfo.build_upgrade}
                onChange={this.handleChange}
              />
            </FormItem>
          </Form>
        </Card>
        {isHealth && (
          <Card
            style={{
              marginBottom: 24
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                健康检测
                {startProbe && (
                  <div>
                    <a
                      onClick={() => {
                        this.setState({ editStartHealth: startProbe });
                      }}
                      style={{
                        marginRight: '5px',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                    >
                      {JSON.stringify(startProbe) != '{}' ? '编辑' : '设置'}
                    </a>

                    {JSON.stringify(startProbe) != '{}' &&
                    appProbeUtil.isStartProbeStart(startProbe) ? (
                      <a
                        onClick={() => {
                          this.handleStartProbeStart(false);
                        }}
                        style={{ fontSize: '14px', fontWeight: 400 }}
                      >
                        禁用
                      </a>
                    ) : (
                      JSON.stringify(startProbe) != '{}' && (
                        <a
                          onClick={() => {
                            this.handleStartProbeStart(true);
                          }}
                          style={{ fontSize: '14px', fontWeight: 400 }}
                        >
                          启用
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>
            }
          >
            {startProbe && (
              <div style={{ display: 'flex' }}>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  当前状态:{this.handleState(startProbe)}
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  检测方式:{startProbe.scheme ? startProbe.scheme : '未设置'}
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  不健康处理方式:
                  {startProbe.mode === 'readiness'
                    ? '下线'
                    : startProbe.mode === 'liveness'
                    ? '重启'
                    : '未设置'}
                </div>
              </div>
            )}
          </Card>
        )}
        {this.state.addTag && (
          <AddTag
            tags={tabData || []}
            onCancel={this.cancelAddTag}
            onOk={this.handleAddTag}
          />
        )}
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}

        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除此变量吗？"
            subDesc="此操作不可恢复"
          />
        )}

        {this.state.transfer && (
          <ConfirmModal
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title="转移环境变量"
            desc="确定要转移此变量吗？"
            subDesc=""
          />
        )}

        {viewStartHealth && (
          <ViewHealthCheck
            title="健康检查查看"
            data={viewStartHealth}
            onCancel={() => {
              this.setState({ viewStartHealth: null });
            }}
          />
        )}
        {this.state.editStartHealth && (
          <EditHealthCheck
            ports={ports}
            onOk={this.handleEditHealth}
            title="健康检测"
            data={this.state.editStartHealth}
            onCancel={this.onCancelEditStartProbe}
            loading={loading}
          />
        )}
        {this.state.toEditAction && (
          <EditActions
            onSubmit={this.handleEditAction}
            onCancel={this.hideEditAction}
            actions={teamControl.actions}
            value={this.state.toEditAction.service_perms.map(item => item.id)}
          />
        )}
        {this.state.viewRunHealth && (
          <ViewRunHealthCheck
            title="运行时检查查看"
            data={this.state.viewRunHealth}
            onCancel={() => {
              this.setState({ viewRunHealth: null });
            }}
          />
        )}
        {this.state.editRunHealth && (
          <EditRunHealthCheck
            ports={ports}
            onOk={this.handleEditRunHealth}
            title="设置运行时检查"
            data={this.state.editRunHealth}
            onCancel={this.onCancelEditRunProbe}
          />
        )}
        {this.state.showAddMember && (
          <SetMemberAppAction
            members={this.state.memberslist}
            actions={teamControl.actions}
            onOk={this.handleAddMember}
            onCancel={this.hideAddMember}
          />
        )}

        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
        {this.state.visibleAppSetting && (
          <Modal
            title="组件部署类型设置"
            visible={this.state.visibleAppSetting}
            // onOk={this.handleOk_AppSetting}
            width={600}
            onCancel={this.handleCancel_AppSetting}
            footer={
              isShow ? (
                [
                  <Popconfirm
                    title="修改部署类型，存储数据可能丢失或存储不可用,你确定要修改吗？"
                    onConfirm={this.handleOk_AppSetting}
                    onCancel={this.handleCancel_AppSetting}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="primary">确定</Button>
                  </Popconfirm>,
                  <Button onClick={this.handleCancel_AppSetting}>取消</Button>
                ]
              ) : (
                <div>
                  <Button type="primary" onClick={this.handleCancel_AppSetting}>
                    确定
                  </Button>
                  <Button onClick={this.handleCancel_AppSetting}>取消</Button>
                </div>
              )
            }
          >
            <Form.Item {...appsetting_formItemLayout}>
              {getFieldDecorator('extend_method', {
                initialValue: baseInfo.extend_method || 'stateless_multiple',
                rules: [
                  {
                    required: true,
                    message: '请选择组件类型'
                  }
                ]
              })(
                <RadioGroup onChange={this.onChange1}>
                  {globalUtil.getSupportComponentTyps().map(item => {
                    return (
                      <div key={item.type}>
                        <Radio style={radioStyle} value={item.type}>
                          {item.name}
                        </Radio>
                        <p style={{ color: '#999999', paddingLeft: '26px' }}>
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            </Form.Item>
          </Modal>
        )}
      </Fragment>
    );
  }
}
