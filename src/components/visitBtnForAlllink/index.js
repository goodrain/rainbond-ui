/* eslint-disable react/jsx-no-target-blank */
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

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
  renderHttpPort = (visitInfo, type) => {
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
      if (links[0] && links[0].url && links[0].url[0]) {
        singleLink =
          links[0].url[0].includes('http') || links[0].url[0].includes('https')
            ? links[0].url[0]
            : `http://${links[0].url[0]}`;
      }
      return singleLink ? (
        <Tooltip
          title={formatMessage({id:'tooltip.visit'})}
          placement="topRight"
        >
          {type === 'link' ? (
            <a
              style={{ fontSize: '14px' }}
              onClick={e => {
                e.stopPropagation();
                window.open(singleLink);
              }}
            >
             <FormattedMessage id='componentOverview.header.right.visit'/>
            </a>
          ) : (
            <Button
              type={type}
              onClick={e => {
                e.stopPropagation();
                window.open(singleLink);
              }}
            >
              <FormattedMessage id='componentOverview.header.right.visit'/>
            </Button>
          )}
        </Tooltip>
      ) : null;
    }
    return (
      <Tooltip
        placement="topLeft"
        arrowPointAtCenter
        title={formatMessage({id:'tooltip.visit'})}
      >
        <Dropdown
          overlay={
            <Menu>
              {links.map(item => {
                const setUrl = item.url && item.url.length > 0 && item.url[0];
                return (
                  <Menu.Item key={item}>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => {
                        e.stopPropagation();
                      }}
                      href={
                        setUrl &&
                        (setUrl.includes('http') || setUrl.includes('https')
                          ? setUrl
                          : `http://${setUrl}`)
                      }
                    >
                      {item.service_cname}
                    </a>
                  </Menu.Item>
                );
              })}
            </Menu>
          }
          placement="bottomRight"
        >
          {type === 'link' ? (
            <a style={{ fontSize: '14px' }}><FormattedMessage id='componentOverview.header.right.visit'/></a>
          ) : (
            <Button type={type}><FormattedMessage id='componentOverview.header.right.visit'/></Button>
          )}
        </Dropdown>
      </Tooltip>
    );
  };

  render() {
    const { linkList, type = 'primary' } = this.props;
    return this.renderHttpPort(linkList, type);
  }
}
