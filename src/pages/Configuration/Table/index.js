// eslint-disable-next-line import/extensions
import ConfirmModal from '@/components/ConfirmModal';
import { batchOperation } from '@/services/app';
import {
  Badge,
  Button,
  Card,
  Form,
  Input,
  Modal,
  notification,
  Popover,
  Row,
  Table,
  Col
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'

const { confirm } = Modal;
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
      info: {},
      deleteVar: false
    };
  }

  componentDidMount() {
    this.fetchConfigurationList();
  }
  onPageChange = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
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
      callback: res => {
        if (res && res.status_code === 200) {
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
  handelChange = e => {
    this.setState({ query: e.target.value });
  };
  handleEnter = () => {
    this.handleSearch();
  };
  handleDelete = data => {
    this.setState({
      deleteVar: true,
      info: data
    });
  };
  cancelDeleteVariabl = () => {
    this.setState({
      deleteVar: false
    });
  };
  handleResetInfo = () => {
    this.setState({
      info: {}
    });
  };
  handleDeleteVariabl = () => {
    const { dispatch, regionName, teamName, appID } = this.props;
    const { page, pageSize, query, info } = this.state;
    const serviceIds = [];
    if (info && info.services && info.services.length > 0) {
      info.services.map(item => {
        serviceIds.push(item.service_id);
      });
    }

    dispatch({
      type: 'global/DeleteConfiguration',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_id: appID,
        name: info.config_group_name,
        query,
        page,
        page_size: pageSize
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.fetchConfigurationList();
          this.cancelDeleteVariabl();
          if (serviceIds.length > 0) {
            this.showRemind(serviceIds);
          } else {
            this.handleResetInfo();
          }
          notification.success({
            message: formatMessage({ id: 'notification.success.delete' })
          });
        }
      }
    });
  };

  showRemind = serviceIds => {
    const th = this;
    confirm({
      title: formatMessage({ id: 'notification.hint.confiuration.update.title' }),
      content: formatMessage({ id: 'notification.hint.confiuration.update.content' }),
      okText: formatMessage({ id: 'button.update' }),
      cancelText: formatMessage({ id: 'button.cancel' }),
      onOk() {
        th.handleBatchOperation(serviceIds);
        return new Promise((resolve, reject) => {
          setTimeout(Math.random() > 0.5 ? resolve : reject, 2000);
        }).catch(() => console.log('Oops errors!'));
      },
      onCancel() {
        th.handleResetInfo();
      }
    });
  };
  handleBatchOperation = serviceIds => {
    const { teamName } = this.props;
    batchOperation({
      action: 'upgrade',
      team_name: teamName,
      serviceIds:
        serviceIds && serviceIds.length > 0 ? serviceIds.join(',') : ''
    }).then(data => {
      if (data) {
        notification.success({
          message: formatMessage({ id: 'notification.success.updates' }),
          duration: '3'
        });
        this.handleResetInfo();
      }
    });
  };
  render() {
    const {
      deleteConfigurationLoading,
      appConfigGroupPermissions: { isCreate, isDelete, isEdit },
      regionName,
      teamName,
      appID
    } = this.props;

    const { apps, loading, page, pageSize, total, deleteVar } = this.state;
    return (
      <div>
        {deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVariabl}
            onCancel={this.cancelDeleteVariabl}
            loading={deleteConfigurationLoading}
            title={formatMessage({ id: 'confirmModal.delete.configuration.title' })}
            desc={formatMessage({ id: 'confirmModal.delete.configuration.desc' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
          />
        )}
        <Card
          style={{
            borderRadius: 5
          }}
          className={styles.cardBody}
        >
          <Row className={styles.cardHeader}>
            <Col span={20}>
              <Form layout="inline" style={{ display: 'inline-block' }}>
                <FormItem>
                  <Input
                    placeholder={formatMessage({ id: 'appConfiguration.placeholder' })}
                    onChange={this.handelChange}
                    onPressEnter={this.handleEnter}
                    style={{ width: 250 }}
                  />
                </FormItem>
                <FormItem>
                  <Button type="primary" onClick={this.handleSearch} icon="search">
                    {formatMessage({ id: 'appConfiguration.btn.search' })}
                  </Button>
                </FormItem>
              </Form>
            </Col>
            <Col span={4}>
              {isCreate && (
                <Button
                  type="primary"
                  icon="plus"
                  style={{ float: 'right', margin: '4px 0 0' }}
                  onClick={() => {
                    this.handleConfigurationOperation();
                  }}
                >
                  {formatMessage({ id: 'appConfiguration.btn.add' })}
                </Button>
              )}
            </Col>
          </Row>
          <div style={{ padding: 24 }}>
            <Table
              size="default"
              rowKey={(record, index) => index}
              pagination={{
                size: 'default',
                current: page,
                pageSize,
                total,
                onChange: this.onPageChange,
                onShowSizeChange: this.onPageChange,
                showQuickJumper: true,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
                hideOnSinglePage: total<=10
              }}
              dataSource={apps || []}
              loading={loading}
              columns={[
                {
                  title: formatMessage({ id: 'appConfiguration.table.name' }),
                  dataIndex: 'config_group_name'
                },
                {
                  title: formatMessage({ id: 'appConfiguration.table.createTime' }),
                  dataIndex: 'create_time',
                  align: 'center',
                  render: val => {
                    return `${moment(val)
                      .locale('zh-cn')
                      .format('YYYY-MM-DD HH:mm:ss')}`;
                  }
                },
                {
                  title: formatMessage({ id: 'appConfiguration.table.componentNum' }),
                  dataIndex: 'services_num',
                  align: 'center',
                  render: (val, data) => {
                    return (
                      <div>
                        {val ? (
                          <Popover
                            placement="top"
                            title={formatMessage({ id: 'appConfiguration.table.take_effect_component' })}
                            content={
                              <div>
                                {data.services.map(item => {
                                  const {
                                    service_cname: name,
                                    service_alias: alias
                                  } = item;
                                  return (
                                    <Link
                                      key={alias}
                                      to={`/team/${teamName}/region/${regionName}/components/${alias}/overview`}
                                    >
                                      {name}
                                    </Link>
                                  );
                                })}
                              </div>
                            }
                            trigger="click"
                          >
                            <a>{val}</a>
                          </Popover>
                        ) : (
                          0
                        )}
                      </div>
                    );
                  }
                },
                {
                  title: formatMessage({ id: 'appConfiguration.table.status' }),
                  dataIndex: 'enable',
                  align: 'center',
                  render: val => {
                    return (
                      <div>
                        <Badge
                          status={val ? 'success' : 'error'}
                          text={<span>{val ? formatMessage({ id: 'appConfiguration.table.take_effect' }) : formatMessage({ id: 'appConfiguration.table.not_take_effect' })}</span>}
                        />
                      </div>
                    );
                  }
                },
                {
                  title: formatMessage({ id: 'appConfiguration.table.operate' }),
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
                            {formatMessage({ id: 'appConfiguration.table.btn.edit' })}
                          </a>
                        )}
                        {isDelete && (
                          <a
                            onClick={() => {
                              this.handleDelete(data);
                            }}
                          >
                            {formatMessage({ id: 'appConfiguration.table.btn.delete' })}
                          </a>
                        )}
                      </div>
                    );
                  }
                }
              ]}
            />
          </div>
        </Card>
      </div>
    );
  }
}
