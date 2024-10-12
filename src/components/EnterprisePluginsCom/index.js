import React, { Component } from 'react';
import { Spin, Card, Button } from 'antd';
import Result from '../Result';
import PluginsUtiles from '../../utils/pulginUtils'
import Global from '../../utils/global'
import baseInfo from './baseInfo';
import { connect } from 'dva';
import { routerRedux } from "dva/router";
import styles from './index.less';

@connect(({ activities, appControl, appDetail, application, chart, createApp, enterprise, error, form, gateWay, global, index, invoice, list, login, market, monitor, order, plugin, profile, project, region, register, rule, teamControl, user }) => ({
  activities: activities,
  appControl: appControl,
  appDetail: appDetail,
  application: application,
  chart: chart,
  createApp: createApp,
  enterprise: enterprise,
  errors: error,
  form: form,
  gateWay: gateWay,
  global: global,
  index: index,
  invoice: invoice,
  list: list,
  login: login,
  market: market,
  monitor: monitor,
  order: order,
  plugin: plugin,
  profile: profile,
  project: project,
  region: region,
  register: register,
  rule: rule,
  teamControl: teamControl,
  user: user
}))
export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
  }
  // 判断是否为多视图插件
  isMultiViewPlugin = () => {
    const { plugins, appKey } = this.props;
    const str = PluginsUtiles.determineRenderKey(appKey)
    return str
  }
  jumpRouter = (url) => {
    this.props.dispatch(
      routerRedux.push(
        url
      )
    );
  };

  // 渲染插件
  rbdPluginsRender = () => {
    const {
      app,
      plugins,
      pluginLoading,
      error,
      errInfo,
      dispatch,
      activities,
      appControl,
      appDetail,
      application,
      chart,
      createApp,
      enterprise,
      form,
      gateWay,
      global,
      index,
      errors,
      invoice,
      list,
      login,
      market,
      monitor,
      order,
      plugin,
      profile,
      project,
      region,
      register,
      rule,
      teamControl,
      user,
      formatMessage,
      componentData
    } = this.props;
    const key = this.isMultiViewPlugin()
    const AppPagePlugin = app[key] ? app[key] : false
    const reduxInfo = {
      activities: activities,
      appControl: appControl,
      appDetail: appDetail,
      application: application,
      chart: chart,
      createApp: createApp,
      enterprise: enterprise,
      error: errors,
      form: form,
      gateWay: gateWay,
      global: global,
      index: index,
      invoice: invoice,
      list: list,
      login: login,
      market: market,
      monitor: monitor,
      order: order,
      plugin: plugin,
      profile: profile,
      project: project,
      region: region,
      register: register,
      rule: rule,
      teamControl: teamControl,
      user: user
    }
    return pluginLoading ? (
      <div style={{ width: '100%', height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="插件内容加载中..." />
      </div>
    ) : (
      error ? (
        <Card style={{ marginTop: 20 }}>
          <Result
            type="error"
            title='插件加载失败'
            description={`错误信息：${errInfo}`}
            actions={
              <Button onClick={() => { console.log('点了一下'); }}>查看文档</Button>
            }
            style={{
              marginTop: 48,
              marginBottom: 16
            }}
          />,
        </Card>
      ) : (
        AppPagePlugin &&
        <AppPagePlugin
          jumpRouter={this.jumpRouter}
          dispatch={dispatch}
          baseInfo={baseInfo}
          reduxInfo={reduxInfo}
          formatMessage={formatMessage}
          componentData={componentData}
        />
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
