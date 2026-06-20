/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import { Card, Col, Modal, notification, Row, Spin, Switch } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import ImageHubForm from '../../components/ImageHubForm';
import ImageWarehouse from './imageWarehouse';
import SmsConfigForm from '../../components/SmsConfigForm';
import ScrollerX from '../../components/ScrollerX';
import rainbondUtil from '../../utils/rainbond';
import styles from './index.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import OauthTable from './oauthTable';

@connect(({ loading, global }) => ({
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  imageHubLongin: loading.effects['global/editImageHub'],
  resourceViewUpdating: loading.effects['global/updatePlatformSettings'],
}))
class Infrastructure extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise } = this.props;
    this.state = {
      enterpriseAdminLoading: false,
      showDeleteDomain: false,
      closeImageHub: false,
      openImageHub: false,
      israinbondTird: rainbondUtil.OauthEnterpriseEnable(enterprise),
      isEnableAppstoreImageHub: rainbondUtil.isEnableAppstoreImageHub(enterprise),
      AppstoreImageHubValue: rainbondUtil.fetchAppstoreImageHub(enterprise),
      openSmsConfig: false,
      openGlobalImageHub: false,
      globalImageHubList: [],
      globalImageHubLoading: false,
      pendingEnableGlobalImageHub: false,
      smsConfig: null
    };
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/getIsRegist'
    });
    this.fetchSmsConfig();
    this.fetchGlobalImageHub();
    this.fetchPlatformSettings();
  }

  onRegistChange = checked => {
    this.props.dispatch({
      type: 'global/putIsRegist',
      payload: {
        isRegist: checked
      }
    });
  };

  handlChooseeOpen = () => {
    const { israinbondTird } = this.state;
    israinbondTird ? this.handleOpenDomain() : this.handelIsOpen(true);
  };

  handleOpenDomain = () => {
    this.setState({
      showDeleteDomain: true
    });
  };

  handelIsOpen = enable => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/editOauth',
      payload: {
        arr: { enable, value: null }
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: enable ? formatMessage({id:'notification.success.Oauth2'}) : formatMessage({id:'notification.success.close'})
          });
          this.fetchEnterpriseInfo();
        }
      }
    });
  };

  handelIsOpenImageHub = (enable, value) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { AppstoreImageHubValue, isEnableAppstoreImageHub } = this.state;
    const params = value || AppstoreImageHubValue || {};
    dispatch({
      type: 'global/editImageHub',
      payload: {
        enterprise_id: eid,
        enable,
        hub_url: params.hub_url,
        namespace: params.namespace,
        hub_user: params.hub_user,
        hub_password: params.hub_password
      },

      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: !isEnableAppstoreImageHub
              ? formatMessage({id:'notification.success.opened_successfully'})
              : enable && value
              ? formatMessage({id:'notification.success.change'})
              : formatMessage({id:'notification.success.close'})
          });
          this.fetchEnterpriseInfo();
          this.handelCloseImageHub();
        }
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
      },
      callback: info => {
        if (info) {
          this.setState({
            israinbondTird: rainbondUtil.OauthEnterpriseEnable(info.bean),
            isEnableAppstoreImageHub: rainbondUtil.isEnableAppstoreImageHub(info.bean),
            AppstoreImageHubValue: rainbondUtil.fetchAppstoreImageHub(info.bean)
          });
        }
      }
    });
    dispatch({ type: 'user/fetchCurrent' });
    this.handelClone();
  };

  handelClone = () => {
    this.setState({
      showDeleteDomain: false
    });
  };
  handelOpenCloseImageHub = () => {
    this.setState({ closeImageHub: true });
  };
  handelOpenImageHub = () => {
    this.setState({ openImageHub: true });
  };
  handelCloseImageHub = () => {
    this.setState({ closeImageHub: false, openImageHub: false });
  };
  handelOpenGlobalImageHub = () => {
    this.setState({ openGlobalImageHub: true });
  };
  handelCloseGlobalImageHub = () => {
    this.setState({ openGlobalImageHub: false, pendingEnableGlobalImageHub: false });
    this.fetchGlobalImageHub();
  };
  handelOpenSmsConfig = () => {
    this.setState({ openSmsConfig: true });
  };
  handelCloseSmsConfig = () => {
    this.setState({ openSmsConfig: false });
  };
  // 获取短信配置
  fetchSmsConfig = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/getSmsConfig',
      payload: {
        enterprise_id: eid
      },
      callback: (res) => {
        this.setState({
          smsConfig: res.bean
        })
      }
    })
  }

  fetchGlobalImageHub = callback => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    this.setState({ globalImageHubLoading: true });
    dispatch({
      type: 'global/fetchEnterpriseImageHub',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        const list = res && res.list ? res.list : [];
        this.setState({
          globalImageHubList: list,
          globalImageHubLoading: false
        }, () => {
          if (callback) {
            callback(list);
          }
        });
      },
      handleError: () => {
        this.setState({ globalImageHubLoading: false });
      }
    });
  };

  fetchPlatformSettings = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/fetchPlatformSettings',
      payload: { eid }
    });
  };

  handelIsOpenGlobalImageHub = enable => {
    const { globalImageHubList } = this.state;
    if (enable && (!globalImageHubList || !globalImageHubList.length)) {
      this.setState({
        openGlobalImageHub: true,
        pendingEnableGlobalImageHub: true
      });
      return;
    }
    this.updateGlobalImageHubStatus(enable);
  };

  updateGlobalImageHubStatus = enable => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/updatePlatformSettings',
      payload: { eid, enable_global_image_registry: enable },
      callback: () => {
        notification.success({
          message: enable
            ? formatMessage({ id: 'notification.success.opened_successfully' })
            : formatMessage({ id: 'notification.success.close' })
        });
      }
    });
  };

  handleGlobalImageHubChange = action => {
    const { pendingEnableGlobalImageHub } = this.state;
    const { enterprise } = this.props;
    this.fetchGlobalImageHub(list => {
      if (action === 'add' && pendingEnableGlobalImageHub && list.length) {
        this.setState({ pendingEnableGlobalImageHub: false });
        this.updateGlobalImageHubStatus(true);
      }
      if (action === 'delete' && !list.length && enterprise && enterprise.enable_global_image_registry) {
        this.updateGlobalImageHubStatus(false);
      }
    });
  };

  onResourceViewChange = checked => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/updatePlatformSettings',
      payload: { eid, enable_team_resource_view: checked },
      callback: () => {
        notification.success({
          message: checked
            ? formatMessage({ id: 'notification.success.opened_successfully' })
            : formatMessage({ id: 'notification.success.close' })
        });
      }
    });
  };

  // 更新短信配置
  handelIsOpenSmsConfig = (enable, value) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/updateSmsConfig',
      payload: {
        enterprise_id: eid,
        sms_config: {
          enable,
          value
        }
      },
      callback: (res) => {
        if (res && res.status_code === 200) {
          this.fetchSmsConfig()
          this.handelCloseSmsConfig()
          notification.success({
            message: res.msg_show
          })
        }
      }
    })
  }
  render() {
    const {
      oauthLongin,
      imageHubLongin,
      rainbondInfo,
      enterprise,
      resourceViewUpdating,
      match: {
        params: { eid }
      }
    } = this.props;
    const isSaas = rainbondInfo && rainbondInfo.is_saas || false;
    const enableTeamResourceView = !!(enterprise && enterprise.enable_team_resource_view);
    const {
      enterpriseAdminLoading,
      showDeleteDomain,
      israinbondTird,
      isEnableAppstoreImageHub,
      AppstoreImageHubValue,
      openOauthTable,
      openImageHub,
      closeImageHub,
      openSmsConfig,
      openGlobalImageHub,
      globalImageHubList,
      globalImageHubLoading,
      smsConfig
    } = this.state;
    const isEnableGlobalImageHub = !!(enterprise && enterprise.enable_global_image_registry);
    const hasGlobalImageHubConfig = !!(globalImageHubList && globalImageHubList.length);
    const UserRegistered = (
      <Card
        hoverable
        bordered={false}
        className={styles.infrastructureCard}
      >
        <Row type="flex" align="middle">
          <Col span={3}>
            {/* 用户注册 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.login.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {/* 控制用户是否可以注册功能。 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.login.content'/>
            </span>
          </Col>

          <Col span={4} style={{ textAlign: 'right' }}>
            {this.props.isRegist && isSaas && (
              <a
                onClick={this.handelOpenSmsConfig}
                style={{ marginRight: '10px' }}
              >
                {/* 查看配置 */}
                <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
              </a>
            )}
            <Switch
              onChange={this.onRegistChange}
              // className={styles.automaTictelescopingSwitch}
              checked={this.props.isRegist}
            />
          </Col>
        </Row>
      </Card>
    );
    const Oauth = (
      <div>
        <Card
          hoverable
          bordered={false}
          className={styles.infrastructureCard}
        >
          <Row type="flex" align="middle">
            <Col span={3}>
              {/* Oauth 第三方服务集成 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.serve.title'/>
            </Col>
            <Col span={17}>
              <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                {/* 支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目。支持钉钉、Aliyun等服务进行第三方登录认证。 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.serve.content'/>
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
                  {/* 查看配置 */}
                  <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
                </a>
              )}
              <Switch
                onChange={this.handlChooseeOpen}
                checked={israinbondTird}
                // className={styles.automaTictelescopingSwitch}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
    const MirrorWarehouseInformation = (
      <Card hoverable bordered={false}  className={styles.infrastructureCard}>
        <Row type="flex" align="middle">
          <Col span={3}>
            {/* 内部组件库镜像仓库 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.mirroring.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {/* 用于存储发布到组件库的应用模型镜像，其需要能被所有集群访问。 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.mirroring.content'/>
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {isEnableAppstoreImageHub && (
              <a
                onClick={this.handelOpenImageHub}
                style={{ marginRight: '10px' }}
              >
                {/* 查看配置 */}
                <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
              </a>
            )}

            <Switch
              onChange={() => {
                isEnableAppstoreImageHub
                  ? this.handelOpenCloseImageHub()
                  : this.handelOpenImageHub();
              }}
              checked={isEnableAppstoreImageHub}
              // className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );
    const GlobalImageWarehouseInformation = (
      <Card hoverable bordered={false} className={styles.infrastructureCard}>
        <Row type="flex" align="middle">
          <Col span={3}>
            <FormattedMessage id='enterpriseSetting.basicsSetting.globalImageRegistry.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              <FormattedMessage id='enterpriseSetting.basicsSetting.globalImageRegistry.content'/>
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {(isEnableGlobalImageHub || hasGlobalImageHubConfig) && (
              <a
                onClick={this.handelOpenGlobalImageHub}
                style={{ marginRight: '10px' }}
              >
                <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
              </a>
            )}
            <Switch
              onChange={this.handelIsOpenGlobalImageHub}
              checked={isEnableGlobalImageHub}
              loading={resourceViewUpdating || globalImageHubLoading}
            />
          </Col>
        </Row>
      </Card>
    );
    const TeamResourceView = (
      <Card hoverable bordered={false} className={styles.infrastructureCard}>
        <Row type="flex" align="middle">
          <Col span={3}>团队 K8S 原生资源</Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              开启后，团队视图侧边菜单将显示"K8S 原生资源"入口，团队成员可查看该团队的资源使用情况。
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Switch
              onChange={this.onResourceViewChange}
              checked={enableTeamResourceView}
              loading={resourceViewUpdating}
            />
          </Col>
        </Row>
      </Card>
    );
    return (
      <Fragment>
        {openSmsConfig && (
          <SmsConfigForm
            eid={eid}
            onCancel={this.handelCloseSmsConfig}
            data={smsConfig?.sms_config.value}
            onOk={values => {
              this.handelIsOpenSmsConfig(true, values);
            }}
          />
        )}
        {openImageHub && (
          <ImageHubForm
            eid={eid}
            title={
              !isEnableAppstoreImageHub
                ? formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.modal.title'})
                : formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.modal.comp_title'})
            }
            loading={imageHubLongin}
            onCancel={this.handelCloseImageHub}
            data={AppstoreImageHubValue}
            onOk={values => {
              this.handelIsOpenImageHub(true, values);
            }}
          />
        )}
        {openGlobalImageHub && (
          <Modal
            title={formatMessage({ id: 'enterpriseSetting.basicsSetting.globalImageRegistry.title' })}
            visible
            width={960}
            footer={null}
            onCancel={this.handelCloseGlobalImageHub}
            destroyOnClose
          >
            <ImageWarehouse
              mode="enterprise"
              enterpriseId={eid}
              onChange={this.handleGlobalImageHubChange}
            />
          </Modal>
        )}
        {(closeImageHub || showDeleteDomain) && (
          <ConfirmModal
            loading={closeImageHub ? imageHubLongin : oauthLongin}
            title={formatMessage({ id: 'confirmModal.close.delete.title' })}
            desc={
              closeImageHub
                ? formatMessage({ id: 'confirmModal.delete.component_ibrary_mirror.desc' })
                : formatMessage({ id: 'confirmModal.delete.Oauth.desc' })
            }
            onOk={() => {
              closeImageHub
                ? this.handelIsOpenImageHub(false)
                : this.handelIsOpen(false);
            }}
            onCancel={() => {
              closeImageHub
                ? this.handelCloseImageHub()
                : this.handelClone();
            }}
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
        {enterpriseAdminLoading ? (
          <div className={styles.example}>
            <Spin />
          </div>
        ) : (
          <div>
            {UserRegistered}
            {Oauth}
            {MirrorWarehouseInformation}
            {GlobalImageWarehouseInformation}
            {TeamResourceView}
          </div>
        )}
      </Fragment>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
@connect(({ global }) => ({
  enterprise: global.enterprise
}))
export default class Index extends PureComponent {
  render() {
    const { enterprise } = this.props;
    if (enterprise) {
      return (
        <ScrollerX sm={840}>
          <Infrastructure {...this.props} />
        </ScrollerX>
      );
    }
    return null;
  }
}
