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
  Table,
  Row,
  Col
} from 'antd';
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { getUnRelationedApp } from '../../services/app';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;
const { Option } = Select;

@Form.create()
@connect()
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
      condition: '',
      language: cookie.get('language') === 'zh-CN' ? true : false,
      dependValue: 'un_dependency'
    };
  }
  componentDidMount() {
    this.getRelationedApp();
  }
  handleSubmit = () => {
    if (!this.state.selectedRowKeys.length) {
      notification.warning({
        message: formatMessage({id:'notification.warn.relyOn'})
      });
      return;
    }
    const ids = this.state.selectedRowKeys;
    this.props.onSubmit && this.props.onSubmit(ids);
  };
  getRelationedApp = () => {
    const { dispatch, type, appAlias } = this.props
    if(type === 'relatum'){
      dispatch({
        type: 'appControl/getReverseDependency',
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          page: this.state.page,
          page_size: this.state.page_size,
          search_key: this.state.search_key,
          condition: this.state.condition
        },
        callback: res => {
          if(res){
            this.setState({
              apps: res.list || [],
              total: res.total,
              // selectedRowKeys: []
            });
          }
        }
      })
    } else {
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
            // selectedRowKeys: []
          });
        }
      });
    }
    
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  onPageChange = page => {
    this.setState({ page }, () => {
      this.getRelationedApp();
    });
  };
  handleSearch = e => {
    e.preventDefault();
    this.state.page = 1;
    this.getRelationedApp();
  };
  handleKeyChange = e => {
    this.setState({ search_key: e.target.value });
  };
  handleConditionChange = value => {
    this.setState({ condition: value });
  };
  handleDependChange = value => {
    this.setState({ dependValue: value },()=>{
    this.getRelationedApp();
    });
  }
  render() {
    const rowSelection = {
      onChange: selectedRowKeys => {
        this.setState({ selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys
    };
    return (
      <Modal
        // title="添加依赖"
        title={<FormattedMessage id='componentOverview.body.addRelation.title'/>}
        width={1000}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Row>
        <Col span={24}>
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
              placeholder={formatMessage({id:'componentOverview.body.addRelation.placeholder'})}
            />
          </FormItem>
          <FormItem>
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              size="small"
              style={this.state.language ? { width: 100 } : { width: 200 }}
              value={this.state.condition}
              onChange={this.handleConditionChange}
            >
              <Option value="" style={{textAlign:'left'}}><FormattedMessage id='componentOverview.body.addRelation.option'/></Option>
              <Option value="group_name" style={{textAlign:'left'}}><FormattedMessage id='componentOverview.body.addRelation.group_name'/></Option>
              <Option value="service_name" style={{textAlign:'left'}}><FormattedMessage id='componentOverview.body.addRelation.service_name'/></Option>
            </Select>
          </FormItem>
          <FormItem>
            <Button size="small" htmlType="submit">
              <Icon type="search" />
              <FormattedMessage id='componentOverview.body.addRelation.search'/>
            </Button>
          </FormItem>
        </Form>
        </Col>
        </Row>

        <Table
          size="middle"
          rowKey={record => record.service_id}
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
              title: formatMessage({id:'componentOverview.body.addRelation.table_group_name'}),
              dataIndex: 'group_name'
            },
            {
              title: formatMessage({id:'componentOverview.body.addRelation.table_service_name'}),
              dataIndex: 'service_cname'
            }
          ]}
        />
      </Modal>
    );
  }
}
