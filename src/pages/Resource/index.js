/* eslint-disable react/sort-comp */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import { Button, Card, Drawer, Form, Table, notification, Popover, Spin } from 'antd';
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from "../../utils/global"
import roleUtil from '../../utils/newRole';
import jsYaml from 'js-yaml'
import CodeMirrorForm from '../../components/CodeMirrorForm';
import { getKubernetesVal, getSingleKubernetesVal, addSingleKubernetesVal, delSingleKubernetesVal, editSingleKubernetesVal } from "../../services/application";
import ConfirmModal from "../../components/ConfirmModal";
import pageheaderSvg from '@/utils/pageHeaderSvg';
import styles from './index.less';

@connect(({ teamControl }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
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
    };
  }
  componentDidMount() {
    this.getPageContent()
  }
  getPageContent = () => {
    const teamName = globalUtil.getCurrTeamName();
    const app_id = globalUtil.getAppID();
    getKubernetesVal({
      team_name: teamName,
      app_id: app_id,
    }).then(res => {
      if (res && res.response_data && res.response_data.code == 200) {
        this.setState({
          content: res.list,
          localContent: ' ',
          loadingSwitch: false
        })
      }
    })
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
  deleteButton = (val) => {
    if (val) {
      this.setState({
        showDeletePort: !this.state.showDeletePort
      })
      this.setState({
        deleteVal: val,
      })
    } else {
      this.setState({
        showDeletePort: !this.state.showDeletePort
      })
    }
  }
  // 删除
  handleDel = () => {
    const { deleteVal } = this.state
    const teamName = globalUtil.getCurrTeamName();
    const app_id = globalUtil.getAppID();
    delSingleKubernetesVal({
      team_name: teamName,
      app_id: app_id,
      yaml: deleteVal.content,
      list_name: deleteVal.name,
      List_id: deleteVal.ID
    }).then(res => {
      if (res && res.response_data && res.response_data.code == 200) {
        notification.success({
          message: formatMessage({ id: 'notification.success.delete' })
        })
        this.getPageContent()
      }
    })
    this.setState({
      showDeletePort: !this.state.showDeletePort,
      visible: false,
    })
  }
  cancalDeletePort = () => {
    this.setState({
      showDeletePort: !this.state.showDeletePort
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
    const { selectedRowKeys } = this.state;
    const { dispatch } = this.props;
    const teamName = globalUtil.getCurrTeamName()
    const app_id = globalUtil.getAppID();
    this.setState({
      handelType: "multiple"
    })
    dispatch({
      type: 'application/batchDelSingleKubernetesVal',
      payload: {
        List_id: selectedRowKeys,
        team_name: teamName,
        app_id: app_id,
      },
      callback: data => {
        notification.success({
          message: formatMessage({ id: 'notification.success.delete' })
        })
        this.setState({
          showDeletePort: !this.state.showDeletePort,
          selectedRowKeys: []
        }, () => {
          this.getPageContent()
        })

      },
      handleError: (err) => {
        notification.error({
          message: formatMessage({ id: 'notification.error.delete' })
        })
        this.setState({
          showDeletePort: !this.state.showDeletePort,
          selectedRowKeys: []
        }, () => {
          this.getPageContent()
        })
      }
    });
  }
  render() {
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
      }
    } = this.state;
    if (!isAccess) {
      return roleUtil.noPermission()
    }
    const isBool = (type == "add") ? true : false
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
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
                  this.setState({
                    handelType: 'single'
                  })
                  this.deleteButton(record)
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
      >
        <Card
          className={styles.CardStyle}
          style={{
            borderRadius: 5
          }}
          extra={
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: isDelete && selectedRowKeys && selectedRowKeys.length > 0 ? 'space-between' : "end"
              }}
            >
              {isDelete && selectedRowKeys && selectedRowKeys.length > 0 &&
                <Button
                  type="primary"
                  onClick={() => {
                    this.deleteButton();
                    this.setState({
                      handelType: 'multiple'
                    })
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
          }
        >
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
            />

          )}

        </Card>
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
          />
        )}
      </PageHeaderLayout>
    );
  }
}

export default Index;
