import { Button, Card, Col, Menu, Row } from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import React, { Fragment, PureComponent } from "react";
import NoPermTip from "../../components/NoPermTip";
import appUtil from "../../utils/app";
import globalUtil from "../../utils/global";
import MonitorHistory from "./component/monitor/pahistoryshow";
import MonitorNow from "./component/monitor/pashow";
import ResourceShow from "./component/monitor/resourceshow";
import TraceShow from "./component/monitor/trace";

const ButtonGroup = Button.Group;

// eslint-disable-next-line react/no-multi-comp
@connect(
  ({ user }) => ({ currUser: user.currentUser }),
  null,
  null,
  {
    withRef: true
  }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      type: "now",
      showMenu: "pm",
      anaPlugins: null
    };
  }

  componentDidMount() {
    if (!this.canView()) return;
    this.getAnalyzePlugins();
  }

  getAnalyzePlugins() {
    this.props.dispatch({
      type: "appControl/getAnalyzePlugins",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        const relist = (data && data.list) || [];
        this.setState({ anaPlugins: relist });
      }
    });
  }
  // 是否可以浏览当前界面
  canView() {
    return appUtil.canManageAppMonitor(this.props.appDetail);
  }
  changeType = type => {
    if (type !== this.state.type) {
      this.setState({ type });
    }
  };

  changeMenu = param => {
    this.setState({ showMenu: param.key });
  };

  renderPM() {
    const { type, anaPlugins, showMenu } = this.state;
    const { appDetail } = this.props;
    const showPerformance = anaPlugins && anaPlugins.length > 0;
    if (showPerformance) {
      return (
        <Fragment>
          <div
            style={{
              textAlign: "left",
              marginBottom: 25
            }}
          >
            <ButtonGroup>
              <Button
                onClick={() => {
                  this.changeType("now");
                }}
                type={type === "now" ? "primary" : ""}
              >
                实时
              </Button>
              <Button
                onClick={() => {
                  this.changeType("history");
                }}
                type={type === "history" ? "primary" : ""}
              >
                历史
              </Button>
            </ButtonGroup>
          </div>
          {type === "now" ? (
            <MonitorNow {...this.props} />
          ) : (
            <MonitorHistory {...this.props} />
          )}
        </Fragment>
      );
    }
    return (
      <Card>
        <div
          style={{
            textAlign: "center",
            fontSize: 18,
            padding: "30px 0"
          }}
        >
          尚未开通性能分析插件
          <p
            style={{
              paddingTop: 8
            }}
          >
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/components/${
                appDetail.service.service_alias
              }/plugin`}
            >
              去开通
            </Link>
          </p>
        </div>
      </Card>
    );
  }

  render() {
    if (!this.canView()) return <NoPermTip />;
    const { showMenu } = this.state;
    const { appDetail } = this.props;
    const defaultShow = ["pm"];
    const enablePM = appDetail.service.language && appDetail.service.language.toLowerCase().indexOf("java")>-1
    return (
      <Row>
        <Col span={4}>
          <div style={{ paddingRight: "16px" }}>
            <Menu
              onSelect={this.changeMenu}
              defaultSelectedKeys={defaultShow}
              style={{ height: "590px" }}
            >
              <Menu.Item key="pm">性能分析</Menu.Item>
              <Menu.Item key="resource">
                资源监控
              </Menu.Item>
              {enablePM && <Menu.Item key="trace">链路追踪</Menu.Item>}
              {/* <Menu.Item key="custom" disabled>
                业务监控
              </Menu.Item> */}
            </Menu>
          </div>
        </Col>
        <Col span={20}>
          {showMenu === "pm" && this.renderPM()}
          {showMenu === "trace" && <TraceShow />}
          {showMenu === "resource" && <ResourceShow />}
        </Col>
      </Row>
    );
  }
}
