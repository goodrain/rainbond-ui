import { Button, Card, Col, Form, Input, notification, Row, Table } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import CreatUser from '../../components/CreatUserForm';
import CurrentTeams from '../../components/CurrentTeams';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import cloud from '../../utils/cloud';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const FormItem = Form.Item;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseUsers extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      page: 1,
      pageSize: 10,
      adminer,
      adminList: [],
      total: 0,
      currentUserInfo: false,
      userVisible: false,
      userInfo: false,
      text: '',
      delVisible: false,
      name: '',
      Loading: false
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }
  componentDidMount() {
    this.loadUser();
  }
  onPageChange = (page, pageSize) => {
    this.setState(
      {
        page,
        pageSize
      },
      () => {
        this.loadUser();
      }
    );
  };
  handleUser = values => {
    this.setState({
      Loading: true
    });
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { userInfo } = this.state;
    let info = values;
    let setType = 'global/creatUser';
    let setMessage = formatMessage({id:'notification.success.add_success'});
    if (userInfo) {
      info = Object.assign({}, userInfo, info);
      setType = 'global/upEnterpriseUsers';
      setMessage = formatMessage({id:'notification.success.edit'});
    }
    dispatch({
      type: setType,
      payload: {
        enterprise_id: eid,
        ...info
      },
      callback: res => {
        if (res && res._condition === 200) {
          this.canceUser();
          this.loadUser();
          notification.success({ message: setMessage });
        }
        this.handleCloseLoading();
      },
      handleError: err => {
        if (
          err &&
          err.data &&
          err.data.code &&
          err.data.code < 600 &&
          err.data.msg_show
        ) {
          notification.warning({ message: err.data.msg_show });
        } else {
          cloud.handleCloudAPIError(err);
        }
        this.handleCloseLoading();
      }
    });
  };

  handleCloseLoading = () => {
    this.setState({ Loading: false });
  };
  handleDelete = () => {
    const { userInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/deleteEnterpriseUsers',
      payload: {
        user_id: userInfo.user_id,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res._condition === 200) {
          this.loadUser();
          this.cancelDelUser();
          notification.success({ message: formatMessage({id:'notification.success.delete'}) });
        }
      }
    });
  };

  loadUser = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { page, pageSize, name } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseUsers',
      payload: {
        enterprise_id: eid,
        page,
        page_size: pageSize,
        name
      },
      callback: res => {
        if (res) {
          this.setState({ adminList: res.list, total: res.total });
        }
      }
    });
  };

  // 管理员添加用户
  addUser = () => {
    this.setState({
      userVisible: true,
      text: formatMessage({id:'enterpriseUser.button.adduser'})
    });
  };

  canceUser = () => {
    this.setState({
      userVisible: false,
      text: '',
      userInfo: false,
      Loading: false
    });
  };

  handleEdit = item => {
    this.setState({
      userInfo: item,
      userVisible: true,
      text: formatMessage({id:'enterpriseUser.button.edituser'})
    });
  };

  delUser = userInfo => {
    this.setState({
      delVisible: true,
      userInfo
    });
  };
  cancelDelUser = () => {
    this.setState({
      delVisible: false,
      userInfo: false
    });
  };
  handleSearch = () => {
    this.setState(
      {
        page: 1
      },
      () => {
        this.loadUser();
      }
    );
  };
  handelChange = value => {
    this.setState({ name: value && value.trim() });
  };
  handleCurrentUserId = currentUserInfo => {
    this.setState({
      currentUserInfo
    });
  };

  render() {
    const {
      adminList,
      adminer,
      text,
      userInfo,
      delVisible,
      userVisible,
      page,
      pageSize,
      total,
      Loading,
      currentUserInfo
    } = this.state;
    const {
      match: {
        params: { eid }
      }
    } = this.props;

    const columns = [
      {
        // title: '用户名称',
        title: formatMessage({id:'enterpriseUser.table.userName'}),
        dataIndex: 'nick_name',
        rowKey: 'nick_name',
        align: 'center',
        render: (val, data) => (
          <Button
            type="link"
            onClick={() => {
              this.handleCurrentUserId(data);
            }}
          >
            {val}
          </Button>
        )
      },
      {
        // title: '姓名',
        title: formatMessage({id:'enterpriseUser.table.name'}),
        dataIndex: 'real_name',
        rowKey: 'real_name',
        align: 'center'
      },
      {
        // title: '电话',
        title: formatMessage({id:'enterpriseUser.table.phone'}),
        dataIndex: 'phone',
        rowKey: 'phone',
        align: 'center'
      },
      {
        // title: '邮箱',
        title: formatMessage({id:'enterpriseUser.table.email'}),
        dataIndex: 'email',
        rowKey: 'email',
        align: 'center'
      },
      {
        // title: '创建时间',
        title: formatMessage({id:'enterpriseUser.table.time'}),
        dataIndex: 'create_time',
        rowKey: 'create_time',
        align: 'center',
        render: val => {
          return (
            <span>
              {moment(val)
                .locale('zh-cn')
                .format('YYYY-MM-DD HH:mm:ss')}
            </span>
          );
        }
      },
      {
        // title:'操作',
        title: formatMessage({id:'enterpriseUser.table.handle'}),
        dataIndex: 'user_id',
        align: 'center',
        rowKey: 'user_id',
        render: (val, item) => {
          return [
            <a
              onClick={() => {
                this.delUser(item);
              }}
            >
              {/* 删除 */}
              <FormattedMessage id='button.delete'/>
            </a>,
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              {/* 编辑 */}
              <FormattedMessage id='button.edit'/>
            </a>
          ];
        }
      }
    ];

    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseUser.PageHeaderLayout.title'/>}
        content={<FormattedMessage id='enterpriseUser.PageHeaderLayout.content'/>}
        titleSvg={pageheaderSvg.getSvg('userSvg',18)}
      >
        <Row
          style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            background:'#fafbfc',
            borderRadius:5,
            boxShadow:'rgb(36 46 66 / 16%) 1px 2px 5px 0px',
            padding:10
          }}
        >
          <Col span={12}>
            <Form layout="inline" style={{ display: 'inline-block' }}>
              <FormItem>
                <Input
                  placeholder={formatMessage({id:'placeholder.searchUser.user'})}
                  onChange={e => this.handelChange(e.target.value)}
                  onPressEnter={this.handleSearch}
                  style={{ width: 250 }}
                />
              </FormItem>
              <FormItem>
                <Button
                  type="primary"
                  onClick={this.handleSearch}
                  icon="search"
                >
                  {/* 搜索 */}
                  <FormattedMessage id='button.search'/>
                </Button>
              </FormItem>
            </Form>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            {adminer && (
              <Button
                type="primary"
                icon="plus"
                style={{ float: 'right' }}
                onClick={this.addUser}
              >
                {/* 新增用户 */}
                <FormattedMessage id='enterpriseUser.button.adduser'/>

              </Button>
            )}
          </Col>
        </Row>
        <Card style={{borderRadius:5,boxShadow:'rgb(36 46 66 / 16%) 1px 2px 5px 0px',}}> 
          {delVisible && (
            <ConfirmModal
              onOk={this.handleDelete}
              title={formatMessage({ id: 'confirmModal.user.delete.title' })}
              subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
              desc={formatMessage({ id: 'confirmModal.delete.user.desc' })}
              onCancel={this.cancelDelUser}
            />
          )}

          {userVisible && (
            <CreatUser
              eid={eid}
              loading={Loading}
              userInfo={userInfo}
              title={text}
              onOk={this.handleUser}
              onCancel={this.canceUser}
            />
          )}
          {currentUserInfo && (
            <CurrentTeams
              eid={eid}
              userInfo={currentUserInfo}
              onCancel={() => {
                this.handleCurrentUserId(false);
              }}
            />
          )}
          <Table
            pagination={total > 10 ? {
              current: page,
              pageSize,
              total,
              onChange: this.onPageChange
            } : false}
            dataSource={adminList}
            columns={columns}
          />
        </Card>
      </PageHeaderLayout>
    );
  }
}
