import { Button, Modal, notification, Table } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import roleUtil from '../../utils/role';
import AddMember from '../AddMember';
import styles from '../CreateTeam/index.less';

@connect(({ user }) => ({
  user: user.currentUser
}))
class currentTeams extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      toEditAction: false,
      editRoleLoading: true,
      Loading: true
    };
  }
  componentDidMount() {
    this.getEnterpriseTeams();
  }

  getEnterpriseTeams = () => {
    const { dispatch, eid, userInfo } = this.props;
    dispatch({
      type: 'global/fetchUserTeams',
      payload: {
        user_id: userInfo && userInfo.user_id,
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            list: (res && res.list) || [],
            Loading: false
          });
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
    const { dispatch, eid, userInfo } = this.props;
    const { toEditAction } = this.state;
    let type = 'user/editUserRoles';
    if (toEditAction.roles && toEditAction.roles.length > 0) {
      type = 'teamControl/editMember';
    }
    dispatch({
      type,
      payload: {
        enterprise_id: eid,
        team_name: toEditAction.team_name,
        user_id: userInfo && userInfo.user_id,
        role_ids: data.role_ids
      },
      callback: () => {
        this.getEnterpriseTeams();
        notification.success({ message: formatMessage({id:'notification.success.setting_successfully'}) });
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
    const { list, Loading, toEditAction, editRoleLoading } = this.state;
    const th = this;
    const columns = [
      {
        title: '团队名称',
        dataIndex: 'team_alias',
        rowKey: 'team_alias'
      },
      {
        title: '角色',
        dataIndex: 'roles',
        render(val) {
          return (
            <span>
              {val && val.length > 0 ? (
                val.map(item => {
                  return (
                    <span style={{ marginRight: '8px' }} key={`role${item}`}>
                      {roleUtil.actionMap(item)}
                    </span>
                  );
                })
              ) : (
                <span style={{ color: 'rgba(0,0,0,.45)' }}>尚未加入</span>
              )}
            </span>
          );
        }
      },
      {
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
              设置角色
            </a>
          );
        }
      }
    ];

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
            rowKey={(record,index) => index}
            scroll={{ y: 300 }}
            pagination={false}
            dataSource={list}
            columns={columns}
          />
        </Modal>
        {toEditAction && (
          <AddMember
            viewName="enterprise"
            title="设置角色"
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
