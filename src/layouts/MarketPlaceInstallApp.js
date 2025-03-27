import React, { Component } from 'react'
import { Spin, notification } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import AppShareInstall from '@/components/AppShareInstall';
import cookie from '@/utils/cookie';
@connect(({ user }) => ({
  currUser: user.currentUser,
}))
export default class MarketPlaceInstallApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      appInfo: false,
      isShare: false
    };
  }
  componentDidMount() {
    this.fetchAppInfo();
    this.getAppNames();
  }

  // 获取当前团队下的所有应用名称
  getAppNames = () => {
    const { dispatch, currUser } = this.props;
    const teamName = currUser.teams[0]?.team_name;
    dispatch({
      type: 'teamControl/fetchAppNames',
      payload: {
        team_name: teamName,
        region_name: currUser.teams[0]?.region[0]?.team_region_name,
      }
    });
  }

  // 查询应用市场应用的详情
  fetchAppInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'market/fetchMarkets',
      payload: {
        enterprise_id: this.props?.currUser?.enterprise_id,
        pageSize: 999,
        page: 1,
        name: 'RainbondMarket',
        query: this.props?.location?.query?.app_name,
        is_plugin: false,
        arch: 'amd64'
      },
      callback: (res) => {
        if (res && res.list && res.list.length > 0) {
          const appInfo = res.list.find(item => item.app_id === this.props?.match?.params?.appId);
          this.setState({
            appInfo: appInfo,
          })
        }
      }
    })
  }

  // 安装应用
  installApp = (teamName, regionName, values) => {
    const { appInfo } = this.state;
    const { dispatch, currUser } = this.props;
    cookie.set('team_name', values.team_name);
    cookie.set('region_name', regionName);
    dispatch({
      type: 'application/addGroup',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_name: values.group_name,
        k8s_app: values.k8s_app,
        note: '',
      },
      callback: (res) => {
        if(res && res.group_id){
          this.installShareApp(teamName, regionName, values, res.group_id)
        }
      },
      handleError: () => {
        this.setState({
          isShare: false
        })
      }
    })
  }
  

  // 安装通过分享链接的应用
  installShareApp = (teamName, regionName, values, group_id) => {
    const { appInfo } = this.state;
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'createApp/installApp',
      payload: {
        region_name: regionName,
        team_name: teamName,
        group_id: group_id,
        app_id: appInfo.app_id,
        is_deploy: true,
        app_version: values.version,
        install_from_cloud: true,
        marketName: 'RainbondMarket',
      },
      callback: () => {
        // 刷新左侧按钮
        this.setState({
          isShare: false
        })
        dispatch(
          routerRedux.push(
            `/team/${teamName}/region/${regionName}/apps/${group_id}`
          )
          );
      },
      handleError: () => {
        this.setState({
          isShare: false
        })
      }
      });
  }
  /**
   * 安装通过分享链接的应用。
   * 使用提供的表单值和区域名称安装应用，设置cookie，并向服务器发送安装请求。
   * 成功后清除分享状态，更新页面路由至应用概览页。
   * 
   * @param {Object} values - 表单提交的值，包含团队名、区域名、组ID等。
   * @param {string} regionName - 应用将被安装的区域名称。
   */
  handleInstallApp = (values) => {
    const { appInfo } = this.state;
    const { dispatch, currUser } = this.props;
    const teamName = this.props.currUser.teams[0]?.team_name;
    const regionName = this.props.currUser.teams[0]?.region[0]?.team_region_name;
    this.setState({
      isShare: true
    })
    if(values.install_type === 'new'){
      this.installApp(teamName, regionName, values)
    } else {
      this.installShareApp(teamName, regionName, values, values.group_id)
    }
  }

  render() {
    const { currUser } = this.props;
    const { appInfo, isShare } = this.state;
    const eid = currUser.enterprise_id;
    const teams = currUser.teams;
    const teamName = this.props.currUser.teams[0]?.team_name;
    const regionName = this.props.currUser.teams[0]?.region[0]?.team_region_name;
    const appName = this.props?.location?.query?.app_name;
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {appInfo &&
          <AppShareInstall
            title={`确定要安装${appName}吗？`}
            eid={eid}
            appName={appName}
            teamName={teamName}
            regionName={regionName}
            appInfo={appInfo}
            isShare={isShare}
            onOk={this.handleInstallApp}
          />
        }
      </div>
    )
  }
}
