/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
import NewbieGuiding from '@/components/NewbieGuiding';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Icon,
  Input,
  Menu,
  notification,
  Pagination,
  Tooltip,
  Row,
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
import WarningImg from '../../../public/images/warning.png';
import ConfirmModal from '../../components/ConfirmModal';
import CreateTeam from '../../components/CreateTeam';
import JoinTeam from '../../components/JoinTeam';
import OpenRegion from '../../components/OpenRegion';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import roleUtil from '../../utils/role';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import cookie from '../../utils/cookie';
import globalUtil from '../../utils/global';
import styles from './index.less';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import publicColor from '../../../config/theme'
import pluginUtile from '../../utils/pulginUtils'

const { Search } = Input;
const FormItem = Form.Item;

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
      userTeamList: [],
      overviewTeamInfo: false,
      showAddTeam: false,
      showExitTeam: false,
      showDelApply: false,
      ApplyInfo: false,
      exitTeamName: '',
      enterpriseTeamsLoading: false,
      userTeamsLoading: true,
      overviewTeamsLoading: true,
      adminer,
      showDelTeam: false,
      page: 1,
      page_size: 10,
      name: '',
      total: 1,
      joinTeam: false,
      delTeamLoading: false,
      showOpenRegion: false,
      initShow: false,
      guideStep: 1,
      searchConfig: false,
      language: cookie.get('language') === 'zh-CN' ? true : false,
      showEnterprisePlugin: false
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
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
  getUserTeams = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, page_size, name } = this.state;
    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        page,
        page_size,
        name
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            userTeamList: res.list,
            userTeamsLoading: false
          });
        }
      }
    });
  };

  load = () => {
    this.state.adminer && this.getEnterpriseTeams();
    this.getOverviewTeam();
    this.getUserTeams();
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

  handlePaginations = () => (
    <Pagination
      current={this.state.page}
      pageSize={this.state.page_size}
      total={Number(this.state.total)}
      onChange={this.onPageChangeTeam}
      showQuickJumper
      showTotal={total => `共 ${total} 条`}
      showSizeChanger
      onShowSizeChange={this.onPageChangeTeam}
      hideOnSinglePage={this.state.total <= 10}
    />
  );
  handleSearchUserTeam = name => {
    this.setState(
      {
        page: 1,
        name
      },
      () => {
        this.getUserTeams();
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

  getOverviewTeam = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;

    dispatch({
      type: 'global/fetchOverviewTeam',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            overviewTeamsLoading: false,
            overviewTeamInfo: res.bean
          });
        }
      }
    });
  };

  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false, initShow: false });
  };
  showExitTeam = exitTeamName => {
    this.setState({ showExitTeam: true, exitTeamName });
  };

  handleExitTeam = () => {
    const { exitTeamName } = this.state;
    this.props.dispatch({
      type: 'teamControl/exitTeam',
      payload: {
        team_name: exitTeamName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.getOverviewTeam();
          this.getUserTeams();
          this.hideExitTeam();
        }
      }
    });
  };

  hideExitTeam = () => {
    this.setState({ showExitTeam: false, exitTeamName: '' });
  };

  showApply = ApplyInfo => {
    this.setState({ showDelApply: true, ApplyInfo });
  };

  hideDelApply = () => {
    this.setState({ showDelApply: false, ApplyInfo: false });
  };

  handleActiveTabs = key => {
    this.setState(
      {
        name: '',
        page: 1
      },
      () => {
        if (key === 'team') {
          this.getOverviewTeam();
          this.getUserTeams();
        } else {
          this.getEnterpriseTeams();
        }
      }
    );
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

  handleDelApply = () => {
    const { ApplyInfo } = this.state;
    this.props.dispatch({
      type: 'teamControl/undoTeamUsers',
      payload: {
        team_name: ApplyInfo.team_name
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.withdraw_claim' }) });
        this.getOverviewTeam();
        this.hideDelApply();
      }
    });
  };

  handleJoinTeam = values => {
    this.props.dispatch({
      type: 'global/joinTeam',
      payload: values,
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.wait_review' }) });
        this.getOverviewTeam();
        this.cancelJoinTeam();
      }
    });
  };

  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
  };

  showRegions = (team_name, regions, ismanagement = false) => {
    return (
      regions &&
      regions.length > 0 &&
      regions.map(item => {
        return (
          <Tooltip placement="top" title={item.region_alias}>
            <Button
              key={`${item.region_name}region`}
              className={styles.regionShow}
              onClick={() => {
                if (ismanagement) {
                  this.handleJoinTeams(team_name, item.region_name);
                } else {
                  this.onJumpTeam(team_name, item.region_name);
                }
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
  handleJoinTeams = (teamName, region) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/joinTeam',
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.onJumpTeam(teamName, region);
        }
      }
    });
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
  handleNewbieGuiding = info => {
    const { prevStep, nextStep, jumpUrl = '' } = info;
    const { dispatch } = this.props;
    const { adminer } = this.state;
    return (
      <NewbieGuiding
        {...info}
        totals={2}
        handleClose={() => {
          this.handleGuideStep('close');
        }}
        handlePrev={() => {
          if (prevStep) {
            this.handleGuideStep(prevStep);
          }
        }}
        handleNext={() => {
          if (jumpUrl) {
            dispatch(routerRedux.push(jumpUrl));
          }
          if (nextStep) {
            if (nextStep === 2) {
              if (adminer) {
                this.onAddTeam();
              } else {
                this.onJoinTeam();
              }
            }
            this.handleGuideStep(nextStep);
          }
        }}
      />
    );
  };

  handleGuideStep = guideStep => {
    this.setState({
      guideStep
    });
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
      overviewTeamInfo,
      enterpriseTeamsLoading,
      overviewTeamsLoading,
      adminer,
      userTeamList,
      userTeamsLoading,
      delTeamLoading,
      showCloseAllComponent,
      closeTeamComponentLoading,
      initShow,
      guideStep,
      language,
      setTenantLimitShow,
      limitTenantName,
      limitTeamName,
      initLimitValue,
      initCupLimitValue,
      regionAlias,
      limitSummitLoading,
      initLimitStorageValue,
      teamNameTitle,
      showEnterprisePlugin
    } = this.state;
    const request_join_team =
      overviewTeamInfo &&
      overviewTeamInfo.request_join_team.filter(item => {
        if (item.is_pass === 0) {
          return item;
        }
      });
    const haveNewJoinTeam = request_join_team.length > 0;

    const userTeam = userTeamList && userTeamList.length > 0 && userTeamList;
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
    const menu = exitTeamName => {
      return (
        <Menu>
          <Menu.Item>
            <a
              onClick={() => {
                this.showExitTeam(exitTeamName);
              }}
            >
              {/* 退出项目/团队 */}
              <FormattedMessage id='enterpriseTeamManagement.handle.quit' />
            </a>
          </Menu.Item>
        </Menu>
      );
    };

    const menucancel = item => {
      return (
        <Menu>
          <Menu.Item>
            <a
              onClick={() => {
                this.showApply(item);
              }}
            >
              {/* 撤销申请 */}
              <FormattedMessage id='enterpriseTeamManagement.handle.backout' />
            </a>
          </Menu.Item>
        </Menu>
      );
    };

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
    const operation = (
      <Col span={language ? 7 : 6} style={{ textAlign: 'right' }}>
        {adminer ? (
          <Button
            type="primary"
            onClick={this.onAddTeam}
            style={{ marginRight: '5px' }}
            icon="plus"
          >
            {/* 创建 项目/团队 */}
            <FormattedMessage id='enterpriseTeamManagement.allProject.button.setup' />
          </Button>
        ) : (
          <Button type="primary" onClick={this.onJoinTeam} icon="plus">
            {/* 加入 项目/团队 */}
            <FormattedMessage id='enterpriseTeamManagement.allProject.button.join' />
          </Button>
        )}
      </Col>
    );
    const en_operation = (
      <Col span={language ? 7 : 6} style={{ textAlign: 'right' }}>
        {adminer ? (
          <Button
            type="primary"
            onClick={this.onAddTeam}
            style={{ marginRight: '5px' }}
            icon="plus"
          >
            {/* 创建 项目/团队 */}
            <FormattedMessage id='enterpriseTeamManagement.allProject.button.setup' />
          </Button>
        ) : (
          <Button type="primary" onClick={this.onJoinTeam} icon="plus">
            {/* 加入 项目/团队 */}
            <FormattedMessage id='enterpriseTeamManagement.allProject.button.join' />
          </Button>
        )}
      </Col>
    );

    const managementTemas = (
      <div>
        <div style={{
          background: '#fff',
          borderRadius: 5,
          fontSize: 14,
          fontWeight: 600
        }}>
          <Row
            className={styles.managementTemas}
          >
            <Col
              span={language ? 2 : 3}
              className={styles.teamsTit}
              style={{ marginBottom: '0' }}
            >
              {/* 全部项目/团队 */}
              <FormattedMessage id='enterpriseTeamManagement.allProject.lable' />
            </Col>
            <Col span={15} style={{ textAlign: 'left' }}>
              <Search
                style={{ width: '500px' }}
                placeholder={formatMessage({ id: 'enterpriseTeamManagement.allProject.search' })}
                onSearch={this.handleSearchTeam}
              />
            </Col>
            {operation}
          </Row>
          {showEnterprisePlugin ? (

            <div style={{ padding: '24px 0 0 0', border: '1px solid #e3e3e3', borderTop: 0 }}>
              <Row style={{ width: '100%' }} className={styles.rowTitle}>
                <Row className={styles.teamMinTit} type="flex" align="middle">
                  <Col span={4} style={{ width: '13%', textAlign: 'center' }}>
                    {/* 项目/团队名称 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.teamName' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* 管理员 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.Administrator' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* 人数 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.number' />
                  </Col>
                  <Col span={7} style={{ width: '21%', textAlign: 'center' }}>
                    {/* 集群 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.colony' />
                  </Col>
                  <Col span={2} style={{ width: '12%', textAlign: 'center' }}>
                    {/* 内存使用量/总量(MB) */}
                    <FormattedMessage id='enterpriseTeamManagement.table.memory_total' />
                  </Col>
                  <Col span={2} style={{ width: '12%', textAlign: 'center' }}>
                    {/* CPU使用量/总量(m) */}
                    <FormattedMessage id='enterpriseTeamManagement.table.CUP_total' />
                  </Col>
                  <Col span={2} style={{ width: '12%', textAlign: 'center' }}>
                    {/* 存储使用量/总量(GB) */}
                    <FormattedMessage id='enterpriseTeamManagement.table.quota_total' />
                  </Col>
                  <Col span={2} style={{ width: '12%', textAlign: 'center' }}>
                    {/* 运行应用数 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.operation' />
                  </Col>
                </Row>
                <Col className={styles.borTitle}>
                  {/* 操作 */}
                  <FormattedMessage id='enterpriseTeamManagement.table.handle' />
                </Col>
              </Row>
              {teamList.map(item => {
                const {
                  team_id,
                  team_alias,
                  region_list,
                  owner_name,
                  team_name,
                  running_apps,
                  user_number,
                  cpu_request,
                  memory_request,
                  storage_request,
                  set_limit_memory,
                  set_limit_cpu,
                  set_limit_storage
                } = item;
                const memory = (memory_request == 0) ? formatMessage({ id: 'componentOverview.body.tab.overview.unlimited' }) : memory_request % 1024 == 0 ? (memory_request / 1024) : (memory_request / 1024).toFixed(1)
                const limit_memory = (set_limit_memory == 0) ? formatMessage({ id: 'appOverview.no_limit' }) : set_limit_memory % 1024 == 0 ? (set_limit_memory / 1024) : (set_limit_memory / 1024).toFixed(1)
                return (
                  <Card
                    key={team_id}
                    style={{ border: 0, borderBottom: '1px solid #f4f4f4' }}
                    hoverable
                    bodyStyle={{ padding: 0 }}
                  >
                    <Row
                      type="flex"
                      align="middle"
                      className={styles.pl24}
                    >
                      <Row
                        type="flex"
                        align="middle"
                        className={styles.pl23}
                        onClick={() => { this.handleJoinTeams(team_name, region_list[0].region_name); }}
                      >
                        <Col style={{ color: globalUtil.getPublicColor(), fontWeight: '600', width: '13%', textAlign: 'center', fontSize: '16px' }}>{team_alias}</Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{owner_name}</Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{user_number}</Col>
                        <Col style={{ width: '21%', display: 'flex', justifyContent: 'center' }} >
                          {this.showRegions(team_name, region_list, true)}
                        </Col>
                        <Col style={{ width: '12%', textAlign: 'center' }}>{memory}/{limit_memory}</Col>
                        <Col style={{ width: '12%', textAlign: 'center' }}>{cpu_request}/{set_limit_cpu == 0 ? formatMessage({ id: 'appOverview.no_limit' }) : set_limit_cpu}</Col>
                        <Col style={{ width: '12%', textAlign: 'center' }}>{storage_request}/{set_limit_storage == 0 ? formatMessage({ id: 'appOverview.no_limit' }) : set_limit_storage}</Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{running_apps}</Col>
                      </Row>
                      <Col className={styles.bor}>
                        <Dropdown
                          overlay={managementMenu(team_name)}
                          placement="bottomLeft"
                        >
                          <Icon component={moreSvg} style={{ width: '100%' }} />
                        </Dropdown>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 0 0 0', border: '1px solid #e3e3e3', borderTop: 0 }}>
              <Row style={{ width: '100%' }} className={styles.rowTitle}>
                <Row className={styles.teamMinTit} type="flex" align="middle">
                  <Col span={4} style={{ width: '13%', textAlign: 'center' }}>
                    {/* 项目/团队名称 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.teamName' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* 管理员 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.Administrator' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* 人数 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.number' />
                  </Col>
                  <Col span={7} style={{ width: '39%', textAlign: 'center' }}>
                    {/* 集群 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.colony' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* 内存使用量(MB) */}
                    <FormattedMessage id='enterpriseTeamManagement.table.memory' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* CPU使用量 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.CUP' />
                  </Col>
                  <Col span={2} style={{ width: '9%', textAlign: 'center' }}>
                    {/* 运行应用数 */}
                    <FormattedMessage id='enterpriseTeamManagement.table.operation' />
                  </Col>
                </Row>
                <Col className={styles.borTitle}>
                  {/* 操作 */}
                  <FormattedMessage id='enterpriseTeamManagement.table.handle' />
                </Col>
              </Row>
              {teamList.map(item => {
                const {
                  team_id,
                  team_alias,
                  region_list,
                  owner_name,
                  team_name,
                  running_apps,
                  user_number,
                  cpu_request,
                  memory_request,
                  set_limit_memory
                } = item;
                const memory = (memory_request == 0) ? formatMessage({ id: 'componentOverview.body.tab.overview.unlimited' }) : memory_request % 1024 == 0 ? (memory_request / 1024) : (memory_request / 1024).toFixed(1)
                const set_limit = (set_limit_memory == 0) ? formatMessage({ id: 'componentOverview.body.tab.overview.unlimited' }) : set_limit_memory % 1024 == 0 ? (set_limit_memory / 1024) : (set_limit_memory / 1024).toFixed(1)
                return (
                  <Card
                    key={team_id}
                    style={{ border: 0, borderBottom: '1px solid #f4f4f4' }}
                    hoverable
                    bodyStyle={{ padding: 0 }}
                  >
                    <Row
                      type="flex"
                      align="middle"
                      className={styles.pl24}
                    >
                      <Row
                        type="flex"
                        align="middle"
                        className={styles.pl23}
                        onClick={() => { this.handleJoinTeams(team_name, region_list[0].region_name); }}
                      >
                        <Col style={{ color: globalUtil.getPublicColor(), fontWeight: '600', width: '13%', textAlign: 'center', fontSize: '16px' }}>{team_alias}</Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{owner_name}</Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{user_number}</Col>
                        <Col style={{ width: '39%', display: 'flex', justifyContent: 'center' }} >
                          {this.showRegions(team_name, region_list, true)}
                        </Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{memory} </Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{cpu_request}</Col>
                        <Col style={{ width: '9%', textAlign: 'center' }}>{running_apps}</Col>
                      </Row>
                      <Col className={styles.bor}>
                        <Dropdown
                          overlay={managementMenu(team_name)}
                          placement="bottomLeft"
                        >
                          <Icon component={moreSvg} style={{ width: '100%' }} />
                        </Dropdown>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'right', margin: '15px' }}>
            {Number(this.state.total) > 10 && this.handlePaginations()}
          </div>
        </div>
      </div>
    );

    const teamInfo = (
      <div>
        <Row>
          <Col span={17} className={styles.teamsTit}>
            {/* {haveNewJoinTeam && '最新加入项目/团队'} */}
            {haveNewJoinTeam && <FormattedMessage id='enterpriseTeamManagement.other.haveNewJoinTeam' />}
          </Col>
        </Row>
        {haveNewJoinTeam && (
          <Row className={styles.teamMinTits} type="flex" align="middle">
            <Col span={6}>
              {/* 项目/团队名称 */}
              <FormattedMessage id='enterpriseTeamManagement.table.teamName' />
            </Col>
            <Col span={3}>
              {/* 管理员 */}
              <FormattedMessage id='enterpriseTeamManagement.table.Administrator' />
            </Col>
            <Col span={3}>
              {/* 角色 */}
              <FormattedMessage id='enterpriseTeamManagement.table.td.role' />
            </Col>
            <Col span={12}>
              {/* 状态 */}
              <FormattedMessage id='enterpriseTeamManagement.table.td.status' />
            </Col>
          </Row>
        )}
        {request_join_team &&
          request_join_team.map(item => {
            const {
              is_pass,
              team_id,
              team_name,
              team_alias,
              owner_name,
              role
            } = item;

            return (
              <Card
                key={team_id}
                style={{
                  // marginTop: '10px',
                  borderLeft: is_pass === 0 && '6px solid #4D73B1',
                  border: 0
                }}
                bodyStyle={{ padding: 0 }}
                hoverable
              >
                <Row
                  type="flex"
                  className={styles.pls24}
                  align="middle"
                  key={team_id}
                // onClick={()=>{this.onJumpTeam(team_name, region_list[0].region_name)}}
                >
                  <Col span={6} style={{ color: globalUtil.getPublicColor(), fontWeight: '600', fontSize: '16px' }}>{team_alias}</Col>
                  <Col span={3}>{owner_name}</Col>
                  <Col span={3}>{roleUtil.actionMap(role)}</Col>
                  <Col
                    span={11}
                    style={{
                      color: is_pass === 0 && '#999999'
                    }}
                  >
                    {is_pass === 0 && (
                      <span>
                        <img src={WarningImg} alt="" />
                        &nbsp;
                        {/* 申请加入项目/团队审批中 */}
                        <FormattedMessage id='enterpriseTeamManagement.other.examine' />
                      </span>
                    )}
                  </Col>
                  <Col span={1} className={styles.bors}>
                    <Dropdown
                      overlay={
                        is_pass === 0 ? menucancel(item) : menu(team_name)
                      }
                      placement="bottomLeft"
                    >
                      <Icon component={moreSvg} style={{ width: '100%' }} />
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })}

        <Row
          style={{
            margin: '10px 0',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Col
            span={language ? 2 : 3}
            className={styles.teamsTit}
            style={{ marginBottom: '0' }}
          >
            {/* 我的项目/团队 */}
            <FormattedMessage id='enterpriseTeamManagement.PageHeaderLayout.title' />
          </Col>

          <Col span={15} style={{ textAlign: 'left' }}>
            <Search
              style={{ width: '500px' }}
              placeholder={formatMessage({ id: 'enterpriseTeamManagement.allProject.search' })}
              onSearch={this.handleSearchUserTeam}
            />
          </Col>
          {en_operation}
        </Row>
        {userTeam && (
          <Row style={{ width: '100%' }} className={styles.rowTitle}>
            <Row className={styles.teamMinTit} type="flex" align="middle">
              <Col span={6} style={{ width: '16%', textAlign: 'center' }}>
                {/* 项目/团队名称 */}
                <FormattedMessage id='enterpriseTeamManagement.table.teamName' />
              </Col>
              <Col span={3} style={{ width: '10%', textAlign: 'center' }}>
                {/* 管理员 */}
                <FormattedMessage id='enterpriseTeamManagement.table.Administrator' />
              </Col>
              <Col span={3} style={{ width: '26%', textAlign: 'center' }}>
                {/* 角色 */}
                <FormattedMessage id='enterpriseTeamManagement.table.td.role' />
              </Col>
              <Col span={12} style={{ width: '48%', textAlign: 'left' }}>
                {/* 集群 */}
                <FormattedMessage id='enterpriseTeamManagement.table.colony' />
              </Col>
            </Row>
            <Col className={styles.borTitle}>
              {/* 操作 */}
              <FormattedMessage id='enterpriseTeamManagement.table.handle' />
            </Col>
          </Row>
        )}
        {!userTeam && (
          <Empty
            description={<FormattedMessage id='enterpriseTeamManagement.other.description' />}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        {userTeam &&
          userTeam.map(item => {
            const {
              team_id,
              team_alias,
              team_name,
              region_list,
              owner_name,
              roles
            } = item;
            return (
              <Card
                key={team_id}
                style={{ marginBottom: '10px' }}
                hoverable
                bodyStyle={{ padding: 0 }}
              >
                <Row
                  type="flex"
                  align="middle"
                  className={styles.pl24}
                >
                  <Row
                    type="flex"
                    align="middle"
                    className={styles.pl23}
                    onClick={() => { this.onJumpTeam(team_name, region_list[0].region_name) }}
                  >
                    <Col span={6} style={{ color: '#4D73B1', fontWeight: '600', width: '16%', textAlign: 'center', fontSize: '16px' }}>{team_alias}</Col>
                    <Col span={3} style={{ width: '10%', textAlign: 'center' }}>{owner_name}</Col>
                    <Col span={3} style={{ width: '26%', textAlign: 'center' }}>
                      {roles &&
                        roles.length > 0 &&
                        roles.map(role => {
                          return (
                            <span
                              style={{ marginRight: '8px' }}
                              key={`role${role}`}
                            >
                              {roleUtil.actionMap(role)}
                            </span>
                          );
                        })}
                    </Col>
                    <Col span={11} style={{ width: '48%', textAlign: 'left' }}>
                      {this.showRegions(team_name, region_list)}
                    </Col>
                  </Row>
                  <Col span={1} className={styles.bor}>
                    <Dropdown overlay={menu(team_name)} placement="bottomLeft">
                      <Icon component={moreSvg} style={{ width: '100%' }} />
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })}
      </div>
    );
    let title = <FormattedMessage id='enterpriseTeamManagement.PageHeaderLayout.title' />;
    const content = <FormattedMessage id='enterpriseTeamManagement.PageHeaderLayout.context' />;
    if (adminer) {
      title = <FormattedMessage id='enterpriseTeamManagement.PageHeaderLayout.title.admin' />;
    }
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
        {this.state.joinTeam && (
          <JoinTeam
            enterpriseID={eid}
            onOk={this.handleJoinTeam}
            onCancel={this.cancelJoinTeam}
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
        {this.state.showExitTeam && (
          <ConfirmModal
            onOk={this.handleExitTeam}
            title={formatMessage({ id: 'confirmModal.project_team_quit.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.project_team_quit.desc' })}
            onCancel={this.hideExitTeam}
          />
        )}
        {this.state.showDelApply && (
          <ConfirmModal
            onOk={this.handleDelApply}
            title={formatMessage({ id: 'confirmModal.revocation.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.revocation.desc' })}
            onCancel={this.hideDelApply}
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

        {enterpriseTeamsLoading || overviewTeamsLoading || userTeamsLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <ScrollerX sm={1250}>{adminer ? managementTemas : teamInfo}</ScrollerX>
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
