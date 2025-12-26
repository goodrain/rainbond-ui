/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Menu,
  notification,
  Table,
  Tooltip,
  Spin,
  Modal,
  Alert,
  Form,
  InputNumber
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import ScrollerX from '@/components/ScrollerX'
import React, { PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import CreateTeam from '../../components/CreateTeam';
import OpenRegion from '../../components/OpenRegion';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import styles from './index.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import pluginUtile from '../../utils/pulginUtils'

const { Search } = Input;

@Form.create()

@connect(({ user, global, rbdPlugin, region }) => ({
  user: user.currentUser,
  pluginsList: global.pluginsList,
  cluster_info: region.cluster_info
}))
export default class EnterpriseTeams extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      teamList: [],
      showAddTeam: false,
      exitTeamName: '',
      enterpriseTeamsLoading: false,
      adminer,
      showDelTeam: false,
      page: 1,
      page_size: 10,
      name: '',
      total: 1,
      delTeamLoading: false,
      showOpenRegion: false,
      initShow: false,
      searchConfig: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      showEnterprisePlugin: false
    };
  }
  componentDidMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
      return;
    }
    this.load();
    this.isShowEnterprisePlugin()
  }
  isShowEnterprisePlugin = () => {
    const { dispatch, cluster_info } = this.props;
    (cluster_info || []).forEach(item => {
      dispatch({
        type: 'global/getPluginList',
        payload: { enterprise_id: globalUtil.getCurrEnterpriseId(), region_name: item.region_name },
        callback: (res) => {
          if (res && res.list) {
            const showEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(res.list)
            if (showEnterprisePlugin) {
              this.setState({
                showEnterprisePlugin: true,
              })
            }
          }
        },
        handleError: () => {
          this.setState({ plugins: {}, loading: false });
        },
      });
    })
  }

  onPageChangeTeam = (page, pageSize) => {
    this.setState({ page, page_size: pageSize }, () => {
      this.getEnterpriseTeams();
    });
  };

  getEnterpriseTeams = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseTeams',
      payload: {
        page,
        page_size,
        enterprise_id: eid,
        name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            total: (res.bean && res.bean.total_count) || 1,
            initShow: this.state.searchConfig
              ? false
              : res.bean.total_count === 0,
            teamList: (res.bean && res.bean.list) || [],
            enterpriseTeamsLoading: false,
            searchConfig: false
          });
        }
      }
    });
  };
  load = () => {
    this.getEnterpriseTeams();
  };
  handleSearchTeam = name => {
    this.setState(
      {
        page: 1,
        name,
        searchConfig: true
      },
      () => {
        this.getEnterpriseTeams();
      }
    );
  };

  handleCreateTeam = values => {
    this.props.dispatch({
      type: 'teamControl/createTeam',
      payload: values,
      callback: (res) => {
        const { response_data } = res
        if (response_data && response_data.code) {
          if (response_data.code === 400) {
            notification.warning({ message: response_data.msg_show });
          } else {
            notification.success({ message: response_data.msg_show })
          }
        }
        // 添加完查询企业团队列表
        this.load();
        this.cancelCreateTeam();
      }
    });
  };

  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false, initShow: false });
  };
  showCloseAllComponent = exitTeamName => {
    this.setState({ showCloseAllComponent: true, exitTeamName });
  };
  hideCloseAllComponent = () => {
    this.setState({ showCloseAllComponent: false, exitTeamName: '' });
  };

  showDelTeam = exitTeamName => {
    this.setState({ showDelTeam: true, exitTeamName });
  };

  hideDelTeam = () => {
    this.setState({ showExitTeam: false, showDelTeam: false });
  };
  handleCloseAllComponentInTeam = () => {
    const { exitTeamName, closeTeamComponentLoading } = this.state;
    if (closeTeamComponentLoading) {
      return;
    }
    this.setState({ closeTeamComponentLoading: true });
    this.props.dispatch({
      type: 'teamControl/stopComponentInTeam',
      payload: {
        team_name: exitTeamName
      },
      callback: res => {
        this.setState({ closeTeamComponentLoading: false });
        if (res && res.status_code === 200) {
          notification.success({ message: formatMessage({ id: 'notification.success.operate_successfully_close' }) });
        }
        this.hideCloseAllComponent();
      },
      handleError: err => {
        if (err.data) {
          notification.warning({
            message: err.data.msg_show
          });
        }
        notification.warning({
          message: formatMessage({ id: 'notification.warn.malfunction' })
        });
        this.setState({ closeTeamComponentLoading: false });
      }
    });
  };
  handleDelTeam = () => {
    const { exitTeamName, delTeamLoading } = this.state;
    if (delTeamLoading) {
      return;
    }
    this.setState({ delTeamLoading: true });
    this.props.dispatch({
      type: 'teamControl/delTeam',
      payload: {
        team_name: exitTeamName
      },
      callback: res => {
        this.setState({ delTeamLoading: false });
        if (res && res.status_code === 200) {
          this.setState(
            {
              page: 1
            },
            () => {
              this.getEnterpriseTeams();
            }
          );

          this.hideDelTeam();
          notification.success({ message: formatMessage({ id: 'notification.success.project_team_delete' }) });
        }
      },
      handleError: err => {
        if (err.data) {
          notification.warning({
            message: err.data.msg_show
          });
        }
        this.setState({ delTeamLoading: false });
      }
    });
  };

  showRegions = (team_name, regions) => {
    return (
      regions &&
      regions.length > 0 &&
      regions.map(item => {
        return (
          <Tooltip placement="top" title={item.region_alias} key={`${item.region_name}region`}>
            <Button
              className={styles.regionShow}
              onClick={() => {
                this.onJumpTeam(team_name, item.region_name);
              }}
            >
              {item.region_alias}
              <Icon type="right" />
            </Button>
          </Tooltip>
        );
      })
    );
  };

  handleOpenRegion = regions => {
    const { openRegionTeamName } = this.state;
    this.props.dispatch({
      type: 'teamControl/openRegion',
      payload: {
        team_name: openRegionTeamName,
        region_names: regions.join(',')
      },
      callback: () => {
        this.load();
        this.cancelOpenRegion();
      }
    });
  };

  cancelOpenRegion = () => {
    this.setState({ showOpenRegion: false, openRegionTeamName: '' });
  };

  onJumpTeam = (team_name, region) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`/team/${team_name}/region/${region}/index`));
  };
  /**
 * 设置团队限制。
 * @param {string} name - 团队名称。
 * @param {Array} teamList - 团队列表。
 * 该函数用于设置团队的资源限制，并显示相应的对话框。
 */
  setTenantLimit = (name, teamList) => {
    let info = {}
    teamList && teamList.length > 0 &&
      teamList.map(item => {
        if (item.team_name == name) {
          info = item
        }
      })
    const { region_list } = info
    this.setState({
      setTenantLimitShow: true,
      limitTenantName: info.team_name,
      limitTeamName: info.team_alias,
      initLimitValue: info.set_limit_memory,
      initCupLimitValue: info.set_limit_cpu || 0,
      showTenantListRegion: region_list[0].region_id,
      regionAlias: region_list[0].region_alias,
      initLimitStorageValue: info.set_limit_storage || 0
    });
  };
  /**
* 提交资源限制设置。
* @param {Object} e - 事件对象。
* 该函数验证表单字段，如果验证通过，则发送设置企业租户限制的请求，并在请求成功后显示操作成功的通知。
*/
  submitLimit = e => {
    e.preventDefault();
    const {
      form,
      dispatch
    } = this.props;
    const eid = globalUtil.getCurrEnterpriseId()
    const { limitTenantName, showTenantListRegion } = this.state;
    form.validateFields(
      {
        force: true
      },
      (err, values) => {
        if (!err) {
          this.setState({ limitSummitLoading: true });
          dispatch({
            type: 'region/setEnterpriseTenantLimit',
            payload: {
              enterprise_id: eid,
              region_id: showTenantListRegion,
              tenant_name: limitTenantName,
              limit_memory: values.limit_memory,
              limit_cpu: values.limit_cpu,
              limit_storage: values.limit_storage
            },
            callback: () => {
              this.getEnterpriseTeams()
              notification.success({
                message: formatMessage({ id: 'notification.success.setting_successfully' })
              });
              this.setState({
                limitSummitLoading: false,
                setTenantLimitShow: false
              });

            },
            handleError: () => {
              notification.warning({
                message: formatMessage({ id: 'notification.error.setting_failed' })
              });
              this.setState({ limitSummitLoading: false });
            }
          });
        }
      }
    );
  };
  /**
 * 隐藏设置团队限制的对话框。
 * 该函数将组件状态中的setTenantLimitShow设置为false，从而隐藏设置团队限制的对话框。
 */
  hideTenantListShow = () => {
    this.setState({
      setTenantLimitShow: false,
    });
  };

  render() {
    const {
      match: {
        params: { eid }
      },
      form,
      pluginsList
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 20 },
        sm: { span: 12 }
      }
    };
    const { getFieldDecorator } = form;
    const {
      teamList,
      enterpriseTeamsLoading,
      delTeamLoading,
      showCloseAllComponent,
      closeTeamComponentLoading,
      initShow,
      language,
      setTenantLimitShow,
      limitTeamName,
      initLimitValue,
      initCupLimitValue,
      regionAlias,
      limitSummitLoading,
      initLimitStorageValue,
      showEnterprisePlugin
    } = this.state;
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );
    const managementMenu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
              onClick={() => {
                this.showCloseAllComponent(exitTeamName);
              }}
            >
              {/* 关闭所有组件 */}
              <FormattedMessage id='enterpriseTeamManagement.admin.handle.turnoff' />
            </a>
          </Menu.Item>
          <Menu.Item>
            <a
              onClick={() => {
                this.setState({
                  showOpenRegion: true,
                  openRegionTeamName: exitTeamName
                });
              }}
            >
              {/* 开通集群 */}
              <FormattedMessage id='enterpriseTeamManagement.admin.handle.open' />
            </a>
          </Menu.Item>
          {showEnterprisePlugin &&
            <Menu.Item>
              <a
                onClick={() => {
                  this.setTenantLimit(exitTeamName, teamList)
                }}
              >
                <FormattedMessage id='enterpriseColony.table.handle.quota' />
              </a>
            </Menu.Item>
          }
          <Menu.Item>
            <a
              onClick={() => {
                this.showDelTeam(exitTeamName);
              }}
            >
              {/* 删除项目/团队 */}
              <FormattedMessage id='enterpriseTeamManagement.admin.handle.delete' />
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    // 基础列定义
    const baseColumns = [
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.teamName' }),
        dataIndex: 'team_alias',
        align: 'center',
        width: 150,
        render: (val, row) => (
          <a
            style={{ color: globalUtil.getPublicColor(), fontWeight: '600', fontSize: '16px' }}
            onClick={() => this.onJumpTeam(row.team_name, row.region_list[0]?.region_name)}
          >
            {val}
          </a>
        )
      },
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.number' }),
        dataIndex: 'user_number',
        align: 'center',
        width: 80
      },
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.colony' }),
        dataIndex: 'region_list',
        align: 'center',
        width: 200,
        render: (regions, row) => this.showRegions(row.team_name, regions)
      }
    ];

    // 企业插件启用时的额外列
    const enterprisePluginColumns = [
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.memory_total' }),
        dataIndex: 'memory_request',
        align: 'center',
        width: 180,
        render: (val, row) => {
          const memory = val === 0 ? 0 : val % 1024 === 0 ? (val / 1024) : (val / 1024).toFixed(1);
          const limit = row.set_limit_memory === 0
            ? formatMessage({ id: 'appOverview.no_limit' })
            : row.set_limit_memory % 1024 === 0 ? (row.set_limit_memory / 1024) : (row.set_limit_memory / 1024).toFixed(1);
          return `${memory}/${limit}`;
        }
      },
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.CUP_total' }),
        dataIndex: 'cpu_request',
        align: 'center',
        width: 160,
        render: (val, row) => `${val}/${row.set_limit_cpu === 0 ? formatMessage({ id: 'appOverview.no_limit' }) : row.set_limit_cpu}`
      },
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.quota_total' }),
        dataIndex: 'storage_request',
        align: 'center',
        width: 180,
        render: (val, row) => `${val}/${row.set_limit_storage === 0 ? formatMessage({ id: 'appOverview.no_limit' }) : `${row.set_limit_storage}(GB)`}`
      }
    ];

    // 非企业插件时的列
    const normalColumns = [
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.memory' }),
        dataIndex: 'memory_request',
        align: 'center',
        width: 100,
        render: (val) => val === 0 ? 0 : val % 1024 === 0 ? (val / 1024) : (val / 1024).toFixed(1)
      },
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.CUP' }),
        dataIndex: 'cpu_request',
        align: 'center',
        width: 100
      }
    ];

    // 公共的操作列
    const actionColumns = [
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.operation' }),
        dataIndex: 'running_apps',
        align: 'center',
        width: 100
      },
      {
        title: formatMessage({ id: 'enterpriseTeamManagement.table.handle' }),
        dataIndex: 'action',
        align: 'center',
        width: 80,
        render: (_, row) => (
          <Dropdown overlay={managementMenu(row.team_name)} placement="bottomLeft">
            <Icon component={moreSvg} style={{ cursor: 'pointer' }} />
          </Dropdown>
        )
      }
    ];

    // 根据是否启用企业插件组合列
    const columns = showEnterprisePlugin
      ? [...baseColumns, ...enterprisePluginColumns, ...actionColumns]
      : [...baseColumns, ...normalColumns, ...actionColumns];

    const managementTemas = (
      <div>
        {/* 标题和搜索栏 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Search
            style={{ width: 500, marginRight: 16 }}
            placeholder={formatMessage({ id: 'enterpriseTeamManagement.allProject.search' })}
            onSearch={this.handleSearchTeam}
          />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <Button type="primary" onClick={this.onAddTeam} icon="plus">
              <FormattedMessage id='enterpriseTeamManagement.allProject.button.setup' />
            </Button>
          </div>
        </div>
        {/* 表格 */}
        <Table
          rowKey="team_id"
          dataSource={teamList}
          columns={columns}
          pagination={{
            current: this.state.page,
            pageSize: this.state.page_size,
            total: Number(this.state.total),
            onChange: this.onPageChangeTeam,
            showQuickJumper: true,
            showTotal: total => language ? `共 ${total} 条` : `Total ${total} items`,
            showSizeChanger: true,
            onShowSizeChange: this.onPageChangeTeam,
            hideOnSinglePage: this.state.total <= 10
          }}
        />
      </div>
    );

    const title = <FormattedMessage id='enterpriseTeamManagement.PageHeaderLayout.title.admin' />;
    const content = <FormattedMessage id='enterpriseTeamManagement.PageHeaderLayout.context' />;
    return (
      <PageHeaderLayout title={title} content={content} titleSvg={pageheaderSvg.getPageHeaderSvg('teams', 20)}>
        {showCloseAllComponent && (
          <ConfirmModal
            onOk={this.handleCloseAllComponentInTeam}
            loading={closeTeamComponentLoading}
            title={formatMessage({ id: 'confirmModal.project_team_close.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.project_team_close.desc' })}
            onCancel={this.hideCloseAllComponent}
          />
        )}
        {this.state.showAddTeam && (
          <CreateTeam
            enterprise_id={eid}
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {initShow && (
          <CreateTeam
            title={<FormattedMessage id='enterpriseTeamManagement.allProject.title' />}
            enterprise_id={eid}
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {this.state.showDelTeam && (
          <ConfirmModal
            loading={delTeamLoading}
            onOk={this.handleDelTeam}
            title={formatMessage({ id: 'confirmModal.project_team_delete.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.project_team_delete.desc' })}
            onCancel={this.hideDelTeam}
          />
        )}
        {this.state.showOpenRegion && (
          <OpenRegion
            onSubmit={this.handleOpenRegion}
            onCancel={this.cancelOpenRegion}
            teamName={this.state.openRegionTeamName}
          />
        )}

        {enterpriseTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <>{managementTemas}</>
        )}
        <Modal
          centered
          maskClosable={false}
          title="编辑资源限额"
          width={800}
          visible={setTenantLimitShow}
          footer={null}
          onOk={this.hideTenantListShow}
          onCancel={this.hideTenantListShow}
        >
          {setTenantLimitShow && (
            <div>
              <Alert
                style={{ margin: '0px 0 16px 0' }}
                message={formatMessage({ id: 'enterpriseColony.table.handle.quota.alert' }, { name: limitTeamName }) + formatMessage({ id: 'enterpriseColony.table.handle.quota.alert1' }, { region: regionAlias })}
              />
              <Form onSubmit={this.submitLimit}>
                <Form.Item
                  {...formItemLayout}
                  name="limit_memory"
                  label={formatMessage({ id: 'enterpriseColony.table.handle.quota.form.label.limit_memory' })}
                >
                  {getFieldDecorator('limit_memory', {
                    initialValue: initLimitValue,
                    rules: [
                      {
                        required: true,
                        message: '内存限额必填'
                      }
                    ]
                  })(
                    <InputNumber
                      style={{ width: '200px' }}
                      min={0}
                      precision={0}
                      max={2147483647}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  {...formItemLayout}
                  name="limit_cpu"
                  label={formatMessage({ id: 'enterpriseColony.table.handle.quota.form.label.limit_cpu' })}
                >
                  {getFieldDecorator('limit_cpu', {
                    initialValue: initCupLimitValue,
                    rules: [
                      {
                        required: true,
                        message: 'CPU限额必填'
                      }
                    ]
                  })(
                    <InputNumber
                      style={{ width: '200px' }}
                      min={0}
                      precision={0}
                      max={2147483647}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  {...formItemLayout}
                  name="limit_storage"
                  label="存储限额(GB)"
                >
                  {getFieldDecorator('limit_storage', {
                    initialValue: initLimitStorageValue,
                    rules: [
                      {
                        required: true,
                        message: '请填写存储限额'
                      }
                    ]
                  })(
                    <InputNumber
                      style={{ width: '200px' }}
                      min={0}
                      precision={0}
                      max={2147483647}
                    />
                  )}
                </Form.Item>
                <div style={{ textAlign: "right" }}>
                  <Button
                    onClick={() => {
                      this.setState({
                        setTenantLimitShow: false,
                      });
                    }}
                  >
                    {formatMessage({ id: 'button.cancel' })}
                  </Button>
                  <Button
                    style={{ marginLeft: '16px' }}
                    loading={limitSummitLoading}
                    type="primary"
                    htmlType="submit"
                  >
                    {formatMessage({ id: 'button.confirm' })}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Modal>
      </PageHeaderLayout>
    );
  }
}
