import React, { PureComponent, Fragment } from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "dva";
import { Link, Switch, Route, routerRedux } from "dva/router";
import { Card, Form, List, Input, Modal, Button, Tooltip, Radio } from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import globalUtil from "../../utils/global";
import sourceUtil from "../../utils/source-unit";
import CreateAppFromMarketForm from "../../components/CreateAppFromMarketForm";
import Ellipsis from "../../components/Ellipsis";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import PluginStyles from "../Plugin/Index.less";
import GoodrainRZ from "../../components/GoodrainRenzheng";

@connect(
  ({ global, loading }) => ({
    rainbondInfo: global.rainbondInfo,
    loading
  }),
  null,
  null,
  { pure: false }
)
@Form.create()
export default class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    const appName = decodeURIComponent(this.props.handleType && this.props.handleType === "Service" ? "" : (this.props.match.params.keyword || ""));
    this.state = {
      list: [],
      showCreate: null,
      scope: "",
      app_name: appName,
      page: 1,
      pageSize: 9,
      total: 0,
      target: "searchWrap",
      showApp: {},
      showMarketAppDetail: false,
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
  }
  componentWillUnmount() {
    this.mount = false;
    this.mountquery = false;
  }
  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    })
  }
  handleChange = v => { };
  handleSearch = v => {
    this.setState(
      {
        app_name: v,
        page: 1
      },
      () => {
        this.getApps();
      }
    );
  };
  getApps = v => {
    this.props.dispatch({
      type: "market/getMarketApp",
      payload: {
        app_name: this.state.app_name || "",
        scope: this.state.scope,
        page_size: this.state.pageSize,
        page: this.state.page
      },
      callback: data => {
        this.setState({
          list: data.list || [],
          total: data.total
        });
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
  handleInstallBounced = () => {
    const { installBounced, is_deploy } = this.state;
    this.props.dispatch({
      type: "createApp/installApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.props.groupId ? this.props.groupId : 0,
        app_id: installBounced.ID,
        is_deploy
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
        this.state.handleType && this.props.refreshCurrent()
        this.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
            this.props.groupId ? this.props.groupId : 0
            }`
          )
        );
      }
    });
  }
  handleCreate = (vals, is_deploy) => {
    const app = this.state.showCreate;
    this.props.dispatch({
      type: "createApp/installApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...vals,
        app_id: app.ID,
        is_deploy
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
        this.onCancelCreate();
        this.setState({ is_deploy: true })
        this.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
            vals.group_id
            }`
          )
        );
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
  }

  renderApp = item => {
    const ismarket = item.source;
    const title = item => (
      <div
        title={item.group_name || ""}
        style={{
          maxWidth: "200px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow:"ellipsis"
        }}
        onClick={() => {
          this.showMarketAppDetail(item);
        }}
      >
        <a
          href="javascript:;"
          onClick={() => {
            this.showMarketAppDetail(item);
          }}
        >
          {item.group_name || ""}
        </a>
      </div>
    );
    const { handleType } = this.state;
    return (
      <Fragment>
        {item.is_official && (
          <GoodrainRZ style={{ marginLeft: 6, marginTop: 6 }} />
        )}
        {handleType?
        <Card
          className={PluginStyles.card}
          actions={[
            <div onClick={() => {
              this.showCreate(item);
            }}>
              <div className={PluginStyles.cardTitle}> 
              <span title={item.group_name}>{item.group_name}</span>
              <span>安装</span>
              </div>
              <div>版本:{item.version}</div>
              </div>

          ]}
        >
          <Card.Meta
            style={{ height:80, overflow: "hidden",display:"flex",justifyContent:"center" }}
            className={PluginStyles.CardMeta}
            avatar={
              <img
                style={{ width: 80, height:80, margin: "auto" }}
                alt={item.title}
                src={item.pic || require("../../../public/images/app_icon.jpg")}
                onClick={() => {
                  this.showMarketAppDetail(item);
                }}
              />
            }

            title=""
            description={""}
          />
        </Card>:
         <Card
         className={PluginStyles.card}
         actions={[
             <span onClick={() => {
             this.showCreate(item);
           }}>安装</span>
         ]}
       >
         <Card.Meta
           style={{ height: 112, overflow: "hidden" }}
           avatar={
             <img
               style={{ width: 110, height: 110, margin: " 0 auto" }}
               alt={item.title}
               src={item.pic || require("../../../public/images/app_icon.jpg")}
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
                   marginBottom: 8,
                   fontSize: 12
                 }}
               >
                 版本: {item.version}
                 <br />
                 内存: {sourceUtil.unit(item.min_memory || 128, "MB")}
               </span>
               <Ellipsis className={PluginStyles.item} lines={3}>
                 <span title={item.describe}>{item.describe}</span>
               </Ellipsis>
             </Fragment>
           }
         />
       </Card>
      }
      </Fragment>
    );
  };
  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    const { handleType, moreState, installBounced, list } = this.state;
    const formItemLayout = {};
    const paginationProps = {
      current: this.state.moreState ? 1 : this.state.page,
      pageSize: this.state.moreState ? 3 : this.state.pageSize,
      total: this.state.moreState ? 0 : this.state.total,
      onChange: v => {
        this.hanldePageChange(v);
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
          emptyText: (
            <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
              暂无应用， 你可以<br />
              <br />
              分享应用 或{" "}
              <Link
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/source`}
              >
                从云端同步
              </Link>
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

    const mainSearch = (
      <div
        style={{
          textAlign: "center"
        }}
      >
        <span id="searchWrap" style={{ display: "inline-block" }}>
          <Input.Search
            placeholder="请输入应用名称"
            enterButton="搜索"
            size="large"
            defaultValue={this.state.app_name}
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
        tab: "云市"
      },
      {
        key: "enterprise",
        tab: "本公司"
      },
      {
        key: "team",
        tab: "本团队"
      }
    ];
    const loading = this.props.loading;
    return (
      <div>
        {handleType ? <div>
          {!moreState && mainSearch}
          <div style={{ marginBottom: !moreState ? "40px" : "0px", marginTop: !moreState ? "20px" : "" }} className={PluginStyles.cardList}>{cardList}</div>
          {moreState && list && list.length > 0 &&
            <div style={{
              textAlign: "right",
              zIndex: 9,
              position: "absolute",
              height: "100px",
              background: "white",
              width: "100%",
              right: 0,
              bottom: "-42px",
            }}>
              <a onClick={this.loadMore}>查看更多...</a></div>}
          {installBounced && <Modal
            title="确认要安装此应用作为你的服务组件么？"
            visible={installBounced}
            onOk={this.handleInstallBounced}
            onCancel={() => { this.setState({ installBounced: false }) }}
            footer={
              <div>
                <Button onClick={() => { this.setState({ installBounced: false, is_deploy: true }) }}>取消</Button>
                <Button onClick={this.handleInstallBounced} type="primary" >
                  安装
                </Button>
                {/* <Tooltip placement="topLeft" title={<p>取消本选项你可以先对服务进行<br />高级设置再构建启动。</p>} > */}
                <Radio size="small" onClick={this.renderSuccessOnChange} checked={this.state.is_deploy}>并构建启动</Radio>
                {/* </Tooltip> */}
              </div>
            }
          >
            <p>{installBounced.describe}</p>
          </Modal>}
          {this.state.showCreate && (
            <CreateAppFromMarketForm
              disabled={loading.effects["createApp/installApp"]}
              onSubmit={this.handleCreate}
              onCancel={this.onCancelCreate}
            />
          )}
          {this.state.showMarketAppDetail && (
            <MarketAppDetailShow
              onOk={this.hideMarketAppDetail}
              onCancel={this.hideMarketAppDetail}
              app={this.state.showApp}
            />
          )}
        </div> :

          <PageHeaderLayout
            content={mainSearch}
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
              />
            )}
            {this.state.showMarketAppDetail && (
              <MarketAppDetailShow
                onOk={this.hideMarketAppDetail}
                onCancel={this.hideMarketAppDetail}
                app={this.state.showApp}
              />
            )}
            {/* <GuideManager /> */}
          </PageHeaderLayout>}
      </div>
    );
  }
}
