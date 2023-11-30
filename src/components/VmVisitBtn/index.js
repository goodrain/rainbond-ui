/* eslint-disable react/sort-comp */
import {
    Alert,
    Button,
    Card,
    Dropdown,
    Icon,
    Menu,
    Modal,
    notification,
    Table,
    Tooltip
  } from 'antd';
  import { connect } from 'dva';
  import { Link } from 'dva/router';
  import React, { Fragment, PureComponent } from 'react';
  import { CopyToClipboard } from 'react-copy-to-clipboard';
  import globalUtil from '../../utils/global';
  import { openInNewTab } from '../../utils/utils';
  import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
  
  @connect(({ user, appControl, global }) => ({
    visitInfo: appControl.visitInfo,
    currUser: user.currentUser
  }))
  export default class Index extends PureComponent {
    constructor(props) {
      super(props);
      this.state = {
      };
    }
    componentDidMount() {
      this.mount = true;
      this.fetchVisitInfo();
    }
    renderHttpPort = visitInfo => {
        const { showModal } = this.state;
        const demo = visitInfo;
        const appAlias = this.props.app_alias;
        const links = this.getHttpLinks(demo.access_info || {});
        if (links.length === 1) {
          return (
            <Tooltip title={formatMessage({ id: 'tooltip.visit' })}>
              <Button
                type={this.props.btntype}
                onClick={() => {
                  // window.open(links[0]);
                  openInNewTab(links[0]);
                }}
              >
                {/* 访问 */}
                <FormattedMessage id='componentOverview.header.right.visit' />
              </Button>
            </Tooltip>
          );
        } 
        return (
          <Tooltip
            title={formatMessage({ id: 'tooltip.visit' })}
            placement="topRight"
          >
            <Dropdown
              overlay={
                <Menu onClick={this.handleClickLink}>
                  {links.map(item => (
                    <Menu.Item key={item}>{item}</Menu.Item>
                  ))}
                  {/* <Menu.Item key={1}>{11}</Menu.Item> */}
                </Menu>
              }
              placement="bottomRight"
            >
              <Button type={this.props.btntype}>
                <a href={links[0]} target="_blank">
                  <FormattedMessage id='componentOverview.header.right.visit' />
                  {/* 访问 */}
                </a>
              </Button>
            </Dropdown>
          </Tooltip>
        );
      };


    render() {
      const { visitInfo } = this.props;
      if (!visitInfo) {
        return null;
      }


      return null;
    }
  }