import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import {
  Card,
  Form,
  List,
  Input,
  Modal,
  Button,
  Tabs,
  Radio,
  Select,
  Tag,
  Spin,
  Alert,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CreateAppFromMarketForm from '../../components/CreateAppFromMarketForm';
import Ellipsis from '../../components/Ellipsis';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import GoodrainRZ from '../../components/GoodrainRenzheng';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';
import rainbondUtil from '../../utils/rainbond';
import sourceUtil from '../../utils/source-unit';
import PluginStyles from '../Plugin/Index.less';
import styles from '../../components/CreateTeam/index.less';

const { Option } = Select;
const { TabPane } = Tabs;

@connect(
  ({ global, loading, teamControl, enterprise }) => ({
    loading,
    enterprise: global.enterprise,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  }),
  null,
  null,
  { pure: false }
)
@Form.create()
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    const appName = decodeURIComponent(
      this.props.handleType && this.props.handleType === 'Service'
        ? ''
        : this.props.match.params.keyword || ''
    );
    this.state = {
      list: [],
      app_name: appName,
      page: 1,
      pageSize: 9,
      total: 0,
      isSpinList: true,
      isSpincloudList: true,
      networkText: '',
      cloudList: [],
      cloudApp_name: '',
      cloudPage: 1,
      cloudPageSize: 9,
      cloudTotal: 0,
      showCreate: null,
      scope: this.props.scope || '',
      scopeMax:
        this.props.scopeMax ||
        (rainbondUtil.cloudMarketEnable(this.props.enterprise)
          ? ''
          : 'localApplication'),
      showApp: {},
      showMarketAppDetail: false,
      installBounced: false,
      handleType: this.props.handleType ? this.props.handleType : null,
      moreState: this.props.moreState ? this.props.moreState : null,
      is_deploy: true,
      marketTabLoading: false,
      marketTab: [],
      currentKey: '',
    };
    this.mount = false;
  }
  componentWillMount() {
    const { currentTeamPermissionsInfo, dispatch } = this.props;
    roleUtil.canCreateComponent(currentTeamPermissionsInfo, dispatch);
  }
  componentDidMount() {
    this.mount = true;
    this.getApps();
    this.getMarketsTab();
  }
  componentWillUnmount() {
    this.mount = false;
    this.mountquery = false;
  }

  onCancelCreate = () => {
    this.setState({ showCreate: null });
  };
  getCloudRecommendApps = v => {
    const { currentKey } = this.state;
    const { currentEnterprise } = this.props;
    this.props.dispatch({
      type: 'market/fetchMarkets',
      payload: {
        name: currentKey,
        enterprise_id: currentEnterprise.enterprise_id,
        query: v ? '' : this.state.cloudApp_name || '',
        pageSize: v ? 9 : this.state.cloudPageSize,
        page: v ? 1 : this.state.cloudPage,
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              cloudList: data.list || [],
              cloudTotal: data.total,
            },
            () => {
              if (
                data._code &&
                data._code === 210 &&
                data._condition &&
                data._condition === 10503
              ) {
                this.setState({
                  isSpincloudList: -1,
                  networkText: data.msg_show,
                });
              } else {
                this.setState({
                  isSpincloudList: false,
                });
              }
            }
          );
        } else {
          this.setState({ isSpincloudList: false });
        }
      },
    });
  };
  getApps = v => {
    const { currentEnterprise } = this.props;
    this.props.dispatch({
      type: 'market/fetchAppModels',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
        app_name: v ? '' : this.state.app_name || '',
        scope: v ? '' : this.state.scope,
        page_size: v ? 9 : this.state.pageSize,
        page: v ? 1 : this.state.page,
        is_complete: 1,
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              list: data.list || [],
              total: data.total,
            },
            () => {
              this.setState({
                isSpinList: false,
              });
            }
          );
        } else {
          this.setState({ isSpinList: false });
        }
      },
    });
  };
  getMarketsTab = () => {
    const { dispatch, currentEnterprise, enterprise } = this.props;
    if (!rainbondUtil.cloudMarketEnable(enterprise)) {
      return null;
    }
    this.setState({ marketTabLoading: true });
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: currentEnterprise.enterprise_id,
      },
      callback: res => {
        if (res && res._code === 200) {
          const arr = res.list;
          const arryNew = [];
          let scopeMax = '';
          if (arr && arr.length > 0) {
            scopeMax = arr[0].name;
            res.list.map(item => {
              arryNew.push(
                Object.assign({}, item, { tab: item.alias, key: item.name })
              );
            });
          }
          this.setState(
            {
              scopeMax,
              currentKey: scopeMax,
              marketTabLoading: false,
              marketTab: arryNew,
            },
            () => {
              this.getCloudRecommendApps('reset');
            }
          );
        }
      },
    });
  };
  handleSearch = v => {
    const { scopeMax } = this.state;
    if (scopeMax == 'localApplication') {
      this.setState(
        {
          app_name: v,
          page: 1,
        },
        () => {
          this.getApps();
        }
      );
    } else {
      this.setState(
        {
          cloudApp_name: v,
          cloudPage: 1,
        },
        () => {
          this.getCloudRecommendApps();
        }
      );
    }
  };

  hanldePageChange = page => {
    this.setState(
      {
        page,
      },
      () => {
        this.getApps();
      }
    );
  };

  hanldeCloudPageChange = page => {
    this.setState(
      {
        cloudPage: page,
      },
      () => {
        this.getCloudRecommendApps();
      }
    );
  };

  handleTabChange = key => {
    this.setState(
      {
        scope: key,
        page: 1,
      },
      () => {
        this.getApps();
      }
    );
  };

  handleTabMaxChange = key => {
    this.setState(
      {
        currentKey: key,
        scopeMax: key,
        isSpinList: true,
        isSpincloudList: true,
        app_name: '',
        cloudApp_name: '',
      },
      () => {
        if (key == 'localApplication') {
          this.getApps('reset');
        } else {
          this.getCloudRecommendApps('reset');
        }
      }
    );
  };

  showCreate = app => {
    const { handleType } = this.state;
    if (handleType) {
      this.setState({ installBounced: app });
    } else {
      this.setState({ showCreate: app });
    }
  };
  handleInstallBounced = e => {
    e.preventDefault();
    const { form, dispatch, groupId, refreshCurrent } = this.props;
    const { installBounced, is_deploy, scopeMax, handleType } = this.state;
    const teamName = globalUtil.getCurrTeamName();

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      dispatch({
        type: 'createApp/installApp',
        payload: {
          team_name: teamName,
          group_id: groupId || 0,
          app_id: installBounced.app_id,
          is_deploy,
          group_key: installBounced.group_key,
          app_version: fieldsValue.group_version,
          install_from_cloud: scopeMax !== 'localApplication',
        },
        callback: () => {
          // 刷新左侧按钮
          dispatch({
            type: 'global/fetchGroups',
            payload: {
              team_name: teamName,
            },
          });

          // 关闭弹框
          this.setState({ installBounced: false, is_deploy: true });
          if (handleType && refreshCurrent) {
            refreshCurrent();
          }
          dispatch(
            routerRedux.push(
              `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${groupId ||
                0}`
            )
          );
        },
      });
    });
  };
  handleCreate = (vals, is_deploy) => {
    const { dispatch } = this.props;
    const { showCreate: app } = this.state;
    const teamName = globalUtil.getCurrTeamName();
    dispatch({
      type: 'createApp/installApp',
      payload: {
        team_name: teamName,
        ...vals,
        app_id: app.app_id,
        is_deploy,
        group_key: app.group_key,
        app_version: vals.group_version,
      },
      callback: () => {
        // 刷新左侧按钮
        dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: teamName,
          },
          callback: () => {
            dispatch(
              routerRedux.push(
                `/team/${teamName}/region/${globalUtil.getCurrRegionName()}/apps/${
                  vals.group_id
                }`
              )
            );
          },
        });
      },
    });
  };

  handleCloudCreate = (vals, is_deploy) => {
    const { scopeMax, currentKey } = this.state;
    const app = this.state.showCreate;
    this.props.dispatch({
      type: 'createApp/installApp',
      payload: {
        app_id: app.app_id,
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
        is_deploy,
        app_versions: app.app_versions,
        group_key: app.app_key_id,
        app_version: vals.group_version,
        install_from_cloud: scopeMax !== 'localApplication',
        marketName: currentKey,
      },
      callback: () => {
        // 刷新左侧按钮
        this.props.dispatch({
          type: 'global/fetchGroups',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
          },
          callback: () => {
            // 关闭弹框
            this.onCancelCreate();
            this.setState({ is_deploy: true });
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${
                  vals.group_id
                }`
              )
            );
          },
        });
      },
    });
  };

  handleVisibleChange = (item, flag) => {
    const newvisible = this.state.visiblebox;
    const { ID } = item;
    newvisible[ID] = flag;
    this.setState({ visiblebox: newvisible });
    this.queryExport(item);
  };
  showMarketAppDetail = app => {
    // cloud app
    if (app && app.app_detail_url) {
      window.open(app.app_detail_url, '_blank');
      return;
    }
    this.setState({
      showApp: app,
      showMarketAppDetail: true,
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false,
    });
  };
  loadMore = () => {
    this.props.handleServiceComponent();
  };

  handleTabs = (tabList, cardList) => {
    return (
      <Tabs
        defaultActiveKey=""
        onChange={this.handleTabChange}
        style={{ background: '#fff', padding: '20px ' }}
      >
        {tabList.map(item => {
          const { key, tab } = item;
          return (
            <TabPane tab={tab} key={key}>
              <div
                className={PluginStyles.cardList}
                style={{ paddingBottom: '20px' }}
              >
                {cardList}
              </div>
            </TabPane>
          );
        })}
      </Tabs>
    );
  };
  renderApp = item => {
    const { scopeMax, handleType } = this.state;
    const cloud = scopeMax != 'localApplication';
    const title = item => (
      <div
        title={item.app_name || ''}
        style={{
          maxWidth: '200px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        <a
          onClick={() => {
            this.showMarketAppDetail(item);
          }}
        >
          {cloud ? item.name : item.app_name || ''}
        </a>
      </div>
    );
    return (
      <Fragment>
        {(item.is_official == true || item.is_official == 1) && (
          <GoodrainRZ style={{ marginLeft: 6, marginTop: 6 }} />
        )}
        {handleType ? (
          <Card
            className={PluginStyles.cards}
            actions={[
              <div
                onClick={() => {
                  this.showCreate(item);
                }}
              >
                <div className={PluginStyles.cardTitle}>
                  <span title={item.app_name}>{item.app_name}</span>
                  <span>安装</span>
                </div>
                <div
                  title={item.version}
                  className={PluginStyles.cardVersionStyle}
                >
                  <span>版本:</span>
                  <div className={PluginStyles.overScroll}>
                    <div>
                      {item.versions_info &&
                        item.versions_info.map((items, index) => {
                          return (
                            <Tag
                              title={items.version}
                              className={PluginStyles.cardVersionTagStyle}
                              color="green"
                              size="small"
                              key={index}
                            >
                              {items.version}
                            </Tag>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>,
            ]}
          >
            <Card.Meta
              style={{
                height: 80,
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              className={PluginStyles.CardMeta}
              avatar={
                <img
                  style={{ width: 80, height: 80, margin: 'auto' }}
                  alt={item.title}
                  src={
                    item.pic || require('../../../public/images/app_icon.jpg')
                  }
                />
              }
              onClick={() => {
                this.showMarketAppDetail(item);
              }}
              title=""
              description=""
            />
          </Card>
        ) : (
          <Card
            className={PluginStyles.cards}
            actions={[
              <span
                onClick={() => {
                  this.showCreate(item);
                }}
              >
                安装
              </span>,
            ]}
          >
            <Card.Meta
              className={PluginStyles.cardsMetas}
              avatar={
                <img
                  style={{ width: 110, height: 110, margin: ' 0 auto' }}
                  alt={item.title}
                  src={
                    cloud
                      ? item.logo
                      : item.pic ||
                        require('../../../public/images/app_icon.jpg')
                  }
                  height={154}
                  onClick={() => {
                    this.showMarketAppDetail(item);
                  }}
                />
              }
              title={title(item)}
              description={
                <Fragment>
                  <span
                    style={{
                      display: 'block',
                      color: 'rgb(200, 200, 200)',
                      marginBottom: 2,
                      fontSize: 12,
                    }}
                  >
                    <div
                      title={item.version}
                      className={PluginStyles.cardVersionStyle}
                    >
                      <span>版本:</span>
                      <div className={PluginStyles.overScroll}>
                        <div>
                          {item.versions_info &&
                            item.versions_info.map((items, index) => {
                              return (
                                <Tag
                                  title={items.version}
                                  className={PluginStyles.cardVersionTagStyle}
                                  color="green"
                                  size="small"
                                  key={index}
                                >
                                  {items.version}
                                </Tag>
                              );
                            })}
                          {item.versions &&
                            item.versions.map((itemx, index) => {
                              return (
                                <Tag
                                  className={PluginStyles.cardVersionTagStyle}
                                  color="green"
                                  size="small"
                                  title={itemx.app_version}
                                  key={index}
                                >
                                  {itemx.app_version}
                                </Tag>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    {cloud && (
                      <div className={PluginStyles.shareNameStyle}>
                        <span>分享者:</span>
                        <a
                          href={item.market_url || 'javascript:;'}
                          target="_blank"
                          title={item.market_name}
                        >
                          {item.market_name}
                        </a>
                      </div>
                    )}
                    {!cloud && (
                      <div className={PluginStyles.memoryStyle}>
                        <span>内存: </span>
                        {sourceUtil.unit(item.min_memory || 128, 'MB')}
                      </div>
                    )}
                  </span>
                  <Ellipsis className={PluginStyles.item} lines={3}>
                    <span title={cloud ? item.desc : item.describe}>
                      {cloud ? item.desc : item.describe}
                    </span>
                  </Ellipsis>
                </Fragment>
              }
            />
          </Card>
        )}
      </Fragment>
    );
  };
  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy,
    });
  };
  render() {
    const {
      form,
      loading,
      enterprise,
      currentEnterprise,
      currentTeam,
      currentRegionName,
    } = this.props;

    const { getFieldDecorator } = form;
    const {
      handleType,
      moreState,
      installBounced,
      list,
      scopeMax,
      cloudList,
      cloudPage,
      cloudPageSize,
      cloudTotal,
      isSpinList,
      isSpincloudList,
      networkText,
      page,
      pageSize,
      total,
      marketTab,
    } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 5,
      },
      wrapperCol: {
        span: 19,
      },
    };
    const paginationProps = {
      current: moreState ? 1 : page,
      pageSize: moreState ? 3 : pageSize,
      total: moreState ? 1 : total,
      onChange: v => {
        this.hanldePageChange(v);
      },
    };
    const cloudPaginationProps = {
      current: cloudPage,
      pageSize: cloudPageSize,
      total: cloudTotal,
      onChange: v => {
        this.hanldeCloudPageChange(v);
      },
    };

    const cardList = (
      <List
        bordered={false}
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1,
        }}
        locale={{
          emptyText: !isSpinList && list && list.length <= 0 && (
            <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
              暂无应用模型， 你可以
              <br />
              <br />
              发布应用模型
              {rainbondUtil.cloudMarketEnable(enterprise) && currentEnterprise && (
                <span>
                  或{' '}
                  <Link
                    to={`/enterprise/${currentEnterprise.enterprise_id}/shared/cloudMarket`}
                  >
                    从云端同步
                  </Link>
                </span>
              )}
            </p>
          ),
        }}
        pagination={paginationProps}
        dataSource={list}
        renderItem={item => (
          <List.Item style={{ border: 'none' }}>
            {this.renderApp(item)}
          </List.Item>
        )}
      />
    );

    const cloudCardList = (
      <List
        bordered={false}
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1,
        }}
        locale={{
          emptyText: !isSpincloudList && cloudList && cloudList.length <= 0 && (
            <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
              暂无应用模型， 你可以
              <br />
              <br />
              发布应用模型
              {rainbondUtil.cloudMarketEnable(enterprise) && currentEnterprise && (
                <span>
                  或{' '}
                  <Link
                    to={`/enterprise/${currentEnterprise.enterprise_id}/shared/cloudMarket`}
                  >
                    从云端同步
                  </Link>
                </span>
              )}
            </p>
          ),
        }}
        pagination={cloudPaginationProps}
        dataSource={cloudList}
        renderItem={item => (
          <List.Item style={{ border: 'none' }}>
            {this.renderApp(item)}
          </List.Item>
        )}
      />
    );

    const mainSearch = (
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <span id="searchWrap" style={{ display: 'inline-block' }}>
          <Input.Search
            ref="searchs"
            placeholder="请输入应用名称"
            enterButton="搜索"
            size="large"
            value={
              this.state.scopeMax == 'localApplication'
                ? this.state.app_name
                : this.state.cloudApp_name
            }
            onChange={event => {
              this.setState({
                app_name: event.target.value,
                cloudApp_name: event.target.value,
              });
            }}
            defaultValue={
              this.state.scopeMax == 'localApplication'
                ? this.state.app_name
                : this.state.cloudApp_name
            }
            onSearch={this.handleSearch}
            style={{
              width: 522,
            }}
          />
        </span>
      </div>
    );

    const tabAllList = [
      {
        key: '',
        tab: '全部',
      },
    ];
    const tabComponentList = [
      {
        key: 'enterprise',
        tab: '公司分享',
      },
      {
        key: 'team',
        tab: '团队分享',
      },
    ];
    const tabList = tabAllList.concat(tabComponentList);
    const tabListMax = marketTab.concat([
      {
        key: 'localApplication',
        tab: '本地应用',
      },
    ]);

    console.log('tabListMax', tabListMax);
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: '创建组件' });

    const SpinBox = (
      <div
        style={{
          height: '300px',
          lineHeight: '300px',
          textAlign: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
    return (
      <div>
        {this.state.showCreate && (
          <CreateAppFromMarketForm
            disabled={loading.effects['createApp/installApp']}
            onSubmit={
              handleType
                ? this.handleCreate
                : scopeMax == 'localApplication'
                ? this.handleCreate
                : this.handleCloudCreate
            }
            onCancel={this.onCancelCreate}
            showCreate={this.state.showCreate}
          />
        )}

        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}

        {handleType ? (
          <div>
            {!moreState && mainSearch}
            <div
              style={{
                marginBottom: !moreState ? '40px' : '0px',
              }}
              className={PluginStyles.cardList}
            >
              {this.handleTabs(tabComponentList, cardList)}
            </div>
            {moreState && list && list.length > 0 && (
              <div
                style={{
                  textAlign: 'right',
                  zIndex: 9,
                  position: 'absolute',
                  height: '70px',
                  background: 'white',
                  width: '100%',
                  right: 0,
                  bottom: '-10px',
                }}
              >
                <a onClick={this.loadMore}>查看更多...</a>
              </div>
            )}
            {installBounced && (
              <Modal
                title="确认要安装此应用作为你的组件么？"
                className={styles.TelescopicModal}
                visible={installBounced}
                onOk={this.handleInstallBounced}
                onCancel={() => {
                  this.setState({ installBounced: false });
                }}
                footer={
                  <div>
                    <Button
                      onClick={() => {
                        this.setState({
                          installBounced: false,
                          is_deploy: true,
                        });
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={this.handleInstallBounced}
                      type="primary"
                      style={{ marginRight: '5px' }}
                      loading={loading.effects['createApp/installApp']}
                    >
                      安装
                    </Button>
                    <Radio
                      size="small"
                      onClick={this.renderSuccessOnChange}
                      checked={this.state.is_deploy}
                    >
                      并构建启动
                    </Radio>
                  </div>
                }
              >
                <p>{installBounced.describe}</p>
                <Form
                  onSubmit={this.handleInstallBounced}
                  layout="horizontal"
                  hideRequiredMark
                >
                  <Form.Item {...formItemLayout} label="安装版本">
                    {getFieldDecorator('group_version', {
                      initialValue:
                        installBounced &&
                        installBounced.versions_info &&
                        installBounced.versions_info[0].version,
                      rules: [
                        {
                          required: true,
                          message: '请选择版本',
                        },
                      ],
                    })(
                      <Select style={{ width: '220px' }}>
                        {this.state.installBounced &&
                          this.state.installBounced.versions_info &&
                          this.state.installBounced.versions_info.map(
                            (item, index) => {
                              return (
                                <Option key={index} value={item.version}>
                                  {item.version}
                                </Option>
                              );
                            }
                          )}
                      </Select>
                    )}
                  </Form.Item>
                </Form>
              </Modal>
            )}
          </div>
        ) : (
          <div>
            <PageHeaderLayout
              breadcrumbList={breadcrumbList}
              content={mainSearch}
              tabList={tabListMax}
              tabActiveKey={scopeMax}
              onTabChange={this.handleTabMaxChange}
            >
              {scopeMax == 'localApplication' ? (
                <div>
                  {isSpinList ? SpinBox : this.handleTabs(tabList, cardList)}
                </div>
              ) : (
                <div>
                  {isSpincloudList && isSpincloudList !== -1 ? (
                    SpinBox
                  ) : (
                    <div>
                      <div
                        className={PluginStyles.cardList}
                        style={{ paddingBottom: '20px' }}
                      >
                        {isSpincloudList !== -1 && cloudCardList}
                        {networkText && (
                          <Alert
                            style={{ textAlign: 'center', marginBottom: 16 }}
                            message={networkText}
                            type="warning"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </PageHeaderLayout>
          </div>
        )}
      </div>
    );
  }
}
