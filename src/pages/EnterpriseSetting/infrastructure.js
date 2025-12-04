/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
import { Card, Col, notification, Row, Spin, Switch } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import defaultLogo from '../../../public/logo.png';
import CertificateForm from '../../components/CertificateForm';
import CloudBackupForm from '../../components/CloudBackupForm';
import ConfirmModal from '../../components/ConfirmModal';
import ImageHubForm from '../../components/ImageHubForm';
import SmsConfigForm from '../../components/SmsConfigForm';
import MonitoringForm from '../../components/MonitoringForm';
import PlatformBasicInformationForm from '../../components/PlatformBasicInformationForm';
import ScrollerX from '../../components/ScrollerX';
import rainbondUtil from '../../utils/rainbond';
import styles from './index.less';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import OauthTable from './oauthTable';

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  certificateLongin: loading.effects['global/putCertificateType'],
  imageHubLongin: loading.effects['global/editImageHub'],
  monitoringLongin: loading.effects['global/editImageHub'],
  objectStorageLongin: loading.effects['global/editCloudBackup'],
  overviewInfo: index.overviewInfo,
}))
class Infrastructure extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise, rainbondInfo } = this.props;
    this.state = {
      enterpriseAdminLoading: false,
      showDeleteDomain: false,
      openCertificate: false,
      closeCertificate: false,
      closeImageHub: false,
      closeCloudStorage: false,
      openImageHub: false,
      openEnableStorage: false,
      openCloudBackup: false,
      closeCloudBackup: false,
      openBasicInformation: false,
      israinbondTird: rainbondUtil.OauthEnterpriseEnable(enterprise),
      isEnableAppstoreImageHub: rainbondUtil.isEnableAppstoreImageHub(
        enterprise
      ),
      AppstoreImageHubValue: rainbondUtil.fetchAppstoreImageHub(enterprise),
      isEnableObjectStorage: rainbondUtil.isEnableObjectStorage(enterprise),
      storageValue: {},
      isEnableStorage: false,
      ObjectStorageValue: rainbondUtil.fetchObjectStorage(enterprise),
      providers: [
        { key: 'alioss', name: '阿里云对象存储' },
        { key: 's3', name: 'S3' }
      ],
      isSwitch: rainbondInfo.is_alarm.enable || false,
      openSmsConfig: false,
      smsConfig: null
    };
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/getIsRegist'
    });
    this.fetchAlarmSwitch();
    this.fetchCloudStorage()
    this.fetchSmsConfig()
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
  // 获取云端对象存储信息
  fetchCloudStorage = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/fetchCloudStorage',
      payload: {},
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            storageValue: res?.bean?.value,
            isEnableStorage: res?.bean?.enable,
          })
        }
      }
    })
  }
  handleEditCloudStorage = (enable, value) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { storageValue, isEnableStorage } = this.state;
    const params = value || storageValue || {};
    dispatch({
      type: 'global/editCloudStorage',
      payload: {
        enable,
        ...params
      },
      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: !isEnableStorage
              ? formatMessage({id:'notification.success.opened_successfully'})
              : enable && value
              ? formatMessage({id:'notification.success.change'})
              : formatMessage({id:'notification.success.close'})
          });
          this.fetchCloudStorage();
          this.handelCloseStorage();
        }
      }
    });
  };

  handelIsOpenCloudBackup = (enable, value) => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    const { ObjectStorageValue, isEnableObjectStorage } = this.state;
    const params = value || ObjectStorageValue || {};
    dispatch({
      type: 'global/editCloudBackup',
      payload: {
        enterprise_id: eid,
        enable,
        provider: params.provider,
        endpoint: params.endpoint,
        bucket_name: params.bucket_name,
        access_key: params.access_key,
        secret_key: params.secret_key
      },

      callback: res => {
        if (res && res.status_code === 200) {
          notification.success({
            message: !isEnableObjectStorage
              ? formatMessage({id:'notification.success.opened_successfully'})
              : enable && value
              ? formatMessage({id:'notification.success.change'})
              : formatMessage({id:'notification.success.close'})
          });
          this.fetchEnterpriseInfo();
          this.handelCloseCloudBackup();
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
    const { openCertificate, closeCertificate } = this.state;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      },
      callback: info => {
        if (info && !openCertificate && !closeCertificate) {
          this.setState({
            israinbondTird: rainbondUtil.OauthEnterpriseEnable(info.bean),
            isEnableAppstoreImageHub: rainbondUtil.isEnableAppstoreImageHub(
              info.bean
            ),
            isEnableObjectStorage: rainbondUtil.isEnableObjectStorage(
              info.bean
            ),
            AppstoreImageHubValue: rainbondUtil.fetchAppstoreImageHub(
              info.bean
            ),
            ObjectStorageValue: rainbondUtil.fetchObjectStorage(info.bean)
          });
        }
      }
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
      showDeleteDomain: false
    });
  };
  handelOpenCertificate = () => {
    this.setState({ openCertificate: true });
  };
  handelOpenCloseCertificate = () => {
    this.setState({ closeCertificate: true });
  };
  handelOpenCloseImageHub = () => {
    this.setState({ closeImageHub: true });
  };
  handelOpenImageHub = () => {
    this.setState({ openImageHub: true });
  };
  handelCloseCertificate = () => {
    this.setState({ closeCertificate: false, openCertificate: false });
  };
  handelCloseImageHub = () => {
    this.setState({ closeImageHub: false, openImageHub: false });
  };

  handelOpenCloudBackup = () => {
    this.setState({ openCloudBackup: true });
  };
  handelOpenCloseCloudBackup = () => {
    this.setState({ closeCloudBackup: true });
  };
  handelOpenCloseStorage = () => {
    this.setState({ closeCloudStorage: true });
  };
  handelOpenisEnableStorage = () => {
    this.setState({ openEnableStorage: true });
  };
  handelCloseStorage = () => {
    this.setState({ closeCloudStorage: false, openEnableStorage: false });
  };
  handelCloseCloudBackup = () => {
    this.setState({ closeCloudBackup: false, openCloudBackup: false });
  };
  handelOpenBasicInformation = () => {
    this.setState({ openBasicInformation: true });
  };
  handelCloseBasicInformation = () => {
    this.setState({ openBasicInformation: false });
  };
  handelOpenSmsConfig = () => {
    this.setState({ openSmsConfig: true });
  }
  handelCloseSmsConfig = () => {
    this.setState({ openSmsConfig: false });
  }
  handelIsOpenBasicInformation = value => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/putBasicInformation',
      payload: {
        ...value,
        enterprise_id: eid
      },
      callback: () => {
        this.handelCloseBasicInformation();
        this.fetchEnterpriseInfo();
        // 初始化 获取RainbondInfo信息
        this.handleRainbondInfo()
      }
    });
  };
  handleRainbondInfo = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: info => {
        if (info) {
          const fetchFavicon = rainbondUtil.fetchFavicon(info);
          const link =
            document.querySelector("link[rel*='icon']") ||
            document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = fetchFavicon;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      }
    });
  }
  createClusters = values => {
    const {
      dispatch,
      enterprise,
      match: {
        params: { eid }
      }
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
          value: values ? values.auto_ssl_config : false
        }
      },
      callback: res => {
        if (res && res._condition === 200) {
          notification.success({
            message: !values
              ? formatMessage({id:'notification.success.close'})
              : !AutomaticCertificate
              ? formatMessage({id:'notification.success.opened_successfully'})
              : formatMessage({id:'notification.success.edit'})
          });
          this.fetchEnterpriseInfo();
        }
      }
    });
  };

  isJSON = str => {
    const clues = () => {
      notification.warning({
        message: formatMessage({id:'notification.error.json_format_failed'})
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
  isAlarmChange = checked => {
    this.props.dispatch({
      type: 'global/updateAlarmSwitch',
      payload: {
        is_alarm: checked
      },
      callback: (res) => {
        this.fetchAlarmSwitch()
        this.handleRainbondInfo()
      }
    });
  }
  fetchAlarmSwitch = () => {
    this.props.dispatch({
      type: 'global/fetchAlarmSwitch',
      callback: (res) => {
        this.setState({
          isSwitch: res.bean.is_alarm
        })
      }
    }
    );
  }
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
      enterprise,
      oauthLongin,
      certificateLongin,
      imageHubLongin,
      monitoringLongin,
      objectStorageLongin,
      rainbondInfo,
      match: {
        params: { eid }
      }
    } = this.props;
    let infos = {};
    if (rainbondInfo) {
      const fetchLogo =
        rainbondUtil.fetchLogo(rainbondInfo, enterprise) || defaultLogo;
      const fetchFavicon = rainbondUtil.fetchFavicon(enterprise);

      const title =
        rainbondInfo && rainbondInfo.title && rainbondInfo.title.value;
      const enterpriseTitle =
        (enterprise && enterprise.enterprise_alias) ||
        (rainbondInfo && rainbondInfo.enterprise_alias);
      const doc_url = rainbondUtil.documentPlatform_url(rainbondInfo);
      const officialDemo = rainbondUtil.officialDemoEnable(enterprise);
      // eslint-disable-next-line no-const-assign
      infos = {
        logo: fetchLogo,
        title,
        doc_url,
        officialDemo,
        enterprise_alias: enterpriseTitle,
        favicon: fetchFavicon
      };
    }
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);
    const isSaas = rainbondInfo && rainbondInfo.is_saas || false;
    const {
      enterpriseAdminLoading,
      showDeleteDomain,
      israinbondTird,
      isEnableAppstoreImageHub,
      AppstoreImageHubValue,
      storageValue,
      isEnableObjectStorage,
      isEnableStorage,
      ObjectStorageValue,
      openCertificate,
      closeCertificate,
      openOauthTable,
      openImageHub,
      openEnableStorage,
      closeImageHub,
      closeCloudStorage,
      openCloudBackup,
      closeCloudBackup,
      providers,
      openBasicInformation,
      isSwitch,
      openSmsConfig,
      smsConfig
    } = this.state;
    const UserRegistered = (
      <Card
        hoverable
        bordered={false}
        style={{borderRadius:0}}
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
          style={{ borderTop: '1px solid  #ccc', borderRadius:0 }}
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
    const AutomaticCertificate = rainbondUtil.CertificateIssuedByEnable(
      enterprise
    );
    const AutomaticIssueCertificate = (
      <Card
        hoverable
        bordered={false}
        style={{ borderTop: '1px solid  #ccc', borderRadius:0}}
        className={styles.infrastructureCard}
      >
        <Row type="flex" align="middle">
          <Col span={3}>
            {/* 自动签发证书 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.certificate.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {/* 这是一个外部扩充功能，实现网关策略所需证书的自动签发。 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.certificate.content'/>
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {AutomaticCertificate && (
              <a
                onClick={this.handelOpenCertificate}
                style={{ marginRight: '10px' }}
              >
                {/* 查看配置 */}
                <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
              </a>
            )}

            <Switch
              onChange={() => {
                AutomaticCertificate
                  ? this.handelOpenCloseCertificate()
                  : this.handelOpenCertificate();
              }}
              checked={AutomaticCertificate}
              // className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );

    const MirrorWarehouseInformation = (
      <Card hoverable bordered={false} style={{ borderTop: '1px solid  #ccc' ,borderRadius:0}} className={styles.infrastructureCard}>
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
    // 老对象存储
    const CloudBackup = (
      <Card hoverable bordered={false} style={{ borderTop: '1px solid  #ccc',borderRadius:0 }} className={styles.infrastructureCard}>
        <Row type="flex" align="middle">
          <Col span={3}>
            {/* 对象存储 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.storage.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {/* 对象存储用于云端备份功能，存储应用的备份文件。 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.storage.content'/>
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {isEnableObjectStorage && (
              <a
                onClick={this.handelOpenCloudBackup}
                style={{ marginRight: '10px' }}
              >
                {/* 查看配置 */}
                <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
              </a>
            )}

            <Switch
              onChange={() => {
                isEnableObjectStorage
                  ? this.handelOpenCloseCloudBackup()
                  : this.handelOpenCloudBackup();
              }}
              checked={isEnableObjectStorage}
              // className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );
    // 新对象存储
    const CloudStorage = (
      <Card hoverable bordered={false} style={{ borderTop: '1px solid  #ccc' , borderRadius:0}} className={styles.infrastructureCard} >
        <Row type="flex" align="middle">
          <Col span={3}>
            {/* 对象存储 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.storage.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {/* 对象存储用于云端备份功能，存储应用的备份文件。 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.storage.content'/>
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {isEnableStorage && (
              <a
                onClick={this.handelOpenisEnableStorage}
                style={{ marginRight: '10px' }}
              >
                {/* 查看配置 */}
                <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
              </a>
            )}

            <Switch
              onChange={() => {
                isEnableStorage
                  ? this.handelOpenCloseStorage()
                  : this.handelOpenisEnableStorage();
              }}
              checked={isEnableStorage}
              // className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );
    const verificationCode = (
      <Card 
      hoverable 
      bordered={false} 
      style={{ borderTop: '1px solid  #ccc' }}
      className={styles.infrastructureCard}
      >
        <Row type="flex" align="middle">
          <Col span={3}>
            {/* 基础信息 */}
            <FormattedMessage id='enterpriseSetting.basicsSetting.basicInformation.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {/* 可以修改网站的标题、企业名称、LOGO、网页图标。 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.basicInformation.content'/>
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <a
              onClick={this.handelOpenBasicInformation}
              style={{ marginRight: '10px' }}
            >
              {/* 查看配置 */}
              <FormattedMessage id='enterpriseSetting.basicsSetting.checkTheConfiguration'/>
            </a>
          </Col>
        </Row>
      </Card>
    );
    // 警告功能关闭开启
    const WarningFeature =(
      <Card
        hoverable
        bordered={false}
        style={{ borderTop: '1px solid  #ccc' , borderRadius:0}}
        className={styles.infrastructureCard}
      >
        <Row type="flex" align="middle">
          <Col span={3}>
            <FormattedMessage id='enterpriseSetting.basicsSetting.alarm.title'/>
          </Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              <FormattedMessage id='enterpriseSetting.basicsSetting.alarm.content'/>
            </span>
          </Col>

          <Col span={4} style={{ textAlign: 'right' }}>
            <Switch
              onChange={this.isAlarmChange}
              // className={styles.automaTictelescopingSwitch}
              checked={isSwitch}
            />
          </Col>
        </Row>
      </Card>
    );

    return (
      <Fragment>
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
        {openEnableStorage && (
          <MonitoringForm
            title={ !isEnableStorage ? formatMessage({id:'enterpriseSetting.basicsSetting.storage.modal.title'}) : formatMessage({id:'enterpriseSetting.basicsSetting.storage.title'}) }
            loading={monitoringLongin}
            onCancel={this.handelCloseStorage}
            data={storageValue}
            onOk={values => {
              this.handleEditCloudStorage(true, values);
            }}
          />
        )}
        {openCloudBackup && (
          <CloudBackupForm
            eid={eid}
            title={!isEnableObjectStorage ? formatMessage({id:'enterpriseSetting.basicsSetting.storage.modal.title'}) : formatMessage({id:'enterpriseSetting.basicsSetting.storage.title'})}
            loading={objectStorageLongin}
            onCancel={this.handelCloseCloudBackup}
            data={ObjectStorageValue}
            providers={providers}
            onOk={values => {
              this.handelIsOpenCloudBackup(true, values);
            }}
          />
        )}
        {openBasicInformation && (
          <PlatformBasicInformationForm
            title={formatMessage({id:'enterpriseSetting.basicsSetting.basicInformation.title'})}
            eid={eid}
            loading={objectStorageLongin}
            data={infos}
            onCancel={this.handelCloseBasicInformation}
            onOk={this.handelIsOpenBasicInformation}
          />
        )}

        {(closeCloudStorage ||
          closeImageHub ||
          closeCertificate ||
          showDeleteDomain ||
          closeCloudBackup) && (
          <ConfirmModal
            loading={
              closeCloudStorage
                ? monitoringLongin
                : closeImageHub
                ? imageHubLongin
                : closeCertificate
                ? certificateLongin
                : showDeleteDomain
                ? oauthLongin
                : closeCloudBackup
                ? objectStorageLongin
                : false
            }
            title={formatMessage({ id: 'confirmModal.close.delete.title' })}
            desc={
              closeCloudStorage
                ? formatMessage({ id: 'confirmModal.delete.object_storage.desc' })
                : closeImageHub
                ? formatMessage({ id: 'confirmModal.delete.component_ibrary_mirror.desc' })
                : closeCertificate
                ? formatMessage({ id: 'confirmModal.delete.automatic_issued.desc' })
                : showDeleteDomain
                ? formatMessage({ id: 'confirmModal.delete.Oauth.desc' })
                : closeCloudBackup
                ? formatMessage({ id: 'confirmModal.delete.object_storage.desc' })
                : ''
            }
            onOk={() => {
              closeCloudStorage
                ? this.handleEditCloudStorage(false)
                : closeImageHub
                ? this.handelIsOpenImageHub(false)
                : closeCertificate
                ? this.createClusters(false)
                : showDeleteDomain
                ? this.handelIsOpen(false)
                : closeCloudBackup
                ? this.handelIsOpenCloudBackup(false)
                : '';
            }}
            onCancel={() => {
              closeCloudStorage
                ? this.handelCloseStorage()
                : closeImageHub
                ? this.handelCloseImageHub()
                : closeCertificate
                ? this.handelCloseCertificate()
                : showDeleteDomain
                ? this.handelClone()
                : closeCloudBackup
                ? this.handelCloseCloudBackup()
                : '';
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
          <div style={{borderTop:'1px solid #ccc',borderBottom:'1px solid #ccc'}}>
            {/* {enterpriseEdition && BasicInformation} */}
            {UserRegistered}
            {/* {AutomaticIssueCertificate} */}
            {Oauth}
            {MirrorWarehouseInformation}
            {/* {CloudStorage} */}
            {WarningFeature}
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
