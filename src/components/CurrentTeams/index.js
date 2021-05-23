import { Button, Icon, Modal, notification, Table } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import userUtil from '../../utils/user';
import AddMember from '../AddMember';
import styles from '../CreateTeam/index.less';

@connect(({ user }) => ({
  user: user.currentUser
}))
class currentTeams extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      page: 1,
      pageSize: 10,
      total: 0,
      list: [],
      toEditAction: false,
      editRoleLoading: true,
      Loading: true
    };
  }
  componentDidMount() {
    this.fetchCurrentTeams();
  }
  onJumpTeam = (teamName, region) => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push(`/team/${teamName}/region/${region}/index`));
  };
  onPageChange = page => {
    this.setState({ page }, () => {
      this.fetchCurrentTeams();
    });
  };
  fetchCurrentTeams = () => {
    const { dispatch, userInfo, eid } = this.props;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        enterprise_id: eid,
        user_id: userInfo && userInfo.user_id,
        page: 1,
        page_size: 10
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            list: res.list,
            Loading: false
          });
        }
      }
    });
  };

  showRegions = (teamName, regions, ismanagement = false) => {
    return regions.map(item => {
      return (
        <Button
          key={`${item.region_name}region`}
          className={styles.regionShow}
          onClick={() => {
            if (ismanagement) {
              this.handleJoinTeams(teamName, item.region_name);
            } else {
              this.onJumpTeam(teamName, item.region_name);
            }
          }}
        >
          {item.region_alias}
          <Icon type="right" />
        </Button>
      );
    });
  };
  handleJoinTeams = (teamName, region) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/joinTeam',
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.onJumpTeam(teamName, region);
        }
      }
    });
  };
  handleRole = data => {
    this.setState({
      toEditAction: data,
      editRoleLoading: false
    });
  };

  handleEditRole = data => {
    this.setState({ editRoleLoading: true });
    const { dispatch, userInfo } = this.props;
    const { toEditAction } = this.state;
    dispatch({
      type: 'teamControl/editMember',
      payload: {
        team_name: toEditAction.team_name,
        user_id: userInfo && userInfo.user_id,
        role_ids: data.role_ids
      },
      callback: () => {
        this.fetchCurrentTeams();
        notification.success({ message: '修改成功' });
        this.handleRole(false);
      }
    });
  };

  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  render() {
    const { onCancel, title, userInfo, eid } = this.props;
    const {
      page,
      pageSize,
      total,
      list,
      Loading,
      toEditAction,
      adminer,
      editRoleLoading
    } = this.state;
    const th = this;
    const columns = [
      {
        title: '团队名称',
        dataIndex: 'team_alias',
        rowKey: 'team_alias',
        align: 'center'
      },
      {
        title: '集群',
        dataIndex: 'team_name',
        rowKey: 'team_name',
        align: 'center',
        render(val, data) {
          return th.showRegions(val, data.region_list, true);
        }
      },
      {
        title: '角色',
        dataIndex: 'roles',
        render(val) {
          return (
            <span>
              {val && val.length > 0
                ? val.map(item => {
                    return (
                      <span style={{ marginRight: '8px' }} key={`role${item}`}>
                        {item}
                      </span>
                    );
                  })
                : '-'}
            </span>
          );
        }
      }
    ];
    if (adminer) {
      columns.push({
        title: '操作',
        dataIndex: 'action',
        align: 'center',
        width: 100,
        render(_, data) {
          return (
            <a
              onClick={() => {
                th.handleRole(data);
              }}
            >
              修改角色
            </a>
          );
        }
      });
    }
    return (
      <Fragment>
        <Modal
          visible
          width={800}
          title={title || '团队列表'}
          className={styles.TelescopicModal}
          maskClosable={false}
          footer={[
            <Button style={{ marginTop: '20px' }} onClick={onCancel}>
              关闭
            </Button>
          ]}
          onCancel={onCancel}
        >
          <Table
            loading={Loading}
            scroll={{ y: 300 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: this.onPageChange
            }}
            dataSource={list}
            columns={columns}
          />
        </Modal>
        {toEditAction && (
          <AddMember
            viewName="enterprise"
            title="修改角色"
            eid={eid}
            loading={editRoleLoading}
            data={toEditAction}
            userId={userInfo && userInfo.user_id}
            teamName={toEditAction && toEditAction.team_name}
            nickName={userInfo && userInfo.nick_name}
            onOk={this.handleEditRole}
            onCancel={() => {
              this.handleRole(false);
            }}
          />
        )}
      </Fragment>
    );
  }
}
export default currentTeams;
