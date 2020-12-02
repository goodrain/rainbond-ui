import {
  Button,
  Col,
  Divider,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Row,
  Spin
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import styless from '../../components/CreateTeam/index.less';
import RapidCopy from '../../components/RapidCopy';
import VisterBtn from '../../components/visitBtnForAlllink';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import AddServiceComponent from './AddServiceComponent';
import AddThirdParty from './AddThirdParty';
import AppShape from './AppShape';
import ComponentList from './ComponentList';
import EditorTopology from './EditorTopology';
import styles from './Index.less';

const FormItem = Form.Item;

@Form.create()
class EditGroupName extends PureComponent {
  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;

    form.validateFields(
      {
        force: true
      },
      (err, vals) => {
        if (!err && onOk) {
          onOk(vals);
        }
      }
    );
  };
  render() {
    const {
      title,
      onCancel,
      form,
      loading = false,
      group_name: groupName,
      group_note: groupNote
    } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    return (
      <Modal
        title={title || ''}
        visible
        onCancel={onCancel}
        onOk={this.onOk}
        confirmLoading={loading}
        className={styless.TelescopicModal}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_name', {
              initialValue: groupName || '',
              rules: [
                {
                  required: true,
                  message: '请填写应用名称'
                }
              ]
            })(<Input placeholder="请填写应用名称" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="应用备注">
            {getFieldDecorator('group_note', {
              initialValue: groupNote || ''
            })(<Input.TextArea placeholder="请填写应用备注信息" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(({ user, groupControl, teamControl, enterprise, loading }) => ({
  buildShapeLoading: loading.effects['global/buildShape'],
  addGroupLoading: loading.effects['groupControl/addGroup'],
  editGroupLoading: loading.effects['groupControl/editGroup'],
  deleteLoading: loading.effects['groupControl/delete'],
  currUser: user.currentUser,
  apps: groupControl.apps,
  groupDetail: groupControl.groupDetail || {},
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise
}))
class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      type: 'shape',
      toDelete: false,
      toEdit: false,
      toAdd: false,
      service_alias: [],
      linkList: [],
      jsonDataLength: 0,
      promptModal: false,
      code: '',
      size: 'large',
      currApp: {},
      loadingDetail: true,
      rapidCopy: false,
      componentTimer: true
    };
  }

  componentDidMount() {
    this.loading();
  }

  componentWillUnmount() {
    this.closeTimer();
    const { dispatch } = this.props;
    dispatch({ type: 'groupControl/clearGroupDetail' });
  }

  getGroupId() {
    return this.props.appID;
  }
  closeTimer = () => {
    if (this.timer) {
      clearInterval(this.timer);
    }
  };
  loading = () => {
    this.fetchAppDetail();
    this.loadTopology(true);
  };

  loadTopology(isCycle) {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    cookie.set('team_name', team_name);
    cookie.set('region_name', region_name);

    dispatch({
      type: 'global/fetAllTopology',
      payload: {
        region_name,
        team_name,
        groupId: this.getGroupId()
      },
      callback: res => {
        if (res && res._code == 200) {
          const data = res.bean;
          if (JSON.stringify(data) === '{}') {
            return;
          }
          const service_alias = [];
          const { json_data } = data;
          this.setState({ jsonDataLength: Object.keys(json_data).length });
          Object.keys(json_data).map(key => {
            if (
              json_data[key].cur_status == 'running' &&
              json_data[key].is_internet == true
            ) {
              service_alias.push(json_data[key].service_alias);
            }
          });
          this.setState({ service_alias }, () => {
            this.loadLinks(service_alias.join('-'), isCycle);
          });
        }
      }
    });
  }

  loadLinks(service_alias, isCycle) {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/queryLinks',
      payload: {
        service_alias,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              linkList: res.list || []
            },
            () => {
              if (isCycle) {
                this.handleTimers(
                  'timer',
                  () => {
                    this.loadTopology(true);
                  },
                  10000
                );
              }
            }
          );
        }
      },
      handleError: err => {
        this.handleError(err);
        this.handleTimers(
          'timer',
          () => {
            this.loadTopology(true);
          },
          20000
        );
      }
    });
  }
  handleError = err => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    if (err && err.data && err.data.msg_show) {
      notification.warning({
        message: `请求错误`,
        description: err.data.msg_show
      });
    }
  };
  handleTimers = (timerName, callback, times) => {
    const { componentTimer } = this.state;
    if (!componentTimer) {
      return null;
    }
    this[timerName] = setTimeout(() => {
      callback();
    }, times);
  };

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    this.setState({ loadingDetail: true });
    dispatch({
      type: 'groupControl/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            currApp: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        const { componentTimer } = this.state;
        if (!componentTimer) {
          return null;
        }
        if (res && res.code === 404) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  handleFormReset = () => {
    const { form } = this.props;
    form.resetFields();
    this.loadApps();
  };
  handleSearch = e => {
    e.preventDefault();
    this.loadApps();
  };
  changeType = type => {
    this.setState({ type });
  };
  toDelete = () => {
    this.closeComponentTimer();
    this.setState({ toDelete: true });
  };
  cancelDelete = (isOpen = true) => {
    this.setState({ toDelete: false });
    if (isOpen) {
      this.openComponentTimer();
    }
  };

  closeComponentTimer = () => {
    this.setState({ componentTimer: false });
    this.closeTimer();
  };
  openComponentTimer = () => {
    this.setState({ componentTimer: true }, () => {
      this.loadTopology(true);
    });
  };

  handleDelete = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'groupControl/delete',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: '删除成功' });
          this.closeComponentTimer();
          this.cancelDelete(false);
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  newAddress = grid => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: list => {
        if (list && list.length) {
          if (grid == list[0].group_id) {
            this.newAddress(grid);
          } else {
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                  list[0].group_id
                }`
              )
            );
          }
        } else {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };

  toEdit = () => {
    this.setState({ toEdit: true });
  };
  cancelEdit = () => {
    this.setState({ toEdit: false });
  };
  handleEdit = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: 'groupControl/editGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        group_name: vals.group_name,
        group_note: vals.group_note
      },
      callback: () => {
        this.handleUpDataHeader();
        this.cancelEdit();
        this.fetchAppDetail();
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });
      }
    });
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: true }
    });
  };
  toAdd = () => {
    this.setState({ toAdd: true });
  };
  cancelAdd = () => {
    this.setState({ toAdd: false });
  };

  handleAdd = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: 'groupControl/addGroup',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_name: vals.group_name,
        group_note: vals.group_note
      },
      callback: () => {
        notification.success({ message: '添加成功' });
        this.cancelAdd();
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });
      }
    });
  };

  /** 构建拓扑图 */
  handleTopology = code => {
    this.setState({
      promptModal: true,
      code
    });
  };

  handleOpenRapidCopy = () => {
    this.setState({
      rapidCopy: true
    });
  };

  handleCloseRapidCopy = () => {
    this.setState({
      rapidCopy: false
    });
  };

  handlePromptModalOpen = () => {
    const { code } = this.state;
    const { dispatch } = this.props;
    dispatch({
      type: 'global/buildShape',
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        action: code
      },
      callback: data => {
        notification.success({
          message: data.msg_show || '构建成功',
          duration: '3'
        });
        this.handlePromptModalClose();
        this.loadTopology(false);
      }
    });
  };

  handlePromptModalClose = () => {
    this.setState({
      promptModal: false,
      code: ''
    });
  };
  handleSizeChange = e => {
    this.setState({ size: e.target.value });
  };

  render() {
    const {
      groupDetail,
      appID,
      currentEnterprise,
      currentTeam,
      currentRegionName,
      appPermissions: {
        isCreate,
        isEdit,
        isDelete,
        isStart,
        isStop,
        isUpdate,
        isConstruct,
        isCopy
      },
      buildShapeLoading,
      addGroupLoading,
      editGroupLoading,
      deleteLoading,
      componentPermissions,
      componentPermissions: {
        isAccess: isComponentDescribe,
        isCreate: isComponentCreate,
        isConstruct: isComponentConstruct
      }
    } = this.props;
    const {
      loadingDetail,
      currApp,
      rapidCopy,
      jsonDataLength,
      linkList,
      code,
      toAdd,
      promptModal,
      toEdit,
      toDelete,
      type
    } = this.state;
    if (groupDetail.group_id != appID && !loadingDetail) {
      this.fetchAppDetail();
    }

    const codeObj = {
      start: '启动',
      restart: '重启',
      stop: '停用',
      deploy: '构建'
    };

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div style={{ display: 'flex' }}>
          <div style={{ marginTop: '3px' }}>
            {globalUtil.fetchSvg('application')}
          </div>
          <div className={styles.content}>
            <div className={styles.contentTitle}>
              {currApp.group_name || '-'}
              {isEdit && (
                <Icon
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={this.toEdit}
                  type="edit"
                />
              )}
            </div>
            <div className={styles.content_Box}>
              {isCreate && (
                <a onClick={this.toAdd} href="javascript:;">
                  新增
                </a>
              )}
              {isDelete && (
                <span>
                  <Divider type="vertical" />

                  <a onClick={this.toDelete} href="javascript:;">
                    删除
                  </a>
                </span>
              )}
              {isStop && (
                <span>
                  <Divider type="vertical" />
                  <a
                    onClick={() => {
                      this.handleTopology('stop');
                    }}
                    href="javascript:;"
                  >
                    停用
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    const BtnDisabled = !(jsonDataLength > 0);
    const MR = { marginRight: '10px' };

    const extraContent = (
      <div className={styles.extraContent}>
        {isStart && (
          <Button
            style={MR}
            onClick={() => {
              this.handleTopology('start');
            }}
            disabled={BtnDisabled}
          >
            启动
          </Button>
        )}

        {isUpdate && (
          <Button
            style={MR}
            onClick={() => {
              this.handleTopology('upgrade');
            }}
            disabled={BtnDisabled}
          >
            更新
          </Button>
        )}
        {isConstruct && isComponentConstruct && (
          <Button
            style={MR}
            disabled={BtnDisabled}
            onClick={() => {
              this.handleTopology('deploy');
            }}
          >
            构建
          </Button>
        )}
        {isCopy && (
          <Button
            style={MR}
            disabled={BtnDisabled}
            onClick={this.handleOpenRapidCopy}
          >
            快速复制
          </Button>
        )}
        {linkList.length > 0 && <VisterBtn linkList={linkList} />}
      </div>
    );
    let breadcrumbList = [];

    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: groupDetail.group_name, appID: groupDetail.group_id }
    );
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        loading={loadingDetail}
        content={pageHeaderContent}
        extraContent={
          <Row>
            <Col span={24} style={{ paddingTop: '10px' }}>
              {extraContent}
            </Col>
          </Row>
        }
      >
        <Row
          style={{
            display: 'flex',
            background: '#FFFFFF',
            height: '60px',
            alignItems: 'center',
            borderBottom: '1px solid #e8e8e8'
          }}
        >
          <Col span={16} style={{ paddingleft: '12px' }}>
            <a
              onClick={() => {
                this.changeType('shape');
              }}
              style={{
                marginLeft: '30px',
                color: type !== 'list' ? '#1890ff' : 'rgba(0, 0, 0, 0.65)'
              }}
            >
              拓扑图
            </a>
            {isComponentDescribe && (
              <a
                onClick={() => {
                  this.changeType('list');
                }}
                style={{
                  marginLeft: '30px',
                  color: type === 'list' ? '#1890ff' : 'rgba(0, 0, 0, 0.65)'
                }}
              >
                列表
              </a>
            )}
          </Col>

          <Col span={4} style={{ textAlign: 'right' }}>
            {isComponentCreate && isComponentConstruct && (
              <AddThirdParty
                groupId={this.getGroupId()}
                refreshCurrent={() => {
                  this.loading();
                }}
                onload={() => {
                  this.setState({ type: 'spin' }, () => {
                    this.setState({
                      type: this.state.size == 'large' ? 'shape' : 'list'
                    });
                  });
                }}
              />
            )}
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            {isComponentCreate && isComponentConstruct && (
              <AddServiceComponent
                groupId={this.getGroupId()}
                refreshCurrent={() => {
                  this.loading();
                }}
                onload={() => {
                  this.setState({ type: 'spin' }, () => {
                    this.setState({
                      type: this.state.size == 'large' ? 'shape' : 'list'
                    });
                  });
                }}
              />
            )}
          </Col>
        </Row>
        {rapidCopy && (
          <RapidCopy
            on={this.handleCloseRapidCopy}
            onCancel={this.handleCloseRapidCopy}
            title="应用复制"
          />
        )}

        {type !== 'list' && isComponentCreate && (
          <Row
            style={{
              textAlign: 'right',
              paddingTop: '16px',
              paddingRight: '20px',
              background: '#fff'
            }}
          >
            {type === 'shapes' ? (
              <a
                onClick={() => {
                  this.changeType('shape');
                }}
              >
                切换到展示模式
              </a>
            ) : (
              <a
                onClick={() => {
                  this.changeType('shapes');
                }}
              >
                切换到编辑模式
              </a>
            )}
          </Row>
        )}

        {type === 'list' && (
          <ComponentList
            componentPermissions={componentPermissions}
            groupId={this.getGroupId()}
          />
        )}
        {type === 'shape' && <AppShape group_id={this.getGroupId()} />}
        {type === 'spin' && <Spin />}
        {type === 'shapes' && (
          <EditorTopology
            changeType={types => {
              this.changeType(types);
            }}
            group_id={this.getGroupId()}
          />
        )}
        {toDelete && (
          <ConfirmModal
            title="删除应用"
            desc="确定要此删除此应用吗？"
            subDesc="此操作不可恢复"
            loading={deleteLoading}
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
          />
        )}
        {toEdit && (
          <EditGroupName
            group_name={groupDetail.group_name}
            group_note={groupDetail.group_note}
            loading={editGroupLoading}
            title="修改应用信息"
            onCancel={this.cancelEdit}
            onOk={this.handleEdit}
          />
        )}
        {toAdd && (
          <EditGroupName
            title="添加新应用"
            loading={addGroupLoading}
            onCancel={this.cancelAdd}
            onOk={this.handleAdd}
          />
        )}
        {promptModal && (
          <Modal
            title="友情提示"
            confirmLoading={buildShapeLoading}
            visible={promptModal}
            onOk={this.handlePromptModalOpen}
            onCancel={this.handlePromptModalClose}
          >
            <p>{codeObj[code]}当前应用下的全部组件？</p>
          </Modal>
        )}
      </PageHeaderLayout>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user, teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    currUser: user.currentUser
  }),
  null,
  null,
  {
    pure: false
  }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appPermissions: this.handlePermissions('queryAppInfo'),
      componentPermissions: this.handlePermissions('queryComponentInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      appPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  getGroupId() {
    const { params } = this.props.match;
    return params.appID;
  }
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    return (
      <Main
        key={this.getGroupId()}
        appID={this.getGroupId()}
        {...this.props}
        {...this.state}
      />
    );
  }
}
