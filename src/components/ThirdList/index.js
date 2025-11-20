/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/no-danger */
/* eslint-disable react/jsx-indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
/* eslint-disable camelcase */
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Icon,
  Input,
  List,
  Modal,
  Pagination,
  Row,
  Skeleton,
  Spin,
  Table,
  Tooltip,
  Alert
} from 'antd';
import { connect } from 'dva';
import React from 'react';
import { formatMessage } from 'umi-plugin-locale';
import App from '../../../public/images/code.svg';
import globalUtil from '../../utils/global';
import oauthUtil from '../../utils/oauth';
import ThirForm from './form.js';
import styles from './Index.less';

@connect()
@Form.create()
class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      detection: false,
      lists: [],
      page: 1,
      total: 0,
      loading: true,
      thirdInfo: false,
      search: '',
      event_id: '',
      check_uuid: '',
      create_loading: false,
      create_status: '',
      service_info: '',
      error_infos: '',
      loadingMore: false,
      hasMore: true
    };
    this.thirdFormRef = React.createRef();
    this.listRef = React.createRef();
  }

  // 暴露一个 handleSubmit 方法供父组件调用
  handleSubmit = () => {
    if (this.thirdFormRef.current && this.thirdFormRef.current.getWrappedInstance) {
      const formInstance = this.thirdFormRef.current.getWrappedInstance();
      if (formInstance && formInstance.handleSubmit) {
        // 创建一个假的事件对象
        const fakeEvent = { preventDefault: () => {} };
        formInstance.handleSubmit(fakeEvent);
      }
    }
  }
  componentDidMount() {
    this.handleCodeWarehouseInfo(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.type !== this.props.type) {
      this.setState({ visible: false, search: '' }, () => {
        this.handleCodeWarehouseInfo(nextProps);
      });
    }
  }
  onChangePage = page => {
    this.setState({ page, loading: true }, () => {
      this.handleCodeWarehouseInfo(this.props);
    });
  };
  handleSearch = search => {
    const _th = this;
    this.setState(
      {
        page: 1,
        loading: true,
        search,
        lists: [],
        hasMore: true
      },
      () => {
        _th.handleCodeWarehouseInfo(_th.props);
      }
    );
  };

  // 处理列表滚动加载
  handleListScroll = (e) => {
    const { loadingMore, hasMore, page } = this.state;
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // 当滚动到距离底部50px时触发加载
    if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore) {
      this.setState({
        page: page + 1
      }, () => {
        this.handleCodeWarehouseInfo(this.props, true);
      });
    }
  };
  // 获取代码仓库信息
  handleCodeWarehouseInfo = (props, append = false) => {
    const { page, search, lists } = this.state;
    const { dispatch, type } = props;
    this.setState(
      {
        loading: !append,
        loadingMore: append
      },
      () => {
        dispatch({
          type: 'global/codeWarehouseInfo',
          payload: {
            page,
            search,
            oauth_service_id: type
          },
          callback: res => {
            if (res && res.bean) {
              const newList = append ? [...lists, ...res.bean.repositories] : res.bean.repositories;
              const total = Number(res.bean.total) || 0;
              const hasMore = newList.length < total;
              this.setState({
                loading: false,
                loadingMore: false,
                total,
                lists: newList,
                hasMore
              });
            }
          }
        });
      }
    );
  };

  // 代码检测
  handleTestCode = () => {
    const { thirdInfo } = this.state;
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    this.setState(
      {
        create_loading: true
      },
      () => {
        dispatch({
          type: 'global/testCode',
          payload: {
            region_name,
            tenant_name: team_name,
            project_url: thirdInfo.project_url,
            version: thirdInfo.project_default_branch,
            oauth_service_id: this.props.type
          },
          callback: res => {
            if (res && res.status_code === 200) {
              this.setState(
                {
                  event_id: res.data && res.data.bean && res.data.bean.event_id,
                  check_uuid:
                    res.data && res.data.bean && res.data.bean.check_uuid,
                  create_status: 'Checking',
                  create_loading: false
                },
                () => {
                  this.handleDetectionCode();
                }
              );
            }
          }
        });
      }
    );
  };
  handleDetectionCode = () => {
    const { event_id, check_uuid } = this.state;
    const { dispatch, type } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const _th = this;
    dispatch({
      type: 'global/detectionCode',
      payload: {
        oauth_service_id: type,
        region: region_name,
        tenant_name: team_name,
        check_uuid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (
            res.bean &&
            res.bean.check_status != 'Success' &&
            res.bean.check_status != 'Failure'
          ) {
            this.timer = setTimeout(function () {
              _th.handleDetectionCode();
            }, 3000);
          } else {
            clearTimeout(this.timer);
            this.setState({
              create_status: res.bean && res.bean.check_status,
              service_info: res.bean && res.bean.service_info,
              error_infos: res.bean && res.bean.error_infos
            });
          }
        }
      }
    });
  };
  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
  showModal = thirdInfo => {
    this.setState({
      visible: true,
      thirdInfo
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  handleDetection = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.setState({
      detection: false,
      create_status: '',
      service_info: '',
      error_infos: ''
    });
  };
  handleOpenDetection = thirdInfo => {
    this.setState({
      thirdInfo,
      detection: true
    });
  };
  render() {
    const {
      visible,
      detection,
      lists,
      loading,
      thirdInfo,
      create_loading,
      total,
      page,
      create_status,
      error_infos,
      service_info,
      loadingMore,
      hasMore
    } = this.state;
    const { handleType, oauthService } = this.props;
    const ServiceComponent = handleType && handleType === 'Service';
    const serviceInfos = service_info && service_info.length > 0;

    // 检查认证状态
    const isAuthenticated = oauthService?.is_authenticated;
    const isExpired = oauthService?.is_expired;
    const needAuth = !isAuthenticated || isExpired;
    const columns = [
      {
        title: formatMessage({ id: 'componentOverview.body.ThirdList.component_name' }),
        dataIndex: 'name',
        render: data => <span>{data || thirdInfo.project_name}</span>
      },
      {
        title: formatMessage({ id: 'componentOverview.body.ThirdList.language' }),
        dataIndex: 'language'
      }
    ];
    return (
      <div>
        {detection && (
          <Modal
            visible={detection}
            onCancel={this.handleDetection}
            title={formatMessage({ id: 'componentOverview.body.ThirdList.detect_language' })}
            footer={
              !create_status
                ? [
                  <Button key="back" onClick={this.handleDetection}>
                    {formatMessage({ id: 'componentOverview.body.ThirdList.close' })}
                  </Button>,
                  <Button
                    key="submit"
                    type="primary"
                    loading={create_loading}
                    onClick={this.handleTestCode}
                  >
                    {formatMessage({ id: 'componentOverview.body.ThirdList.detect' })}
                  </Button>
                ]
                : create_status == 'Success'
                  ? [
                    <Button key="back" onClick={this.handleDetection}>
                      {formatMessage({ id: 'componentOverview.body.ThirdList.close' })}
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleDetection}
                    >
                      {formatMessage({ id: 'componentOverview.body.ThirdList.confirm' })}
                    </Button>
                  ]
                  : [
                    <Button key="back" onClick={this.handleDetection}>
                      {formatMessage({ id: 'componentOverview.body.ThirdList.close' })}
                    </Button>
                  ]
            }
          >
            <div>
              {create_status == 'Checking' || create_status == 'Complete' ? (
                <div>
                  <p style={{ textAlign: 'center' }}>
                    <Spin />
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    {formatMessage({ id: 'componentOverview.body.ThirdList.detecting' })}
                  </p>
                </div>
              ) : (
                ''
              )}
              {create_status == 'Failure' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#28cb75',
                      fontSize: '36px'
                    }}
                  >
                    <Icon
                      style={{
                        color: '#f5222d',
                        marginRight: 8
                      }}
                      type="close-circle-o"
                    />
                  </p>

                  {error_infos &&
                    error_infos.map(items => {
                      return (
                        <div>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `<span>${items.error_info ||
                                ''} ${items.solve_advice || ''}</span>`
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              ) : (
                ''
              )}
              {create_status == 'Success' ? (
                <div>
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#28cb75',
                      fontSize: '36px'
                    }}
                  >
                    <Icon type="check-circle-o" />
                  </div>
                  {serviceInfos && (
                    <Table
                      rowKey={(record, index) => index}
                      title={() =>
                        service_info.length > 1 && (
                          <div
                            style={{
                              textAlign: 'center',
                              fontSize: '20px',
                              color: '#000'
                            }}
                          >
                            {formatMessage({ id: 'componentOverview.body.ThirdList.multi_module' }, { language: service_info[0].language })}
                          </div>
                        )
                      }
                      dataSource={service_info}
                      columns={columns}
                      pagination={false}
                    />
                  )}
                </div>
              ) : (
                ''
              )}
              {create_status == 'Failed' ? (
                <div>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '999',
                      fontSize: '36px'
                    }}
                  >
                    <Icon type="close-circle-o" />
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    {formatMessage({ id: 'componentOverview.body.ThirdList.detect_failed' })}
                  </p>
                </div>
              ) : (
                ''
              )}

              {!create_status && (
                <div>
                  <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    {formatMessage({ id: 'componentOverview.body.ThirdList.confirm_detect' })}
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {!visible ? (
          <div>
            {/* 认证提示 */}
            {needAuth && oauthService && (
              <Alert
                message={
                  isExpired
                    ? formatMessage(
                        { id: 'componentOverview.body.ThirdList.auth_expired_title' },
                        { name: oauthService.name }
                      )
                    : formatMessage(
                        { id: 'componentOverview.body.ThirdList.auth_required_title' },
                        { name: oauthService.name }
                      )
                }
                description={
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      {isExpired
                        ? formatMessage({ id: 'componentOverview.body.ThirdList.auth_expired_desc' })
                        : formatMessage({ id: 'componentOverview.body.ThirdList.auth_required_desc' })
                      }
                    </div>
                    <Button
                      type="primary"
                      icon="safety"
                      onClick={() => {
                        const authURL = oauthUtil.getAuthredictURL(oauthService);
                        if (authURL) {
                          window.open(`${authURL}&type=certification`, '_blank');
                        }
                      }}
                    >
                      {formatMessage({ id: 'componentOverview.body.ThirdList.go_auth' })}
                    </Button>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            <Input.Search
              placeholder={formatMessage({ id: 'componentOverview.body.ThirdList.search_placeholder' })}
              enterButton={formatMessage({ id: 'componentOverview.body.ThirdList.search_button' })}
              size="large"
              onSearch={this.handleSearch}
              disabled={needAuth}
              style={{
                padding: '0 0 11px 0',
              }}
            />
            <div
              ref={this.listRef}
              onScroll={this.handleListScroll}
              style={{ maxHeight: '600px', overflowY: 'auto' }}
            >
              <List
                loading={loading}
                className={styles.lists}
                dataSource={lists}
                gutter={1}
                renderItem={item => (
              <List.Item
                className={styles.listItem}
                actions={[
                  <div>
                    <a
                      style={{
                        marginLeft: '16px',
                        pointerEvents: needAuth ? 'none' : 'auto',
                        opacity: needAuth ? 0.5 : 1
                      }}
                      onClick={() => {
                        if (!needAuth) {
                          this.showModal(item);
                        }
                      }}
                    >
                      {formatMessage({ id: 'componentOverview.body.ThirdList.create_component' })}
                    </a>
                  </div>
                ]}
              >
                <Skeleton avatar title={false} loading={false} active>
                  <List.Item.Meta
                    style={{
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                    avatar={<Avatar src={App} shape="square" />}
                    title={
                      <a target="_blank" href={item.project_url}>
                        <div className={styles.listItemMataTitle}>
                          <Tooltip title={item.project_name}>
                            <div>{item.project_name || '-'}</div>
                          </Tooltip>
                          <Tooltip
                            title={
                              item.project_full_name &&
                              item.project_full_name.split('/')[0]
                            }
                          >
                            <div>
                              {item.project_full_name &&
                                item.project_full_name.split('/')[0]}
                            </div>
                          </Tooltip>
                        </div>
                      </a>
                    }
                  />
                  {!ServiceComponent && (
                    <Row
                      justify="center"
                      style={{
                        width: '60%',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      <Col span={18}>
                        <Tooltip title={item.project_description}>
                          <div
                            className={styles.listItemMataDesc}
                            style={{ paddingLeft: '10px' }}
                          >
                            {item.project_description}
                          </div>
                        </Tooltip>
                      </Col>

                      <Col span={6}>
                        <Tooltip title={item.project_default_branch}>
                          <div className={styles.listItemMataBranch}>
                            <Icon
                              type="apartment"
                              style={{ marginRight: '5px' }}
                            />
                            {item.project_default_branch || '-'}
                          </div>
                        </Tooltip>
                      </Col>
                    </Row>
                  )}
                </Skeleton>
              </List.Item>
            )}
          />
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin tip={formatMessage({ id: 'componentOverview.body.ThirdList.loading_more' })} />
            </div>
          )}
          {!hasMore && lists.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              {formatMessage({ id: 'componentOverview.body.ThirdList.all_loaded' })}
            </div>
          )}
            </div>
          </div>
        ) : (
          <Card bordered={false}  className={styles.listCard}
            extra={
              <Button
                onClick={this.handleCancel}
              >
                {formatMessage({ id: 'componentOverview.body.ThirdList.back_to_list' })}
              </Button>
            }
          >
            <ThirForm
              wrappedComponentRef={this.thirdFormRef}
              onSubmit={this.props.handleSubmit}
              {...this.props}
              ServiceComponent={ServiceComponent}
              thirdInfo={thirdInfo}
              showSubmitBtn={true}
            />
          </Card>
        )}
      </div>
    );
  }
}

export default Index;
