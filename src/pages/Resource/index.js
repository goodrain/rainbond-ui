/* eslint-disable react/sort-comp */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import { Button, Card, Drawer, Form, Table, notification, Popover } from 'antd';
import React, { PureComponent } from 'react';
import globalUtil from "../../utils/global"
import CodeMirrorForm from '../../components/CodeMirrorForm';
import { getKubernetesVal, getSingleKubernetesVal, addSingleKubernetesVal, delSingleKubernetesVal, editSingleKubernetesVal } from "../../services/application"

import ConfirmModal from "../../components/ConfirmModal"
import styles from './index.less';

@Form.create()
class Index extends PureComponent {
  state = {
    visible: false,
    content: [],
    localContent: "",
    type: "add",
    title: "新增",
    showDeletePort: false,
    deleteVal: {},
    editName: '',
    editId: 0,
  };
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
      if (res && res.response_data  && res.response_data.code == 200) {
        this.setState({
          content: res.list,
          localContent: "",
        })
      }
    })
  }
  onClose = () => {
    this.setState({
      localContent: "",
      visible: false,
    });
  };
  // 新增
  handleConfigurationOperation = (val) => {
    const { type, localContent } = this.state
    this.setState({
      visible: true,
      title: "新增",
      localContent: "",
      type: "add"
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
      if (res && res.response_data  &&  res.response_data.code == 200) {
        notification.success({
          message: '删除成功'
        })
        this.getPageContent()
      }
      this.setState({
        showDeletePort: !this.state.showDeletePort,
        visible: false
      })
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
        if (res && res.response_data  &&  res.response_data.code == 200) {
          notification.success({
            message: '添加完成'
          })
          this.getPageContent()
        } else {
          notification.error({
            message: '添加失败'
          })
        }
        this.setState({
          visible: false
        })
      })
    } else if (type == "edit") {
      editSingleKubernetesVal({
        team_name: teamName,
        app_id: app_id,
        list_name: this.state.editName,
        yaml: list.yaml,
        List_id: editId,
      }).then(res => {
        if (res && res.response_data  &&  res.response_data.code == 200) {
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
        this.setState({
          visible: false
        })
      })
    }
  }
  render() {
    const {
      form: { getFieldDecorator, setFieldsValue }
    } = this.props;
    const { content, localContent, title } = this.state;
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
        title: '资源名称',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
        width: 300
      },
      {
        title: '资源类型',
        dataIndex: 'kind',
        key: 'kind',
        align: 'center',
        width: 200
      },
      {
        title: '状态',
        dataIndex: 'success',
        key: 'success',
        align: 'center',
        width: 200,
        render: (text, record) => {
          return <div>
            {text == 1 && <span style={{ color: 'green' }}>创建成功</span>}
            {text == 2 && <span style={{ color: 'green' }}>更新成功</span>}
            {text == 3 &&
              <>
                <span style={{ color: 'red' }}>创建失败</span>
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title="失败详情"
                  content={record.status.substr(4)}
                  trigger="hover"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    查看详情
                  </span>
                </Popover>
              </>
            }
            {text == 4 &&
              <div >
                <span style={{ color: 'red' }}>更新失败</span>
                <Popover
                  overlayClassName={styles.tooltip_style}
                  placement="bottom"
                  title="失败详情"
                  content={record.status.substr(4)}
                  trigger="click"
                >
                  <span
                    style={{ marginLeft: "20px", color: "#5672ac", cursor: "pointer" }}
                  >
                    查看详情
                  </span>
                </Popover>
              </div>
            }
          </div>
        }
      },
      {
        title: '操作',
        dataIndex: 'content',
        key: 'content',
        align: 'center',
        width: 200,
        render: (text, record) => {
          return (
            <>
              {record.success === 3 ? (
                  <span className={styles.action} onClick={() => this.editErrButton("edit", record)} style={{ marginRight: "10px" }}>查看</span>
              ) : (
                <span className={styles.action} onClick={() => this.editButton("edit", record)} style={{ marginRight: "10px" }}>编辑</span>
              )
              }
              <span className={styles.action} onClick={() => this.deleteButton(record)}>删除</span>
            </>
          );
        }
      }
    ];

    return (
      <PageHeaderLayout
        title="K8s 资源管理"
        content="此处管理直接通过 Yaml 文件部署到 Kubernetes 集群中的资源。"
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
            添加配置组
          </Button>
        </div>
        <Card>
          <Table dataSource={content} columns={columns} />
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
              data={localContent || ""}
              mode={'yaml'}
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
            <Button onClick={this.handleSubmit} type="primary">
              确定
            </Button>
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
