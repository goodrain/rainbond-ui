/* eslint-disable react/sort-comp */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import { Button, Card, Drawer, Form, Table } from 'antd';
import React, { PureComponent } from 'react';
import globalUtil from "../../utils/global"
import CodeMirrorForm from '../../components/CodeMirrorForm';
import { getKubernetesVal, getSingleKubernetesVal } from "../../services/application"
import styles from './index.less';

@Form.create()
class Index extends PureComponent {
  state = {
    visible: false,
    content: [],
    localContent: "",
    type:"",
    title:"新增"
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

      if (res.response_data.code == 200) {
        this.setState({
          content: res.list,
        })
      }
    })
  }

  showDrawer = () => {
    this.setState({
      visible: true
    });
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };
  handleConfigurationOperation = () => {

    this.setState({ 
      visible: true ,
      title:"新增",
      localContent:'',
      type:"add"
    });

  };
  handleSubmit = () => {
    const { form } = this.props;
    form.validateFields((err, val) => {
      //   if (err) return;
    });
  };
  // 编辑
  editButton = (val, row) => {

    const teamName = globalUtil.getCurrTeamName();
    const app_id = globalUtil.getAppID();
    // getSingleKubernetesVal({
    //   team_name:teamName,
    //   app_id:app_id,
    //   list_name:row.name
    // }).then( res =>{
    //   console.log(res,"单个属性");
    // })
    this.setState({
      type:val,
      visible: true,
      localContent: row.content,
      title:"修改"
    })
  }
  deleteButton = (val) => {

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
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 200,
        render: () => {
          return <span style={{ color: 'green' }}>创建成功</span>;
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
              <span className={styles.action} onClick={() => this.editButton("edit",record)}>编辑</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles.action} onClick={() => this.deleteButton(record.name)}>删除</span>
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
          title= {title}
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
              data={localContent}
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
      </PageHeaderLayout>
    );
  }
}

export default Index;
