import roleUtil from '@/utils/role';
import userUtil from '@/utils/user';
import { Button, notification, Spin, Table } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { PureComponent } from 'react';
import AddAdmin from '../../components/AddAdmin';
import ConfirmModal from '../../components/ConfirmModal';
import ScrollerX from '../../components/ScrollerX';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

@connect(({ user, global }) => ({
  user: user.currentUser,
  enterprise: global.enterprise,
}))
export default class Management extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      adminList: [],
      showAddAdmin: false,
      exitAdminNameID: '',
      enterpriseAdminLoading: false,
      showDelTeam: false,
      info: false
    };
  }

  componentWillMount() {
    this.fetchEnterpriseInfo();
    this.getEnterpriseAdmins();
  }
  onAddAdmin = () => {
    this.setState({ showAddAdmin: true });
  };

  getEnterpriseAdmins = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseAdmin',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            adminList: res.list,
            enterpriseAdminLoading: false
          });
        }
      }
    });
  };
  handleCreateAdmin = values => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { info } = this.state;
    if (info) {
      dispatch({
        type: 'global/editEnterpriseAdminTeams',
        payload: {
          enterprise_id: eid,
          ...values
        },
        callback: () => {
          notification.success({ message: formatMessage({ id: 'notification.success.edit' }) });
          this.getEnterpriseAdmins();
          this.cancelCreateAdmin();
        }
      });
    } else {
      dispatch({
        type: 'global/addEnterpriseAdminTeams',
        payload: {
          enterprise_id: eid,
          ...values
        },
        callback: () => {
          notification.success({ message: formatMessage({ id: 'notification.success.add' }) });
          this.getEnterpriseAdmins();
          this.cancelCreateAdmin();
        }
      });
    }
  };

  cancelCreateAdmin = () => {
    this.setState({ showAddAdmin: false, info: false });
  };

  showDelTeam = exitAdminNameID => {
    this.setState({ showDelTeam: true, exitAdminNameID });
  };

  hideDelAdmin = () => {
    this.setState({ showDelTeam: false });
  };

  handleDelAdmin = () => {
    const { exitAdminNameID } = this.state;
    this.props.dispatch({
      type: 'global/deleteEnterpriseAdmin',
      payload: {
        user_id: exitAdminNameID
      },
      callback: () => {
        notification.success({ message: formatMessage({ id: 'notification.success.delete' }) });
        this.getEnterpriseAdmins();
        this.hideDelAdmin();
      }
    });
  };

  fetchEnterpriseInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      }
    });
    dispatch({ type: 'user/fetchCurrent' });
  };

  render() {
    const {
      match: {
        params: { eid }
      },
      user
    } = this.props;
    const {
      adminList,
      enterpriseAdminLoading,
      showAddAdmin,
      showDelTeam,
      info,
      adminer
    } = this.state;
    const userId = user && user.user_id;

    const columns = [
      {
        title: formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.designation' }),
        dataIndex: 'nick_name',
        key: 'nick_name',
        width: '20%',
      },
      {
        title: formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.name' }),
        dataIndex: 'real_name',
        key: 'real_name',
        width: '20%',
      },
      {
        title: formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.role' }),
        dataIndex: 'roles',
        key: 'roles',
        width: '25%',
        render: roles => (
          roles && roles.map((item, index) => (
            <span key={index} style={{ marginRight: 5 }}>
              {roleUtil.roleMap(item)}
            </span>
          ))
        ),
      },
      {
        title: formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.time' }),
        dataIndex: 'create_time',
        key: 'create_time',
        width: '20%',
        render: text => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.operation' }),
        key: 'action',
        width: '15%',
        render: (_, record) => (
          userId !== record.user_id && (
            <a onClick={() => this.showDelTeam(record.user_id)}>
              {formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.Menu.delete' })}
            </a>
          )
        ),
      },
    ];

    return (
      <ScrollerX sm={840}>
        {showAddAdmin && (
          <AddAdmin
            eid={eid}
            info={info}
            onOk={this.handleCreateAdmin}
            onCancel={this.cancelCreateAdmin}
          />
        )}
        {showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelAdmin}
            title={formatMessage({ id: 'confirmModal.admin.delete.title' })}
            subDesc={formatMessage({ id: 'confirmModal.delete.strategy.subDesc' })}
            desc={formatMessage({ id: 'confirmModal.delete.admin.desc' })}
            onCancel={this.hideDelAdmin}
          />
        )}
        {enterpriseAdminLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div className={styles.adminContainer}>
            <div className={styles.adminHeader}>
              {adminer && (
                <Button type="primary" onClick={this.onAddAdmin} icon="plus">
                  {formatMessage({ id: 'enterpriseSetting.enterpriseAdmin.col.time.add' })}
                </Button>
              )}
            </div>
            <Table
              columns={columns}
              dataSource={adminList}
              rowKey="user_id"
              pagination={false}
            />
          </div>
        )}
      </ScrollerX>
    );
  }
}
