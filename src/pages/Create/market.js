import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
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
  Alert
} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import globalUtil from "../../utils/global";
import rainbondUtil from "../../utils/rainbond";
import sourceUtil from "../../utils/source-unit";
import CreateAppFromMarketForm from "../../components/CreateAppFromMarketForm";
import Ellipsis from "../../components/Ellipsis";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import PluginStyles from "../Plugin/Index.less";
import GoodrainRZ from "../../components/GoodrainRenzheng";

const Option = Select.Option;
const { TabPane } = Tabs;

@connect(
  ({ global, loading, appControl }) => ({
    rainbondInfo: global.rainbondInfo,
    loading,
    appDetail: appControl.appDetail
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
      this.props.handleType && this.props.handleType === "Service"
        ? ""
        : this.props.match.params.keyword || ""
    );
    this.state = {
      list: [],
      app_name: appName,
      page: 1,
      pageSize: 9,
      total: 0,
      isSpinList: true,
      isSpincloudList: true,
      networkText: "",
      cloudList: [],
      cloudApp_name: "",
      cloudPage: 1,
      cloudPageSize: 9,
      cloudTotal: 0,
      showCreate: null,
      scope: "",
      scopeMax:
        this.props.scopeMax ||
        (rainbondUtil.cloudMarketEnable(this.props.rainbondInfo)
          ? "cloudApplication"
          : "localApplication"),
      target: "searchWrap",
      showApp: {},
      showMarketAppDetail: false,
      group_version: "",
      installBounced: false,
      handleType: this.props.handleType ? this.props.handleType : null,
      moreState: this.props.moreState ? this.props.moreState : null,
      is_deploy: true
    };
    this.mount = false;
  }
  componentDidMount() {
    this.mount = true;
    this.getApps();
    this.getCloudRecommendApps();
  }
  componentWillUnmount() {
    this.mount = false;
    this.mountquery = false;
  }
  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };
  handleChange = v => {};
  handleSearch = v => {
    const { scopeMax } = this.state;
    if (scopeMax == "localApplication") {
      this.setState(
        {
          app_name: v,
          page: 1
        },
        () => {
          this.getApps();
        }
      );
    } else {
      this.setState(
        {
          cloudApp_name: v,
          cloudPage: 1
        },
        () => {
          this.getCloudRecommendApps();
        }
      );
    }
  };
  getApps = v => {
    this.props.dispatch({
      type: "market/getMarketApp",
      payload: {
        app_name: v ? "" : this.state.app_name || "",
        scope: v ? "" : this.state.scope,
        page_size: v ? 9 : this.state.pageSize,
        page: v ? 1 : this.state.page
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              list: data.list || [],
              total: data.total
            },
            () => {
              this.setState({
                isSpinList: false
              });
            }
          );
        } else {
          this.setState({ isSpinList: false });
        }
      }
    });
  };

  getCloudRecommendApps = v => {
    this.props.dispatch({
      type: "market/getRecommendMarketAppList",
      payload: {
        app_name: v ? "" : this.state.cloudApp_name || "",
        page_size: v ? 9 : this.state.cloudPageSize,
        page: v ? 1 : this.state.cloudPage
      },
      callback: data => {
        if (data) {
          this.setState(
            {
              cloudList: data.list || [],
              cloudTotal: data.total
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
                  networkText: data.msg_show
                });
              } else {
                this.setState({
                  isSpincloudList: false
                });
              }
            }
          );
        } else {
          this.setState({ isSpincloudList: false });
        }
      }
    });
  };

  hanldePageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.getApps();
      }
    );
  };

  hanldeCloudPageChange = page => {
    this.setState(
      {
        cloudPage: page
      },
      () => {
        this.getCloudRecommendApps();
      }
    );
  };

  getDefaulType = () => "";
  handleTabChange = key => {
    this.setState(
      {
        scope: key,
        page: 1
      },
      () => {
        this.getApps();
      }
    );
  };

  handleTabMaxChange = key => {
    this.setState(
      {
        scopeMax: key,
        isSpinList: true,
        isSpincloudList: true,
        app_name: "",
        cloudApp_name: ""
      },
      () => {
        if (key == "localApplication") {
          this.getApps("reset");
        } else {
          this.getCloudRecommendApps("reset");
        }
      }
    );
  };

  onCancelCreate = () => {
    this.setState({ showCreate: null });
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
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const { installBounced, is_deploy, scopeMax } = this.state;
      this.props.dispatch({
        type: "createApp/installApp",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          group_id: this.props.groupId ? this.props.groupId : 0,
          app_id: installBounced.ID,
          is_deploy,
          group_key: installBounced.group_key,
          group_version: fieldsValue.group_version,
          install_from_cloud: scopeMax == "cloudApplication" ? true : false
        },
        callback: () => {
          // 刷新左侧按钮
          this.props.dispatch({
            type: "global/fetchGroups",
            payload: {
              team_name: globalUtil.getCurrTeamName()
            }
          });

          // 关闭弹框
          this.setState({ installBounced: false, is_deploy: true });
          this.state.handleType && this.props.refreshCurrent();
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                this.props.groupId ? this.props.groupId : 0
              }`
            )
          );
        }
      });
    });
  };
  handleCreate = (vals, is_deploy) => {
    const { group_version } = this.state;
    const app = this.state.showCreate;
    this.props.dispatch({
      type: "createApp/installApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
        app_id: app.ID,
        is_deploy,
        group_key: app.group_key,
        group_version: vals.group_version
      },
      callback: () => {
        // 刷新左侧按钮
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: globalUtil.getCurrTeamName()
          },
          callback: () => {
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                  vals.group_id
                }`
              )
            );
          }
        });
      }
    });
  };

  handleCloudCreate = (vals, is_deploy) => {
    const { group_version, scopeMax } = this.state;
    const app = this.state.showCreate;
    this.props.dispatch({
      type: "createApp/installApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
        is_deploy,
        app_versions: app.app_versions,
        group_key: app.app_key_id,
        group_version: vals.group_version,
        install_from_cloud: scopeMax == "cloudApplication" ? true : false
      },
      callback: () => {
        // 刷新左侧按钮
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: globalUtil.getCurrTeamName()
          },
          callback: () => {
            // 关闭弹框
            this.onCancelCreate();
            this.setState({ is_deploy: true });
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                  vals.group_id
                }`
              )
            );
          }
        });
      }
    });
  };

  handleVisibleChange = (item, flag) => {
    const newvisible = this.state.visiblebox;
    const ID = item.ID;
    newvisible[ID] = flag;
    this.setState({ visiblebox: newvisible });
    this.queryExport(item);
  };
  showMarketAppDetail = app => {
    //cloud app
    if (app && app.app_detail_url) {
      window.open(app.app_detail_url, "_blank");
      return;
    }
    this.setState({
      showApp: app,
      showMarketAppDetail: true
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };
  loadMore = () => {
    this.props.handleServiceComponent();
  };

  renderApp = item => {
    const { scopeMax, handleType } = this.state;
    let cloud = scopeMax == "localApplication" ? false : true;
    const title = item => (
      <div
        title={cloud ? item.name : item.group_name || ""}
        style={{
          maxWidth: "200px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis"
        }}
      >
        <a
          onClick={() => {
            this.showMarketAppDetail(item);
          }}
        >
          {cloud ? item.name : item.group_name || ""}
        </a>
      </div>
    );
    return (
      <Fragment>
        {item.is_official && (
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
                  <span title={item.group_name}>{item.group_name}</span>
                  <span>安装</span>
                </div>
                <div
                  title={item.version}
                  className={PluginStyles.cardVersionStyle}
                >
                  {" "}
                  <span>版本:</span>
                  <div className={PluginStyles.overScroll}>
                    <div>
                      {item.group_version_list &&
                        item.group_version_list.map((item, index) => {
                          return (
                            <Tag
                              title={item}
                              className={PluginStyles.cardVersionTagStyle}
                              color="green"
                              size="small"
                              key={index}
                            >
                              {" "}
                              {item}
                            </Tag>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            ]}
          >
            <Card.Meta
              style={{
                height: 80,
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                cursor: "pointer"
              }}
              className={PluginStyles.CardMeta}
              avatar={
                <img
                  style={{ width: 80, height: 80, margin: "auto" }}
                  alt={item.title}
                  src={
                    item.pic || require("../../../public/images/app_icon.jpg")
                  }
                />
              }
              onClick={() => {
                this.showMarketAppDetail(item);
              }}
              title=""
              description={""}
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
              </span>
            ]}
          >
            <Card.Meta
              style={{ height: 112, overflow: "auto" }}
              avatar={
                <img
                  style={{ width: 110, height: 110, margin: " 0 auto" }}
                  alt={item.title}
                  src={
                    cloud
                      ? item.logo
                      : item.pic ||
                        require("../../../public/images/app_icon.jpg")
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
                      display: "block",
                      color: "rgb(200, 200, 200)",
                      marginBottom: 2,
                      fontSize: 12
                    }}
                  >
                    <div
                      title={item.version}
                      className={PluginStyles.cardVersionStyle}
                    >
                      <span>版本:</span>
                      <div className={PluginStyles.overScroll}>
                        <div>
                          {item.group_version_list &&
                            item.group_version_list.map((item, index) => {
                              return (
                                <Tag
                                  title={item}
                                  className={PluginStyles.cardVersionTagStyle}
                                  color="green"
                                  size="small"
                                  title={item.app_version}
                                  key={index}
                                >
                                  {item}
                                </Tag>
                              );
                            })}
                          {item.app_versions &&
                            item.app_versions.map((item, index) => {
                              return (
                                <Tag
                                  title={item}
                                  className={PluginStyles.cardVersionTagStyle}
                                  color="green"
                                  size="small"
                                  title={item.app_version}
                                  key={index}
                                >
                                  {item.app_version}
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
                          href={
                            item.enterprise &&
                            item.enterprise.enterprise_market_url
                              ? item.enterprise.enterprise_market_url
                              : "javascript:;"
                          }
                          target="_blank"
                          title={item.enterprise.name}
                        >
                          {item.enterprise.name}
                        </a>
                      </div>
                    )}
                    {!cloud && (
                      <div className={PluginStyles.memoryStyle}>
                        <span>内存: </span>
                        {sourceUtil.unit(item.min_memory || 128, "MB")}
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

  handleChangeVersion = value => {
    this.setState({
      group_version: value
    });
  };

  handleTabsCallback = key => {
    console.log(key);
  };

  render() {
    const { form, appDetail, rainbondInfo } = this.props;
    const { getFieldDecorator } = form;
    const {
      handleType,
      moreState,
      installBounced,
      list,
      scopeMax,
      scope,
      cloudList,
      cloudApp_name,
      cloudPage,
      cloudPageSize,
      cloudTotal,
      isSpinList,
      isSpincloudList,
      networkText
    } = this.state;

    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const paginationProps = {
      current: this.state.moreState ? 1 : this.state.page,
      pageSize: this.state.moreState ? 3 : this.state.pageSize,
      total: this.state.moreState ? 1 : this.state.total,
      onChange: v => {
        this.hanldePageChange(v);
      }
    };
    const cloudPaginationProps = {
      current: cloudPage,
      pageSize: cloudPageSize,
      total: cloudTotal,
      onChange: v => {
        this.hanldeCloudPageChange(v);
      }
    };

    const cardList = (
      <List
        bordered={false}
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1
        }}
        locale={{
          emptyText: !isSpinList && list && list.length <= 0 && (
            <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
              暂无应用， 你可以
              <br />
              <br />
              分享应用
              {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
                <span>
                  或{" "}
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`}
                  >
                    从云端同步
                  </Link>
                </span>
              )}
            </p>
          )
        }}
        pagination={paginationProps}
        dataSource={list}
        renderItem={item => (
          <List.Item style={{ border: "none" }}>
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
          xs: 1
        }}
        locale={{
          emptyText: !isSpincloudList && cloudList && cloudList.length <= 0 && (
            <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
              暂无应用， 你可以
              <br />
              <br />
              分享应用
              {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
                <span>
                  或{" "}
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`}
                  >
                    从云端同步
                  </Link>
                </span>
              )}
            </p>
          )
        }}
        pagination={cloudPaginationProps}
        dataSource={cloudList}
        renderItem={item => (
          <List.Item style={{ border: "none" }}>
            {this.renderApp(item)}
          </List.Item>
        )}
      />
    );

    const mainSearch = (
      <div
        style={{
          textAlign: "center"
        }}
      >
        <span id="searchWrap" style={{ display: "inline-block" }}>
          <Input.Search
            ref="searchs"
            placeholder="请输入应用名称"
            enterButton="搜索"
            size="large"
            value={
              this.state.scopeMax == "localApplication"
                ? this.state.app_name
                : this.state.cloudApp_name
            }
            onChange={event => {
              this.setState({
                app_name: event.target.value,
                cloudApp_name: event.target.value
              });
            }}
            defaultValue={
              this.state.scopeMax == "localApplication"
                ? this.state.app_name
                : this.state.cloudApp_name
            }
            onSearch={this.handleSearch}
            style={{
              width: 522
            }}
          />
        </span>
      </div>
    );

    const tabList = [
      {
        key: "",
        tab: "全部"
      },
      {
        key: "goodrain",
        tab: "云端下载"
      },
      {
        key: "enterprise",
        tab: "公司分享"
      },
      {
        key: "team",
        tab: "团队分享"
      }
    ];

    let tabListMax = [
      {
        key: "localApplication",
        tab: "本地应用"
      }
    ];

    if (rainbondUtil.cloudMarketEnable(rainbondInfo)) {
      tabListMax.unshift({
        key: "cloudApplication",
        tab: "云端应用"
      });
    }

    const loading = this.props.loading;
    return (
      <div>
        {handleType ? (
          <div>
            {!moreState && mainSearch}
            <div
              style={{
                marginBottom: !moreState ? "40px" : "0px",
                marginTop: !moreState ? "20px" : ""
              }}
              className={PluginStyles.cardList}
            >
              {cardList}
            </div>
            {moreState && list && list.length > 0 && (
              <div
                style={{
                  textAlign: "right",
                  zIndex: 9,
                  position: "absolute",
                  height: "70px",
                  background: "white",
                  width: "100%",
                  right: 0,
                  bottom: "-10px"
                }}
              >
                <a onClick={this.loadMore}>查看更多...</a>
              </div>
            )}
            {installBounced && (
              <Modal
                title="确认要安装此应用作为你的组件么？"
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
                          is_deploy: true
                        });
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={this.handleInstallBounced}
                      type="primary"
                      style={{ marginRight: "5px" }}
                      loading={loading.effects["createApp/installApp"]}
                    >
                      安装
                    </Button>
                    {/* <Tooltip placement="topLeft" title={<p>取消本选项你可以先对组件进行<br />高级设置再构建启动。</p>} > */}
                    <Radio
                      size="small"
                      onClick={this.renderSuccessOnChange}
                      checked={this.state.is_deploy}
                    >
                      并构建启动
                    </Radio>
                    {/* </Tooltip> */}
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
                    {getFieldDecorator("group_version", {
                      initialValue:
                        installBounced &&
                        installBounced.group_version_list &&
                        installBounced.group_version_list[0],
                      rules: [
                        {
                          required: true,
                          message: "请选择版本"
                        }
                      ]
                    })(
                      <Select
                        onChange={this.handleChangeVersion}
                        style={{ width: "220px" }}
                      >
                        {this.state.installBounced &&
                          this.state.installBounced.group_version_list &&
                          this.state.installBounced.group_version_list.map(
                            (item, index) => {
                              return (
                                <Option key={index} value={item}>
                                  {item}
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

            {this.state.showCreate && (
              <CreateAppFromMarketForm
                disabled={loading.effects["createApp/installApp"]}
                onSubmit={this.handleCreate}
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
          </div>
        ) : (
          <div>
            <PageHeaderLayout
              content={mainSearch}
              tabList={tabListMax}
              tabActiveKey={scopeMax}
              onTabChange={this.handleTabMaxChange}
            >
              {scopeMax == "localApplication" ? (
                <div>
                  {isSpinList ? (
                    <div
                      style={{
                        height: "300px",
                        lineHeight: "300px",
                        textAlign: "center"
                      }}
                    >
                      <Spin size="large" />
                    </div>
                  ) : (
                    <Tabs
                      defaultActiveKey=""
                      onChange={this.handleTabChange}
                      style={{ background: "#fff", padding: "20px " }}
                    >
                      {tabList.map(item => {
                        const { key, tab } = item;
                        return (
                          <TabPane tab={tab} key={key}>
                            <div
                              className={PluginStyles.cardList}
                              style={{ paddingBottom: "20px" }}
                            >
                              {cardList}
                            </div>
                            {this.state.showCreate && (
                              <CreateAppFromMarketForm
                                disabled={
                                  loading.effects["createApp/installApp"]
                                }
                                onSubmit={this.handleCreate}
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
                          </TabPane>
                        );
                      })}
                    </Tabs>
                  )}
                </div>
              ) : (
                <div>
                  {isSpincloudList && isSpincloudList !== -1 ? (
                    <div
                      style={{
                        height: "300px",
                        lineHeight: "300px",
                        textAlign: "center"
                      }}
                    >
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div>
                      <div
                        className={PluginStyles.cardList}
                        style={{ paddingBottom: "20px" }}
                      >
                        {isSpincloudList !== -1 && cloudCardList}
                        {networkText && (
                          <Alert
                            style={{ textAlign: "center", marginBottom: 16 }}
                            message={networkText}
                            type="warning"
                          />
                        )}
                      </div>
                      {this.state.showCreate && (
                        <CreateAppFromMarketForm
                          disabled={loading.effects["createApp/installApp"]}
                          onSubmit={this.handleCloudCreate}
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
                    </div>
                  )}
                </div>
              )}

              {/* {scopeMax == "localApplication" &&
                <PageHeaderLayout
                  content={""}
                  tabList={tabList}
                  tabActiveKey={this.state.scope}
                  onTabChange={this.handleTabChange}
                >
                  <div className={PluginStyles.cardList}>{cardList}</div>
                  {this.state.showCreate && (
                    <CreateAppFromMarketForm
                      disabled={loading.effects["createApp/installApp"]}
                      onSubmit={this.handleCreate}
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

                </PageHeaderLayout>
              } */}
              {/* <GuideManager /> */}

              {/* <GuideManager /> */}
            </PageHeaderLayout>
          </div>
        )}
      </div>
    );
  }
}
