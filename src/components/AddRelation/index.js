/*
  添加依赖应用
*/
import {
  Button,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Select,
  Table
} from 'antd';
import React, { PureComponent } from 'react';
import { getUnRelationedApp } from '../../services/app';
import globalUtil from '../../utils/global';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
export default class AddRelation extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      apps: [],
      page: 1,
      page_size: 6,
      total: 0,
      search_key: '',
      condition: ''
    };
  }
  componentDidMount() {
    this.getUnRelationedApp();
  }
  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({
        message: '请选择要依赖的应用'
      });
      return;
    }

    const ids = this.state.selectedRowKeys.map(
      item => this.state.apps[item].service_id
    );
    this.props.onSubmit && this.props.onSubmit(ids);
  };
  getUnRelationedApp = () => {
    getUnRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: this.state.page,
      page_size: this.state.page_size,
      search_key: this.state.search_key,
      condition: this.state.condition
    }).then(data => {
      if (data) {
        this.setState({
          apps: data.list || [],
          total: data.total,
          selectedRowKeys: []
        });
      }
    });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  onPageChange = page => {
    this.setState({ page }, () => {
      this.getUnRelationedApp();
    });
  };
  handleSearch = e => {
    e.preventDefault();
    this.state.page = 1;
    this.getUnRelationedApp();
  };
  handleKeyChange = e => {
    this.setState({ search_key: e.target.value });
  };
  handleConditionChange = value => {
    this.setState({ condition: value });
  };
  render() {
    const rowSelection = {
      onChange: selectedRowKeys => {
        this.setState({ selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys
    };
    return (
      <Modal
        title="添加依赖"
        width={1000}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Form
          style={{ textAlign: 'right', paddingBottom: 8 }}
          layout="inline"
          onSubmit={this.handleSearch}
        >
          <FormItem>
            <Input
              size="small"
              type="text"
              onChange={this.handleKeyChange}
              value={this.state.search_key}
              placeholder="请输入关键字"
            />
          </FormItem>
          <FormItem>
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              size="small"
              style={{ width: 100 }}
              value={this.state.condition}
              onChange={this.handleConditionChange}
            >
              <Option value="">全部</Option>
              <Option value="group_name">应用名称</Option>
              <Option value="service_name">组件名称</Option>
            </Select>
          </FormItem>
          <FormItem>
            <Button size="small" htmlType="submit">
              <Icon type="search" />
              搜索
            </Button>
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
              title: '应用名称',
              dataIndex: 'group_name'
            },
            {
              title: '组件名称',
              dataIndex: 'service_cname'
            }
          ]}
        />
      </Modal>
    );
  }
}
