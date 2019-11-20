import React, { PureComponent, Fragment } from "react";
import globalUtil from "../../utils/global";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import BasicListStyles from "../List/BasicList.less";
import Styles from "../Source/Index.less";
import {
  Card,
  List,
  Avatar,
  Input,
  Radio,
  notification,
  Select,
  Alert
} from "antd";
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Search } = Input;
const Option = Select.Option;

export default class CloudApp extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      pageSize: 10,
      total: 0,
      page: 1,
      sync: false,
      loading: false,
      showMarketAppDetail: false,
      showApp: {},
      version: null,
      versionList: null,
      networkText: ""
    };
  }
  componentDidMount = () => {
    this.handleSync();
  };
  handleClose = () => {
    this.props.onClose && this.props.onClose();
    this.setState({ versionList: null });
  };
  handleSync = () => {
    this.loadApps();
  };
  handleSearch = app_name => {
    this.setState(
      {
        versionList: null,
        app_name: app_name,
        page: 1
      },
      () => {
        this.loadApps();
      }
    );
  };
  loadApps = () => {
    this.setState(
      {
        loading: true
      },
      () => {
        this.props.dispatch({
          type: "global/getMarketApp",
          payload: {
            app_name: this.state.app_name,
            page: this.state.page,
            pageSize: this.state.pageSize
          },
          callback: data => {
            if (data) {
              this.setState({
                apps: data.list || [],
                loading:
                  data._code &&
                  data._code === 210 &&
                  data._condition &&
                  data._condition === 10503
                    ? -1
                    : false,
                total: data.total,
                version: null,
                networkText: data.msg_show
              });
            }
          }
        });
      }
    );
  };
  handleLoadAppDetail = data => {
    this.props.dispatch({
      type: "global/syncMarketAppDetail",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        body: {
          group_key: data.group_key,
          // version: data.version,
          group_version: this.state.version
            ? [this.state.version]
            : [data.version[0]],
          template_version: data.template_version
        }
      },
      callback: data => {
        notification.success({ message: "操作成功" });
        this.loadApps();
        this.props.onSyncSuccess && this.props.onSyncSuccess();
      }
    });
  };

  shouldComponentUpdate = () => {
    return true;
  };

  handleChange = (version, data, index) => {
    this.setState({ version });
    this.props.dispatch({
      type: "global/getVersion",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_name: data.group_name,
        group_key: data.group_key,
        version: version
      },
      callback: res => {
        if (res && res._code == 200) {
          if (res.list && res.list.length > 0) {
            let arr = this.state.apps;
            arr[index].is_complete = res.list[0].is_complete;
            arr[index].is_upgrade = res.list[0].is_upgrade;
            this.setState({ apps: arr });
          }
        }
      }
    });
  };

  handlePageChange = page => {
    this.setState(
      {
        page: page
      },
      () => {
        this.loadApps();
      }
    );
  };
  showMarketAppDetail = app => {
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
  getAction = item => {
    if (item.is_complete) {
      if (item.is_upgrade === 0) {
        return (
          <Fragment>
            <span>已下载,无更新</span>
          </Fragment>
        );
      } else {
        return (
          <Fragment>
            <a
              href="javascript:;"
              onClick={() => {
                this.handleLoadAppDetail(item);
              }}
            >
              更新新版本
            </a>
          </Fragment>
        );
      }
    } else {
      return (
        <a
          href="javascript:;"
          onClick={() => {
            this.handleLoadAppDetail(item);
          }}
        >
          下载
        </a>
      );
    }
  };
  render() {
    const { versionList } = this.state;
    const paginationProps = {
      pageSize: this.state.pageSize,
      total: this.state.total,
      current: this.state.page,
      onChange: pageSize => {
        this.handlePageChange(pageSize);
      }
    };
    return (
      <Card
        className={BasicListStyles.listCard}
        bordered={false}
        title={
          <div>
            云端{" "}
            <Search
              className={BasicListStyles.extraContentSearch}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearch}
            />
          </div>
        }
        style={{}}
        bodyStyle={{
          padding: "0 32px 40px 32px"
        }}
        extra={
          <div className={BasicListStyles.extraContent}>
            <RadioGroup>
              <RadioButton onClick={this.handleClose}>关闭</RadioButton>
            </RadioGroup>
          </div>
        }
      >
        {this.state.loading === -1 ? (
          <div style={{ height: "300px" }}>
            <Alert
              style={{ marginTop: "130px", textAlign: "center" }}
              message={this.state.networkText}
              type="warning"
            />
          </div>
        ) : (
          <List
            size="large"
            rowKey="id"
            loading={this.state.loading === -1 ? false : this.state.loading}
            pagination={paginationProps}
            dataSource={this.state.apps}
            renderItem={(item, index) => (
              <List.Item actions={[this.getAction(item)]}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        item.pic ||
                        require("../../../public/images/app_icon.jpg")
                      }
                      onClick={() => {
                        this.showMarketAppDetail(item);
                      }}
                      shape="square"
                      size="large"
                    />
                  }
                  title={
                    <a
                      style={{ color: "#1890ff" }}
                      href={"javascript:;"}
                      onClick={() => {
                        this.showMarketAppDetail(item);
                      }}
                    >
                      {item.group_name}
                      {item.is_official && "(官方推荐)"}
                    </a>
                  }
                  description={
                    <div className={Styles.conts}>
                      {!this.state.loading && (
                        <p>
                          {" "}
                          <span
                            style={{ display: "inline-block", width: "60px" }}
                          >
                            版本:
                          </span>
                          <Select
                            defaultValue={item.version[0]}
                            onChange={version => {
                              this.handleChange(version, item, index);
                            }}
                            size="small"
                          >
                            {item.version &&
                              item.version.map((item, index) => {
                                return (
                                  <Option value={item} key={index}>
                                    {item}
                                  </Option>
                                );
                              })}
                          </Select>
                        </p>
                      )}

                      {item.enterprise && item.enterprise.name && (
                        <p className={Styles.publisher}>
                          <span>发布者：</span>
                          <a href="javascript:;" title={item.enterprise.name}>
                            {item.enterprise.name}
                          </a>
                        </p>
                      )}
                      <div>{item.describe || "-"}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
      </Card>
    );
  }
}
