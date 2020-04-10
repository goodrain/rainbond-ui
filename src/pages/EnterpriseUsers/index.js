import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Button, Table, Tabs, Row, Col, notification } from 'antd';
import { routerRedux } from 'dva/router';
import userUtil from '../../utils/user';
import CreatUser from '../../components/CreatUserForm';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import ConfirmModal from '../../components/ConfirmModal';
import moment from 'moment';

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  overviewInfo: index.overviewInfo,
}))
export default class EnterpriseUsers extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      page: 1,
      page_size: 10,
      adminer,
      adminList: [],
      total: 0,
      userVisible: false,
      userInfo: false,
      text: '',
      delVisible: false,
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    !adminer && dispatch(routerRedux.push(`/`));
  }
  componentDidMount() {
    this.loadUser();
  }

  handleCreatUser = values => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    const { userInfo } = this.state;
    if (userInfo) {
      this.upUser(values);
      return null;
    }
    dispatch({
      type: 'global/creatUser',
      payload: {
        enterprise_id: eid,
        ...values,
      },
      callback: data => {
        if (data && data._condition == 200) {
          this.loadUser();
          this.cancelCreatUser();
          notification.success({ message: data.msg_show || '' });
        }
      },
      handleError: res => {
        if (res && res.data && res.data.code) {
          switch (res.data.code) {
            case 3000:
              notification.warning({ message: '用户已存在' });
              break;
            case 3003:
              notification.warning({ message: '邮箱已存在' });
              break;
            case 3004:
              notification.warning({ message: '电话已存在' });
              break;
          }
        }
      },
    });
  };

  upUser = values => {
    const { userInfo } = this.state;
    const info = userInfo;
    info.user_name = values.user_name;
    info.password = values.password;

    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/upEnterpriseUsers',
      payload: {
        ...info,
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._condition == 200) {
          this.cancelCreatUser();
          this.loadUser();
          notification.success({ message: '编辑成功' });
        }
      },
    });
  };

  handleDelete = () => {
    const { userInfo } = this.state;
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/deleteEnterpriseUsers',
      payload: {
        user_id: userInfo.user_id,
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._condition == 200) {
          this.loadUser();
          this.cancelDelUser();
          notification.success({ message: '删除成功' });
        }
      },
    });
  };

  onPageChange = (page, page_size) => {
    this.setState(
      {
        page,
        page_size,
      },
      () => {
        this.loadUser();
      }
    );
  };

  loadUser = name => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    const { page, page_size } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseUsers',
      payload: {
        enterprise_id: eid,
        page,
        page_size,
        name,
      },
      callback: res => {
        if (res) {
          this.setState({ adminList: res.list, total: res.total });
        }
      },
    });
  };

  // 管理员添加用户
  addUser = () => {
    this.setState({
      userVisible: true,
      text: '添加用户',
    });
  };

  cancelCreatUser = () => {
    this.setState({
      userVisible: false,
      text: '',
      userInfo: false,
    });
  };

  handleEdit = item => {
    this.setState({
      userInfo: item,
      userVisible: true,
      text: '编辑用户',
    });
  };

  delUser = userInfo => {
    this.setState({
      delVisible: true,
      userInfo,
    });
  };
  cancelDelUser = () => {
    this.setState({
      delVisible: false,
      userInfo: false,
    });
  };

  render() {
    const { adminList, adminer, text, userInfo, delVisible } = this.state;

    const {
      match: {
        params: { eid },
      },
    } = this.props;

    const columns = [
      {
        title: '用户名称',
        dataIndex: 'nick_name',
        rowKey: 'nick_name',
        align: 'center',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        rowKey: 'email',
        align: 'center',
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        rowKey: 'create_time',
        align: 'center',
        render: val => {
          return (
            <span>
              {' '}
              {moment(val)
                .locale('zh-cn')
                .format('YYYY-MM-DD hh:mm:ss')}
            </span>
          );
        },
      },
      {
        title: '操作',
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
              删除
            </a>,
            <a
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              编辑
            </a>,
          ];
        },
      },
    ];

    return (
      <PageHeaderLayout
        title="用户管理"
        content="企业用户查询、添加和修改相关功能，用户需要操作应用或组件相关资源时需要将其分配到相应的团队"
      >
        <Card>
          <Row style={{ marginBottom: '20px' }}>
            <Col span={12} style={{ color: '#2B3844' }}>
              企业用户
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              {adminer && (
                <Button onClick={this.addUser} type="primary" size="small">
                  新增
                </Button>
              )}
            </Col>
          </Row>

          {delVisible && (
            <ConfirmModal
              onOk={this.handleDelete}
              title="删除用户"
              subDesc="此操作不可恢复"
              desc="确定要删除此用户吗？"
              onCancel={this.cancelDelUser}
            />
          )}

          {this.state.userVisible && (
            <CreatUser
              eid={eid}
              userInfo={userInfo}
              title={text}
              onOk={this.handleCreatUser}
              onCancel={this.cancelCreatUser}
            />
          )}

          <Table
            size="middle"
            pagination={{
              current: this.state.page,
              pageSize: this.state.page_size,
              total: this.state.total,
              onChange: this.onPageChange,
            }}
            dataSource={adminList}
            columns={columns}
          />
        </Card>
      </PageHeaderLayout>
    );
  }
}
