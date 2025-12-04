import React, { Component } from 'react';
import { Spin, Card, Button, Icon, Select } from 'antd';
import { connect } from 'dva';
import { importAppPagePlugin } from '../../utils/importPlugins';
import { getRainbondInfo } from '../../services/api';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import RbdPluginsCom from '../../components/RBDPluginsCom'
import Global from '@/utils/global';
import PluginUtil from '../../utils/pulginUtils';
import { routerRedux } from 'dva/router';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

const { Option } = Select;
@connect(({ user, region }) => ({
  user: user.currentUser,
  cluster_info: region.cluster_info,
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
      showSelect: null,
      regionName: null,
    };
    this.isLoading = false; // 防止重复加载的标志
    this.importingPlugin = null; // 当前正在导入的插件名称
  }

  componentDidMount() {
    // 对于isCom模式，延迟加载以确保URL参数正确更新
    if (this.props.isCom) {
      setTimeout(() => {
        this.getPluginsList();
      }, 100);
    } else {
      this.getPluginsList();
    }
    
    const urlParams = new URLSearchParams(window.location.search || window.location.hash?.split('?')[1]);
    const showSelect = urlParams.get('showSelect');
    this.setState({ showSelect });
  }
  
  componentWillUnmount() {
    // 清理可能的定时器和异步操作
    this.isLoading = false;
    this.importingPlugin = null;
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.location || !this.props.location) return;

    const prevSearch = prevProps.location.search || prevProps.location.hash?.split('?')[1] || '';
    const currentSearch = this.props.location.search || this.props.location.hash?.split('?')[1] || '';

    const prevUrlParams = new URLSearchParams(prevSearch);
    const currentUrlParams = new URLSearchParams(currentSearch);

    const prevRegionName = prevUrlParams.get('regionName');
    const currentRegionName = currentUrlParams.get('regionName');
    const prevShowSelect = prevUrlParams.get('showSelect');
    const currentShowSelect = currentUrlParams.get('showSelect');
    
    // 监听tab参数变化
    const prevTab = prevUrlParams.get('tab');
    const currentTab = currentUrlParams.get('tab');

    if (prevRegionName !== currentRegionName) {
      this.isLoading = false; // 允许重新加载
      this.getPluginsList();
      return; // 避免同时执行tab切换逻辑
    }

    if (prevShowSelect !== currentShowSelect) {
      this.setState({ showSelect: currentShowSelect });
    }
    
    // 当tab参数变化时，重新加载对应的插件
    if (prevTab !== currentTab && this.props.isCom && currentTab && prevTab) {
      // 清理状态，避免上一个插件的状态影响新插件
      this.setState({
        app: {},
        plugins: {},
        loading: true,
        pluginLoading: true,
        error: false,
        errInfo: '',
      });
      
      // 重置标志
      this.isLoading = false;
      this.importingPlugin = null;
      
      this.getPluginsList();
    }
  }

  importPlugin = (meta, regionName) => {
    // 防止重复导入同一个插件
    if (this.importingPlugin === meta.name) {
      return;
    }
    
    this.importingPlugin = meta.name;
    this.setState({ pluginLoading: true }); // 设置加载状态
    
    importAppPagePlugin(meta, regionName, 'enterprise').then(res => {
      this.importingPlugin = null;
      this.setState({ app: res, pluginLoading: false })
    }).catch(err => {
      this.importingPlugin = null;
      this.setState({
        errInfo: err?.response?.data?.message || err?.message || "An unexpected error occurred.",
        pluginLoading: false,
        error: true
      })
    })
  }
  getPluginsList = () => {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    const type = PluginUtil.getCurrentViewPosition(window.location.href);
    type === 'Platform' ? this.loadEnterpriseClusters() : this.loadPluginList();
  };

  loadEnterpriseClusters = () => {
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
    const region_name = urlParams.get('regionName');
    const regionName = Global.getCurrRegionName() || this.props?.match?.params?.regionID || region_name
    this.setState({ regionName });
    this.loadPluginList(regionName);
  };

  loadPluginList = (regionName) => {
    const {
      dispatch,
      match,
      isCom,
      user,
      cluster_info
    } = this.props;
    let pluginId = ''
    if (isCom) {
      pluginId = Global.getSlidePanelTab()
    } else {
      pluginId = match.params.pluginId
    }
    const enterpriseId = Global.getCurrEnterpriseId() || user?.enterprise_id;
    const currentRegionName = regionName || Global.getCurrRegionName();
    dispatch({
      type: 'global/getPluginList',
      payload: { enterprise_id: enterpriseId, region_name: currentRegionName },
      callback: (res) => {
        this.isLoading = false; // 重置加载标志
        if (res && res.list) {
          const plugin = res.list.find((item) => item.name === pluginId) || {};
          // 先设置插件信息
          this.setState({ plugins: plugin, loading: false });
          // 对于JSInject类型的插件，延迟调用importPlugin避免重复渲染
          if (plugin.plugin_type === 'JSInject') {
            setTimeout(() => {
              this.importPlugin(plugin, currentRegionName);
            }, 50);
          }
        }
      },
      handleError: () => {
        this.isLoading = false; // 重置加载标志
        this.setState({ plugins: {}, loading: false });
      },
    });
  };
  handleChange = (value) => {
      const { dispatch, match} = this.props;
    const pluginId = match.params.pluginId
    dispatch(routerRedux.push(`/enterprise/${Global.getCurrEnterpriseId()}/plugins/${pluginId}?regionName=${value}&showSelect=true`));
  }
  render() {
    const { plugins, loading, regionName } = this.state;
    const { isCom = false } = this.props
    return (
      <>
        {!loading ? (
          isCom ?
            <RbdPluginsCom {...this.state} />
            :
            <PageHeaderLayout
              title={plugins?.display_name}
              content={plugins?.description}
              pluginSVg={plugins?.icon}
              extraContent={
                this.state.showSelect ?
                  <>
                    <span style={{ marginRight: 6 }}>选择集群：</span>
                    <Select defaultValue={regionName} style={{ width: 120 }} onChange={this.handleChange}>
                      {
                        this.props.cluster_info.map(item => (
                          <Option value={item.region_name}>{item.region_name}</Option>
                        ))
                      }
                    </Select>
                  </> :
                  <>
                    {
                      Global.getCurrTeamName() &&
                      <Button onClick={() => {
                        const { dispatch } = this.props;
                        dispatch(
                          routerRedux.push({
                            pathname: `/team/${Global.getCurrTeamName()}/region/${Global.getCurrRegionName()}/index`,
                          })
                        );
                      }} type="default">
                        <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.home' })}
                      </Button>
                    }
                  </>
              }
            >
              <RbdPluginsCom {...this.state} key={regionName} />
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
