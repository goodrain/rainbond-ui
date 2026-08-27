/* eslint-disable react/sort-comp */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import { Button, Drawer, Form, Table, notification, Popover, Spin, Tag } from 'antd';
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import globalUtil from "../../utils/global"
import roleUtil from '../../utils/newRole';
import jsYaml from 'js-yaml'
import CodeMirrorForm from '../../components/CodeMirrorForm';
import { getKubernetesVal, getSingleKubernetesVal, addSingleKubernetesVal, delSingleKubernetesVal, editSingleKubernetesVal } from "../../services/application";
import ConfirmModal from "../../components/ConfirmModal";
import pageheaderSvg from '@/utils/pageHeaderSvg';
import Exception from '../Exception/403';
import styles from './index.less';

@connect(({ teamControl, global, user }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  rainbondInfo: global.rainbondInfo,
  currentUser: user.currentUser
}))
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      content: [],
      localContent: '',
      type: "add",
      title: formatMessage({ id: 'addKubenetesResource.btn.add' }),
      showDeletePort: false,
      deleteVal: {},
      editName: '',
      editId: 0,
      isSubmit: true,
      loadingSwitch: true,
      resourcePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app_resources', `app_${globalUtil.getAppID()}`),
      page: 1,
      pageSize: 10,
      total: 0,
      selectedRowKeys: [],
      isDeletionSubmitting: false
    };
    this.deletePollingTimer = null;
    this.pageRequestSequence = 0;
    this.isUnmounted = false;
  }
  componentDidMount() {
    this.isUnmounted = false;
    if (!this.canAccessAppK8sResources()) {
      return;
    }
    this.getPageContent()
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    this.clearDeletionPolling();
  }

  canAccessAppK8sResources = () => {
    const { rainbondInfo, currentUser } = this.props;
    const isSaas = !!(rainbondInfo && rainbondInfo.is_saas);
    return !isSaas || !!(currentUser && currentUser.is_enterprise_admin);
  };
  isDeletionPending = record => record && record.delete_status === 'DELETING';

  isDeletionFailed = record => record && record.delete_status === 'DELETE_FAILED';

  clearDeletionPolling = () => {
    if (this.deletePollingTimer) {
      clearTimeout(this.deletePollingTimer);
      this.deletePollingTimer = null;
    }
  };

  scheduleDeletionPolling = content => {
    this.clearDeletionPolling();
    if (
      !this.isUnmounted &&
      Array.isArray(content) &&
      content.some(this.isDeletionPending)
    ) {
      this.deletePollingTimer = setTimeout(() => {
        this.deletePollingTimer = null;
        this.getPageContent();
      }, 3000);
    }
  };

  isRequestAccepted = res => {
    const businessCode = res && res.response_data && res.response_data.code;
    const statusCode = res && (res.status_code || res._code);
    return Number(businessCode) === 200 || Number(statusCode) === 202;
  };

  getPageContent = () => {
    this.clearDeletionPolling();
    const requestSequence = this.pageRequestSequence + 1;
    this.pageRequestSequence = requestSequence;
    const teamName = globalUtil.getCurrTeamName();
    const app_id = globalUtil.getAppID();
    return getKubernetesVal({
      team_name: teamName,
      app_id: app_id,
    }).then(res => {
      if (this.isUnmounted || requestSequence !== this.pageRequestSequence) {
        return;
      }
      if (this.isRequestAccepted(res)) {
        const content = Array.isArray(res.list) ? res.list : [];
        const selectableRecordIDs = content.reduce((ids, record) => {
          if (!this.isDeletionPending(record)) {
            ids[String(record.ID)] = true;
          }
          return ids;
        }, {});
        this.setState(previousState => ({
          content,
          localContent: ' ',
          loadingSwitch: false,
          selectedRowKeys: (previousState.selectedRowKeys || []).filter(
            resourceID => selectableRecordIDs[String(resourceID)]
          )
        }), () => this.scheduleDeletionPolling(content));
      } else {
        this.setState({ loadingSwitch: false });
      }
    }).catch(() => {
      if (!this.isUnmounted && requestSequence === this.pageRequestSequence) {
        this.setState({ loadingSwitch: false });
      }
    });
  }
  onClose = () => {
    this.setState({
      visible: false,
      isSubmit: true,
      type: 'add'
    });
  };
  // 新增
  handleConfigurationOperation = () => {
    this.setState({
      visible: true,
      title: formatMessage({ id: 'addKubenetesResource.btn.add' }),
      type: "add",
      localContent: false,
    });
  };
  handleSubmit = () => {
    const { form } = this.props;
    form.validateFields((err, val) => {
      const label = {
        yaml: val.yaml
      }
      const yamlValidation = this.handYamlValidation(val.yaml)
      if (yamlValidation) {
        if (val.yaml) {
          this.handelAddOrEdit(label)
        } else {
          notification.error({
            message: formatMessage({ id: 'notification.hint.resource.msg' })
          })
        }
      }
    });
  };
  // 编辑
  editButton = (val, row) => {
    const teamName = globalUtil.getCurrTeamName();
    const app_id = globalUtil.getAppID();
    getSingleKubernetesVal({
      team_name: teamName,
      app_id: app_id,
      list_name: row.name,
      id: row.ID
    }).then(res => {
      if (res && res.response_data && res.response_data.code == 200) {
        this.setState({
          type: val,
          visible: true,
          editName: row.name,
          localContent: res.list.content,
          editId: row.ID,
          title: formatMessage({ id: 'addKubenetesResource.table.btn.edit' })
        })
      } else {
        this.setState({
          type: val,
          visible: true,
          editName: row.name,
          localContent: row.content,
          editId: row.ID,
          title: formatMessage({ id: 'addKubenetesResource.table.btn.edit' })
        })
      }
    })
  }
  editErrButton = (val, row) => {
    this.setState({
      title: "yaml",
      visible: true,
      localContent: row.content,
      isSubmit: false
    })
  }
  // 删除提示框弹出
  deleteButton = (val, handelType) => {
    if (this.state.isDeletionSubmitting) {
      return;
    }
    this.setState({
      showDeletePort: true,
      deleteVal: val || {},
      handelType
    });
  };

  completeDeletion = submitted => {
    if (this.isUnmounted) {
      return;
    }
    if (submitted) {
      notification.success({
        message: formatMessage({ id: 'addKubenetesResource.notification.deleteSubmitted' })
      });
    } else {
      notification.error({
        message: formatMessage({ id: 'notification.error.delete' })
      });
    }
    this.setState({
      showDeletePort: false,
      visible: false,
      isDeletionSubmitting: false,
      selectedRowKeys: []
    }, () => {
      if (submitted) {
        this.getPageContent();
      }
    });
  };
  // 删除
  handleDel = () => {
    const { deleteVal, isDeletionSubmitting } = this.state
    if (isDeletionSubmitting) {
      return;
    }
    const teamName = globalUtil.getCurrTeamName();
    const app_id = globalUtil.getAppID();
    this.setState({ isDeletionSubmitting: true });
    delSingleKubernetesVal({
      team_name: teamName,
      app_id: app_id,
      yaml: deleteVal.content,
      list_name: deleteVal.name,
      List_id: deleteVal.ID
    }).then(res => {
      this.completeDeletion(this.isRequestAccepted(res));
    }).catch(() => this.completeDeletion(false));
  }
  cancalDeletePort = () => {
    this.setState({
      showDeletePort: false
    })
  }
  handelAddOrEdit = (list) => {
    const teamName = globalUtil.getCurrTeamName()
    const app_id = globalUtil.getAppID();
    const { selectval, type, editId } = this.state
    // 判断是新增还是修改
    if (type == "add") {
      addSingleKubernetesVal({
        team_name: teamName,
        app_id: app_id,
        yaml: list.yaml
      }).then(res => {
        if (res && res.response_data && res.response_data.code == 200) {
          notification.success({
            message: formatMessage({ id: 'notification.success.add' })
          })
          this.getPageContent()
        } else {
          notification.error({
            message: formatMessage({ id: 'notification.error.add' })
          })
          this.getPageContent()
        }
      })
    } else if (type == "edit") {
      editSingleKubernetesVal({
        team_name: teamName,
        app_id: app_id,
        list_name: this.state.editName,
        yaml: list.yaml,
        List_id: editId,
      }).then(res => {
        if (res && res.response_data && res.response_data.code == 200) {
          notification.success({
            message: formatMessage({ id: 'notification.success.change' })
          })
          this.getPageContent()
        } else {
          notification.error({
            message: formatMessage({ id: 'notification.error.change' })
          })
          this.getPageContent()
        }
      })
    }
    this.setState({
      visible: false,
    })
  }
  handYamlValidation = (value) => {
    try {
      if (value) {
        const jsonData = jsYaml.loadAll(value)
        return jsonData
      }
    } catch (e) {
      const errorInfo = e.message.indexOf("\n")
      const str = e.message.substring(0, errorInfo);
      notification.error({ message: str, duration: 30, top: 10 })
    }
  }
  onSelectChange = (selectedRowKeys) => {
    this.setState({ selectedRowKeys });
  };
  batchDeletion = () => {
    const { selectedRowKeys, isDeletionSubmitting } = this.state;
    if (isDeletionSubmitting || !selectedRowKeys || selectedRowKeys.length === 0) {
      return;
    }
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const app_id = globalUtil.getAppID();
    this.setState({
      isDeletionSubmitting: true
    })
    dispatch({
      type: 'application/batchDelSingleKubernetesVal',
      payload: {
        List_id: selectedRowKeys,
        team_name: teamName,
        app_id: app_id,
      },
      callback: data => {
        this.completeDeletion(this.isRequestAccepted(data));
      },
      handleError: () => {
        this.completeDeletion(false);
      }
    });
  }
  onPageChange = (page, pageSize) => {
    this.setState({
      page,
      pageSize
    })
  }
  render() {
    if (!this.canAccessAppK8sResources()) {
      return <Exception />;
    }

    const {
      form: { getFieldDecorator, setFieldsValue },
    } = this.props;
    const {
      content,
      localContent,
      title,
      isSubmit,
      loadingSwitch,
      TooltipValue,
      type,
      selectedRowKeys,
      handelType,
      resourcePermission,
      resourcePermission: {
        isAccess,
        isDelete,
        isCreate,
        isEdit,
      },
      page,
      pageSize,
      total,
      isDeletionSubmitting
    } = this.state;
    if (!isAccess) {
      return roleUtil.noPermission()
    }
    const paginationProps = {
      pageSize,
      total: content.length,
      page,
      current: page,
      onChange: this.onPageChange,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: (total) => `共 ${total} 条`,
      onShowSizeChange: this.onPageChange,
      hideOnSinglePage: content.length<=10
    } 
    const isBool = (type == "add") ? true : false
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      getCheckboxProps: record => ({
        disabled: this.isDeletionPending(record)
      })
    };
    const formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {

        xs: { span: 20 },
        sm: { span: 20 }
      }
    };
    const formItemLayouts = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      }
    };

    const columns = [
      {
        title: formatMessage({ id: 'addKubenetesResource.table.name' }),
        dataIndex: 'name',
        key: 'name',
        align: 'center',
        width: 300
      },
      {
        title: formatMessage({ id: 'addKubenetesResource.table.type' }),
        dataIndex: 'kind',
        key: 'kind',
        align: 'center',
        width: 200
      },
      {
        title: formatMessage({ id: 'addKubenetesResource.table.status' }),
        dataIndex: 'state',
        key: 'state',
        align: 'center',
        width: 200,
        render: (text, record) => {
          if (this.isDeletionPending(record)) {
            return <Tag color="orange">{formatMessage({ id: 'addKubenetesResource.table.deleting' })}</Tag>;
          }
          if (this.isDeletionFailed(record)) {
            const deleteError = record.delete_error || record.error_overview;
            return <div>
              <Tag color="red">{formatMessage({ id: 'addKubenetesResource.table.delete_failed' })}</Tag>
              {deleteError &&
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title={formatMessage({ id: 'addKubenetesResource.table.delete_errorDetail' })}
                  content={deleteError}
                  trigger="click"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    {formatMessage({ id: 'addKubenetesResource.table.checkDetail' })}
                  </span>
                </Popover>
              }
            </div>;
          }
          return <div>
            {text == 1 && <span style={{ color: 'green' }}>{formatMessage({ id: 'addKubenetesResource.table.success' })}</span>}
            {text == 2 && <span style={{ color: 'green' }}>{formatMessage({ id: 'addKubenetesResource.table.update_success' })}</span>}
            {text == 3 &&
              <>
                <span style={{ color: 'red' }}>{formatMessage({ id: 'addKubenetesResource.table.error' })}</span>
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title={formatMessage({ id: 'addKubenetesResource.table.errorDetail' })}
                  content={record.error_overview}
                  trigger="click"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    {formatMessage({ id: 'addKubenetesResource.table.checkDetail' })}
                  </span>
                </Popover>
              </>
            }
            {text == 4 &&
              <div >
                <span style={{ color: 'red' }}>{formatMessage({ id: 'addKubenetesResource.table.update_error' })}</span>
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title={formatMessage({ id: 'addKubenetesResource.table.errorDetail' })}
                  content={record.error_overview}
                  trigger="click"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    {formatMessage({ id: 'addKubenetesResource.table.checkDetail' })}
                  </span>
                </Popover>
              </div>
            }
          </div>
        }
      },
      {
        title: formatMessage({ id: 'addKubenetesResource.table.operate' }),
        dataIndex: 'content',
        key: 'content',
        align: 'center',
        width: 200,
        render: (text, record) => {
          if (this.isDeletionPending(record)) {
            return (
              <>
                {isEdit && <span className={styles.disabledAction}>{formatMessage({ id: 'addKubenetesResource.table.btn.edit' })}</span>}
                {isDelete && <span className={styles.disabledAction}>{formatMessage({ id: 'addKubenetesResource.table.btn.delete' })}</span>}
              </>
            );
          }
          if (this.isDeletionFailed(record)) {
            return isDelete ? (
              <span className={styles.action} onClick={() => this.deleteButton(record, 'single')}>
                {formatMessage({ id: 'addKubenetesResource.table.btn.retry_delete' })}
              </span>
            ) : null;
          }
          return (
            <>
              {isEdit && <>
                {
                  record.state === 3 ? (
                    <span className={styles.action} onClick={() => this.editErrButton("edit", record)} style={{ marginRight: "10px" }}>{formatMessage({ id: 'addKubenetesResource.table.btn.check' })}</span>
                  ) : (
                    <span className={styles.action} onClick={() => this.editButton("edit", record)} style={{ marginRight: "10px" }}>{formatMessage({ id: 'addKubenetesResource.table.btn.edit' })}</span>
                  )
                }
              </>
              }
              {isDelete &&
                <span className={styles.action} onClick={() => {
                  this.deleteButton(record, 'single')
                }
                }>
                  {formatMessage({ id: 'addKubenetesResource.table.btn.delete' })}
                </span>
              }
            </>
          );
        }
      }
    ];

    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'addKubenetesResource.title' })}
        content={formatMessage({ id: 'addKubenetesResource.desc' })}
        titleSvg={pageheaderSvg.getPageHeaderSvg('kubenetes', 18)}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview`)
            );
          }} icon="home">
            {formatMessage({ id: 'menu.app.dashboard' })}
          </Button>
        }
      >
        <div className={styles.resourceContainer}>
          <div
            className={styles.resourceHeader}
            style={{
              justifyContent: isDelete && selectedRowKeys && selectedRowKeys.length > 0 ? 'space-between' : 'flex-end'
            }}
          >
            {isDelete && selectedRowKeys && selectedRowKeys.length > 0 &&
              <Button
                type="primary"
                onClick={() => {
                  this.deleteButton(null, 'multiple');
                }}
                icon='delete'
              >
                <FormattedMessage id='componentOverview.body.tab.monitor.CustomMonitor.delete' />
              </Button>
            }
            {isCreate &&
              <Button
                type="primary"
                icon="plus"
                onClick={() => {
                  this.handleConfigurationOperation();
                }}
              >
                {formatMessage({ id: 'addKubenetesResource.btn.add' })}
              </Button>
            }
          </div>
          {loadingSwitch ? (
            <div className={styles.loadingStyle}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={content}
              columns={columns}
              rowSelection={rowSelection}
              rowKey={record => record.ID}
              pagination={paginationProps}
            />
          )}
        </div>
        <Drawer
          title={title}
          placement="right"
          width="400"
          onClose={this.onClose}
          visible={this.state.visible}
        >
          <Form {...formItemLayout}>
            <CodeMirrorForm
              setFieldsValue={setFieldsValue}
              Form={Form}
              style={{ marginBottom: '20px' }}
              getFieldDecorator={getFieldDecorator}
              formItemLayout={formItemLayouts}
              name={"yaml"}
              message={formatMessage({ id: 'notification.hint.confiuration.editContent' })}
              data={localContent || ""}
              mode={'yaml'}
              isAuto={true}
            />
          </Form>
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '100%',
              borderTop: '1px solid #e9e9e9',
              padding: '10px 16px',
              background: '#fff',
              textAlign: 'right'
            }}
          >
            <Button onClick={this.onClose} style={{ marginRight: 8 }}>
              {formatMessage({ id: 'button.cancel' })}
            </Button>
            {isSubmit &&
              <Button onClick={this.handleSubmit} type="primary">
                {formatMessage({ id: 'button.confirm' })}
              </Button>
            }
          </div>
        </Drawer>
        {this.state.showDeletePort && (
          <ConfirmModal
            title={formatMessage({ id: 'confirmModal.delete.resource.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.resource.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            onOk={handelType == "multiple" ? this.batchDeletion : this.handleDel}
            onCancel={this.cancalDeletePort}
            loading={isDeletionSubmitting}
            disabled={isDeletionSubmitting}
          />
        )}
      </PageHeaderLayout>
    );
  }
}

export default Index;
