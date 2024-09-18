import React, { Component } from 'react';
import { Spin, Card, Button } from 'antd';
import { connect } from 'dva';
import { importAppPagePlugin } from '../../utils/importPlugins';
import { getRainbondInfo } from '../../services/api';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import Global from '@/utils/global';
import PluginUtil from '../../utils/pulginUtils';
import Result from '../../components/Result'
import styles from './index.less';

@connect(({ user, teamControl, global }) => ({
  user: user.currentUser,
}))
export default class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      app: {},
      plugins: {},
      loading: true,
      pluginLoading: true,
      error: false,
      errInfo: '',
    };
  }

  componentDidMount() {
    this.getPluginsList();
  }

  importPlugin = (meta, regionName) => {
    importAppPagePlugin(meta, regionName).then(res => {
      console.log(res,"res");
      this.setState({ app: res, pluginLoading: false })
    }).catch(err => {
      this.setState({
        errInfo:  err?.response?.data?.message || err?.message || "An unexpected error occurred.",
        pluginLoading: false,
        error: true
      })
    })
  }
  getPluginsList = () => {
    const type = PluginUtil.getCurrentViewPosition(window.location.href);
    type === 'Platform' ? this.loadEnterpriseClusters() : this.loadPluginList();
  };

  loadEnterpriseClusters = () => {
    const { dispatch } = this.props;
    const enterpriseId = Global.getCurrEnterpriseId();

    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: { enterprise_id: enterpriseId },
      callback: (res) => {
        if (res.status_code === 200 && res.list?.[0]?.region_name) {
          this.loadPluginList(res.list[0].region_name);
        }
      },
    });
  };

  loadPluginList = (regionName) => {
    const {
      dispatch,
      match: {
        params: { pluginId },
      },
      user,
    } = this.props;
    const enterpriseId = Global.getCurrEnterpriseId() || user?.enterprise_id;
    const currentRegionName = regionName || Global.getCurrRegionName();

    dispatch({
      type: 'global/getPluginList',
      payload: { enterprise_id: enterpriseId, region_name: currentRegionName },
      callback: (res) => {
        if (res && res.list) {
          const plugin = res.list.find((item) => item.name === pluginId) || {};
          this.setState({ plugins: plugin, loading: false }, () => {
            if (plugin.plugin_type === 'JSInject') {
              this.importPlugin(plugin, regionName);
            }
          });
        }
      },
      handleError: () => {
        this.setState({ plugins: {}, loading: false });
      },
    });
  };

  contentRender = () => {
    const { app, plugins, pluginLoading, error, errInfo } = this.state;
    if (plugins?.plugin_type === 'JSInject') {
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
          app.root && <app.root colorPrimary={Global.getPublicColor('primary-color')} api={getRainbondInfo} />
        )
      );
    }
    return (
      <div style={{ height: '100vh' }}>
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
    );
  };

  render() {
    const { plugins, loading } = this.state;
    return (
      <>
        {!loading ? (
          <PageHeaderLayout title={plugins?.name} content={plugins?.description} pluginSVg={plugins?.icon}>
            {this.contentRender()}
          </PageHeaderLayout>
        ) : (
          <div style={{ width: '100%', height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" />
          </div>
        )}
      </>
    );
  }
}
