import {
  Alert,
  Avatar,
  Card,
  Input,
  List,
  notification,
  Radio,
  Select
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import globalUtil from '../../utils/global';
import BasicListStyles from '../List/BasicList.less';
import appIcon from '../../../public/images/app_icon.jpg';
import Styles from './index.less';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Search } = Input;
const { Option } = Select;

@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo
}))
export default class CloudApp extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      pageSize: 10,
      total: 0,
      page: 1,
      loading: false,
      showMarketAppDetail: false,
      showApp: {},
      networkText: '',
      appName: ''
    };
  }
  componentDidMount = () => {
    this.loadApps();
  };

  getAction = item => {
    if (item.is_complete) {
      if (item.is_upgrade === 0) {
        return (
          <Fragment>
            <span>已下载,无更新</span>
          </Fragment>
        );
      }
      return (
        <Fragment>
          <a
            href="javascript:;"
            onClick={() => {
              this.handleLoadAppDetail(item);
            }}
          >
            更新新版本
          </a>
        </Fragment>
      );
    }
    return (
      <a
        href="javascript:;"
        onClick={() => {
          this.handleLoadAppDetail(item);
        }}
      >
        下载
      </a>
    );
  };

  handleLoadAppDetail = item => {
    const { dispatch, eid, onSyncSuccess } = this.props;
    dispatch({
      type: 'global/syncMarketAppDetail',
      payload: {
        enterprise_id: eid,
        body: {
          app_id: item.app_id,
          app_versions: item.version
        }
      },
      callback: () => {
        notification.success({ message: formatMessage({id:'notification.success.succeeded'}) });
        this.loadApps();
        if (onSyncSuccess) {
          onSyncSuccess();
        }
      }
    });
  };

  handleChange = (version, data, index) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/getVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_name: data.app_name,
        group_key: data.group_key,
        version
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (res.list && res.list.length > 0) {
            const arr = this.state.apps;
            arr[index].is_complete = res.list[0].is_complete;
            arr[index].is_upgrade = res.list[0].is_upgrade;
            this.setState({ apps: arr });
          }
        }
      }
    });
  };

  handlePageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.loadApps();
      }
    );
  };
  showMarketAppDetail = app => {
    if (app && app.app_detail_url) {
      window.open(app.app_detail_url, '_blank');
      return;
    }
    this.setState({
      showApp: app,
      showMarketAppDetail: true
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  loadApps = () => {
    const { dispatch, eid } = this.props;
    const { appName, page, pageSize } = this.state;
    this.setState(
      {
        loading: true
      },
      () => {
        dispatch({
          type: 'market/getMarketApp',
          payload: {
            enterprise_id: eid,
            app_name: appName,
            page,
            page_size: pageSize
          },
          callback: data => {
            if (data) {
              this.setState({
                apps: data.list || [],
                loading:
                  data._code &&
                  data.status_code === 210 &&
                  data._condition &&
                  data._condition === 10503
                    ? -1
                    : false,
                total: data.total,
                networkText: data.msg_show
              });
            }
          }
        });
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
        this.loadApps();
      }
    );
  };
  handleClose = () => {
    const { dispatch, eid } = this.props;

    dispatch(routerRedux.push(`/enterprise/${eid}/shared/local`));
  };

  render() {
    const {
      pageSize,
      total,
      page,
      loading,
      networkText,
      apps,
      showMarketAppDetail,
      showApp
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
      <Card
        className={BasicListStyles.listCard}
        bordered={false}
        title={
          <div>
            云端
            <Search
              className={BasicListStyles.extraContentSearch}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearch}
            />
          </div>
        }
        style={{}}
        bodyStyle={{
          padding: '0 32px 40px 32px'
        }}
        extra={
          <div className={BasicListStyles.extraContent}>
            <RadioGroup>
              <RadioButton
                style={{ background: '#4D73B1', color: '#fff' }}
                onClick={this.handleClose}
              >
                关闭
              </RadioButton>
            </RadioGroup>
          </div>
        }
      >
        {loading === -1 ? (
          <div style={{ height: '300px' }}>
            <Alert
              style={{ marginTop: '130px', textAlign: 'center' }}
              message={networkText}
              type="warning"
            />
          </div>
        ) : (
          <List
            size="large"
            rowKey="id"
            loading={loading === -1 ? false : loading}
            pagination={paginationProps}
            dataSource={apps}
            renderItem={(item, index) => (
              <List.Item actions={[this.getAction(item)]}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        item.pic || appIcon
                        // eslint-disable-next-line global-require
                      }
                      onClick={() => {
                        this.showMarketAppDetail(item);
                      }}
                      shape="square"
                      size="large"
                    />
                  }
                  title={
                    <a
                      style={{ color: '#384551' }}
                      onClick={() => {
                        this.showMarketAppDetail(item);
                      }}
                    >
                      {item.app_name}
                      {!loading && (
                        <Select
                          getPopupContainer={triggerNode =>
                            triggerNode.parentNode
                          }
                          style={{ marginLeft: '18px' }}
                          defaultValue={item.version[0]}
                          onChange={version => {
                            this.handleChange(version, item, index);
                          }}
                          size="small"
                        >
                          {item.version &&
                            item.version.map((items, index) => {
                              return (
                                <Option value={items} key={index}>
                                  {items}
                                </Option>
                              );
                            })}
                        </Select>
                      )}
                    </a>
                  }
                  description={
                    <div className={Styles.conts}>
                      <div>{item.describe || '-'}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
        {showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={showApp}
          />
        )}
      </Card>
    );
  }
}
