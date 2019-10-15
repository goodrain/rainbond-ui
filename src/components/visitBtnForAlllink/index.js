import React, { PureComponent, Fragment } from "react";
import { Row, Col, Button, Modal, Dropdown, Menu, Table, Card, Alert, Tooltip } from "antd";
import { connect } from "dva";
import { Link } from "dva/router";
import DescriptionList from "../../components/DescriptionList";
import globalUtil from "../../utils/global";

const { Description } = DescriptionList;

/*
  access_type : no_port|无端口、
                http_port|http协议，可以对外访问 、
                not_http_outer|非http、
                可以对外访问的、
                not_http_inner|非http对内，如mysql,
                http_inner| http对内
*/

// @connect(({ user, appControl, global }) => ({ visitInfo: appControl.visitInfo }))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  renderHttpPort = (visitInfo) => {
    const { showModal } = this.state;
    const linksMap = visitInfo.map((item) => {
      return { url: item.access_info[0].access_urls, service_cname: item.access_info[0].service_cname }
    })

    /**筛选出里面有必须url */
    const links = linksMap.filter(item => item.url[0]);
    if (links.length === 0) {
      return null
    }
    if (links.length === 1) {
      let singleLink
      if (links[0] && links[0].url && links[0].url[0])
        singleLink = links[0].url[0].includes("http") || links[0].url[0].includes("https") ? links[0].url[0] : `http://${links[0].url[0]}`;
        return (
        singleLink ? <Tooltip title="跳转到组件对外访问端口对应的域名地址" placement="topRight">
          <Button type="primary"
            onClick={() => {
              window.open(singleLink);
            }}
          >
            访问
          </Button>
        </Tooltip> : null
      );
    }
    return (
      <Tooltip
        placement="topLeft"
        arrowPointAtCenter
        title="跳转到组件对外访问端口对应的域名地址">
        <Dropdown
          overlay={
            <Menu>
              {links.map(item => <Menu.Item key={item}>
                <a target="_blank" href={item.url[0].includes("http") || item.url[0].includes("https") ? item.url[0] : `http://${item.url[0]}`}>{item.service_cname} </a>
              </Menu.Item>)}
            </Menu>
          }
          placement="bottomRight"
        >
          <Button type="primary">
            访问
          </Button>
        </Dropdown>
      </Tooltip>
    );
  };

  render() {
    const { linkList } = this.props;
    return this.renderHttpPort(linkList);
  }
}
