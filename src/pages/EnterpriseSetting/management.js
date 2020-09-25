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
import React, { Fragment, PureComponent } from 'react';
import AddAdmin from '../../components/AddAdmin';
import ConfirmModal from '../../components/ConfirmModal';
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
    this.state = {
      adminList: [],
      showAddAdmin: false,
      exitAdminNameID: '',
      enterpriseAdminLoading: false,
      showDelTeam: false
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
        if (res && res._code === 200) {
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
    dispatch({
      type: 'global/addEnterpriseAdminTeams',
      payload: {
        enterprise_id: eid,
        user_id: values.user_id
      },
      callback: () => {
        notification.success({ message: '添加成功' });
        this.getEnterpriseAdmins();
        this.cancelCreateAdmin();
      }
    });
  };

  cancelCreateAdmin = () => {
    this.setState({ showAddAdmin: false });
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
        notification.success({ message: '删除成功' });
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
      }
    } = this.props;

    const {
      adminList,
      enterpriseAdminLoading,
      showAddAdmin,
      showDelTeam
    } = this.state;

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

    const managementMenu = exitAdminNameID => {
      return (
        <Menu>
          <Menu.Item>
            <a
              href="javascript:;"
              onClick={() => {
                this.showDelTeam(exitAdminNameID);
              }}
            >
              删除管理员
            </a>
          </Menu.Item>
        </Menu>
      );
    };
    const operation = (
      <Col span={4} offset={20} style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          onClick={this.onAddAdmin}
          className={styles.btns}
        >
          添加管理员
        </Button>
      </Col>
    );
    const managementAdmin = (
      <div style={{ marginTop: '20px' }}>
        <Row>{operation}</Row>
        {adminLists && (
          <Row
            className={styles.teamMinTit}
            type="flex"
            align="middle"
            style={{ padding: ' 0 0 10px 24px' }}
          >
            <Col span={7}>名称</Col>
            <Col span={7}>姓名</Col>
            <Col span={7}>时间</Col>
          </Row>
        )}
        {adminLists ? (
          adminLists.map(item => {
            const { user_id, create_time, nick_name, real_name } = item;
            return (
              <Card
                key={user_id}
                style={{ marginBottom: '10px' }}
                bodyStyle={{ padding: 0 }}
                hoverable
              >
                <Row
                  type="flex"
                  align="middle"
                  style={{ paddingLeft: '24px', height: '70px' }}
                >
                  <Col span={7}>{nick_name}</Col>
                  <Col span={7}>{real_name}</Col>
                  <Col span={7}>{create_time}</Col>
                  <Col span={2} />
                  <Col span={1} className={styles.bor}>
                    <Dropdown
                      overlay={managementMenu(user_id)}
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
      </div>
    );

    return (
      <Fragment>
        {showAddAdmin && (
          <AddAdmin
            eid={eid}
            onOk={this.handleCreateAdmin}
            onCancel={this.cancelCreateAdmin}
          />
        )}
        {showDelTeam && (
          <ConfirmModal
            onOk={this.handleDelAdmin}
            title="删除管理员"
            subDesc="此操作不可恢复"
            desc="确定要删除此管理员吗？"
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
