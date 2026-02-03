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
  Icon
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi';
import Lists from '../../components/Lists';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import AppCard from './AppCard';
import { HotIcon, HeartIcon } from './icons';
import globalUtil from '../../utils/global';
import styles from './index.less';

const { Search } = Input;

@connect(({ user, global }) => ({
  currentUser: user.currentUser,
  enterprise: global.enterprise
}))
class Explore extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // 分页
      marketPag: {
        pageSize: 10,
        total: 0,
        page: 1,
        query: ''
      },
      pageSize: 10,
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
      // 类别应用列表（无限滚动）
      selectedCategory: 'all', // 默认选中全部应用
      categoryApps: [],
      categoryAppsPage: 1,
      categoryAppsLoading: false,
      categoryAppsHasMore: true
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
              componentList: res.list,
              localLoading: false
            });
          }
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

    dispatch({
      type: 'explore/fetchCategories',
      payload: {},
      callback: res => {
        this.setState({ hotCategoriesLoading: false });
        console.log(res, "res");

        if (res?.response_data?.tree) {
          this.setState({
            hotCategories: res?.response_data?.tree.slice(0, 5) // 只取前5个顶级分类
          });
        }
      }
    });
  };

  // 获取推荐应用
  getRecommendedApps = () => {
    const { dispatch } = this.props;

    this.setState({ recommendedLoading: true });

    dispatch({
      type: 'explore/fetchRecommendedApps',
      callback: res => {
        this.setState({ recommendedLoading: false });
        if (res?.response_data) {
          this.setState({
            recommendedApps: res.response_data || []
          });
        }
      }
    });
  };

  // 获取类别应用（无限滚动）
  getCategoryApps = (reset = false) => {
    const { dispatch } = this.props;
    const { selectedCategory, categoryAppsPage, categoryApps, categoryAppsLoading, categoryAppsHasMore } = this.state;

    // 如果正在加载或没有更多数据，则不请求
    if (categoryAppsLoading || (!reset && !categoryAppsHasMore)) {
      return;
    }

    const page = reset ? 1 : categoryAppsPage;

    this.setState({ categoryAppsLoading: true });

    const payload = {
      page,
      page_size: 10,
      timeSort: 1
    };

    // 如果不是全部应用，添加 apptype 参数
    if (selectedCategory !== 'all') {
      payload.apptype = selectedCategory;
    }

    dispatch({
      type: 'explore/fetchApps',
      payload,
      callback: res => {
        this.setState({ categoryAppsLoading: false });
        if (res?.response_data?.apps) {
          const newApps = res.response_data.apps || [];
          const totalPages = Math.ceil((res.response_data.total || 0) / 10);

          this.setState({
            categoryApps: reset ? newApps : [...categoryApps, ...newApps],
            categoryAppsPage: page + 1,
            categoryAppsHasMore: page < totalPages && newApps.length > 0
          });
        }
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

  // 滚动加载
  handleScroll = () => {
    const { activeTabKey } = this.state;
    // 只在外部市场 tab 下触发滚动加载
    if (activeTabKey === 'local') return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // 距离底部 200px 时加载更多
    if (scrollHeight - scrollTop - clientHeight < 200) {
      this.getCategoryApps();
    }
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
              // 默认选中第一个应用市场
              if (first && list.length > 0) {
                const firstMarket = list[0];
                this.onTabChange(firstMarket.ID);
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
      }
    });
  };

  // Tab 切换
  onTabChange = tabID => {
    const { marketTab } = this.state;

    let marketArr = marketTab.filter(item => item.ID === Number(tabID));
    const isMarket = marketArr && marketArr.length > 0;

    this.setState(
      {
        marketInfo: isMarket ? marketArr[0] : false,
        activeTabKey: `${tabID}`,
        name: '',
        marketList: [],
        marketLoading: true,
        marketPag: {
          pageSize: 10,
          total: 0,
          page: 1,
          query: ''
        }
      },
      () => {
        if (tabID !== 'local' && isMarket && marketArr[0].status === 1) {
          this.getMarkets(marketArr[0].name);
        } else if (tabID === 'local') {
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

  // 范围切换
  onChangeRadio = e => {
    this.setState({ page: 1, scope: e.target.value }, () => {
      this.getApps();
    });
  };

  // 显示应用详情 - 跳转到详情页
  showMarketAppDetail = app => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    // 兼容两种数据结构获取 appId
    const appId = app.id || app.app_id || '';
    console.log('appId:', appId);
    dispatch(routerRedux.push(`/explore/${eid}/detail/${appId}`));
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
        <Row style={contentStyle}>
          <Col span={16} style={{ display: 'flex', alignItems: 'center' }}>
            <Search
              style={{ width: '250px' }}
              placeholder={formatMessage({ id: 'applicationMarket.localMarket.placeholder' })}
              onSearch={this.handleSearchLocal}
            />
            <div className={styles.radioGroup}>
              <Radio.Group value={this.state.scope} onChange={this.onChangeRadio}>
                <Radio.Button value="enterprise">
                  <FormattedMessage id="applicationMarket.localMarket.radioValue.enterprise" />
                </Radio.Button>
                <Radio.Button value="team">
                  <FormattedMessage id="applicationMarket.localMarket.radioValue.team" />
                </Radio.Button>
              </Radio.Group>
            </div>
          </Col>
        </Row>

        {localLoading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : componentList && componentList.length > 0 ? (
          componentList.map((item, index) => {
            const { pic, versions_info: versions } = item;
            return this.renderListItem('localsContent', item, pic, versions, index);
          })
        ) : (
          <Empty
            description={<FormattedMessage id="applicationMarket.localMarket.nothing.msg" />}
            style={{ marginTop: 100 }}
          />
        )}

        {this.state.total > 10 && (
          <div style={paginationStyle}>
            <Pagination
              showQuickJumper
              current={this.state.page}
              pageSize={this.state.pageSize}
              total={this.state.total}
              onChange={this.onPageChangeApp}
              showTotal={total => `共 ${total} 条`}
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
        {/* 推荐 */}
        <div className={styles.recommendSection}>
          <div className={styles.recommendHeader}>
            <h3 className={styles.recommendTitle}>
              <HeartIcon className={styles.recommendTitleIcon} />
              推荐
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
              <Empty description="暂无推荐应用" />
            )}
          </div>
        </div>

        {/* 热门类别 */}
        <div className={styles.hotCategories}>
          <h3 className={styles.hotCategoriesTitle}>
            <HotIcon className={styles.hotCategoriesTitleIcon} />
            热门类别
          </h3>
          <div className={styles.categoryList}>
            {/* 全部应用选项 */}
            <div
              className={`${styles.categoryItem} ${styles.categoryAll} ${this.state.selectedCategory === 'all' ? styles.categoryActive : ''}`}
              onClick={() => this.handleCategoryClick('all')}
            >
              <span className={styles.categoryName}>全部应用</span>
              <Icon type="appstore" className={styles.categoryIcon} />
            </div>
            {this.state.hotCategoriesLoading ? (
              <Spin size="small" />
            ) : this.state.hotCategories.length > 0 ? (
              this.state.hotCategories.map((category, index) => {
                const { style, icon } = this.getCategoryStyle(category, index);
                const categoryName = category.appClassificationName || '未知类别';
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
              <Empty description="暂无分类数据" />
            )}
          </div>
        </div>

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
              <span>加载中...</span>
            </div>
          )}
          {!this.state.categoryAppsHasMore && this.state.categoryApps.length > 0 && (
            <div className={styles.noMore}>没有更多了</div>
          )}
          {!this.state.categoryAppsLoading && this.state.categoryApps.length === 0 && (
            <Empty description="暂无应用" />
          )}
        </div>
      </div>
    );

    // 判断当前是否选中应用市场
    const isMarketActive = activeTabKey !== 'local';
    const isLocalActive = activeTabKey === 'local';

    // 渲染当前内容
    const renderContent = () => {
      if (isLocalActive) {
        return localsContent;
      }
      return marketContent;
    };

    return (
      <div className={styles.explorePage}>
        {showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={showApp}
          />
        )}

        {marketInfoSwitch ? (
          <div className={styles.exploreContainer}>
            {/* 手写的两个选项 */}
            <div className={styles.tabSwitcher}>
              <div
                className={`${styles.tabOption} ${isMarketActive ? styles.active : ''}`}
                onClick={() => {
                  // 切换到外部市场，选中第一个市场
                  if (tabsList.length > 0) {
                    const firstMarket = tabsList[0];
                    if (firstMarket.types === 'marketTab') {
                      this.onTabChange(firstMarket.ID);
                    }
                  }
                }}
              >
                <Icon type="global" className={styles.tabOptionIcon} />
                <span>外部市场</span>
              </div>
              <div
                className={`${styles.tabOption} ${isLocalActive ? styles.active : ''}`}
                onClick={() => this.onTabChange('local')}
              >
                <Icon type="desktop" className={styles.tabOptionIcon} />
                <span>本地组件库</span>
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

export default Explore;
