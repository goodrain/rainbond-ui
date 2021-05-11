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
import PlatformBasicInformationForm from '../../components/PlatformBasicInformationForm';
import rainbondUtil from '../../utils/rainbond';
import styles from './index.less';
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
  objectStorageLongin: loading.effects['global/editCloudBackup'],
  overviewInfo: index.overviewInfo
}))
class Infrastructure extends PureComponent {
  constructor(props) {
    super(props);
    const { enterprise } = this.props;
    this.state = {
      enterpriseAdminLoading: false,
      showDeleteDomain: false,
      openCertificate: false,
      closeCertificate: false,
      closeImageHub: false,
      openImageHub: false,
      openCloudBackup: false,
      closeCloudBackup: false,
      openBasicInformation: false,
      israinbondTird: rainbondUtil.OauthEnterpriseEnable(enterprise),
      isEnableAppstoreImageHub: rainbondUtil.isEnableAppstoreImageHub(
        enterprise
      ),
      AppstoreImageHubValue: rainbondUtil.fetchAppstoreImageHub(enterprise),
      isEnableObjectStorage: rainbondUtil.isEnableObjectStorage(enterprise),
      ObjectStorageValue: rainbondUtil.fetchObjectStorage(enterprise),
      providers: [
        { key: 'alioss', name: '阿里云对象存储' },
        { key: 's3', name: 'S3' }
      ]
    };
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/getIsRegist'
    });
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
            message: enable ? '开启Oauth2.0认证' : '关闭成功'
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
              ? '开通成功'
              : enable && value
              ? '修改成功'
              : '关闭成功'
          });
          this.fetchEnterpriseInfo();
          this.handelCloseImageHub();
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
              ? '开通成功'
              : enable && value
              ? '修改成功'
              : '关闭成功'
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
  handelCloseCloudBackup = () => {
    this.setState({ closeCloudBackup: false, openCloudBackup: false });
  };
  handelOpenBasicInformation = () => {
    this.setState({ openBasicInformation: true });
  };
  handelCloseBasicInformation = () => {
    this.setState({ openBasicInformation: false });
  };
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
    });
  };
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
              ? '关闭成功'
              : !AutomaticCertificate
              ? '开通成功'
              : '编辑成功'
          });
          this.fetchEnterpriseInfo();
        }
      }
    });
  };

  isJSON = str => {
    const clues = () => {
      notification.warning({
        message: '格式错误、请输入正确的JSON格式'
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
      imageHubLongin,
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

      // eslint-disable-next-line no-const-assign
      infos = {
        logo: fetchLogo,
        title,
        doc_url,
        enterprise_alias: enterpriseTitle,
        favicon: fetchFavicon
      };
    }
    const enterpriseEdition = rainbondUtil.isEnterpriseEdition(rainbondInfo);

    const {
      enterpriseAdminLoading,
      showDeleteDomain,
      israinbondTird,
      isEnableAppstoreImageHub,
      AppstoreImageHubValue,
      isEnableObjectStorage,
      ObjectStorageValue,
      openCertificate,
      closeCertificate,
      openOauthTable,
      openImageHub,
      closeImageHub,
      openCloudBackup,
      closeCloudBackup,
      providers,
      openBasicInformation
    } = this.state;
    const UserRegistered = (
      <Card
        hoverable
        bordered={false}
        style={{ borderTop: enterpriseEdition ? '1px solid  #ccc' : 'none' }}
      >
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
    );
    const Oauth = (
      <div>
        <Card
          style={{ borderTop: '1px solid  #ccc' }}
          hoverable
          bordered={false}
        >
          <Row type="flex" align="middle">
            <Col span={3}>Oauth 第三方服务集成</Col>
            <Col span={17}>
              <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                支持Github、Gitlab、码云等多种第三方OAuth服务，用户互联后可获取仓库项目。支持钉钉、Aliyun等服务进行第三方登录认证。
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
      <Card hoverable bordered={false} style={{ borderTop: '1px solid  #ccc' }}>
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

    const MirrorWarehouseInformation = (
      <Card hoverable bordered={false} style={{ borderTop: '1px solid  #ccc' }}>
        <Row type="flex" align="middle">
          <Col span={3}>内部组件库镜像仓库</Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              用于存储发布到组件库的应用模型镜像，其需要能被所有集群访问。
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {isEnableAppstoreImageHub && (
              <a
                onClick={this.handelOpenImageHub}
                style={{ marginRight: '10px' }}
              >
                查看配置
              </a>
            )}

            <Switch
              onChange={() => {
                isEnableAppstoreImageHub
                  ? this.handelOpenCloseImageHub()
                  : this.handelOpenImageHub();
              }}
              checked={isEnableAppstoreImageHub}
              className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );
    const CloudBackup = (
      <Card hoverable bordered={false} style={{ borderTop: '1px solid  #ccc' }}>
        <Row type="flex" align="middle">
          <Col span={3}>对象存储</Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              对象存储用于云端备份功能，存储应用的备份文件
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {isEnableObjectStorage && (
              <a
                onClick={this.handelOpenCloudBackup}
                style={{ marginRight: '10px' }}
              >
                查看配置
              </a>
            )}

            <Switch
              onChange={() => {
                isEnableObjectStorage
                  ? this.handelOpenCloseCloudBackup()
                  : this.handelOpenCloudBackup();
              }}
              checked={isEnableObjectStorage}
              className={styles.automaTictelescopingSwitch}
            />
          </Col>
        </Row>
      </Card>
    );

    const BasicInformation = (
      <Card style={{ marginTop: '10px' }} hoverable bordered={false}>
        <Row type="flex" align="middle">
          <Col span={3}>基础信息</Col>
          <Col span={17}>
            <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              可以修改网站的标题、企业名称、LOGO、网页图标
            </span>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <a
              onClick={this.handelOpenBasicInformation}
              style={{ marginRight: '10px' }}
            >
              查看配置
            </a>
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
        {openImageHub && (
          <ImageHubForm
            eid={eid}
            title={
              !isEnableAppstoreImageHub
                ? '开通组件库镜像仓库'
                : '组件库镜像仓库'
            }
            loading={imageHubLongin}
            onCancel={this.handelCloseImageHub}
            data={AppstoreImageHubValue}
            onOk={values => {
              this.handelIsOpenImageHub(true, values);
            }}
          />
        )}
        {openCloudBackup && (
          <CloudBackupForm
            eid={eid}
            title={!isEnableObjectStorage ? '配置云端备份对象存储' : '对象存储'}
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
            title="基础信息"
            eid={eid}
            loading={objectStorageLongin}
            data={infos}
            onCancel={this.handelCloseBasicInformation}
            onOk={this.handelIsOpenBasicInformation}
          />
        )}

        {(closeImageHub ||
          closeCertificate ||
          showDeleteDomain ||
          closeCloudBackup) && (
          <ConfirmModal
            loading={
              closeImageHub
                ? imageHubLongin
                : closeCertificate
                ? certificateLongin
                : showDeleteDomain
                ? oauthLongin
                : closeCloudBackup
                ? objectStorageLongin
                : false
            }
            title="关闭"
            desc={
              closeImageHub
                ? '确定要关闭组件库镜像仓库？'
                : closeCertificate
                ? '确定要关闭自动签发证书？'
                : showDeleteDomain
                ? '确定要关闭Oauth2.0认证？'
                : closeCloudBackup
                ? '确定要关闭对象存储？'
                : ''
            }
            onOk={() => {
              closeImageHub
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
              closeImageHub
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
          <div>
            {enterpriseEdition && BasicInformation}
            {UserRegistered}
            {AutomaticIssueCertificate}
            {Oauth}
            {MirrorWarehouseInformation}
            {CloudBackup}
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
      return <Infrastructure {...this.props} />;
    }
    return null;
  }
}
