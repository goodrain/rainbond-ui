/* eslint-disable react/sort-comp */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import { Button, Card, Drawer, Form, Table } from 'antd';
import React, { PureComponent } from 'react';
import CodeMirrorForm from '../../components/CodeMirrorForm';
import styles from './index.less';

@Form.create()
class Index extends PureComponent {
  state = { visible: false };

  showDrawer = () => {
    this.setState({
      visible: true
    });
  };

  onClose = () => {
    this.setState({
      visible: false
    });
  };
  handleConfigurationOperation = () => {
    this.setState({ visible: true });
  };
  handleSubmit = () => {
    const { form } = this.props;
    form.validateFields((err, val) => {
      //   if (err) return;
      console.log(val, 'val');
    });
  };
  render() {
    const columns = [
      {
        title: '资源名称',
        dataIndex: 'name',
        key: 'name',
        align: 'center',
        width:200
      },
      {
        title: '资源类型',
        dataIndex: 'type',
        key: 'type',
        align: 'center',
        width:200
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: () => {
          return <span style={{color:'green'}}>创建成功</span>;
        }
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        align:'center',
        width:200,
        render: () => {
          return (
            <>
              <span className={styles.action}>编辑</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles.action}>删除</span>
            </>
          );
        }
      }
    ];
    const dataSource = [
      {
        key: '1',
        name: '胡彦斌',
        type: 'secert',
        status: '成功',
        reason: 'XXXX'
      },
      {
        key: '2',
        name: '胡彦祖',
        type: 'secert',
        status: '失败',
        reason: 'YYYY'
      }
    ];
    const {
      form: { getFieldDecorator, setFieldsValue }
    } = this.props;
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
          <Table dataSource={dataSource} columns={columns} />
        </Card>
        <Drawer
          title="添加资源配置"
          placement="right"
          width="400"
          onClose={this.onClose}
          visible={this.state.visible}
        >
          <Form {...formItemLayout}>
            <Form.Item label="yaml">
              {getFieldDecorator('yaml', {
                // rules: [{ required: true, message: 'yaml配置文件不能为空' }]
              })(
                <CodeMirrorForm
                  setFieldsValue={setFieldsValue}
                  Form={Form}
                  getFieldDecorator={getFieldDecorator}
                  name="file_content"
                  message="yaml配置文件不能为空"
                />
              )}
            </Form.Item>
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
