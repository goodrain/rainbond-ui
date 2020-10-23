import React, { PureComponent } from 'react';
import { Button, Dropdown, Menu, Tooltip } from 'antd';

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
  renderHttpPort = visitInfo => {
    /** 筛选出里面有必须url */
    const links = [];
    const isAccessUrls = visitInfo.filter(item => {
      const { access_info: accessInfo } = item;
      const isUrls =
        accessInfo &&
        accessInfo.length > 0 &&
        accessInfo[0].access_urls &&
        accessInfo[0].access_urls.length > 0;
      if (isUrls) {
        links.push({
          url: accessInfo[0].access_urls,
          service_cname: accessInfo[0].service_cname
        });
      }
      return isUrls;
    });

    if (isAccessUrls.length === 0) {
      return null;
    }

    if (links.length === 1) {
      let singleLink;
      if (links[0] && links[0].url && links[0].url[0])
        singleLink =
          links[0].url[0].includes('http') || links[0].url[0].includes('https')
            ? links[0].url[0]
            : `http://${links[0].url[0]}`;
      return singleLink ? (
        <Tooltip
          title="跳转到组件对外访问端口对应的域名地址"
          placement="topRight"
        >
          <Button
            type="primary"
            onClick={() => {
              window.open(singleLink);
            }}
          >
            访问
          </Button>
        </Tooltip>
      ) : null;
    }
    return (
      <Tooltip
        placement="topLeft"
        arrowPointAtCenter
        title="跳转到组件对外访问端口对应的域名地址"
      >
        <Dropdown
          overlay={
            <Menu>
              {links.map(item => (
                <Menu.Item key={item}>
                  <a
                    target="_blank"
                    href={
                      item.url[0].includes('http') ||
                      item.url[0].includes('https')
                        ? item.url[0]
                        : `http://${item.url[0]}`
                    }
                  >
                    {item.service_cname}{' '}
                  </a>
                </Menu.Item>
              ))}
            </Menu>
          }
          placement="bottomRight"
        >
          <Button type="primary">访问</Button>
        </Dropdown>
      </Tooltip>
    );
  };

  render() {
    const { linkList } = this.props;
    return this.renderHttpPort(linkList);
  }
}
