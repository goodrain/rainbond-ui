import React, { Component } from 'react';
import { Spin, Card, Button } from 'antd';
import Result from '../Result';
import { connect } from 'dva';
import PluginsUtiles from '../../utils/pulginUtils'
import Global from '../../utils/global'
import cookie from "@/utils/cookie";
import styles from './index.less';
@connect(({ user, region, global, index }) => ({
  currentUser: user.currentUser,
  cluster_info: region.cluster_info,
  pluginsList: global.pluginsList,
  overviewInfo: index.overviewInfo,
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

  // 渲染插件
  rbdPluginsRender = () => {
    const { app, plugins, pluginLoading, error, errInfo, dispatch, reduxInfo } = this.props;
    const key = this.isMultiViewPlugin()
    const AppPagePlugin = app[key] ? app[key] : false
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
              <Button onClick={() => { console.log('点了一下'); }}>查看文档</Button>
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
            baseInfo={{
              colorPrimary: Global.getPublicColor('primary-color'),
              currentLocale: cookie.get('language') === 'zh-CN' ? 'zh' : 'en',
              cluster_info: this.props.cluster_info,
              currentUser: this.props.currentUser,
              token: cookie.get('token'),
              pluginsList: this.props.pluginsList,
              overviewInfo: this.props.overviewInfo
            }}
            globalUtile={Global}
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
    return <div style={{ height: '100vh' }}>
      <iframe
        src={plugins?.fronted_path}
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
