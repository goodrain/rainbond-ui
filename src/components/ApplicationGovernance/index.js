/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { Form, Modal, Select, Input, Alert, Table } from 'antd';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;

/* 转移到其他应用组 */

@Form.create()
export default class ApplicationGovernance extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      apps: [],
      page: 1,
      page_size: 6,
      total: 0
    };
  }
  onPageChange = page => {
    this.setState({ page }, () => {
      // this.getUnRelationedApp();
    });
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields((err, value) => {
      if (!err) {
        onOk(value);
      }
    });
  };
  render() {
    const list = [{ id: 1, name: '内置ServiceMesh模式' }];
    const {
      loading = false,
      currGroupID: initValue,
      onCancel,
      form
    } = this.props;
    const { getFieldDecorator } = form;
    const rowSelection = {
      onChange: selectedRowKeys => {
        this.setState({ selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys
    };
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 19
        }
      }
    };
    return (
      <Modal
        title="应用治理模式切换"
        visible
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        width={800}
      >
        <Alert
          style={{ marginBottom: '20px' }}
          message="应用治理模式主要指组件见通信模式，目前支持内置ServiceMesh模式和Kubernetes原生Service模式"
          type="info"
          showIcon
        />
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="治理模式选择">
            {getFieldDecorator('group_id', {
              initialValue: (initValue && Number(initValue)) || '',
              rules: [
                {
                  required: true,
                  message: '不能为空!'
                }
              ]
            })(
              <Select>
                {list.map(item => {
                  return (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="模式说明">
            {getFieldDecorator('volume_path', {
              initialValue: '',
              rules: [
                {
                  required: true,
                  message: '请输入模式说明'
                }
              ]
            })(<TextArea placeholder="请输入模式说明" />)}
          </FormItem>
        </Form>
        <Table
          size="middle"
          pagination={{
            current: this.state.page,
            pageSize: this.state.page_size,
            total: this.state.total,
            onChange: this.onPageChange
          }}
          dataSource={this.state.apps || []}
          rowSelection={rowSelection}
          columns={[
            {
              title: '组件名称/端口',
              dataIndex: 'group_name'
            },
            {
              title: '别名',
              dataIndex: 'service_cname'
            }
          ]}
        />
      </Modal>
    );
  }
}
