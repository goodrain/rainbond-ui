/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-nested-ternary */
import { Button, Modal, Spin, Steps, Tabs } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import authorize from '../../assets/authorize.png';
import install from '../../assets/install.png';
import installColor from '../../assets/install_color.png';
import success from '../../assets/success.png';
import styles from '../CreateTeam/index.less';
import styless from './index.less';

const { Step } = Steps;
const { TabPane } = Tabs;
@connect()
export default class InstallStep extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      installType: '1',
      isAuthorize: false,
      authorizeLoading: true,
      isOffLine: true
    };
  }

  componentWillMount() {
    const { dispatch, eid } = this.props;
    this.handleGetEnterpeiseMsg();
    dispatch({
      type: 'market/fetchMarketsTab',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.status_code === 200) {
          if (
            res.list.length > 0 &&
            res.list[0].access_key !== '' &&
            res.list[0].domain === 'rainbond'
          ) {
            this.setState({
              isAuthorize: true
            });
          }
          this.setState({ authorizeLoading: false });
        }
      }
    });
  }
  // Tab标签页切换
  onTabChange = value => {
    this.setState({ installType: value });
  };
  handleGetEnterpeiseMsg = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: res => {
        res && res.is_offline && this.setState({ isOffLine: false });
      },
      handleError: err => {}
    });
  };
  render() {
    const {
      onCancel,
      isCluster,
      onStartInstall,
      onViewInstance,
      isHaveCluters
    } = this.props;
    const {
      installType,
      isAuthorize,
      authorizeLoading,
      isOffLine
    } = this.state;
    return authorizeLoading ? (
      <Spin />
    ) : isOffLine ? (
      <Modal
        width={800}
        centered
        keyboard={false}
        maskClosable={false}
        footer={false}
        visible
        className={styles.TelescopicModal}
        onOk={() => onCancel(true, installType)}
        onCancel={() => onCancel(false, installType)}
      >
        <h2 className={styless.initTitle}>
          {isCluster ? <FormattedMessage id='enterpriseOverview.overview.InstallStep.success'/> : <FormattedMessage id='enterpriseOverview.overview.InstallStep.install_step'/>}
        </h2>
        <p style={{ textAlign: 'center' }}>
          {isCluster
            ? <FormattedMessage id='enterpriseOverview.overview.InstallStep.app'/>
            : <FormattedMessage id='enterpriseOverview.overview.InstallStep.guide'/>}
        </p>
        <div style={{ padding: '0px 90px' }}>
          <Tabs value={installType} onChange={this.onTabChange}>
            <TabPane  tab={<FormattedMessage id='enterpriseOverview.overview.InstallStep.our_app'/>}key="1">
              <Steps direction="vertical" current="1">
                <Step
                  title={
                    <span
                      style={{
                        color: isCluster ? '#4D73B1' : '#000000A6',
                        fontWeight: 'bold'
                      }}
                    >
                      <FormattedMessage id='enterpriseOverview.overview.InstallStep.install'/>
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isCluster ? installColor : install}
                    />
                  }
                  description={
                    <span
                      style={{ color: isCluster ? '#000000A6' : '#00000073' }}
                    >
                      <FormattedMessage id='enterpriseOverview.overview.InstallStep.into'/>
                    </span>
                  }
                />
              </Steps>
            </TabPane>
            <TabPane  tab={<FormattedMessage id='enterpriseOverview.overview.InstallStep.market'/>}key="2">
              <Steps direction="vertical" current={isCluster ? '2' : '1'}>
                <Step
                  title={
                    <span style={{ color: '#4D73B1', fontWeight: 'bold' }}>
                      <FormattedMessage id='enterpriseOverview.overview.InstallStep.authorization'/>
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isAuthorize ? success : authorize}
                    />
                  }
                  description={
                    <span style={{ color: '#000000A6' }}>
                      <FormattedMessage id='enterpriseOverview.overview.InstallStep.mode'/>
                    </span>
                  }
                />
                <Step
                  title={
                    <span
                      style={{
                        color:
                          isAuthorize && isCluster ? '#4D73B1' : '#000000A6',
                        fontWeight: 'bold'
                      }}
                    >
                      <FormattedMessage id='enterpriseOverview.overview.InstallStep.install'/>
                    </span>
                  }
                  icon={
                    <img
                      style={{ width: '24px', height: '24px' }}
                      src={isAuthorize && isCluster ? installColor : install}
                    />
                  }
                  description={
                    <span style={{ color: '#00000073' }}>
                      <FormattedMessage id='enterpriseOverview.overview.InstallStep.install_mode'/>
                    </span>
                  }
                />
              </Steps>
            </TabPane>
          </Tabs>
        </div>

        {isCluster ? (
          <p style={{ textAlign: 'center', padding: '16px 0' }}>
            <Button
              style={{ marginRight: '20px' }}
              onClick={() => onStartInstall(installType)}
              type="primary"
            >
              {installType === '1' ? <FormattedMessage id='enterpriseOverview.overview.InstallStep.our_app'/> : <FormattedMessage id='enterpriseOverview.overview.InstallStep.Docking'/>}
            </Button>
            {installType === '1' && (
              <Button onClick={() => onViewInstance()}><FormattedMessage id='enterpriseOverview.overview.InstallStep.demo'/></Button>
            )}{' '}
          </p>
        ) : (
          <p style={{ textAlign: 'center', padding: '16px 0' }}>
            <Button onClick={() => onCancel(true, installType)} type="primary">
              <FormattedMessage id='enterpriseOverview.overview.InstallStep.start'/>
            </Button>
          </p>
        )}
      </Modal>
    ) : (
      ''
    );
  }
}
