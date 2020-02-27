import React, { PureComponent, Fragment } from 'react';
import globalUtil from '../../utils/global';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import MarketAppDetailShow from '../../components/MarketAppDetailShow';
import BasicListStyles from '../List/BasicList.less';
import Styles from './index.less';
import {
  Card,
  List,
  Avatar,
  Input,
  Radio,
  notification,
  Select,
  Alert,
} from 'antd';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { Search } = Input;
const Option = Select.Option;

@connect(({ user, global }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
}))
export default class CloudApp extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      page_size: 10,
      total: 0,
      page: 1,
      sync: false,
      loading: false,
      showMarketAppDetail: false,
      showApp: {},
      version: null,
      versionList: null,
      networkText: '',
    };
  }
  componentDidMount = () => {
    this.handleSync();
  };
  handleClose = () => {
    const { dispatch, eid } = this.props;

    dispatch(routerRedux.push(`/enterprise/${eid}/shared`));

    this.setState({ versionList: null });
  };
  handleSync = () => {
    this.loadApps();
  };
  handleSearch = app_name => {
    this.setState(
      {
        versionList: null,
        app_name,
        page: 1,
      },
      () => {
        this.loadApps();
      }
    );
  };

  loadApps = () => {
    const { dispatch, eid } = this.props;
    this.setState(
      {
        loading: true,
      },
      () => {
        dispatch({
          type: 'market/getMarketApp',
          payload: {
            enterprise_id: eid,
            app_name: this.state.app_name,
            page: this.state.page,
            page_size: this.state.page_size,
          },
          callback: data => {
            if (data) {
              this.setState({
                apps: data.list || [],
                loading:
                  data._code &&
                  data._code === 210 &&
                  data._condition &&
                  data._condition === 10503
                    ? -1
                    : false,
                total: data.total,
                version: null,
                networkText: data.msg_show,
              });
            }
          },
        });
      }
    );
  };

  handleLoadAppDetail = item => {
    const { dispatch, eid } = this.props;
    dispatch({
      type: 'global/syncMarketAppDetail',
      payload: {
        enterprise_id: eid,
        body: {
          app_id: item.group_key,
          app_versions: item.version,
        },
      },
      callback: data => {
        notification.success({ message: '操作成功' });
        this.loadApps();
        this.props.onSyncSuccess && this.props.onSyncSuccess();
      },
    });
  };

  shouldComponentUpdate = () => {
    return true;
  };

  handleChange = (version, data, index) => {
    this.setState({ version });
    this.props.dispatch({
      type: 'global/getVersion',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_name: data.group_name,
        group_key: data.group_key,
        version,
      },
      callback: res => {
        if (res && res._code == 200) {
          if (res.list && res.list.length > 0) {
            const arr = this.state.apps;
            arr[index].is_complete = res.list[0].is_complete;
            arr[index].is_upgrade = res.list[0].is_upgrade;
            this.setState({ apps: arr });
          }
        }
      },
    });
  };

  handlePageChange = page => {
    this.setState(
      {
        page,
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
      showMarketAppDetail: true,
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false,
    });
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
  render() {
    const { versionList, CloudApp } = this.state;
    const paginationProps = {
      page_size: this.state.page_size,
      total: this.state.total,
      current: this.state.page,
      onChange: page_size => {
        this.handlePageChange(page_size);
      },
    };
    return (
      <Card
        className={BasicListStyles.listCard}
        bordered={false}
        title={
          <div>
            云端{' '}
            <Search
              className={BasicListStyles.extraContentSearch}
              placeholder="请输入名称进行搜索"
              onSearch={this.handleSearch}
            />
          </div>
        }
        style={{}}
        bodyStyle={{
          padding: '0 32px 40px 32px',
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
        {this.state.loading === -1 ? (
          <div style={{ height: '300px' }}>
            <Alert
              style={{ marginTop: '130px', textAlign: 'center' }}
              message={this.state.networkText}
              type="warning"
            />
          </div>
        ) : (
          <List
            size="large"
            rowKey="id"
            loading={this.state.loading === -1 ? false : this.state.loading}
            pagination={paginationProps}
            dataSource={this.state.apps}
            renderItem={(item, index) => (
              <List.Item actions={[this.getAction(item)]}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        item.pic ||
                        require('../../../public/images/app_icon.jpg')
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
                      href="javascript:;"
                      onClick={() => {
                        this.showMarketAppDetail(item);
                      }}
                    >
                      {item.group_name}
                      {!this.state.loading && (
                        <Select
                          style={{ marginLeft: '18px' }}
                          defaultValue={item.version[0]}
                          onChange={version => {
                            this.handleChange(version, item, index);
                          }}
                          size="small"
                        >
                          {item.version &&
                            item.version.map((item, index) => {
                              return (
                                <Option value={item} key={index}>
                                  {item}
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
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
      </Card>
    );
  }
}
