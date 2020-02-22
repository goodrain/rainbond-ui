import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  List,
  Tabs,
  Radio,
  Input,
  Checkbox,
  Pagination,
  notification,
  Avatar,
} from 'antd';
import { routerRedux } from 'dva/router';
import BasicListStyles from '../List/BasicList.less';
import userUtil from '../../utils/user';
import CloudApp from './CloudApp';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import rainbondUtil from '../../utils/rainbond';

import styles from './index.less';

const { Search } = Input;

@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      loading: true,
      pageSize: 10,
      total: 0,
      page: 1,
      scope: 'enterprise',
      name: '',
      tags: [],
      showCloudApp: true,
      componentList: [],
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.load();
    }
  }

  load = () => {
    this.getApps();
  };
  getApps = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid },
      },
    } = this.props;
    const { page, page_size, name, scope, tags } = this.state;
    dispatch({
      type: 'market/fetchComponent',
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        app_name: name,
        scope,
        page,
        page_size,
        tags,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            componentList: res.list,
            loading: false,
          });
        }
      },
    });
  };

  render() {
    const { componentList } = this.state;
    const { rainbondInfo } = this.props;
    const paginationProps = {
      pageSize: this.state.pageSize,
      total: this.state.total,
      current: this.state.page,
      onChange: pageSize => {
        // this.handlePageChange(pageSize);
      },
    };
    return (
      <PageHeaderLayout
        title="——"
        content="将当前平台和云应用市场进行互联，同步应用，插件，数据中心等资源应用下载完成后，方可在 从应用市场安装 直接安装"
      >
        <div className={styles.descText}>
          <Icon type="exclamation-circle" />
          当前市场不支持跨数据中心互联功能
        </div>
        <div
          className={BasicListStyles.standardList}
          style={{
            display: this.state.showCloudApp ? 'flex' : 'block',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Card
            className={BasicListStyles.listCard}
            bordered={false}
            title={
              <div>
                <span>内部市场</span>
                <Search
                  className={BasicListStyles.extraContentSearch}
                  placeholder="请输入名称进行搜索"
                  onSearch={this.handleSearch}
                />
              </div>
            }
            style={{
              transition: 'all .8s',
              width: '50%',
              display: 'inline-block',
            }}
            bodyStyle={{
              padding: '0 32px 40px 32px',
            }}
          >
            <List
              size="large"
              rowKey="ID"
              locale={{
                emptyText: (
                  <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
                    暂无应用， 你可以
                    <br />
                    <br />
                    分享应用到内部市场
                    {rainbondUtil.cloudMarketEnable(rainbondInfo) && (
                      <span>
                        或<a href="javascript:;">从云端同步</a>
                      </span>
                    )}
                  </p>
                ),
              }}
              loading={this.state.loading}
              pagination={paginationProps}
              dataSource={componentList}
              renderItem={(item, index) => {
                const itemID = item.app_id;

                const renderItem = (
                  <List.Item
                    actions={
                      <div  style={{ color: '#999999' }}>
                        版本:&nbsp;
                        {item.versions &&
                          item.versions.map((item, index) => {
                            return (
                              <Tag
                                style={{
                                  height: '17px',
                                  lineHeight: '16px',
                                }}
                                color="green"
                                size="small"
                                key={index}
                              >
                                {' '}
                                {item}
                              </Tag>
                            );
                          })}
                      </div>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={
                            item.pic ||
                            require('../../../public/images/app_icon.jpg')
                          }
                          shape="square"
                          size="large"
                          onClick={() => {
                            // this.showMarketAppDetail(item);
                          }}
                        />
                      }
                      title={
                            <a
                              style={{ color: '#384551' }}
                              onClick={() => {
                                // this.showMarketAppDetail(item);
                              }}
                            >
                              {item.app_name}
                            </a>
                      }
                      description={
                        <div className={styles.conts}>
                          <div>{item.describe}</div>

                          {/* {item.describe || '-'} */}
                        </div>
                      }
                    />
                  </List.Item>
                );
                return renderItem;
              }}
            />
          </Card>
          <div
            style={{
              transition: 'all .8s',
              transform: this.state.showCloudApp
                ? 'translate3d(0, 0, 0)'
                : 'translate3d(100%, 0, 0)',
              marginLeft: 8,
              width: '49%',
            }}
          >
            <CloudApp />
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}
