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
import { formatMessage } from 'umi-plugin-locale';
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
  }

  componentDidMount() {
    this.getPluginsList();
    const urlParams = new URLSearchParams(window.location.search || window.location.hash?.split('?')[1]);
    const showSelect = urlParams.get('showSelect');
    this.setState({ showSelect });
    console.log(this.props.cluster_info, "this.props.cluster_info");

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

    if (prevRegionName !== currentRegionName) {
      this.getPluginsList();
    }

    if (prevShowSelect !== currentShowSelect) {
      this.setState({ showSelect: currentShowSelect });
    }
  }

  importPlugin = (meta, regionName) => {
    importAppPagePlugin(meta, regionName, 'enterprise').then(res => {
      this.setState({ app: res, pluginLoading: false })
    }).catch(err => {
      this.setState({
        errInfo: err?.response?.data?.message || err?.message || "An unexpected error occurred.",
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
        if (res && res.list) {
          const plugin = res.list.find((item) => item.name === pluginId) || {};
          this.setState({ plugins: plugin, loading: false }, () => {
            if (plugin.plugin_type === 'JSInject') {
              this.importPlugin(plugin, currentRegionName);
            }
          });
        }
      },
      handleError: () => {
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
