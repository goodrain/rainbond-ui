/* eslint-disable react/sort-comp */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import { Button, Card, Drawer, Form, Table, notification, Popover, Spin } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from "../../utils/global"
import CodeMirrorForm from '../../components/CodeMirrorForm';
import { getKubernetesVal, getSingleKubernetesVal, addSingleKubernetesVal, delSingleKubernetesVal, editSingleKubernetesVal } from "../../services/application";
import ConfirmModal from "../../components/ConfirmModal";
import styles from './index.less';

@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      content: [],
      localContent: '',
      type: "add",
      title: "新增",
      showDeletePort: false,
      deleteVal: {},
      editName: '',
      editId: 0,
      isSubmit: true,
      loadingSwitch: true,
      TooltipValue:'#请填写yaml文件'
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
          localContent: '',
          loadingSwitch:false
        })
      }
    })
  }
  onClose = () => {
    this.setState({
      visible: false,
      isSubmit: true,
      type:'add'
    });
  };
  // 新增
  handleConfigurationOperation = () => {
    this.setState({
      visible: true,
      title: "新增",
      type: "add",
      localContent: '#请填写yaml文件',
    });
  };
  handleSubmit = () => {
    const { form } = this.props;
    form.validateFields((err, val) => {
      const label = {
        yaml: val.yaml
      }
      if (val.yaml) {
        this.handelAddOrEdit(label)
      } else {
        notification.error({
          message: 'yaml文件内容不能为空'
        })
      }
    });
  };
  // 编辑
  editButton = (val, row) => {
    this.setState({
      type: val,
      visible: true,
      editName: row.name,
      localContent: row.content,
      editId: row.ID,
      title: "修改"
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
    this.setState({
      showDeletePort: !this.state.showDeletePort
    })
    this.setState({
      deleteVal: val,
    })
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
          message: '删除成功'
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
            message: '添加完成'
          })
          this.getPageContent()
        } else {
          notification.error({
            message: '添加失败'
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
            message: '修改成功'
          })
          this.getPageContent()
        } else {
          notification.error({
            message: '修改失败'
          })
          this.getPageContent()
        }
      })
    }
    this.setState({
      visible: false,
    })
  }
  render() {
    const {
      form: { getFieldDecorator, setFieldsValue },

    } = this.props;
    const { content, localContent, title, isSubmit, loadingSwitch, TooltipValue, type } = this.state;
    const isBool = (type == "add") ? true : false 
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
        title: formatMessage({id: 'addKubenetesResource.table.name'}),
        dataIndex: 'name',
        key: 'name',
        align: 'center',
        width: 300
      },
      {
        title: formatMessage({id: 'addKubenetesResource.table.type'}),
        dataIndex: 'kind',
        key: 'kind',
        align: 'center',
        width: 200
      },
      {
        title: formatMessage({id: 'addKubenetesResource.table.status'}),
        dataIndex: 'state',
        key: 'state',
        align: 'center',
        width: 200,
        render: (text, record) => {
          return <div>
            {text == 1 && <span style={{ color: 'green' }}>{formatMessage({id: 'addKubenetesResource.table.success'})}</span>}
            {text == 2 && <span style={{ color: 'green' }}>{formatMessage({id: 'addKubenetesResource.table.update_success'})}</span>}
            {text == 3 &&
              <>
                <span style={{ color: 'red' }}>{formatMessage({id: 'addKubenetesResource.table.error'})}</span>
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title="失败详情"
                  content={record.error_overview}
                  trigger="click"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    {formatMessage({id: 'addKubenetesResource.table.checkDetail'})}
                  </span>
                </Popover>
              </>
            }
            {text == 4 &&
              <div >
                <span style={{ color: 'red' }}>{formatMessage({id: 'addKubenetesResource.table.update_error'})}</span>
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title={formatMessage({id: 'addKubenetesResource.table.errorDetail'})}
                  content={record.error_overview}
                  trigger="click"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    {formatMessage({id: 'addKubenetesResource.table.checkDetail'})}
                  </span>
                </Popover>
              </div>
            }
          </div>
        }
      },
      {
        title: formatMessage({id: 'addKubenetesResource.table.operate'}),
        dataIndex: 'content',
        key: 'content',
        align: 'center',
        width: 200,
        render: (text, record) => {
          return (
            <>
              {record.state === 3 ? (
                <span className={styles.action} onClick={() => this.editErrButton("edit", record)} style={{ marginRight: "10px" }}>{formatMessage({id: 'addKubenetesResource.table.btn.check'})}</span>
              ) : (
                <span className={styles.action} onClick={() => this.editButton("edit", record)} style={{ marginRight: "10px" }}>{formatMessage({id: 'addKubenetesResource.table.btn.edit'})}</span>
              )
              }
              <span className={styles.action} onClick={() => this.deleteButton(record)}>{formatMessage({id: 'addKubenetesResource.table.btn.delete'})}</span>
            </>
          );
        }
      }
    ];

    return (
      <PageHeaderLayout
        title={formatMessage({id: 'addKubenetesResource.title'})}
        content={formatMessage({id: 'addKubenetesResource.desc'})}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '24px'
          }}
        >
          <Button
            type="primary"
            icon="plus"
            onClick={() => {
              this.handleConfigurationOperation();
            }}
          >
            {formatMessage({id: 'addKubenetesResource.btn.add'})}
          </Button>
        </div>
        <Card>
          {loadingSwitch ? (
            <div className={styles.loadingStyle}>
              <Spin size="large" />
            </div>
          ): (
              <Table dataSource = { content } columns = { columns } />

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
              message="请编辑内容"
              data={localContent || "" }
              mode={'yaml'}
              TooltipValue={TooltipValue}
              bool={ isBool }
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
              取消
            </Button>
            {isSubmit &&
              <Button onClick={this.handleSubmit} type="primary">
                确定
              </Button>
            }
          </div>
        </Drawer>
        {this.state.showDeletePort && (
          <ConfirmModal
            title="属性删除"
            desc="确定要删除此属性吗？"
            subDesc="此操作不可恢复"
            onOk={this.handleDel}
            onCancel={this.cancalDeletePort}
          />
        )}
      </PageHeaderLayout>
    );
  }
}

export default Index;
