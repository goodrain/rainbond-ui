import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Col,
  Row,
  Menu,
  Dropdown,
  Icon,
  Spin,
  notification,
  Tabs,
  Switch,
  Empty,
} from 'antd';
import { routerRedux } from 'dva/router';
import userUtil from '../../utils/user';
import rainbondUtil from '../../utils/rainbond';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import AddAdmin from '../../components/AddAdmin';
import CertificateForm from '../../components/CertificateForm';
import OauthTable from './oauthTable';
import ConfirmModal from '../../components/ConfirmModal';
import styles from './index.less';
import OauthForm from '../../components/OauthForm';

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  certificateLongin: loading.effects['global/putCertificateType'],
  overviewInfo: index.overviewInfo,
}))
export default class EnterpriseSetting extends PureComponent {
  constructor(props) {
    super(props);
    const { user, rainbondInfo, enterprise } = this.props;
    const adminer =
      userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      adminList: [],
      showAddAdmin: false,
      exitAdminNameID: '',
      enterpriseAdminLoading: false,
      adminer,
      showDelTeam: false,
      showDeleteDomain: false,
      openCertificate: false,
      closeCertificate: false,
      israinbondTird: rainbondUtil.OauthEnterpriseEnable(enterprise),
    };
  }

  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    !adminer && dispatch(routerRedux.push(`/`));
    adminer && this.fetchEnterpriseInfo();
  }
  componentDidMount() {
    const { dispatch } = this.props;
    this.getEnterpriseAdmins();
    dispatch({
      type: 'global/getIsRegist',
    });
  }
  handleCreateAdmin = values => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/addEnterpriseAdminTeams',
      payload: {
        enterprise_id: eid,
        user_id: values.user_id,
      },
      callback: () => {
        notification.success({ message: '添加成功' });
        this.getEnterpriseAdmins();
        this.cancelCreateAdmin();
      },
    });
  };

  getEnterpriseAdmins = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseAdmin',
      payload: {
        enterprise_id: eid,
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            adminList: res.list,
            enterpriseAdminLoading: false,
          });
        }
      },
    });
  };

  onAddAdmin = () => {
    this.setState({ showAddAdmin: true });
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
        user_id: exitAdminNameID,
      },
      callback: () => {
        notification.success({ message: '删除成功' });
        this.getEnterpriseAdmins();
        this.hideDelAdmin();
      },
    });
  };

  onRegistChange = checked => {
    this.props.dispatch({
      type: 'global/putIsRegist',
      payload: {
        isRegist: checked,
      },
    });
  };

  handlChooseeOpen = () => {
    const { israinbondTird } = this.state;
    israinbondTird ? this.handleOpenDomain() : this.handelIsOpen(true);
  };

  handleOpenDomain = () => {
    this.setState({
      showDeleteDomain: true,
    });
  };

  handelIsOpen = enable => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/editOauth',
      payload: {
        arr: { enable, value: null },
      },
      callback: res => {
        if (res && res._code === 200) {
          notification.success({
            message: enable ? '开启Oauth2.0认证' : '关闭成功',
          });
          this.fetchEnterpriseInfo();
        }
      },
    });
  };

  fetchEnterpriseInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid },
      },
    } = this.props;
    const { openCertificate, closeCertificate } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid,
      },
      callback: info => {
        if (info && !openCertificate && !closeCertificate) {
          this.setState({
            israinbondTird: rainbondUtil.OauthEnterpriseEnable(info.bean),
          });
        }
      },
    });
    if (openCertificate || closeCertificate) {
      this.handelCloseCertificate();
      return null;
    }
    dispatch({ type: 'user/fetchCurrent' });
    this.handelClone();
  };

  handelClone = () => {
    this.setState({
      showDeleteDomain: false,
    });
  };
  handelOpenCertificate = () => {
    this.setState({ openCertificate: true });
  };
  handelOpenCloseCertificate = () => {
    this.setState({ closeCertificate: true });
  };
  handelCloseCertificate = () => {
    this.setState({ closeCertificate: false, openCertificate: false });
  };

  createClusters = values => {
    const {
      onOk,
      dispatch,
      enterprise,
      match: {
        params: { eid },
      },
    } = this.props;

    const AutomaticCertificate = rainbondUtil.CertificateIssuedByEnable(
      enterprise
    );
    if (values && values.auto_ssl_config) {
      if (!this.isJSON(values.auto_ssl_config)) {
        return null;
      }
    }

    dispatch({
      type: 'global/putCertificateType',
      payload: {
        enterprise_id: eid,
        auto_ssl: {
          enable: !!values,
          value: values ? values.auto_ssl_config : false,
        },
      },
      callback: res => {
        if (res && res._condition === 200) {
          notification.success({
            message: !values
              ? '关闭成功'
              : !AutomaticCertificate
              ? '开通成功'
              : '编辑成功',
          });
          this.fetchEnterpriseInfo();
        }
      },
    });
  };

  isJSON = str => {
    const clues = () => {
      notification.warning({
        message: '格式错误、请输入正确的JSON格式',
      });
    };
    if (typeof str === 'string') {
      try {
        const obj = JSON.parse(str);
        if (typeof obj === 'object' && obj) {
          return true;
        }
        clues();
        return false;
      } catch (e) {
        clues();
        return false;
      }
    }
    clues();
    return false;
  };

  render() {
    const {
      enterprise,
      oauthLongin,
      certificateLongin,
      match: {
        params: { eid },
      },
    } = this.props;

    const {
      adminList,
      enterpriseAdminLoading,
      adminer,
      showDeleteDomain,
      israinbondTird,
      openCertificate,
      closeCertificate,
      openOauthTable,
      showAddAdmin,
      showDelTeam,
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
      <Col span={4} style={{ textAlign: 'right' }}>
        {adminer && (
          <Button
            type="primary"
            onClick={this.onAddAdmin}
            className={styles.btns}
          >
            添加管理员
          </Button>
        )}
      </Col>
    );
    const managementAdmin = (
      <div style={{ marginTop: '20px' }}>
        <Row>
          <Col span={20} className={styles.teamsTit}>
            企业管理员管理
          </Col>
          {operation}
        </Row>
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

    const userRegistered = (
      <div>
        <Row>
          <Col span={20} className={styles.teamsTit}>
            基础设置
          </Col>
        </Row>
        <Card style={{ marginTop: '10px' }} hoverable bordered={false}>
          <Row type="flex" align="middle">
            <Col span={3}>用户注册</Col>
            <Col span={17}>
              <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                控制用户是否可以注册功能
              </span>
            </Col>

            <Col span={4} style={{ textAlign: 'right' }}>
              <Switch
                onChange={this.onRegistChange}
                className={styles.automaTictelescopingSwitch}
                checked={this.props.isRegist}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );

    const oauth = (
      <div>
        <Card
          style={{ borderTop: '1px solid  #ccc' }}
          hoverable
          bordered={false}
        >
          <Row type="flex" align="middle">
            <Col span={3}>Oauth互联</Col>
            <Col span={17}>
              <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目。
              </span>
            </Col>
            <Col span={4} style={{ textAlign: 'right' }}>
              {israinbondTird && (
                <a
                  onClick={() => {
                    this.setState({ openOauthTable: true });
                  }}
                  style={{ marginRight: '10px' }}
                >
                  查看配置
                </a>
              )}
              <Switch
                onChange={this.handlChooseeOpen}
                checked={israinbondTird}
                className={styles.automaTictelescopingSwitch}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
    const AutomaticCertificate = rainbondUtil.CertificateIssuedByEnable(
      enterprise
    );
    const AutomaticIssueCertificate = (
      <Card hoverable bordered={false}  style={{ borderTop: '1px solid  #ccc' }}>
        <Row type="flex" align="middle">
          <Col span={3}>自动签发证书</Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              这是一个外部扩充功能，实现网关策略所需证书的自动签发。
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {AutomaticCertificate && (
              <a
                onClick={this.handelOpenCertificate}
                style={{ marginRight: '10px' }}
              >
                查看配置
              </a>
            )}

            <Switch
              onChange={() => {
                AutomaticCertificate
                  ? this.handelOpenCloseCertificate()
                  : this.handelOpenCertificate();
              }}
              checked={AutomaticCertificate}
              className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );

    return (
      <PageHeaderLayout
        title="企业设置"
        content="支持用户注册、Oauth2.0集成等企业设置功能，更丰富的企业管理资源管理功能在企业资源管理平台提供"
      >
        {openCertificate && (
          <CertificateForm
            eid={eid}
            AutomaticCertificate={AutomaticCertificate}
            loading={certificateLongin}
            onCancel={this.handelCloseCertificate}
            onOk={values => {
              this.createClusters(values);
            }}
          />
        )}

        {closeCertificate && (
          <ConfirmModal
            loading={certificateLongin}
            title="关闭"
            desc="确定要关闭自动签发证书？"
            onOk={() => {
              this.createClusters(false);
            }}
            onCancel={this.handelCloseCertificate}
          />
        )}

        {openOauthTable && (
          <OauthTable
            eid={eid}
            onOk={() => {
              this.setState({ openOauthTable: false });
            }}
            onCancel={() => {
              this.setState({ openOauthTable: false });
            }}
          />
        )}
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

        {showDeleteDomain && (
          <ConfirmModal
            loading={oauthLongin}
            title="关闭"
            desc="确定要关闭Oauth2.0认证？"
            onOk={() => {
              this.handelIsOpen(false);
            }}
            onCancel={this.handelClone}
          />
        )}

        {enterpriseAdminLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>
            {userRegistered}
            {AutomaticIssueCertificate}
            {oauth}
            {adminer && managementAdmin}
          </div>
        )}
      </PageHeaderLayout>
    );
  }
}
