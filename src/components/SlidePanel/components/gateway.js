import React, { Component } from 'react'
import PageHeader from '../../ComponentPageHeader'
import globalUtil from '@/utils/global';
import { Spin } from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import GatewayCertificate from '../../../pages/NewGateway/GatewayCertificate';
import GatewayRoute from '../../../pages/NewGateway/GatewayRoute';
import GatewayService from '../../../pages/NewGateway/GatewayService';
import roleUtil from '@/utils/newRole';
import styles from './gateway.less';

@connect(({ user }) => ({
  currUser: user.currentUser
}))
export default class Gateway extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permissions: props.permissions,
      tabKey: this.getInitialTabKey(props.permissions),
      batchGateway: false,
      batchGatewayLoading: false,
      open: false
    }
  }
  componentDidMount() {
    this.handleBatchGateWay();
  }
  getInitialTabKey = (permissions) => {
    const { routePermission, argetServicesPermission, certificatePermission } = permissions;
    if (routePermission.isAccess) return 'route';
    if (argetServicesPermission.isAccess) return 'service';
    if (certificatePermission.isAccess) return 'certificate';
    return 'route';
  }
  handleBatchGateWay = () => {
    const { dispatch, currUser } = this.props;
    const regionName = globalUtil.getCurrRegionName();
    
    dispatch({
      type: 'gateWay/getBatchGateWay',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: regionName
      },
      callback: res => {
        this.setState({
          batchGateway: !!(res?.list?.length),
          batchGatewayLoading: true
        });
      },
      handleError: () => {
        this.setState({
          batchGatewayLoading: true
        });
      }
    });
  }
  handleTabChange = (key, open = false) => {
    const { batchGateway } = this.state
      this.setState({ tabKey: key, open: open })
  }
  renderContent = () => {
    const { open } = this.state;
    const { routePermission, certificatePermission, argetServicesPermission } = this.props.permissions;
    const appID = globalUtil.getAppID();
    const contentMap = {
      certificate: <GatewayCertificate open={open} permission={certificatePermission} appID={appID}/>,
      route: <GatewayRoute open={open} onTabChange={this.handleTabChange} permission={routePermission} appID={appID}/>,
      service: <GatewayService open={open} permission={argetServicesPermission} appID={appID}/>
    };

    return contentMap[this.state.tabKey] || null;
  }
  handleTabList = () => {
    const { routePermission, argetServicesPermission, certificatePermission } = this.props.permissions
    let arr = []
    if (routePermission.isAccess) {
      arr.push({
        key: 'route',
        tab: formatMessage({ id: 'teamNewGateway.NewGateway.index.management' }),
      })
    }
    if (argetServicesPermission.isAccess) {
      arr.push({
        key: 'service',
        tab: formatMessage({ id: 'teamNewGateway.NewGateway.index.Services' }),
      })
    }
    if (certificatePermission.isAccess) {
      arr.push({
        key: 'certificate',
        tab: formatMessage({ id: 'teamNewGateway.NewGateway.index.certificate' }),
      })
    }
    return arr

  }

  render() {
    const { batchGatewayLoading } = this.state
    const { routePermission, argetServicesPermission, certificatePermission } = this.props.permissions
    if (!routePermission.isAccess && !argetServicesPermission.isAccess && !certificatePermission.isAccess) {
      return roleUtil.noPermission()
    }
    return (
      <>
        <>{batchGatewayLoading ? (
          <div className={styles.container}>
            <PageHeader
              {...this.props.pageHeader}
              tabList={this.handleTabList()}
              onTabChange={this.handleTabChange}
              tabActiveKey={this.state.tabKey}
              content={formatMessage({ id: 'versionUpdata_6_2.gateway.desc' })}
              title={formatMessage({ id: 'teamGateway.strategy.title' })}
            />
            <div className={styles.content}>
              {this.renderContent()}
            </div>
          </div>
        ) : (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        )}</>
      </>
    )
  }
}
