import React, { Component } from 'react'
import { Spin, Card, Button } from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import { importAppPagePlugin } from '@/utils/importPlugins';
import EnterprisePluginsCom from '../EnterprisePluginsCom'
import Global from '@/utils/global';
import PluginUtil from '@/utils/pulginUtils';
import theme from '../../../config/theme';
// import styles from './index.less';

@connect(({ user }) => ({
  currUser: user.currentUser,
}))
export default class Backup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      app: {},
      plugins: {},
      loading: true,
      pluginLoading: true,
      error: false,
      errInfo: '',
      type: this.props?.type
    };
  }
  componentDidMount() {
    this.loadEnterpriseClusters()
  }
  loadEnterpriseClusters = () => {
    const { dispatch, currUser } = this.props;
    const enterpriseId = Global.getCurrEnterpriseId() || currUser?.enterprise_id;
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
      currUser,
    } = this.props;
    const enterpriseId = Global.getCurrEnterpriseId() || currUser?.enterprise_id;
    const currentRegionName = regionName || Global.getCurrRegionName();
    dispatch({
      type: 'global/getPluginList',
      payload: { enterprise_id: enterpriseId, region_name: currentRegionName },
      callback: (res) => {
        if (res && res.list) {
          const plugin = res.list.find((item) => item.name === 'rainbond-enterprise-base') || {};
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
  importPlugin = (meta, regionName) => {
    importAppPagePlugin(meta, regionName).then(res => {
      this.setState({ app: res, pluginLoading: false })
    }).catch(err => {
      this.setState({
        errInfo: err?.response?.data?.message || err?.message || "An unexpected error occurred.",
        pluginLoading: false,
        error: true
      })
    })
  }
  render() {
    const { app, loading, type } = this.state;
    const {componentData} = this.props;
    return (<>
      {!loading ? (
        <EnterprisePluginsCom
          key={type}
          {...this.state}
          dispatch={this.props.dispatch}
          appKey={type}
          formatMessage={formatMessage}
          componentData={componentData || {}}
        />
      ) : (
        <div style={{ width: '100%', height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </div>
      )}
    </>
    )
  }
}
