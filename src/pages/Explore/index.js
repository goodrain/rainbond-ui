import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Spin,
  Input,
  Row,
  Col,
  Pagination,
  Empty,
  Tooltip,
  Radio,
  Icon,
  Modal,
  Form,
  Select,
  Button,
  message,
  notification
} from 'antd';
import { pinyin } from 'pinyin-pro';
import { formatMessage, FormattedMessage } from 'umi';
import Lists from '../../components/Lists';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import Result from '../../components/Result';
import AppCard from './AppCard';
import { HotIcon, HeartIcon } from './icons';
import globalUtil from '../../utils/global';
import role from '../../utils/newRole';
import userUtil from '../../utils/user';
import styles from './index.less';

const { Search } = Input;

@connect(({ user, global, teamControl }) => ({
  currentUser: user.currentUser,
  enterprise: global.enterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
class Explore extends PureComponent {
  constructor(props) {
    super(props);
    // 分类列表 ref
    this.categoryListRef = React.createRef();
    this.categoryListOriginalTop = null;
    this.state = {
      // 分页
      marketPag: {
        pageSize: 20,
        total: 0,
        page: 1,
        query: ''
      },
      pageSize: 20,
      total: 0,
      page: 1,
      // 列表数据
      componentList: [],
      marketList: [],
      // 加载状态
      localLoading: true,
      marketLoading: false,
      hotCategoriesLoading: false,
      recommendedLoading: false,
      marketInfoSwitch: false,
      // Tab 数据
      marketTab: [],
      tabsList: [],
      activeTabKey: '', // 默认为空，等待市场数据加载后设置
      // 筛选
      tagList: [],
      tags: [],
      scope: 'enterprise',
      name: '',
      // 市场信息
      marketInfo: false,
      // 弹窗
      showApp: {},
      showMarketAppDetail: false,
      // 热门类别
      hotCategories: [],
      // 推荐应用
      recommendedApps: [],
      recommendedError: false,
      // 类别应用列表（无限滚动）
      selectedCategory: 'all', // 默认选中全部应用
      categoryApps: [],
      categoryAppsPage: 1,
      categoryAppsLoading: false,
      categoryAppsHasMore: true,
      // 搜索关键字
      searchKeyword: '',
      // 分类列表吸顶
      categoryListFixed: false,
      // 外部市场是否可用（分类接口是否成功）
      marketAvailable: true,
      marketErrorMsg: '',
      // 本地安装相关
      localInstallModalVisible: false,
      selectedLocalApp: null,
      teamList: [],
      teamListLoading: false,
      selectedTeam: null,
      groupList: [],
      groupListLoading: false,
      localInstallType: 'new',
      localInstallLoading: false,
      selectedLocalVersion: '',
      // 权限相关状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    };
  }

  componentDidMount() {
    const { currentUser } = this.props;

    if (currentUser) {
      this.load();
    }
    // 添加窗口滚动监听
    window.addEventListener('scroll', this.handleScroll);
  }

  load = () => {
    this.getApps();
    this.getTags();
    this.getMarketsTab(false, true);
    this.getHotCategories();
    this.getRecommendedApps();
    this.getCategoryApps(true); // 初始加载类别应用
  };

  componentWillUnmount() {
    // 移除滚动监听
    window.removeEventListener('scroll', this.handleScroll);
  }

  // 获取本地应用
  getApps = () => {
    const {
      dispatch,
      currentUser,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, pageSize, name, scope, tags } = this.state;

    this.setState({ localLoading: true }, () => {
      dispatch({
        type: 'market/fetchAppModels',
        payload: {
          enterprise_id: eid,
          user_id: currentUser.user_id,
          app_name: name,
          scope,
          page,
          page_size: pageSize,
          tags
        },
        callback: res => {
          if (res && res.status_code === 200) {
            this.setState({
              total: res.total,
              componentList: res.list || [],
              localLoading: false
            });
          } else {
            this.setState({
              localLoading: false,
              componentList: []
            });
          }
        },
        handleError: () => {
          this.setState({
            localLoading: false,
            componentList: []
          });
        }
      });
    });
  };

  // 获取标签
  getTags = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;

    dispatch({
      type: 'market/fetchAppModelsTags',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            tagList: res.list
          });
        }
      }
    });
  };

  // 获取热门类别
  getHotCategories = () => {
    const { dispatch } = this.props;

    this.setState({ hotCategoriesLoading: true });

    // 设置3秒超时
    const timeoutId = setTimeout(() => {
      this.setState({
        hotCategoriesLoading: false,
        hotCategories: [],
        marketAvailable: false,
        marketErrorMsg: formatMessage({ id: 'explore.error.network_timeout' })
      });
    }, 3000);

    dispatch({
      type: 'explore/fetchCategories',
      payload: {},
      callback: res => {
        clearTimeout(timeoutId);
        this.setState({ hotCategoriesLoading: false });
        if (res?.response_data?.tree) {
          this.setState({
            hotCategories: res?.response_data?.tree.slice(0, 5), // 只取前5个顶级分类
            marketAvailable: true,
            marketErrorMsg: ''
          });
        } else {
          this.setState({
            hotCategories: [],
            marketAvailable: false,
            marketErrorMsg: formatMessage({ id: 'explore.error.fetch_categories_failed' })
          });
        }
      },
      handleError: () => {
        clearTimeout(timeoutId);
        this.setState({
          hotCategoriesLoading: false,
          hotCategories: [],
          marketAvailable: false,
          marketErrorMsg: formatMessage({ id: 'explore.error.network_failed' })
        });
      }
    });
  };

  // 获取推荐应用
  getRecommendedApps = () => {
    const { dispatch } = this.props;
    this.setState({ recommendedLoading: true, recommendedError: false });
    dispatch({
      type: 'explore/fetchRecommendedApps',
      callback: res => {
        this.setState({ recommendedLoading: false });
        if (res?.response_data) {
          // 确保 recommendedApps 是数组
          const apps = Array.isArray(res.response_data) ? res.response_data : [];
          this.setState({
            recommendedApps: apps
          });
        } else {
          // 接口返回但没有数据，视为错误
          this.setState({ recommendedError: true });
        }
      },
      handleError: (res) => {
        this.setState({
          recommendedLoading: false,
          recommendedApps: [],
          recommendedError: true
        });
      }
    });
  };

  // 获取类别应用（无限滚动）
  getCategoryApps = (reset = false) => {
    const { dispatch } = this.props;
    const { selectedCategory, categoryAppsPage, categoryApps, categoryAppsLoading, categoryAppsHasMore, searchKeyword } = this.state;

    // 如果正在加载或没有更多数据，则不请求
    if (categoryAppsLoading || (!reset && !categoryAppsHasMore)) {
      return;
    }

    const page = reset ? 1 : categoryAppsPage;

    this.setState({ categoryAppsLoading: true });

    const payload = {
      page,
      page_size: 20,
      timeSort: 1
    };

    // 如果不是全部应用，添加 apptype 参数
    if (selectedCategory !== 'all') {
      payload.apptype = selectedCategory;
    }

    // 如果有搜索关键字，添加 query 参数
    if (searchKeyword) {
      payload.query = searchKeyword;
    }

    dispatch({
      type: 'explore/fetchApps',
      payload,
      callback: res => {
        this.setState({ categoryAppsLoading: false });
        if (res?.response_data?.apps) {
          const newApps = res.response_data.apps || [];
          const totalPages = Math.ceil((res.response_data.total || 0) / 20);

          this.setState({
            categoryApps: reset ? newApps : [...categoryApps, ...newApps],
            categoryAppsPage: page + 1,
            categoryAppsHasMore: page < totalPages && newApps.length > 0
          });
        }
      },
      handleError: () => {
        this.setState({
          categoryAppsLoading: false,
          categoryAppsHasMore: false
        });
      }
    });
  };

  // 点击类别
  handleCategoryClick = (categoryId) => {
    const { selectedCategory } = this.state;
    if (categoryId === selectedCategory) return;

    this.setState({
      selectedCategory: categoryId,
      categoryApps: [],
      categoryAppsPage: 1,
      categoryAppsHasMore: true
    }, () => {
      this.getCategoryApps(true);
    });
  };

  // 搜索类别应用
  handleSearchCategory = (keyword) => {
    this.setState({
      searchKeyword: keyword,
      categoryApps: [],
      categoryAppsPage: 1,
      categoryAppsHasMore: true
    }, () => {
      this.getCategoryApps(true);
    });
  };

  // 滚动加载
  handleScroll = () => {
    const { activeTabKey, categoryListFixed } = this.state;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // 动态获取分类列表的原始位置（只在未吸顶时记录）
    if (!categoryListFixed && this.categoryListRef.current) {
      const rect = this.categoryListRef.current.getBoundingClientRect();
      // 记录元素相对于文档顶部的位置
      this.categoryListOriginalTop = rect.top + scrollTop;
    }

    // 检测分类列表是否需要吸顶
    // 118px = 56px (header) + 62px (tabSwitcher)
    const fixedTop = 118;
    if (this.categoryListOriginalTop !== null) {
      const shouldFixed = scrollTop > this.categoryListOriginalTop - fixedTop;
      if (shouldFixed !== categoryListFixed) {
        this.setState({ categoryListFixed: shouldFixed });
      }
    }

    // 只在外部市场 tab 下触发滚动加载
    if (activeTabKey === 'local') return;

    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // 距离底部 200px 时加载更多
    if (scrollHeight - scrollTop - clientHeight < 200) {
      this.getCategoryApps();
    }
  };

  // 获取团队列表
  fetchTeamList = () => {
    const {
      dispatch,
      match: { params: { eid } },
      location
    } = this.props;

    this.setState({ teamListLoading: true });

    // 获取 URL 中的 teamName 参数
    const query = new URLSearchParams(location?.search || '');
    const urlTeamName = query.get('teamName') || '';

    dispatch({
      type: 'global/fetchMyTeams',
      payload: {
        enterprise_id: eid,
        page: 1,
        page_size: 100
      },
      callback: res => {
        if (res && res.list) {
          const teams = res.list || [];
          this.setState({
            teamList: teams,
            teamListLoading: false
          });
          // 如果有团队，根据 URL 参数或默认选中第一个
          if (teams.length > 0) {
            let targetTeam = null;
            // 如果 URL 中有 teamName 参数，尝试找到对应的团队
            if (urlTeamName) {
              targetTeam = teams.find(t => t.team_name === urlTeamName);
            }
            // 如果没找到或没有参数，选中第一个团队
            if (!targetTeam) {
              targetTeam = teams[0];
            }
            // 自动选中团队
            this.handleTeamChange(targetTeam.team_name);
          }
        } else {
          this.setState({ teamListLoading: false });
        }
      },
      handleError: () => {
        this.setState({ teamListLoading: false });
      }
    });
  };

  // 获取团队权限信息
  fetchTeamPermissions = (teamName) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res.bean) {
          const team = userUtil.getTeamByTeamName(res.bean, teamName);
          const tenantActions = team?.tenant_actions;
          // 获取应用创建权限
          const creatAppPermission = role.queryPermissionsInfo(tenantActions?.team, 'team_app_create');
          this.setState({
            teamPermissionsInfo: tenantActions,
            creatAppPermission: creatAppPermission
          });
        }
      },
      handleError: err => {
        console.error('获取团队权限失败:', err);
      }
    });
  };

  // 团队选择变更
  handleTeamChange = (teamName) => {
    const { teamList } = this.state;
    const { form } = this.props;
    const team = teamList.find(t => t.team_name === teamName);
    if (team) {
      // 获取团队的第一个集群
      const regionName = team.region?.[0]?.region_name || team.region_list?.[0]?.region_name;
      this.setState({
        selectedTeam: team,
        groupList: [],
        localInstallType: 'new',
        // 重置权限状态
        creatAppPermission: {},
        creatComPermission: {},
        teamPermissionsInfo: null
      });
      // 清空已选择的应用
      if (form) {
        form.setFieldsValue({ group_id: undefined });
      }
      // 获取该团队的应用列表
      if (regionName) {
        this.fetchGroupList(teamName, regionName);
      }
      // 获取团队权限信息
      this.fetchTeamPermissions(teamName);
    }
  };

  // 获取应用列表
  fetchGroupList = (teamName, regionName) => {
    const { dispatch } = this.props;

    this.setState({ groupListLoading: true });

    dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teamName,
        region_name: regionName
      },
      callback: res => {
        this.setState({
          groupList: res || [],
          groupListLoading: false
        });
      },
      handleError: () => {
        this.setState({ groupListLoading: false, groupList: [] });
      }
    });
  };

  // 生成英文名
  generateEnglishName = (name) => {
    if (name) {
      const pinyinName = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
      return pinyinName.toLowerCase();
    }
    return '';
  };

  // 点击本地应用安装按钮
  handleLocalAppInstall = (app) => {
    this.setState({
      selectedLocalApp: app,
      localInstallModalVisible: true,
      selectedLocalVersion: app.versions_info && app.versions_info.length > 0
        ? app.versions_info[0].version
        : '',
      localInstallType: 'new',
      selectedTeam: null,
      groupList: [],
      // 重置权限状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    }, () => {
      this.fetchTeamList();
    });
  };

  // 关闭本地安装弹窗
  handleLocalInstallCancel = () => {
    this.setState({
      localInstallModalVisible: false,
      selectedLocalApp: null,
      selectedTeam: null,
      groupList: [],
      localInstallType: 'new',
      localInstallLoading: false,
      // 重置权限状态
      creatAppPermission: {},
      creatComPermission: {},
      teamPermissionsInfo: null
    });
    // 重置表单
    if (this.props.form) {
      this.props.form.resetFields();
    }
  };

  // 本地安装类型变更
  handleLocalInstallTypeChange = (e) => {
    const installType = e.target.value;
    const { creatAppPermission, creatComPermission } = this.state;
    this.setState({ localInstallType: installType });
  };

  // 本地版本变更
  handleLocalVersionChange = (version) => {
    this.setState({ selectedLocalVersion: version });
  };

  // 选择应用变更（用于权限检查）
  handleGroupChange = (groupId) => {
    const { teamPermissionsInfo } = this.state;
    if (teamPermissionsInfo && groupId) {
      // 获取组件创建权限
      const creatComPermission = role.queryPermissionsInfo(teamPermissionsInfo?.team, 'app_overview', `app_${groupId}`);
      this.setState({ creatComPermission: creatComPermission });
    }
  };

  // 提交本地安装
  handleLocalInstallSubmit = () => {
    const { dispatch } = this.props;
    const {
      selectedLocalApp,
      selectedTeam,
      localInstallType,
      selectedLocalVersion
    } = this.state;

    const { form } = this.props;

    form.validateFields((err, values) => {
      if (err) return;

      if (!selectedTeam) {
        message.error(formatMessage({ id: 'explore.error.select_team' }));
        return;
      }

      // 获取团队的第一个集群
      const regionName = selectedTeam.region?.[0]?.region_name || selectedTeam.region_list?.[0]?.region_name;
      if (!regionName) {
        message.error(formatMessage({ id: 'explore.error.no_cluster' }));
        return;
      }

      if (!selectedLocalVersion) {
        message.error(formatMessage({ id: 'explore.error.select_version' }));
        return;
      }

      this.setState({ localInstallLoading: true });

      const teamName = selectedTeam.team_name;

      const installApp = (finalGroupId, isNewApp = false) => {
        dispatch({
          type: 'createApp/installApp',
          payload: {
            team_name: teamName,
            region_name: regionName,
            group_id: finalGroupId,
            app_id: selectedLocalApp.app_id,
            is_deploy: true,
            group_key: selectedLocalApp.group_key || selectedLocalApp.ID,
            app_version: selectedLocalVersion,
            install_from_cloud: false
          },
          callback: () => {
            notification.success({
              message: formatMessage({ id: 'explore.success.install' }),
              description: formatMessage({ id: 'explore.success.install_desc' })
            });
            this.setState({ localInstallLoading: false });
            this.handleLocalInstallCancel();
            // 跳转到应用详情页
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${regionName}/apps/${finalGroupId}/overview`
              )
            );
          },
          handleError: () => {
            message.error(formatMessage({ id: 'explore.error.install_failed' }));
            this.setState({ localInstallLoading: false });
          }
        });
      };

      if (localInstallType === 'new' && values.group_name) {
        // 创建新应用
        const k8s_app = this.generateEnglishName(values.group_name);
        dispatch({
          type: 'application/addGroup',
          payload: {
            region_name: regionName,
            team_name: teamName,
            group_name: values.group_name,
            k8s_app: k8s_app,
            note: ''
          },
          callback: (res) => {
            if (res && res.group_id) {
              installApp(res.group_id, true);
            } else {
              this.setState({ localInstallLoading: false });
            }
          },
          handleError: () => {
            message.error(formatMessage({ id: 'explore.error.create_app_failed' }));
            this.setState({ localInstallLoading: false });
          }
        });
      } else if (localInstallType === 'existing' && values.group_id) {
        // 安装到已有应用
        installApp(values.group_id, false);
      } else {
        this.setState({ localInstallLoading: false });
        message.error(formatMessage({ id: 'explore.error.fill_complete_info' }));
      }
    });
  };

  // 获取类别样式配置
  getCategoryStyle = (category, index) => {
    // 预定义的颜色样式列表
    const colorStyles = ['categoryBlue', 'categoryPurple', 'categoryCyan', 'categoryGreen', 'categoryGray'];
    // 预定义的图标列表
    const icons = ['robot', 'code', 'bar-chart', 'desktop', 'database'];

    // 根据类别名称匹配特定样式
    const nameStyleMap = {
      'AI 智能体与应用': { style: 'categoryBlue', icon: 'robot' },
      'AI 开发和编排': { style: 'categoryPurple', icon: 'code' },
      '业务与生产力应用': { style: 'categoryCyan', icon: 'bar-chart' },
      '开发工具和环境': { style: 'categoryGreen', icon: 'desktop' },
      '数据和中间件': { style: 'categoryGray', icon: 'database' }
    };

    const categoryName = category.appClassificationName || '';

    if (nameStyleMap[categoryName]) {
      return nameStyleMap[categoryName];
    }

    // 默认按索引循环使用样式
    return {
      style: colorStyles[index % colorStyles.length],
      icon: icons[index % icons.length]
    };
  };

  // 获取市场 Tab 列表
  getMarketsTab = (ID, first) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;

    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          const list = res.list || [];
          this.setState(
            {
              marketTab: list
            },
            () => {
              const arr = [];
              this.state.marketTab.forEach(item => {
                item.types = 'marketTab';
                arr.push(item);
              });
              this.setState({
                tabsList: [...this.state.tabsList, ...arr],
                marketInfoSwitch: true
              });
              // 默认选中第一个应用市场，使用 name 作为 key
              if (first && list.length > 0) {
                const firstMarket = list[0];
                this.onTabChange(firstMarket.name);
              } else if (ID) {
                this.onTabChange(ID);
              }
            }
          );
        }
      },
      handleError: () => {
        this.setState({
          marketInfoSwitch: true
        });
      }
    });
  };

  // 获取云市场应用
  getMarkets = name => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { marketPag } = this.state;

    const payload = {
      name,
      enterprise_id: eid,
      ...marketPag
    };

    this.setState({ marketLoading: true });

    dispatch({
      type: 'market/fetchMarkets',
      payload,
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            marketLoading: false,
            marketList: res.list,
            marketPag: {
              ...this.state.marketPag,
              total: res.total
            }
          });
        }
      },
      handleError: () => {
        this.setState({
          marketLoading: false,
          marketList: []
        });
      }
    });
  };

  // Tab 切换 - 使用 name 作为 key
  onTabChange = tabKey => {
    const { marketTab } = this.state;

    let marketArr = marketTab.filter(item => item.name === tabKey);
    const isMarket = marketArr && marketArr.length > 0;

    this.setState(
      {
        marketInfo: isMarket ? marketArr[0] : false,
        activeTabKey: `${tabKey}`,
        name: '',
        marketList: [],
        marketLoading: true,
        marketPag: {
          pageSize: 20,
          total: 0,
          page: 1,
          query: ''
        }
      },
      () => {
        if (tabKey !== 'local' && isMarket && marketArr[0].status === 1) {
          this.getMarkets(marketArr[0].name);
        } else if (tabKey === 'local') {
          this.getApps();
        }
      }
    );
  };

  // 搜索本地应用
  handleSearchLocal = name => {
    this.setState({ page: 1, name }, () => {
      this.getApps();
    });
  };

  // 搜索云市场应用
  handleSearchMarket = query => {
    const { marketPag, marketInfo } = this.state;
    this.setState(
      {
        marketPag: { ...marketPag, page: 1, query }
      },
      () => {
        this.getMarkets(marketInfo && marketInfo.name);
      }
    );
  };

  // 本地应用分页
  onPageChangeApp = (page, pageSize) => {
    this.setState({ page, pageSize }, () => {
      this.getApps();
    });
  };

  // 云市场分页
  onPageChangeAppMarket = (page, pageSize) => {
    const { marketInfo, marketPag } = this.state;
    this.setState(
      {
        marketPag: { ...marketPag, page, pageSize }
      },
      () => {
        this.getMarkets(marketInfo && marketInfo.name);
      }
    );
  };

  // 显示应用详情 - 跳转到详情页
  showMarketAppDetail = app => {
    const {
      dispatch,
      match: {
        params: { eid }
      },
      location
    } = this.props;
    // 兼容两种数据结构获取 appId
    const appId = app.id || app.app_id || '';
    // 获取 URL 中的 teamName 参数并传递到详情页
    const query = new URLSearchParams(location?.search || '');
    const teamName = query.get('teamName') || '';
    let path = `/explore/${eid}/detail/${appId}`;
    if (teamName) {
      path = `${path}?teamName=${teamName}`;
    }
    dispatch(routerRedux.push(path));
  };

  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  // 渲染列表项
  renderListItem = (types, item, pic, versions, index) => {
    const {
      app_id: appId,
      describe,
      app_name: appName,
      name = '',
      tags,
      dev_status: devStatus,
      install_number: installNumber
    } = item;

    const defaulAppImg = globalUtil.fetchSvg('defaulAppImg');
    const isLocalsContent = types !== 'marketContent';

    return (
      <Lists
        key={appId || index}
        Cols={
          <div
            className={styles.listItem}
            onClick={() => {
              if (types === 'marketContent') {
                this.showMarketAppDetail(item);
              }
            }}
          >
            <Col span={3} style={{ display: 'flex' }}>
              <div className={styles.installCount}>
                <Tooltip title={<FormattedMessage id="applicationMarket.localMarket.have.installNumber" />}>
                  <div title={installNumber}>
                    {globalUtil.nFormatter(installNumber)}
                  </div>
                </Tooltip>
              </div>
              <div className={styles.appIcon}>
                {pic ? <img src={pic} alt="" /> : defaulAppImg}
              </div>
            </Col>
            <Col span={12} className={styles.appInfo}>
              <div>
                <p className={styles.appName}>
                  <a onClick={e => {
                    e.stopPropagation();
                    this.showMarketAppDetail(item);
                  }}>
                    {appName || name}
                  </a>
                </p>
                <p className={styles.appDesc}>
                  <Tooltip placement="topLeft" title={describe}>
                    {describe}
                  </Tooltip>
                </p>
              </div>
            </Col>
            <Col span={3} className={styles.appVersion}>
              <div>
                {devStatus && <p className={styles.devStatus}>{devStatus}</p>}
                {versions && versions.length > 0 ? (
                  <p className={styles.version}>
                    {isLocalsContent
                      ? versions[versions.length - 1].version
                      : versions[0].app_version}
                  </p>
                ) : (
                  <p className={styles.version}>
                    <FormattedMessage id="applicationMarket.localMarket.have.versions" />
                  </p>
                )}
              </div>
            </Col>
            <Col span={4} className={styles.appTags}>
              {tags &&
                tags.length > 0 &&
                tags.slice(0, 3).map((tagItem, idx) => (
                  <div key={isLocalsContent ? tagItem.tag_id : idx} className={styles.tag}>
                    {isLocalsContent ? tagItem.name : tagItem}
                  </div>
                ))}
              {tags && tags.length > 3 && (
                <span className={styles.moreTags}>+{tags.length - 3}</span>
              )}
            </Col>
            <Col span={2} className={styles.appAction}>
              <div className={styles.installBtn}>
                {globalUtil.fetchSvg('InstallApp')}
                <span><FormattedMessage id="applicationMarket.localMarket.have.install" /></span>
              </div>
            </Col>
          </div>
        }
      />
    );
  };

  render() {
    const {
      match: {
        params: { eid }
      }
    } = this.props;

    const {
      componentList,
      marketList,
      localLoading,
      marketLoading,
      activeTabKey,
      marketInfo,
      marketPag,
      tabsList,
      marketInfoSwitch,
      showMarketAppDetail,
      showApp
    } = this.state;

    const isMarket = marketInfo && marketInfo.status === 1;
    const accessActions = marketInfo?.access_actions || [];

    const contentStyle = {
      display: 'flex',
      alignItems: 'center',
      padding: '0 0 10px 0',
      margin: '10px 0'
    };

    const paginationStyle = {
      textAlign: 'right',
      margin: '16px 0'
    };

    // 本地组件库内容
    const localsContent = (
      <div className={styles.tabContent}>
        {localLoading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : componentList && componentList.length > 0 ? (
          <div className={styles.localAppCardList}>
            {componentList.map((item, index) => (
              <AppCard
                key={item.app_id || index}
                app={{
                  ...item,
                  name: item.app_name,
                  logo: item.pic,
                  desc: item.describe,
                  maxVersion: item.versions_info && item.versions_info.length > 0
                    ? item.versions_info[0].version
                    : ''
                }}
                type="local"
                onInstall={() => this.handleLocalAppInstall(item)}
              />
            ))}
          </div>
        ) : (
          <Empty
            description={<FormattedMessage id="applicationMarket.localMarket.nothing.msg" />}
            style={{ marginTop: 100 }}
          />
        )}

        {this.state.total > 20 && (
          <div style={paginationStyle}>
            <Pagination
              showQuickJumper
              current={this.state.page}
              pageSize={this.state.pageSize}
              total={this.state.total}
              onChange={this.onPageChangeApp}
              showTotal={total => formatMessage({ id: 'explore.total_count' }, { total })}
              showSizeChanger
              onShowSizeChange={this.onPageChangeApp}
            />
          </div>
        )}
      </div>
    );

    // 云市场内容
    const marketContent = (
      <div className={styles.tabContent}>
        {/* 外部市场不可用时显示错误提示 */}
        {!this.state.marketAvailable ? (
          <div className={styles.marketErrorCard}>
            <Result
              type="warning"
              title={formatMessage({ id: 'explore.market.unavailable_title' })}
              description={formatMessage({ id: 'explore.market.unavailable_desc' })}
            />
          </div>
        ) : (
          <>
            {/* 推荐 - 接口报错或404时不展示 */}
            {!this.state.recommendedError && (
              <div className={styles.recommendSection}>
                <div className={styles.recommendHeader}>
                  <h3 className={styles.recommendTitle}>
                    <HeartIcon className={styles.recommendTitleIcon} />
                    {formatMessage({ id: 'explore.recommend' })}
                  </h3>
                </div>
                <div className={styles.recommendList}>
                  {this.state.recommendedLoading ? (
                    <Spin />
                  ) : this.state.recommendedApps.length > 0 ? (
                    this.state.recommendedApps.map((app, index) => (
                      <AppCard
                        key={app.id || index}
                        app={app}
                        onClick={this.showMarketAppDetail}
                      />
                    ))
                  ) : (
                    <Empty description={formatMessage({ id: 'explore.recommend.no_apps' })} />
                  )}
                </div>
              </div>
            )}

            {/* 热门类别标题 */}
            <div className={styles.hotCategories}>
              <div className={styles.hotCategoriesHeader}>
                <h3 className={styles.hotCategoriesTitle}>
                  <HotIcon className={styles.hotCategoriesTitleIcon} />
                  {formatMessage({ id: 'explore.hot_categories' })}
                </h3>
              </div>
            </div>

            {/* 分类列表 - 吸顶 */}
            <div
              ref={this.categoryListRef}
              className={`${styles.categoryList} ${this.state.categoryListFixed ? styles.categoryListFixed : ''}`}
            >
              {/* 全部应用选项 */}
              <div
                className={`${styles.categoryItem} ${styles.categoryAll} ${this.state.selectedCategory === 'all' ? styles.categoryActive : ''}`}
                onClick={() => this.handleCategoryClick('all')}
              >
                <span className={styles.categoryName}>{formatMessage({ id: 'explore.all_apps' })}</span>
                <Icon type="appstore" className={styles.categoryIcon} />
              </div>
              {this.state.hotCategoriesLoading ? (
                <Spin size="small" />
              ) : this.state.hotCategories.length > 0 ? (
                this.state.hotCategories.map((category, index) => {
                  const { style, icon } = this.getCategoryStyle(category, index);
                  const categoryName = category.appClassificationName || formatMessage({ id: 'explore.unknown_category' });
                  const categoryId = category.appClassificationID;
                  const isActive = this.state.selectedCategory === categoryId;
                  return (
                    <div
                      key={categoryId || index}
                      className={`${styles.categoryItem} ${styles[style]} ${isActive ? styles.categoryActive : ''}`}
                      onClick={() => this.handleCategoryClick(categoryId)}
                    >
                      <span className={styles.categoryName}>{categoryName}</span>
                      <Icon type={icon} className={styles.categoryIcon} />
                    </div>
                  );
                })
              ) : (
                <Empty description={formatMessage({ id: 'explore.no_categories' })} />
              )}
            </div>
            {/* 吸顶时的占位元素 */}
            {this.state.categoryListFixed && <div className={styles.categoryListPlaceholder} />}

            {/* 类别应用列表 */}
            <div className={styles.categoryAppsSection}>
              <div className={styles.categoryAppsList}>
                {this.state.categoryApps.map((app, index) => (
                  <AppCard
                    key={app.id || index}
                    app={app}
                    onClick={this.showMarketAppDetail}
                  />
                ))}
              </div>
              {this.state.categoryAppsLoading && (
                <div className={styles.loadingMore}>
                  <Spin size="small" />
                  <span>{formatMessage({ id: 'explore.loading' })}</span>
                </div>
              )}
              {!this.state.categoryAppsHasMore && this.state.categoryApps.length > 0 && (
                <div className={styles.noMore}>{formatMessage({ id: 'explore.no_more' })}</div>
              )}
              {!this.state.categoryAppsLoading && this.state.categoryApps.length === 0 && (
                <Empty description={formatMessage({ id: 'explore.no_apps' })} />
              )}
            </div>
          </>
        )}
      </div>
    );

    // 判断当前是否选中应用市场
    const isMarketActive = activeTabKey !== 'local';
    const isLocalActive = activeTabKey === 'local';

    // 本地安装相关状态
    const {
      localInstallModalVisible,
      selectedLocalApp,
      teamList,
      teamListLoading,
      selectedTeam,
      groupList,
      groupListLoading,
      localInstallType,
      localInstallLoading,
      selectedLocalVersion,
      creatAppPermission,
      creatComPermission
    } = this.state;

    const { getFieldDecorator } = this.props.form;

    // 渲染当前内容
    const renderContent = () => {
      if (isLocalActive) {
        return localsContent;
      }
      return marketContent;
    };

    // 本地安装弹窗
    const localInstallModal = (
      <Modal
        title={formatMessage({ id: 'explore.install.title' }, { name: selectedLocalApp?.app_name || '' })}
        visible={localInstallModalVisible}
        onCancel={this.handleLocalInstallCancel}
        footer={null}
        width={500}
        destroyOnClose
      >
        {teamListLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : teamList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Empty
              description={
                <span style={{ color: '#666' }}>
                  {formatMessage({ id: 'explore.install.no_team' })}
                </span>
              }
            />
          </div>
        ) : (
          <Form layout="vertical">
            <Form.Item label={formatMessage({ id: 'explore.install.select_team' })}>
              <Select
                placeholder={formatMessage({ id: 'explore.install.select_team_placeholder' })}
                loading={teamListLoading}
                value={selectedTeam?.team_name}
                onChange={this.handleTeamChange}
                style={{ width: '100%' }}
              >
                {Array.isArray(teamList) && teamList.map(team => (
                  <Select.Option key={team.team_name} value={team.team_name}>
                    {team.team_alias || team.team_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {selectedLocalApp?.versions_info && selectedLocalApp.versions_info.length > 0 && (
              <Form.Item label={formatMessage({ id: 'explore.install.select_version' })}>
                <Select
                  placeholder={formatMessage({ id: 'explore.install.select_version_placeholder' })}
                  value={selectedLocalVersion}
                  onChange={this.handleLocalVersionChange}
                  style={{ width: '100%' }}
                >
                  {selectedLocalApp.versions_info.map((v, idx) => (
                    <Select.Option key={idx} value={v.version}>
                      {v.version}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {selectedTeam && (
              <Form.Item label={formatMessage({ id: 'explore.install.type' })}>
                <Radio.Group
                  value={localInstallType}
                  onChange={this.handleLocalInstallTypeChange}
                  buttonStyle="solid"
                >
                  <Radio.Button value="new">{formatMessage({ id: 'explore.install.type_new' })}</Radio.Button>
                  <Radio.Button value="existing">{formatMessage({ id: 'explore.install.type_existing' })}</Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}

            {selectedTeam && localInstallType === 'new' && (
              <Form.Item label={formatMessage({ id: 'explore.install.app_name' })}>
                {getFieldDecorator('group_name', {
                  initialValue: selectedLocalApp?.app_name || '',
                  rules: [
                    { required: true, message: formatMessage({ id: 'explore.install.app_name_placeholder' }) },
                    { max: 24, message: formatMessage({ id: 'explore.install.app_name_max' }) }
                  ]
                })(<Input placeholder={formatMessage({ id: 'explore.install.app_name_placeholder' })} />)}
              </Form.Item>
            )}

            {selectedTeam && localInstallType === 'existing' && (
              <Form.Item label={formatMessage({ id: 'explore.install.select_app' })}>
                {getFieldDecorator('group_id', {
                  rules: [{ required: true, message: formatMessage({ id: 'explore.install.select_app_placeholder' }) }]
                })(
                  <Select
                    placeholder={formatMessage({ id: 'explore.install.select_app_placeholder' })}
                    loading={groupListLoading}
                    style={{ width: '100%' }}
                    onChange={this.handleGroupChange}
                  >
                    {Array.isArray(groupList) && groupList.map(group => (
                      <Select.Option key={group.group_id} value={group.group_id}>
                        {group.group_name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            )}

            <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
              {(() => {
                // 计算权限相关的禁用状态
                let permissionDisabled = false;
                let permissionTip = '';

                if (localInstallType === 'new' && creatAppPermission?.isAccess === false) {
                  permissionDisabled = true;
                  permissionTip = formatMessage({ id: 'explore.error.no_permission_create_app' });
                } else if (localInstallType === 'existing' && creatComPermission?.isCreate === false) {
                  permissionDisabled = true;
                  permissionTip = formatMessage({ id: 'explore.error.no_permission_create_component' });
                }

                const isDisabled = !selectedTeam || !selectedLocalVersion || permissionDisabled;

                const button = (
                  <Button
                    type="primary"
                    onClick={this.handleLocalInstallSubmit}
                    loading={localInstallLoading}
                    disabled={isDisabled}
                  >
                    {formatMessage({ id: 'explore.install.confirm' })}
                  </Button>
                );

                // 如果因权限禁用，显示提示
                if (permissionDisabled) {
                  return (
                    <Tooltip title={permissionTip}>
                      {button}
                    </Tooltip>
                  );
                }

                return button;
              })()}
            </Form.Item>
          </Form>
        )}
      </Modal>
    );

    return (
      <div className={styles.explorePage}>
        {showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={showApp}
          />
        )}

        {localInstallModal}

        {marketInfoSwitch ? (
          <div className={styles.exploreContainer}>
            {/* 手写的两个选项 */}
            <div className={styles.tabSwitcher}>
              <div className={styles.tabSwitcherLeft}>
                <div
                  className={`${styles.tabOption} ${isMarketActive ? styles.active : ''}`}
                  onClick={() => {
                    // 切换到外部市场，选中第一个市场，使用 name 作为 key
                    if (tabsList.length > 0) {
                      const firstMarket = tabsList[0];
                      if (firstMarket.types === 'marketTab') {
                        this.onTabChange(firstMarket.name);
                      }
                    }
                  }}
                >
                  <Icon type="global" className={styles.tabOptionIcon} />
                  <span>{formatMessage({ id: 'explore.market.external' })}</span>
                </div>
                <div
                  className={`${styles.tabOption} ${isLocalActive ? styles.active : ''}`}
                  onClick={() => this.onTabChange('local')}
                >
                  <Icon type="desktop" className={styles.tabOptionIcon} />
                  <span>{formatMessage({ id: 'explore.market.local' })}</span>
                </div>
              </div>
              <div className={styles.tabSwitcherRight}>
                <Search
                  placeholder={isLocalActive ? formatMessage({ id: 'applicationMarket.localMarket.placeholder' }) : formatMessage({ id: 'explore.search_apps' })}
                  onSearch={isLocalActive ? this.handleSearchLocal : this.handleSearchCategory}
                  value={isLocalActive ? this.state.name : this.state.searchKeyword}
                  allowClear
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isLocalActive) {
                      this.setState({ name: value });
                      if (!value && this.state.name) {
                        this.setState({ name: '', page: 1 }, () => {
                          this.getApps();
                        });
                      }
                    } else {
                      this.setState({ searchKeyword: value });
                      if (!value && this.state.searchKeyword) {
                        this.setState({
                          categoryApps: [],
                          categoryAppsPage: 1,
                          categoryAppsHasMore: true
                        }, () => {
                          this.getCategoryApps(true);
                        });
                      }
                    }
                  }}
                  style={{ width: 215 }}
                />
              </div>
            </div>

            {/* 内容区域 */}
            <div className={styles.contentArea}>
              {renderContent()}
            </div>
          </div>
        ) : (
          <div className={styles.loading}>
            <Spin />
          </div>
        )}
      </div>
    );
  }
}

export default Form.create()(Explore);
