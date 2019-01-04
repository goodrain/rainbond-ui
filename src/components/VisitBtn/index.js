import React, { PureComponent, Fragment } from "react";
import { Row, Col, Button, Modal, Dropdown, Menu, Table, Card, Alert, Tooltip } from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import DescriptionList from "../../components/DescriptionList";
import globalUtil from "../../utils/global";
import {openInNewTab} from "../../utils/utils";
import { link } from "fs";

const { Description } = DescriptionList;

/*
  access_type : no_port|无端口、
                http_port|http协议，可以对外访问 、
                not_http_outer|非http、
                可以对外访问的、
                not_http_inner|非http对内，如mysql,
                http_inner| http对内
*/

@connect(({ user, appControl, global }) => ({ visitInfo: appControl.visitInfo }))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
    this.mount = false;
  }
  componentDidMount() {
    this.mount = true;
    this.fetchVisitInfo();
  }
  componentWillUnmount() {
    this.mount = false;
    this.props.dispatch({ type: "appControl/clearVisitInfo" });
  }
  fetchVisitInfo = () => {
    if (!this.mount) return;
    const appAlias = this.props.app_alias;
    // console.log(appAlias)
    this.props.dispatch({
      type: "appControl/fetchVisitInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
      },
    });
    setTimeout(() => {
      this.fetchVisitInfo();
    }, 4000);
  };

  showModal = () => {
    this.setState({ showModal: true });
  };
  hiddenModal = () => {
    this.setState({ showModal: false });
  };
  getHttpLinks = (accessInfo) => {
    let res = [];
    for (let i = 0; i < accessInfo.length; i++) {
      res = res.concat(accessInfo[i].access_urls || []);
    }
    return res;
  };
  handleClickLink = (item) => {
    // window.open(item.key);
    openInNewTab(item.key);
  };
  renderNoHttpOuterTitle = item => (
    <div>
      <span
        style={{
          marginRight: 16,
        }}
      >
        访问地址：{item.access_urls[0]}
      </span>
      <span>访问协议： {item.protocol}</span>
    </div>
  );
  renderNoPort = (visitInfo) => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    return (
      <Fragment>
        <Tooltip title="跳转到应用对外访问端口对应的域名地址" placement="topRight">
          <Button type={this.props.btntype} onClick={this.showModal}>访问</Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="提示"
            visible
            onCancel={this.hiddenModal}
            footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: 16,
              }}
            >
              如需要提供访问服务, 请<Link
                onClick={this.hiddenModal}
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/port`}
              >
                配置端口
                          </Link>
            </div>
          </Modal>
        )}
      </Fragment>
    );
  };
  renderHttpPort = (visitInfo) => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    const links = this.getHttpLinks(demo.access_info || {});
    if (links.length === 1) {
      return (
        <Tooltip title="跳转到应用对外访问端口对应的域名地址">
          <Button type={this.props.btntype}
            onClick={() => {
              // window.open(links[0]);
              openInNewTab(links[0]);
            }}
          >
            访问
          </Button>
        </Tooltip>
      );
    } else if (links.length === 0) {
      return (
        <Fragment>
          <Tooltip title="跳转到应用对外访问端口对应的域名地址" placement="topRight">
            <Button type={this.props.btntype} onClick={this.showModal}>访问</Button>
          </Tooltip>
          {showModal && (
            <Modal
              title="提示"
              visible
              onCancel={this.hiddenModal}
              footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: 16,
                }}
              >
                http协议端口需打开外部访问服务, 去<Link
                  onClick={this.hiddenModal}
                  to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/port`}
                >
                  打开
                </Link>
              </div>
            </Modal>
          )}
        </Fragment>
      );
    }
    return (
      <Tooltip title="跳转到应用对外访问端口对应的域名地址" placement="topRight">
        <Dropdown
          overlay={
            <Menu onClick={this.handleClickLink}>
              {links.map(item => <Menu.Item key={item}>{item}</Menu.Item>)}
              {/* <Menu.Item key={1}>{11}</Menu.Item> */}
            </Menu>
          }
          placement="bottomRight"
        >
          <Button type={this.props.btntype}>
            <a href={links[0]} target="_blank">
              访问
            </a>
          </Button>
        </Dropdown>
      </Tooltip>
    );

    return (
      <Fragment>
        <Tooltip title="跳转到应用对外访问端口对应的域名地址" placement="topRight">
          <Button type={this.props.btntype} onClick={this.showModal}>访问</Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="提示"
            visible
            onCancel={this.hiddenModal}
            footer={[<Button onClick={this.hiddenModal}> 关闭 </Button>]}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: 16,
              }}
            >
              需要配置端口信息, 去<Link
                onClick={this.hiddenModal}
                to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/port`}
              >
                配置
              </Link>
            </div>
          </Modal>
        )}
      </Fragment>
    );
  };
  renderNofHttpOuter = (visitInfo) => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    // console.log(appAlias)
    const res = demo.access_info || [];
    const btn = <Button onClick={this.hiddenModal}>关闭</Button>;
    const btns = [btn];
    return (
      <Fragment>
        <Tooltip title="跳转到应用对外访问端口对应的域名地址" placement="topRight">
          <Button type={this.props.btntype} onClick={this.showModal}>访问</Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="访问信息"
            width="800px"
            visible
            onCancel={this.hiddenModal}
            footer={btns}
          >
            {res.map((item, i) => {
              let connect_info = item.connect_info || [];
              connect_info = connect_info.filter((d, i) => d.attr_name.indexOf("_PORT") === -1 && d.attr_name.indexOf("_HOST") === -1);
              return (
                <Card
                  type="inner"
                  style={{
                    marginBottom: 24,
                  }}
                  title={this.renderNoHttpOuterTitle(item)}
                >
                  {!item.connect_info.length ? (
                    "-"
                  ) : (
                      <Fragment>
                        <table
                          style={{
                            width: "100%",
                          }}
                        >
                          <thead>
                            <tr>
                              <th>变量名</th>
                              <th>变量值</th>
                              <th>说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {connect_info.map((item) => {
                              if (
                                item.attr_name.indexOf("_PORT") > -1 ||
                                item.attr_name.indexOf("_HOST") > -1
                              ) {
                                return null;
                              }
                              return (
                                <tr>
                                  <td width="150">{item.attr_name}</td>
                                  <td>{item.attr_value}</td>
                                  <td>{item.name}</td>
                                </tr>
                              );
                            })}
                            {!connect_info.length ? (
                              <tr>
                                <td
                                  colSpan="3"
                                  style={{
                                    textAlign: "center",
                                  }}
                                >
                                  暂无数据
                              </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </Fragment>
                    )}
                </Card>
              );
            })}
          </Modal>
        )}
      </Fragment>
    );
  };
  renderNotHttpInner = (visitInfo) => {
    const { showModal } = this.state;
    const demo = visitInfo;
    const appAlias = this.props.app_alias;
    const res = demo.access_info || [];
    const btn = <Button onClick={this.hiddenModal}>关闭</Button>;
    const btns = [btn];

    function renderTitle(item) {
      return (
        <div>
          <span>访问协议：{item.protocol}</span>
        </div>
      );
    }

    function renderCard(item, i) {
      const connect_info = item.connect_info || [];
      return (
        <Card
          type="inner"
          style={{
            marginBottom: 24,
          }}
          title={renderTitle(item)}
        >
          {!item.connect_info.length ? (
            "-"
          ) : (
              <Fragment>
                <table
                  style={{
                    width: "100%",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: "33%",
                        }}
                      >
                        变量名
                    </th>
                      <th
                        style={{
                          width: "33%",
                        }}
                      >
                        变量值
                    </th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connect_info.map(item => (
                      <tr>
                        <td width="150">{item.attr_name}</td>
                        <td>{item.attr_value}</td>
                        <td>{item.name}</td>
                      </tr>
                    ))}
                    {!connect_info.length ? (
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            textAlign: "center",
                          }}
                        >
                          暂无数据
                      </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </Fragment>
            )}
        </Card>
      );
    }

    return (
      <Fragment>
        <Tooltip title="跳转到应用对外访问端口对应的域名地址" placement="topRight">
          <Button type={this.props.btntype} onClick={this.showModal}>访问</Button>
        </Tooltip>
        {showModal && (
          <Modal
            title="访问信息"
            width="800px"
            visible
            onCancel={this.hiddenModal}
            footer={btns}
          >
            <Alert
              style={{
                marginBottom: 16,
              }}
              message="其他应用依赖此应用后来访问"
              type="info"
            />{" "}
            {res.map((item, i) => renderCard(item, i))}
          </Modal>
        )}
      </Fragment>
    );
  };
  render() {
    const { visitInfo } = this.props;
    // console.log(visitInfo)
    if (!visitInfo) {
      return null;
    }
    if (visitInfo.access_type == "no_port") {
      return this.renderNoPort(visitInfo);
    }

    if (visitInfo.access_type === "http_port") {
      return this.renderHttpPort(visitInfo);
    }

    if (visitInfo.access_type === "not_http_outer") {
      return this.renderNofHttpOuter(visitInfo);
    }
    if (visitInfo.access_type === "not_http_inner" || visitInfo.access_type === "http_inner") {
      return this.renderNotHttpInner(visitInfo);
    }
    return null;
  }
}
