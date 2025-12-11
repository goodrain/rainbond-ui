/*
  添加依赖应用
*/
import {
  Button,
  Col,
  Form,
  Icon,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Table
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import { getUnRelationedApp } from '../../services/app';

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
      language: cookie.get('language') === 'zh-CN'
    };
  }

  componentDidMount() {
    this.getRelationedApp();
  }

  handleSubmit = () => {
    const { selectedRowKeys } = this.state;
    const { onSubmit } = this.props;
    if (!selectedRowKeys.length) {
      notification.warning({
        message: formatMessage({ id: 'notification.warn.relyOn' })
      });
      return;
    }
    onSubmit && onSubmit(selectedRowKeys);
  };

  getRelationedApp = () => {
    const { dispatch, type, appAlias } = this.props;
    const { page, page_size, search_key, condition } = this.state;
    const payload = {
      team_name: globalUtil.getCurrTeamName(),
      app_alias: appAlias,
      page,
      page_size,
      search_key,
      condition
    };

    if (type === 'relatum') {
      dispatch({
        type: 'appControl/getReverseDependency',
        payload,
        callback: res => {
          if (res) {
            this.setState({
              apps: res.list || [],
              total: res.total
            });
          }
        },
        handleError: err => {
          handleAPIError(err);
        }
      });
    } else {
      getUnRelationedApp(payload).then(data => {
        if (data) {
          this.setState({
            apps: data.list || [],
            total: data.total
          });
        }
      }).catch(err => {
        handleAPIError(err);
      });
    }
  };

  handleCancel = () => {
    const { onCancel } = this.props;
    onCancel && onCancel();
  };

  onPageChange = page => {
    this.setState({ page }, () => {
      this.getRelationedApp();
    });
  };

  handleSearch = e => {
    e.preventDefault();
    this.setState({ page: 1 }, () => {
      this.getRelationedApp();
    });
  };

  handleKeyChange = e => {
    this.setState({ search_key: e.target.value });
  };

  handleConditionChange = value => {
    this.setState({ condition: value });
  };
  render() {
    const { selectedRowKeys, search_key, language, condition, page, page_size, total, apps } = this.state;
    const rowSelection = {
      onChange: keys => {
        this.setState({ selectedRowKeys: keys });
      },
      selectedRowKeys
    };

    return (
      <Modal
        title={<FormattedMessage id='componentOverview.body.addRelation.title' />}
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
                  value={search_key}
                  placeholder={formatMessage({ id: 'componentOverview.body.addRelation.placeholder' })}
                />
              </FormItem>
              <FormItem>
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  size="small"
                  style={language ? { width: 100 } : { width: 200 }}
                  value={condition}
                  onChange={this.handleConditionChange}
                >
                  <Option value="" style={{ textAlign: 'left' }}>
                    <FormattedMessage id='componentOverview.body.addRelation.option' />
                  </Option>
                  <Option value="group_name" style={{ textAlign: 'left' }}>
                    <FormattedMessage id='componentOverview.body.addRelation.group_name' />
                  </Option>
                  <Option value="service_name" style={{ textAlign: 'left' }}>
                    <FormattedMessage id='componentOverview.body.addRelation.service_name' />
                  </Option>
                </Select>
              </FormItem>
              <FormItem>
                <Button size="small" htmlType="submit">
                  <Icon type="search" />
                  <FormattedMessage id='componentOverview.body.addRelation.search' />
                </Button>
              </FormItem>
            </Form>
          </Col>
        </Row>

        <Table
          size="middle"
          rowKey={record => record.service_id}
          pagination={{
            current: page,
            pageSize: page_size,
            total,
            onChange: this.onPageChange
          }}
          dataSource={apps}
          rowSelection={rowSelection}
          columns={[
            {
              title: formatMessage({ id: 'componentOverview.body.addRelation.table_group_name' }),
              dataIndex: 'group_name'
            },
            {
              title: formatMessage({ id: 'componentOverview.body.addRelation.table_service_name' }),
              dataIndex: 'service_cname'
            }
          ]}
        />
      </Modal>
    );
  }
}
