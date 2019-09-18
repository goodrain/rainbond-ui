import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link, Route } from "dva/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Switch,
  Alert,
  Select,
  Modal,
  Input,
  Table,
  notification
} from "antd";
import appPortUtil from "../../utils/appPort-util";
import globalUtil from "../../utils/global";
import styles from "./index.less";
const FormItem = Form.Item;

@connect(({ region }) => {
  return {
    protocols: region.protocols || []
  };
})
class ChangeProtocol extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.protocol || "http",
      visibleModal: false,
      agreement: "",
      NotHttpConnectInfo: []
    };
  }
  onChange = value => {
    this.setState({ value: value });
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleSubmit = () => {
    this.props.onSubmit && this.props.onSubmit(this.state.value);
  };
  render() {
    const protocols = this.props.protocols || [];
    return (
      <Form
        layout="inline"
        style={{
          position: "relative",
          top: -8
        }}
      >
        <FormItem>
          <Select
            onChange={this.onChange}
            size="small"
            value={this.state.value}
            style={{
              width: 80
            }}
          >
            {protocols.map(item => {
              return <Option value={item}>{item}</Option>;
            })}
          </Select>
        </FormItem>
        <div>
          <FormItem>
            <Button onClick={this.handleSubmit} type="primary" size="small">
              确定
            </Button>
          </FormItem>
          <FormItem>
            <Button onClick={this.handleCancel} type="" size="small">
              取消
            </Button>
          </FormItem>
        </div>
      </Form>
    );
  }
}

@connect(({ user, appControl }) => ({ currUser: user.currentUser }))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      editProtocol: false,
      showEditAlias: null,
      showDomain: false,
      showPort: false
    };
  }
  onSubmitProtocol = protocol => {
    this.props.onSubmitProtocol &&
      this.props.onSubmitProtocol(
        protocol,
        this.props.port.container_port,
        () => {
          this.cancelEditProtocol();
        }
      );
  };
  onAddDomain = () => {
    this.props.onAddDomain && this.props.onAddDomain(this.props.port);
  };
  handleDelete = () => {
    this.props.onDelete && this.props.onDelete(this.props.port.container_port);
  };
  handleInnerChange = value => {
    if (value) {
      this.props.onOpenInner &&
        this.props.onOpenInner(this.props.port.container_port);
    } else {
      this.props.onCloseInner &&
        this.props.onCloseInner(this.props.port.container_port);
    }
  };
  handleOuterChange = value => {
    if (value) {
      this.props.onOpenOuter &&
        this.props.onOpenOuter(this.props.port.container_port);
    } else {
      this.props.onCloseOuter &&
        this.props.onCloseOuter(this.props.port.container_port);
    }
  };
  showEditProtocol = () => {
    this.setState({ editProtocol: true });
  };
  cancelEditProtocol = () => {
    this.setState({ editProtocol: false });
  };
  showSubDomain = () => {
    this.props.onSubDomain && this.props.onSubDomain(this.props.port);
  };
  showSubPort = () => {
    this.props.onSubPort && this.props.onSubPort(this.props.port);
  };
  domainsText = domains => {
    var textBl = false;
    domains.map(order => {
      if (order.domain_type == "goodrain-sld") {
        textBl = true;
      }
    });
    return textBl;
  };
  resolveNotHttp = record => {
    const { dispatch } = this.props;
    dispatch({
      type: "gateWay/fetchEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: record.service_name
      },
      callback: data => {
        if (data) {
          const dataList = data.list.filter(item => {
            return (
              !item.attr_name.endsWith("_HOST") &&
              !item.attr_name.endsWith("_PORT")
            );
          });
          this.setState({
            visibleModal: true,
            agreement: record,
            NotHttpConnectInfo: dataList || []
          });
        }
      }
    });
  };
  rowKey = (record, index) => index;
  handeModalCancel = () => {
    this.setState({
      visibleModal: false
    });
  };
  showConnectInfo = infoArr => {
    return (
      <Table
        rowKey={this.rowKey}
        className={styles.tdPadding}
        bordered
        columns={[
          {
            title: "变量名",
            dataIndex: "attr_name",
            key: "attr_name",
            align: "center"
          },
          {
            title: "变量值",
            dataIndex: "attr_value",
            key: "attr_value",
            align: "center"
          },
          {
            title: "说明",
            dataIndex: "name",
            key: "name",
            align: "center"
          }
        ]}
        pagination={false}
        dataSource={infoArr}
        bordered={false}
      />
    );
  };
  render() {
    const port = this.props.port;
    const outerUrl = appPortUtil.getOuterUrl(port);
    const innerUrl = appPortUtil.getInnerUrl(port);
    const showAlias = appPortUtil.getShowAlias(port);
    const domains = appPortUtil.getDomains(port);
    const tcp_domains = appPortUtil.getTcpDomains(port);
    var showDomain = this.props.showDomain;
    var DomainText = this.domainsText(domains);
    const { agreement } = this.state;

    //是否显示对外访问地址,创建过程中不显示
    const showOuterUrl =
      this.props.showOuterUrl === void 0 ? true : this.props.showOuterUrl;
    showDomain = showDomain === void 0 ? true : showDomain;

    const { region } = this.props.currUser.teams[0];
    const currentRegion = region.filter(item => {
      return item.team_region_name == globalUtil.getCurrRegionName();
    });

    return (
      <table
        className={styles.table}
        style={{
          width: "100%",
          marginBottom: 8
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: 60
              }}
            >
              端口号
            </th>
            <th
              style={{
                width: 100
              }}
            >
              端口协议
            </th>
            <th
              style={{
                width: "50%"
              }}
            >
              服务信息
            </th>
            {showDomain && (
              <th
                style={{
                  width: "30%"
                }}
              >
                访问策略
              </th>
            )}
            <th
              style={{
                width: 100
              }}
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{port.container_port}</td>
            <td>
              {this.state.editProtocol ? (
                <ChangeProtocol
                  protocol={port.protocol}
                  onSubmit={this.onSubmitProtocol}
                  onCancel={this.cancelEditProtocol}
                />
              ) : (
                <div>
                  {port.protocol}
                  <a onClick={this.showEditProtocol} href="javascript:;">
                    <Icon type="edit" />
                  </a>
                </div>
              )}
            </td>
            <td>
              <div
                style={{
                  borderBottom: "1px solid #e8e8e8",
                  marginBottom: 8,
                  paddingBottom: 8
                }}
              >
                <p>
                  <span className={styles.label}>对内服务</span>
                  <Switch
                    checked={appPortUtil.isOpenInner(port)}
                    onChange={this.handleInnerChange}
                    size="small"
                  />
                </p>
                <p>
                  <span className={styles.label}>访问地址</span>
                  {innerUrl ? innerUrl : "-"}
                </p>
                <p className={styles.lr}>
                  <span className={styles.label}>使用别名</span>
                  <a
                    href="javascript:;"
                    onClick={() => {
                      this.props.onEditAlias(port);
                    }}
                  >
                    {showAlias}
                  </a>
                </p>
              </div>
              <div>
                <p>
                  {/* {
                    (showOuterUrl && outerUrl) ?
                      port.protocol == 'http' ?
                        <Button size="small" style={{ float: 'right' }} onClick={this.showSubDomain}>
                          {
                            DomainText ?
                              '修改默认域名'
                              :
                              '修改默认域名'
                          }
                        </Button>
                        :
                        <Button size="small" style={{ float: 'right' }} onClick={this.showSubPort}>修改端口</Button>
                      :
                      ''
                  } */}
                  <span className={styles.label}>对外服务</span>
                  <Switch
                    checked={appPortUtil.isOpenOuter(port)}
                    onChange={this.handleOuterChange}
                    size="small"
                  />
                </p>
                {/* <p className={styles.lr}>
                  <span className={styles.label}>访问地址</span>
                  {(showOuterUrl && outerUrl)
                    ? <a href={outerUrl} target={outerUrl} target="_blank">{outerUrl}</a>
                    : '-'}
                </p> */}
                {showOuterUrl && outerUrl ? (
                  <div>
                    {domains.map(domain => {
                      return (
                        <div style={{ paddingLeft: "70px" }}>
                          {domain.domain_type == "goodrain-sld" ? (
                            <p>
                              <a
                                href={
                                  (domain.protocol === "http"
                                    ? "http"
                                    : "https") +
                                  "://" +
                                  domain.domain_name +
                                  (domain.domain_path
                                    ? domain.domain_path
                                    : "/")
                                }
                                target="_blank"
                              >
                                {(domain.protocol === "http"
                                  ? "http"
                                  : "https") +
                                  "://" +
                                  domain.domain_name +
                                  (domain.domain_path
                                    ? domain.domain_path
                                    : "/")}
                              </a>
                              <a
                                title="解绑"
                                onClick={() => {
                                  this.props.onDeleteDomain({
                                    port: port.container_port,
                                    domain: domain.domain_name
                                  });
                                }}
                                className={styles.removePort}
                                href="javascript:;"
                              >
                                <Icon type="close" />
                              </a>
                            </p>
                          ) : (
                            ""
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  ""
                )}
              </div>
            </td>
            {/* {console.log(showDomain, appPortUtil.canBindDomain(port))} */}
            {showDomain && (
              <td>
                {appPortUtil.canBindDomain(port) ? (
                  <div>
                    {domains.map(domain => {
                      return (
                        <div>
                          {domain.domain_type == "www" ? (
                            <p>
                              <a
                                href={
                                  (domain.protocol === "http"
                                    ? "http"
                                    : "https") +
                                  "://" +
                                  domain.domain_name +
                                  (domain.domain_path
                                    ? domain.domain_path
                                    : "/")
                                }
                                target="_blank"
                              >
                                {(domain.protocol === "http"
                                  ? "http"
                                  : "https") +
                                  "://" +
                                  domain.domain_name +
                                  (domain.domain_path
                                    ? domain.domain_path
                                    : "/")}
                              </a>
                              <a
                                title="解绑"
                                onClick={() => {
                                  this.props.onDeleteDomain({
                                    port: port.container_port,
                                    domain: domain.domain_name
                                  });
                                }}
                                className={styles.removePort}
                                href="javascript:;"
                              >
                                <Icon type="close" />
                              </a>
                            </p>
                          ) : (
                            ""
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {outerUrl ? (
                  <div>
                    {tcp_domains.map(domain => {
                      let str = domain.end_point;
                      if (
                        str.indexOf("0.0.0.0") > -1 &&
                        currentRegion &&
                        currentRegion.length > 0
                      ) {
                        str = str.replace(
                          /0.0.0.0/g,
                          currentRegion[0].tcpdomain
                        );
                      }

                      return (
                        <div>
                          {
                            <p>
                              {domain.protocol == "http" ||
                              domain.protocol == "https" ? (
                                <a
                                  href={"http://" + str.replace(/\s+/g, "")}
                                  target="blank"
                                >
                                  {domain.end_point}
                                </a>
                              ) : (
                                <a
                                  href="javascript:void(0)"
                                  onClick={this.resolveNotHttp.bind(
                                    this,
                                    domain
                                  )}
                                >
                                  {domain.end_point}
                                </a>
                              )}
                            </p>
                          }
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {tcp_domains.map(domain => {
                      return (
                        <div>
                          {
                            <p>
                              <a href="javascript:void(0)" disabled>
                                {domain.end_point}
                              </a>
                            </p>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
                {port && port.protocol == "http" && (
                  <Button
                    size="small"
                    style={{ marginTop: "5px" }}
                    onClick={this.onAddDomain}
                  >
                    添加域名
                  </Button>
                )}
                {port && port.protocol != "http" && (
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control/tcp`}
                    style={{
                      wordBreak: "break-all",
                      wordWrap: "break-word",
                      color: "#1890ff"
                    }}
                  >
                    <Button size="small">管理访问策略</Button>
                  </Link>
                )}
              </td>
            )}
            <td>
              <p>
                <Button onClick={this.handleDelete} size="small">
                  删除
                </Button>
              </p>
            </td>
          </tr>
        </tbody>
        {this.state.visibleModal && (
          <Modal
            title="访问信息"
            visible={this.state.visibleModal}
            footer={null}
            onCancel={this.handeModalCancel}
          >
            <ul className={styles.ul}>
              {port && port.protocol != "mysql" ? (
                <li style={{ fontWeight: "bold" }}>
                  您当前的访问协议是{port.protocol}
                </li>
              ) : (
                <li style={{ fontWeight: "bold" }}>
                  您当前的访问协议是{agreement.protocol},打开MySQL客户端访问
                </li>
              )}
              <li>
                <a href="javascript:void(0)" style={{ marginRight: "10px" }}>
                  {agreement.end_point}
                </a>
                <CopyToClipboard
                  text={agreement.end_point.replace(/\s+/g, "")}
                  onCopy={() => {
                    notification.success({ message: "复制成功" });
                  }}
                >
                  <Button size="small" type="primary">
                    <Icon type="copy" />
                    复制
                  </Button>
                </CopyToClipboard>
              </li>
              {this.showConnectInfo(this.state.NotHttpConnectInfo)}
            </ul>
          </Modal>
        )}
      </table>
    );
  }
}
