import { Avatar, Card, Icon, Input, List, Tag, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import rainbondUtil from '../../utils/rainbond';
import BasicListStyles from '../List/BasicList.less';
import CloudApp from './CloudApp';
import styles from './index.less';

const { Search } = Input;

@connect(({ user, global }) => ({
  user: user.currentUser,
  enterprise: global.enterprise
}))
export default class EnterpriseShared extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      pageSize: 10,
      total: 0,
      appName: '',
      page: 1,
      scope: 'enterprise',
      showCloudApp: true,
      componentList: []
    };
  }
  componentDidMount() {
    const { user } = this.props;
    if (user) {
      this.getApps();
    }
  }

  getApps = () => {
    const {
      dispatch,
      user,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, pageSize, appName, scope } = this.state;
    dispatch({
      type: 'market/fetchAppModels',
      payload: {
        enterprise_id: eid,
        user_id: user.user_id,
        app_name: appName,
        scope,
        page,
        page_size: pageSize
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            componentList: res.list,
            loading: false,
            total: res.total
          });
        }
      }
    });
  };

  getAction = item => {
    const { versions_info: versionsInfo = [] } = item;
    if (versionsInfo && versionsInfo.length > 0) {
      return (
        <Fragment>
          <Tag
            style={{
              height: '17px',
              lineHeight: '16px',
              color: '#999999',
              border: 'none',
              background: 'none'
            }}
            size="small"
          >
            {versionsInfo[0].version}
          </Tag>
        </Fragment>
      );
    }
    return '-';
  };
  handlePageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.getApps();
      }
    );
  };

  handleSearch = appName => {
    this.setState(
      {
        appName,
        page: 1
      },
      () => {
        this.getApps();
      }
    );
  };
  render() {
    const {
      enterprise,
      match: {
        params: { eid }
      }
    } = this.props;

    const {
      componentList,
      pageSize,
      total,
      page,
      showCloudApp,
      loading
    } = this.state;

    const paginationProps = {
      page_size: pageSize,
      total,
      current: page,
      onChange: pages => {
        this.handlePageChange(pages);
      }
    };

    return (
      <PageHeaderLayout
        title="云端应用商店应用同步"
        content="从指定的云端应用商店同步应用模版到本地，可同步应用一般是公开免费应用和已购买应用"
      >
        <div className={styles.descText}>
          <Icon type="exclamation-circle" />
          {`当前应用市场${rainbondUtil.appstoreImageHubEnable(
            enterprise
          )}跨集群互联功能`}
        </div>
        <div
          className={BasicListStyles.standardList}
          style={{
            display: showCloudApp ? 'flex' : 'block',
            position: 'relative',
            overflow: 'hidden'
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
                  placeholder={formatMessage({id:'applicationMarket.localMarket.placeholder'})}
                  onSearch={this.handleSearch}
                />
              </div>
            }
            style={{
              transition: 'all .8s',
              width: '50%',
              display: 'inline-block'
            }}
            bodyStyle={{
              padding: '0 32px 40px 32px'
            }}
          >
            <List
              size="large"
              rowKey="ID"
              locale={{
                emptyText: (
                  <p style={{ paddingTop: 80, lineHeight: 1.3 }}>
                    {formatMessage({id:'notification.market.hint.null_app1'})}
                    <br />
                    <br />
                    {formatMessage({id:'notification.market.hint.null_app2'})}
                    {rainbondUtil.cloudMarketEnable(enterprise) && (
                      <span>
                    {formatMessage({id:'notification.market.hint.null_app3'})}
                        <span style={{ color: '#1890ff' }}>
                    {formatMessage({id:'notification.market.hint.null_app4'})}
                        </span>
                      </span>
                    )}
                  </p>
                )
              }}
              loading={loading}
              pagination={paginationProps}
              dataSource={componentList}
              renderItem={item => {
                const renderItem = (
                  <List.Item actions={[this.getAction(item)]}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={
                            item.pic ||
                            // eslint-disable-next-line global-require
                            require('../../../public/images/app_icon.jpg')
                          }
                          shape="square"
                          size="large"
                        />
                      }
                      title={
                        <a style={{ color: '#384551' }}>{item.app_name}</a>
                      }
                      description={
                        <Tooltip title={item.describe}>
                          <span className={styles.desc}>{item.describe}</span>
                        </Tooltip>
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
              transform: showCloudApp
                ? 'translate3d(0, 0, 0)'
                : 'translate3d(100%, 0, 0)',
              marginLeft: 8,
              width: '49%'
            }}
          >
            <CloudApp
              eid={eid}
              onSyncSuccess={() => {
                this.handlePageChange(1);
              }}
            />
          </div>
        </div>
      </PageHeaderLayout>
    );
  }
}
