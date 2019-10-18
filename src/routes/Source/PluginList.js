import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import {
  Row,
  Col,
  Card,
  List,
  Avatar,
  Button,
  Icon,
  Modal,
  Form,
  Input,
  Spin,
  Steps,
  Radio,
  notification,
  Menu,
  Dropdown,
  Upload
} from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import BasicListStyles from "../List/BasicList.less";
import CloudPlugin from "./CloudPlugin";
import MarketPluginDetailShow from "../../components/MarketPluginDetailShow";
import rainbondUtil from "../../utils/rainbond";

const { Search } = Input;

@connect(({ global }) => ({ rainbondInfo: global.rainbondInfo }))
export default class PluginList extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      sync: false,
      page: 1,
      pageSize: 10,
      app_name: this.getParams().name || "",
      plugins: [],
      loading: true,
      total: 0,
      type: "",
      showOfflinePlugin: null,
      showCloudPlugin: false,
      showMarketPluginDetail: false,
      showPlugin: {}
    };
  }
  getParams = () => {
    var param = this.props.match.params || {};
    if (param.name) {
      param.name = decodeURIComponent(param.name);
    }
    return param;
  };
  componentDidMount = () => {
    this.loadPlugins();
  };
  handleSync = () => {
    this.setState(
      {
        sync: true
      },
      () => {
        this.props
          .dispatch({
            type: "global/syncMarketPlugins"
          })
          .then(() => {
            this.setState(
              {
                sync: false
              },
              () => {
                this.loadPlugins();
              }
            );
          });
      }
    );
  };
  loadPlugins = () => {
    this.setState(
      {
        loading: true
      },
      () => {
        this.props.dispatch({
          type: "global/getMarketPlugins",
          payload: {
            plugin_name: this.state.app_name,
            page: this.state.page,
            limit: this.state.pageSize,
            is_complete: this.state.type
          },
          callback: data => {
            if (data) {
              this.setState({
                plugins: data.list || [],
                loading: false,
                total: data.total
              });
            }
          }
        });
      }
    );
  };
  handleLoadPluginDetail = data => {
    this.props.dispatch({
      type: "global/syncMarketPluginTmp",
      payload: {
        plugin_key: data.plugin_key,
        version: data.version
      },
      callback: data => {
        notification.success({ message: "操作成功" });
        this.loadPlugins();
      }
    });
  };
  handlePageChange = page => {
    this.state.page = page;
    this.loadPlugins();
  };
  handleSearch = app_name => {
    this.setState(
      {
        app_name: app_name,
        page: 1
      },
      () => {
        this.loadPlugins();
      }
    );
  };

  handleTypeChange = e => {
    this.setState({ type: e.target.value, page: 1 }, () => {
      this.loadPlugins();
    });
  };
  handleOfflinePlugin = () => {
    const plugin = this.state.showOfflinePlugin;
    this.props.dispatch({
      type: "global/deleteMarketPlugin",
      payload: {
        plugin_id: plugin.id
      },
      callback: () => {
        notification.success({
          message: "删除成功"
        });
        this.hideOfflinePlugin();
        this.loadPlugins();
      }
    });
  };
  showOfflinePlugin = plugin => {
    this.setState({ showOfflinePlugin: plugin });
  };
  hideOfflinePlugin = () => {
    this.setState({ showOfflinePlugin: null });
  };
  hideMarketPluginDetail = () => {
    this.setState({ showMarketPluginDetail: false, showPlugin: {} });
  };
  showMarketPluginDetail = plugin => {
    this.setState({ showMarketPluginDetail: true, showPlugin: plugin });
  };
  render() {
    const { rainbondInfo } = this.props;

    const extraContent = (
      <div className={BasicListStyles.extraContent}>
        {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
          <Button
            type="primary"
            onClick={() => {
              this.setState({ showCloudPlugin: true });
            }}
            value=""
          >
            云端同步
          </Button>
        )}
      </div>
    );

    const paginationProps = {
      pageSize: this.state.pageSize,
      total: this.state.total,
      current: this.state.page,
      onChange: pageSize => {
        this.handlePageChange(pageSize);
      }
    };
    return (
      <div
        className={BasicListStyles.standardList}
        style={{
          display: this.state.showCloudPlugin ? "flex" : "block",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Card
          className={BasicListStyles.listCard}
          bordered={false}
          title={
            <div>
              {this.state.showCloudPlugin && <span>内部市场</span>}
              <Search
                defaultValue={this.state.app_name}
                className={BasicListStyles.extraContentSearch}
                placeholder="请输入名称进行搜索"
                onSearch={this.handleSearch}
              />
            </div>
          }
          style={{
            transition: "all .8s",
            width: this.state.showCloudPlugin ? "50%" : "100%",
            display: "inline-block"
          }}
          bodyStyle={{
            padding: "0 32px 40px 32px"
          }}
          extra={this.state.showCloudPlugin ? null : extraContent}
        >
          <List
            size="large"
            rowKey="id"
            locale={{
              emptyText: (
                <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
                  暂无插件， 你可以
                  <br />
                  <br />
                  分享插件到内部市场
                  {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
                    <span>
                      或{" "}
                      <a
                        onClick={() => {
                          this.setState({ showCloudPlugin: true });
                        }}
                        href="javascript:;"
                      >
                        从云端同步
                      </a>
                    </span>
                  )}
                </p>
              )
            }}
            loading={this.state.loading}
            pagination={paginationProps}
            dataSource={this.state.plugins}
            renderItem={item => (
              <List.Item
                actions={
                  this.state.showCloudPlugin
                    ? null
                    : [
                        item.is_complete ? (
                          <Fragment>
                            {item.source === "market" &&
                              rainbondUtil.cloudMarketEnable(rainbondInfo) && (
                                <a
                                  style={{ marginRight: 8 }}
                                  href="javascript:;"
                                  onClick={() => {
                                    this.handleLoadPluginDetail(item);
                                  }}
                                >
                                  云端更新
                                </a>
                              )}
                            <a
                              href="javascript:;"
                              onClick={() => {
                                this.showOfflinePlugin(item);
                              }}
                            >
                              删除
                            </a>
                          </Fragment>
                        ) : (
                          <a
                            href="javascript:;"
                            onClick={() => {
                              this.handleLoadAppDetail(item);
                            }}
                          >
                            下载应用
                          </a>
                        )
                      ]
                }
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        item.pic ||
                        require("../../../public/images/app_icon.jpg")
                      }
                      shape="square"
                      size="large"
                      onClick={() => {
                        this.showMarketPluginDetail(item);
                      }}
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
                  description={item.desc || "-"}
                />
              </List.Item>
            )}
          />
        </Card>
        <div
          style={{
            transition: "all .8s",
            transform: this.state.showCloudPlugin
              ? "translate3d(0, 0, 0)"
              : "translate3d(100%, 0, 0)",
            marginLeft: 8,
            width: "49%"
          }}
        >
          {this.state.showCloudPlugin ? (
            <CloudPlugin
              onSyncSuccess={() => {
                this.handlePageChange(1);
              }}
              onClose={() => {
                this.setState({ showCloudPlugin: false });
              }}
              dispatch={this.props.dispatch}
            />
          ) : null}
        </div>
        {this.state.showOfflinePlugin && (
          <ConfirmModal
            onOk={this.handleOfflinePlugin}
            desc={`确定要删除此插件吗?`}
            subDesc="删除后其他人将无法安装此插件"
            title={"删除插件"}
            onCancel={this.hideOfflinePlugin}
          />
        )}
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
