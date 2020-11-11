import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Card,
  Table,
  Button,
  Row,
  Form,
  Input,
  notification,
  Badge
} from 'antd';
// eslint-disable-next-line import/extensions
import ConfirmModal from '@/components/ConfirmModal';

const FormItem = Form.Item;
/* eslint react/no-array-index-key: 0 */

@connect(({ loading, teamControl, enterprise }) => ({
  deleteConfigurationLoading: loading.effects['global/DeleteConfiguration'],
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class ConfigurationTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
      page: 1,
      query: '',
      pageSize: 10,
      deleteVar: false
    };
  }

  componentDidMount() {
    this.fetchConfigurationList();
  }
  onPageChange = (page) => {
    this.setState({ page }, () => {
      this.fetchConfigurationList();
    });
  };

  fetchConfigurationList = () => {
    const { dispatch, teamName, regionName, appID } = this.props;
    const { page, pageSize, query } = this.state;
    dispatch({
      type: 'global/fetchConfigurationList',
      payload: {
        team_name: teamName,
        group_id: appID,
        region: regionName,
        query,
        page,
        page_size: pageSize
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.setState({
            loading: false,
            apps: res.list,
            total: res.total
          });
        }
      }
    });
  };
  handleConfigurationOperation = (info = false) => {
    const { dispatch, regionName, teamName, appID } = this.props;
    const id = info ? info.config_group_name : 'add';
    dispatch(
      routerRedux.push(
        `/team/${teamName}/region/${regionName}/apps/${appID}/configgroups/details/${id}`
      )
    );
  };

  handleSearch = () => {
    this.fetchConfigurationList();
  };
  handelChange = (e) => {
    this.setState({ query: e.target.value });
  };
  handleEnter = () => {
    this.handleSearch();
  };
  handleDelete = (data) => {
    this.setState({
      deleteVar: data
    });
  };

  cancelDeleteVariabl = () => {
    this.setState({
      deleteVar: false
    });
  };

  handleDeleteVariabl = () => {
    const { dispatch, regionName, teamName, appID } = this.props;
    const { page, pageSize, query, deleteVar } = this.state;
    dispatch({
      type: 'global/DeleteConfiguration',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_id: appID,
        name: deleteVar.config_group_name,
        query,
        page,
        page_size: pageSize
      },
      callback: (res) => {
        if (res && res._code === 200) {
          this.fetchConfigurationList();
          this.cancelDeleteVariabl();
          notification.success({
            message: '删除成功'
          });
        }
      }
    });
  };

  render() {
    const {
      deleteConfigurationLoading,
      appConfigGroupPermissions: { isCreate, isDelete, isEdit }
    } = this.props;
    const { apps, loading, page, pageSize, total, deleteVar } = this.state;
    return (
      <div>
        <Row>
          <Form layout="inline" style={{ display: 'inline-block' }}>
            <FormItem>
              <Input
                placeholder="搜索配置组名称"
                onChange={this.handelChange}
                onPressEnter={this.handleEnter}
                style={{ width: 250 }}
              />
            </FormItem>
            <FormItem>
              <Button type="primary" onClick={this.handleSearch} icon="search">
                搜索
              </Button>
            </FormItem>
          </Form>
          {isCreate && (
            <Button
              type="primary"
              icon="plus"
              style={{ float: 'right', marginBottom: '20px' }}
              onClick={() => {
                this.handleConfigurationOperation();
              }}
            >
              添加配置组
            </Button>
          )}
        </Row>
        {deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVariabl}
            onCancel={this.cancelDeleteVariabl}
            loading={deleteConfigurationLoading}
            title="删除配置组"
            desc="确定要删除此配置组吗？"
            subDesc="此操作不可恢复"
          />
        )}
        <Card loading={loading}>
          <Table
            size="default"
            pagination={{
              size: 'default',
              current: page,
              pageSize,
              total,
              onChange: this.onPageChange
            }}
            dataSource={apps || []}
            columns={[
              {
                title: '配置组名称',
                dataIndex: 'config_group_name'
              },
              {
                title: '生效组件数',
                dataIndex: 'services_num',
                align: 'center',
                render: (_, data) => {
                  return (
                    <p style={{ marginBottom: 0 }}>{data.services.length}</p>
                  );
                }
              },
              {
                title: '生效状态',
                dataIndex: 'enable',
                align: 'center',
                render: (val) => {
                  return (
                    <div>
                      <Badge
                        status={val ? 'success' : 'error'}
                        text={<span>{val ? '生效中' : '不生效'}</span>}
                      />
                    </div>
                  );
                }
              },
              {
                title: '操作',
                dataIndex: 'action',
                align: 'center',

                render: (val, data) => {
                  return (
                    <div>
                      {isEdit && (
                        <a
                          onClick={() => {
                            this.handleConfigurationOperation(data);
                          }}
                        >
                          编辑
                        </a>
                      )}
                      {isDelete && (
                        <a
                          onClick={() => {
                            this.handleDelete(data);
                          }}
                        >
                          删除
                        </a>
                      )}
                    </div>
                  );
                }
              }
            ]}
          />
        </Card>
      </div>
    );
  }
}
