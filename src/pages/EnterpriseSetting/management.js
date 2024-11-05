import roleUtil from '@/utils/role';
import userUtil from '@/utils/user';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Icon,
  Menu,
  notification,
  Row,
  Spin
} from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import AddAdmin from '../../components/AddAdmin';
import ConfirmModal from '../../components/ConfirmModal';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';
@connect(({ user, loading, global }) => ({
  user: user.currentUser,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  oauthLongin: loading.effects['global/creatOauth']
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
  handleEdit = info => {
    this.setState({ showAddAdmin: true, info });
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

    const adminLists = adminList && adminList.length > 0 && adminList;
    const moreSvg = () => (
      <svg
        t="1581212425061"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="1314"
        width="32"
        height="32"
      >
        <path
          d="M512 192m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1315"
          fill="#999999"
        />
        <path
          d="M512 512m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1316"
          fill="#999999"
        />
        <path
          d="M512 832m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"
          p-id="1317"
          fill="#999999"
        />
      </svg>
    );

    const managementMenu = item => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showDelTeam(item.user_id);
              }}
            >
              {/* 删除管理员 */}
              <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.Menu.delete' />
            </a>
          </Menu.Item>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.handleEdit(item);
              }}
            >
              {/* 编辑管理员 */}
              <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.Menu.edit' />
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    const operation = (
        <Button
          type="primary"
          onClick={this.onAddAdmin}
          icon="plus"
        >
          {/* 添加管理员 */}
          <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.time.add' />
        </Button>
    );
    const managementAdmin = (
      <Card
        extra={
          adminer && operation
        }
      >
        {adminLists && (
          <Row
            className={styles.teamMinTit}
            type="flex"
            align="middle"
            style={{ padding: 16, background: '#FAFAFA' }}
          >
            <Col span={5}>
              {/* 名称 */}
              <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.designation' />
            </Col>
            <Col span={5}>
              {/* 姓名 */}
              <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.name' />
            </Col>
            <Col span={6}>
              {/* 角色 */}
              <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.role' />
            </Col>
            <Col span={5}>
              {/* 时间 */}
              <FormattedMessage id='enterpriseSetting.enterpriseAdmin.col.time' />
            </Col>
          </Row>
        )}
        {adminLists ? (
          adminLists.map(item => {
            const {
              user_id: id,
              create_time: createTime,
              nick_name: nickName,
              real_name: realName,
              roles
            } = item;
            return (
              <Card
                key={id}
                style={{ marginBottom: '10px' }}
                bodyStyle={{ padding: 0 }}
                style={{ border: 0, borderBottom: '1px solid #F1F0F3' }}
                hoverable
              >
                <Row
                  type="flex"
                  align="middle"
                  style={{ paddingLeft: '24px', height: '70px' }}
                >
                  <Col span={5}>{nickName}</Col>
                  <Col span={5}>{realName}</Col>
                  <Col span={6}>
                    {roles.map(items => {
                      return (
                        <span style={{ marginRight: '5px' }}>
                          {roleUtil.roleMap(items)}
                        </span>
                      );
                    })}
                  </Col>
                  <Col span={5}>
                    {moment(createTime).format('YYYY-MM-DD HH:mm:ss')}
                  </Col>
                  <Col span={2} />
                  <Col span={1} className={styles.bor}>
                    <Dropdown
                      disabled={userId == id}
                      overlay={managementMenu(item)}
                      placement="bottomLeft"
                    >
                      <Icon component={moreSvg} style={{ width: '100%' }} />
                    </Dropdown>
                  </Col>
                </Row>
              </Card>
            );
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    );

    return (
      <Fragment>
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
          managementAdmin
        )}
      </Fragment>
    );
  }
}
