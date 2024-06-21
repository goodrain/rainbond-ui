import { Tabs } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import BackupManage from './backup';
import Infrastructure from './infrastructure';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import Management from './management';
import ImageWarehouse from './imageWarehouse';
import UpdateVersion from './updateVersion';
import styles from "./index.less"


const { TabPane } = Tabs;

@connect(({ user, list, loading, global, index }) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  oauthLongin: loading.effects['global/creatOauth'],
  certificateLongin: loading.effects['global/putCertificateType'],
  overviewInfo: index.overviewInfo
}))
export default class EnterpriseSetting extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer,
      activeKey: 'infrastructure'
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch, location } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
    if (location.query.showupdate) {
      this.setState({activeKey: 'updateversion'})
    }
  }
  onChange = key => {
    this.setState({ activeKey: key });
  };

  render() {
    const { adminer, activeKey } = this.state;
    return (
      <PageHeaderLayout
        // title="企业设置"
        title={<FormattedMessage id='enterpriseSetting.PageHeaderLayout.title'/>}
        // content="支持用户注册、Oauth2.0集成等企业设置功能，更丰富的企业管理资源管理功能在企业资源管理平台提供"
        content={<FormattedMessage id='enterpriseSetting.PageHeaderLayout.content'/>}
        titleSvg={pageheaderSvg.getSvg("settingSvg",18)}
        isContent={true} 
      >
        <Tabs 
          onChange={this.onChange} 
          activeKey={activeKey}
          type="card"
          className={styles.tabBarStyle}
          >
          <TabPane 
          tab={
               <div>
                {/* 基础设置 */}
                <FormattedMessage id='enterpriseSetting.TabPane.basicsSetting'/>
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
                  {/* 企业管理员管理 */}
                  <FormattedMessage id='enterpriseSetting.TabPane.enterpriseAdmin'/>
                 </div>
            } 
            key="management">
              <Management {...this.props} />
            </TabPane>
          )}
          {adminer && (
            <TabPane 
              tab={
                <div>
                  {/* 数据备份 */}
                  <FormattedMessage id='enterpriseSetting.TabPane.dataBackups'/>
                 </div>
                } 
              key="backup"
            >
              <BackupManage {...this.props} />
            </TabPane>
          )}
          <TabPane 
            tab={
              <div>
              {/* 镜像仓库 */}
                <FormattedMessage id='enterpriseSetting.TabPane.mirrorWarehouse'/>
              </div>
            } 
            key="image"
          >
            <ImageWarehouse {...this.props} />
          </TabPane>
          <TabPane
            tab={
              <div>
                {/* 版本更新 */}
                <FormattedMessage id='enterpriseSetting.TabPane.updateVersion'/>
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
