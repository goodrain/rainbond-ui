import React, { Component } from 'react';
import { Spin, Card, Button } from 'antd';
import Result from '../Result';
import { connect } from 'dva';
import PluginsUtiles from '../../utils/pulginUtils'
import { formatMessage } from '@/utils/intl';
import { routerRedux } from 'dva/router';
import Global from '../../utils/global'
import cookie from "@/utils/cookie";
import styles from './index.less';
@connect(({ user, region, global, index, appControl, teamControl }) => ({
  currentUser: user.currentUser,
  cluster_info: region.cluster_info,
  pluginsList: global.pluginsList,
  overviewInfo: index.overviewInfo,
  appDetail: appControl.appDetail,
  currentTeam: teamControl.currentTeam,
}))

export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  // 判断是否为多视图插件
  isMultiViewPlugin = () => {
    const { plugins } = this.props;
    const str = PluginsUtiles.isCurrentPluginMultiView(window.location.href, plugins.plugin_views)
    return str
  }
  jumpRouter = (url) => {
    this.props.dispatch(
      routerRedux.push(
        url
      )
    );
  };

  getPluginNamespace = () => {
    const currentTeamNamespace = this.props?.currentTeam?.namespace;
    if (currentTeamNamespace) {
      return currentTeamNamespace;
    }

    const currentTeamName = Global.getCurrTeamName();
    const teams = this.props?.currentUser?.teams || [];
    const currentTeam = teams.find((item) => item.team_name === currentTeamName);
    return currentTeam?.namespace || '';
  };

  // 渲染插件
  rbdPluginsRender = () => {
    const { app, plugins, pluginLoading, error, errInfo, dispatch, reduxInfo } = this.props;
    const key = this.isMultiViewPlugin()
    const AppPagePlugin = app[key] ? app[key] : false
    const currentTeamName = Global.getCurrTeamName();
    const currentTeamNamespace = this.props?.currentTeam?.namespace || '';
    const teams = this.props?.currentUser?.teams || [];
    const matchedTeam = teams.find((item) => item.team_name === currentTeamName);
    const fallbackNamespace = matchedTeam?.namespace || '';
    const resolvedNamespace = this.getPluginNamespace();
    const pluginBaseInfo = {
      colorPrimary: Global.getPublicColor('primary-color'),
      currentLocale: cookie.get('language') === 'zh-CN' ? 'zh' : 'en',
      cluster_info: this.props.cluster_info,
      currentUser: this.props.currentUser,
      token: cookie.get('token'),
      pluginsList: this.props.pluginsList,
      overviewInfo: this.props.overviewInfo,
      appDetail: this.props.appDetail,
      namespace: resolvedNamespace,
    };

    console.info('[RBDPluginsCom] namespace resolution', {
      pluginName: plugins?.name || '',
      currentTeamName,
      currentTeamNamespace,
      matchedTeamName: matchedTeam?.team_name || '',
      fallbackNamespace,
      resolvedNamespace,
    });
    if (!resolvedNamespace) {
      console.warn('[RBDPluginsCom] namespace missing for plugin baseInfo', {
        pluginName: plugins?.name || '',
        currentTeamName,
        currentTeamNamespace,
        fallbackNamespace,
      });
    }

    return pluginLoading ? (
      <div style={{ width: '100%', height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    ) : (
      error ? (
        <Card style={{ marginTop: 20 }}>
          <Result
            type="error"
            title='加载失败'
            description={`错误信息：${errInfo}`}
            actions={
              <Button onClick={() => {}}>查看文档</Button>
            }
            style={{
              marginTop: 48,
              marginBottom: 16
            }}
          />
        </Card>
      ) : (
        AppPagePlugin ?
          <AppPagePlugin
            dispatch={dispatch}
            formatMessage={formatMessage}
            baseInfo={pluginBaseInfo}
            globalUtile={Global}
            jumpRouter={this.jumpRouter}
          />
          :
          <Card style={{ marginTop: 20 }}>
            <Result
              type="error"
              title='插件未安装'
              description={`请检查插件安装版本是否与平台版本兼容`}
            />
          </Card>
      )
    );

  }
  // 渲染iframe
  iframeRender = () => {
    const { app, plugins, pluginLoading, error, errInfo } = this.props;
    const iframeParams = PluginsUtiles.getIframeParams(plugins?.name)    
    return <div style={{ height: '100vh' }}>
      <iframe
        src={`${plugins?.backend}${iframeParams}`}
        style={{ width: '100%', height: '100%' }}
        id={plugins?.name}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        scrolling="auto"
        frameBorder="no"
        border="0"
        marginWidth="0"
        marginHeight="0"
      />
    </div>

  }
  render() {
    const { plugins } = this.props;    
    return (
      <>
        {
          plugins?.plugin_type === 'JSInject'
            ?
            (
              this.rbdPluginsRender()
            ) : (
              this.iframeRender()
            )
        }
      </>
    )
  }
}
