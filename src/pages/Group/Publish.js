import React, { PureComponent } from "react";
import { routerRedux } from 'dva/router';
import { connect } from "dva";
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
} from 'antd';

import PageHeaderLayout from "../../layouts/PageHeaderLayout";

/* eslint react/no-array-index-key: 0 */

@connect(({ list, loading }) => ({
  list,
  loading: loading.models.list
}))
export default class AppPublishList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
      loading: true,
    };
  }
  componentDidMount() {
  }


  render() {
    const { teamName, regionName } = this.props.match.params;
    const { apps, loading } = this.state;
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );
    const menu = appID => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.deleteApp(appID);
              }}
            >
              删除
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    return (
      <PageHeaderLayout
        title="发布记录管理"
        content="应用发布是指将当前运行的应用进行模型化，形成应用模版发布到企业共享库或云端应用商店中，从而支持应用的标准化交付或共享"
      >
        
      </PageHeaderLayout>
    );
  }
}
