import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Card, Button, Icon, List, notification } from "antd";
import { Link, routerRedux } from "dva/router";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import globalUtil from "../../utils/global";
import pluginUtil from "../../utils/plugin";
import userUtil from "../../utils/user";
import TeamUtil from "../../utils/team";
import styles from "./Index.less";
import Ellipsis from "../../components/Ellipsis";
import Manage from "./manage";
import ConfirmModal from "../../components/ConfirmModal";
import NoPermTip from "../../components/NoPermTip";
import MarketPluginDetailShow from "../../components/MarketPluginDetailShow";

class MarketPlugin extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: null,
      showMarketPluginDetail: false,
      showPlugin: {}
    };
  }
  componentDidMount() {
    this.fetchPlugins();
  }
  fetchPlugins = () => {
    this.props.dispatch({
      type: "plugin/getUnInstalledPlugin",
      payload: {
        page: 1,
        limit: 1000
      },
      callback: data => {
        this.setState({
          list: data && data.list || []
        });
      }
    });
  };
  handleInstall = data => {
    this.props.dispatch({
      type: "plugin/installMarketPlugin",
      payload: {
        plugin_id: data.id
      },
      callback: data => {
        notification.success({
          message: "安装成功"
        });
        this.fetchPlugins();
        this.props.onInstallSuccess && this.props.onInstallSuccess();
      }
    });
  };
  hideMarketPluginDetail = () => {
    this.setState({ showMarketPluginDetail: false, showPlugin: {} });
  };
  showMarketPluginDetail = plugin => {
    this.setState({ showMarketPluginDetail: true, showPlugin: plugin });
  };
  renderTmp = () => {
    var list = this.state.list;
    if (!list) {
      return (
        <p style={{ textAlign: "center" }}>
          <Icon type="loading" />
        </p>
      );
    }

    list = list.filter(item => {
      return !item.is_installed && item.is_complete;
    });

    return (
      <List
        rowKey="id"
        grid={{
          gutter: 24,
          lg: 3,
          md: 2,
          sm: 1,
          xs: 1
        }}
        dataSource={list}
        renderItem={item => (
          <List.Item key={item.id}>
            <Card
              className={styles.card}
              actions={[
                <span
                  onClick={() => {
                    this.handleInstall(item);
                  }}
                >
                  安装
                </span>
              ]}
            >
              <Card.Meta
                style={{ height: 99, overflow: "hidden" }}
                avatar={
                  <Icon
                    onClick={() => {
                      this.showMarketPluginDetail(item);
                    }}
                    style={{ fontSize: 50, color: "rgba(0, 0, 0, 0.2)" }}
                    type="api"
                  />
                }
                title={
                  <a
                    style={{ color: "#1890ff" }}
                    href="javascript:;"
                    onClick={() => {
                      this.showMarketPluginDetail(item);
                    }}
                  >
                    {item.plugin_name}
                  </a>
                }
                description={
                  <Fragment>
                    <p
                      style={{
                        display: "block",
                        color: "rgb(220, 220, 220)",
                        marginBottom: 8
                      }}
                    >
                      {" "}
                      {pluginUtil.getCategoryCN(item.category)}{" "}
                    </p>
                    <Ellipsis className={styles.item} lines={3}>
                      {item.desc}
                    </Ellipsis>
                  </Fragment>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    );
  };
  render() {
    const list = this.state.list || [];
    return (
      <div className={styles.cardList}>
        {this.renderTmp()}
        {this.state.showMarketPluginDetail && (
          <MarketPluginDetailShow
            onOk={this.hideMarketPluginDetail}
            onCancel={this.hideMarketPluginDetail}
            plugin={this.state.showPlugin}
          />
        )}
      </div>
    );
  }
}

@connect(({ list, loading }) => ({}))
class PluginList extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      list: [],
      deletePlugin: null,
      downstream_net_plugin: null,
      perf_analyze_plugin: null,
      inandout_net_plugin: null,
      downstream_net_pluginData: {
        category: "downstream_net_plugin",
        desc: "实现智能路由、A/B测试、灰度发布、端口复用等微治理功能",
        plugin_alias: "出站网络治理插件",
        hasInstall: false
      },
      perf_analyze_pluginData: {
        category: "perf_analyze_plugin",
        desc: "实时分析应用的吞吐率、响应时间、在线人数等指标",
        plugin_alias: "实时性能分析",
        hasInstall: false
      },
      inandout_net_pluginData:{
        category: "inandout_net_plugin",
        desc: "该插件支持的出站和入站网络治理，包括动态路由、限流、熔断等功能",
        plugin_alias: "综合网络治理插件",
        hasInstall: false
      },
    };
    this.timer = null;
  }
  componentDidMount() {
    this.fetchDefaultPlugin();
  }
  fetchDefaultPlugin = () => {
    this.props.dispatch({
      type: "plugin/getDefaultPlugin",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data && data.bean) {
          this.setState({
            downstream_net_plugin:data.bean.downstream_net_plugin,
            perf_analyze_plugin:data.bean.perf_analyze_plugin,
            inandout_net_plugin:data.bean.inandout_net_plugin,
          })
          this.fetchPlugins();
        }
      }
    });
  };
  fetchPlugins = () => {
    this.props.dispatch({
      type: "plugin/getMyPlugins",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: data => {
        if (data) {
          var list = data.list || [];
          const {
                downstream_net_plugin,
                downstream_net_pluginData,
                perf_analyze_plugin,
                perf_analyze_pluginData,
                inandout_net_plugin,
                inandout_net_pluginData,
              }=this.state;
          if (downstream_net_plugin===false) {
            list.unshift(downstream_net_pluginData);
          }
          if (perf_analyze_plugin===false) {
            list.unshift(perf_analyze_pluginData);
          }
          if (inandout_net_plugin===false ) {
            list.unshift(inandout_net_pluginData);
          }
          this.setState({
            list: list
          });
        }
      }
    });
  };
  handleCreate = () => {
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create-plugin`
      )
    );
  };
  hanldeDeletePlugin = () => {
    this.props.dispatch({
      type: "plugin/deletePlugin",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_id: this.state.deletePlugin.plugin_id
      },
      callback: data => {
        this.fetchPlugins();
        this.cancelDeletePlugin();
      }
    });
  };
  onDeletePlugin = plugin => {
    this.setState({ deletePlugin: plugin });
  };
  cancelDeletePlugin = () => {
    this.setState({ deletePlugin: null });
  };
  onInstallPlugin = item => {
    this.props.dispatch({
      type: "plugin/installDefaultPlugin",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        plugin_type: item.category
      },
      callback: data => {
        this.fetchDefaultPlugin();
      }
    });
  };
  getItemTitle = item => {
    if (item.hasInstall !== false) {
      return (
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
            item.plugin_id
            }`}
        >
          {" "}
          {item.plugin_alias}{" "}
        </Link>
      );
    } else {
      return item.plugin_alias;
    }
  };
  getAction = item => {
    if (item.hasInstall !== false) {
      return [
        <span
          onClick={() => {
            this.onDeletePlugin(item);
          }}
        >
          删除
        </span>,
        <Link
          to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
            item.plugin_id
            }`}
        >
          管理
        </Link>
      ];
    } else {
      return [
        <span
          onClick={() => {
            this.onInstallPlugin(item);
          }}
        >
          安装
        </span>
      ];
    }
  };
  render() {
    const list = this.state.list;

    const content = (
      <div className={styles.pageHeaderContent}>
        <p>应用插件是标准化的为应用提供功能扩展，与应用共同运行的程序</p>
      </div>
    );

    const extraContent = <div className={styles.extraImg} />;

    return (
      <PageHeaderLayout
        title="我的插件"
        content={content}
        extraContent={extraContent}
      >
        <div className={styles.cardList}>
          <List
            rowKey="id"
            grid={{
              gutter: 24,
              lg: 3,
              md: 2,
              sm: 1,
              xs: 1
            }}
            dataSource={["", ...list]}
            renderItem={item =>
              item ? (
                <List.Item key={item.id}>
                  <Card className={styles.card} actions={this.getAction(item)}>
                    <Card.Meta
                      style={{ height: 100, overflow: "auto" }}
                      avatar={
                        <Icon
                          style={{ fontSize: 50, color: "rgba(0, 0, 0, 0.2)" }}
                          type="api"
                        />
                      }
                      title={this.getItemTitle(item)}
                      description={
                        <Fragment>
                          <p
                            style={{
                              display: "block",
                              color: "rgb(220, 220, 220)",
                              marginBottom: 8
                            }}
                          >
                            {" "}
                            {pluginUtil.getCategoryCN(item.category)}{" "}
                          </p>
                          <Ellipsis className={styles.item} lines={3}>
                            {item.desc}
                          </Ellipsis>
                        </Fragment>
                      }
                    />
                  </Card>
                </List.Item>
              ) : (
                  <List.Item key={item.id}>
                    <Button
                      type="dashed"
                      onClick={this.handleCreate}
                      className={styles.newButton}
                    >
                      <Icon type="plus" />
                      新建插件
                  </Button>
                  </List.Item>
                )
            }
          />
          {this.state.deletePlugin && (
            <ConfirmModal
              onOk={this.hanldeDeletePlugin}
              onCancel={this.cancelDeletePlugin}
              title="删除插件"
              desc="确定要删除此插件吗？"
            />
          )}
        </div>
        <dl style={{ paddingTop: 32, marginTop: 32 }}>
          <dt style={{ marginBottom: "16px", fontSize: "18px" }}>
            从内部市场安装
          </dt>
          <dd>
            <MarketPlugin
              dispatch={this.props.dispatch}
              onInstallSuccess={this.fetchPlugins}
            />
          </dd>
        </dl>
      </PageHeaderLayout>
    );
  }
}

@connect(({ user }) => ({ currUser: user.currentUser }))
class Index extends PureComponent {
  render() {
    const currUser = this.props.currUser;
    const team_name = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, team_name);
    if (!TeamUtil.canManagePlugin(team)) {
      return <NoPermTip />;
    }
    const pluginId = this.props.match.params.pluginId;
    if (pluginId) {
      return <Manage {...this.props} />;
    } else {
      return <PluginList {...this.props} />;
    }
  }
}

export default Index;
