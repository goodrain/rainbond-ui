import { Tabs } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import BackupManage from './backup';
import Infrastructure from './infrastructure';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Management from './management';
import rainbondUtil from '../../utils/rainbond';
import pluginUtile from '../../utils/pulginUtils'
import global from '@/utils/global';
import UpdateVersion from './updateVersion';
import EnterprisePluginsPage from '../../components/EnterprisePluginsPage'
import defaultLogo from '../../../public/logo.png';
import styles from "./index.less"


const { TabPane } = Tabs;

@connect(({ user, list, loading, global, index, region }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  certificateLongin: loading.effects['global/putCertificateType'],
  objectStorageLongin: loading.effects['global/editCloudBackup'],
  overviewInfo: index.overviewInfo,
  pluginsList: global.pluginsList,
  cluster_info: region.cluster_info
}))
export default class EnterpriseSetting extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      activeKey: 'infrastructure',
      showEnterprisePlugin: false
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch, location } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
    this.isShowEnterprisePlugin()
    // 判断地址栏是否有showupdate, 存在显示版本更新列表
    if (location.query.type == 'updateVersion') {
      this.setState({ activeKey: 'updateversion' })
    }
  }
  onChange = key => {
    const { dispatch } = this.props
    const { region_name } = this.state
    this.setState({ activeKey: key });
    if (key == 'upload' || key == 'individuation' || key == 'OverMark') {
      dispatch(routerRedux.push(`/enterprise/${global.getCurrEnterpriseId()}/setting?regionName=${region_name}`));
    }
  };

  isShowEnterprisePlugin = () => {
    const { dispatch, cluster_info } = this.props;
    (cluster_info || []).forEach(item => {
      dispatch({
        type: 'global/getPluginList',
        payload: { enterprise_id: global.getCurrEnterpriseId(), region_name: item.region_name },
        callback: (res) => {
          if (res && res.list) {
            const showEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(res.list)
            if (showEnterprisePlugin) {
              this.setState({
                showEnterprisePlugin: true,
                region_name: item.region_name
              })
            }
          }
        },
        handleError: () => {
          this.setState({ plugins: {}, loading: false });
        },
      });
    })

  }

  handlePlatformBasicInfo = () => {
    const {
      match: {
        params: { eid }
      },
      rainbondInfo,
      enterprise,
      objectStorageLongin
    } = this.props
    let infos = {};
    if (rainbondInfo) {
      const fetchLogo = (rainbondInfo?.disable_logo
        ? rainbondInfo.logo.value
        : rainbondUtil.fetchLogo(rainbondInfo, enterprise)) || defaultLogo;
      const fetchFavicon = rainbondInfo?.disable_logo
        ? rainbondInfo.favicon.value
        : rainbondUtil.fetchFavicon(rainbondInfo);

      const title =
        (rainbondInfo && rainbondInfo.title && rainbondInfo.title.value) || (rainbondInfo.diy_customer == 'rainbond' ? '云原生应用管理平台' : '煤科云PaaS平台');
      const enterpriseTitle =
        (enterprise && enterprise.enterprise_alias) ||
        (rainbondInfo && rainbondInfo.enterprise_alias);
      const doc_url = rainbondUtil.documentPlatform_url(enterprise);
      const officialDemo = rainbondUtil.officialDemoEnable(enterprise);
      const footer = rainbondInfo.footer && rainbondInfo.footer.value || '';
      const showSecurityRestrictions = rainbondInfo?.security_restrictions?.enable
      // eslint-disable-next-line no-const-assign
      infos = {
        logo: fetchLogo,
        title,
        doc_url,
        officialDemo,
        enterprise_alias: enterpriseTitle,
        favicon: fetchFavicon,
        footer,
        showSecurityRestrictions
      };
    }
    return infos
  }

  render() {
    const { adminer, activeKey, showEnterprisePlugin } = this.state;
    const {
      match: {
        params: { eid }
      },
      rainbondInfo,
      enterprise,
      objectStorageLongin,
    } = this.props

    return (
      <PageHeaderLayout
        title={<FormattedMessage id='enterpriseSetting.PageHeaderLayout.title' />}
        content={<FormattedMessage id='enterpriseSetting.PageHeaderLayout.content' />}
        titleSvg={pageheaderSvg.getPageHeaderSvg("setting", 18)}
        isContent={true}
      >
        <Tabs
          onChange={this.onChange}
          activeKey={activeKey}
          type="card"
          className={styles.tabBarStyle}
          destroyInactiveTabPane
        >
          <TabPane
            tab={
              <div>
                <FormattedMessage id='enterpriseSetting.TabPane.basicsSetting' />
              </div>
            }
            key="infrastructure"
          >
            <Infrastructure {...this.props} />
          </TabPane>
          {adminer && (
            <TabPane
              tab={
                <div>
                  <FormattedMessage id='enterpriseSetting.TabPane.enterpriseAdmin' />
                </div>
              }
              key="management">
              <Management {...this.props} />
            </TabPane>
          )}
          {showEnterprisePlugin &&
            <TabPane
              tab={<div>
                <FormattedMessage id='enterpriseSetting.TabPane.individuation' />
              </div>}
              key="individuation"
            >
              <EnterprisePluginsPage
                key="Customization"
                type="Customization"
                componentData={{ eid: eid, loading: objectStorageLongin, data: this.handlePlatformBasicInfo() }
                }
              />
            </TabPane>
          }
          {adminer && (
            <TabPane
              tab={
                <div>
                  <FormattedMessage id='enterpriseSetting.TabPane.dataBackups' />
                </div>
              }
              key="backup"
            >
              <BackupManage {...this.props} />
            </TabPane>
          )}
          {/* <TabPane
            tab={
              <div>
                <FormattedMessage id='enterpriseSetting.TabPane.mirrorWarehouse' />
              </div>
            }
            key="image"
          >
            <ImageWarehouse {...this.props} />
          </TabPane> */}
          {showEnterprisePlugin && (
            <TabPane
              tab={
                <div>
                  <FormattedMessage id='enterpriseSetting.TabPane.upload' />
                </div>
              }
              key="upload">
              <EnterprisePluginsPage type="PackageUpload" key="PackageUpload" />
            </TabPane>
          )}
          {showEnterprisePlugin &&
            <TabPane
              tab={<div>
                超分比例
              </div>}
              key="OverMark"
            >
              <EnterprisePluginsPage
                key="OverMark"
                type="OverMark"
                componentData={{ eid: eid, loading: objectStorageLongin, data: this.handlePlatformBasicInfo() }
                }
              />
            </TabPane>
          }
          <TabPane
            tab={
              <div>
                <FormattedMessage id='enterpriseSetting.TabPane.updateVersion' />
              </div>
            }
            key="updateversion"
          >
            <UpdateVersion {...this.props} />
          </TabPane>
        </Tabs>
      </PageHeaderLayout>
    );
  }
}
