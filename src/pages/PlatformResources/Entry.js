/* eslint-disable react/react-in-jsx-scope */
import { Empty, Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';

@connect()
class PlatformResourcesEntry extends PureComponent {
  state = {
    loading: true
  };

  componentDidMount() {
    this.redirectToStorageManagement();
  }

  getEnterpriseId = () => {
    const { match } = this.props;
    return match && match.params && match.params.eid;
  };

  redirectToStorageManagement = () => {
    const { dispatch } = this.props;
    const eid = this.getEnterpriseId();

    if (!eid) {
      this.setState({ loading: false });
      return;
    }

    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        const clusters = (res && res.list) || [];
        const firstCluster = clusters.find(cluster => cluster && cluster.region_name);
        if (firstCluster) {
          dispatch(
            routerRedux.replace(
              `/enterprise/${eid}/region/${firstCluster.region_name}/platform-resources`
            )
          );
          return;
        }
        this.setState({ loading: false });
      },
      handleError: () => {
        this.setState({ loading: false });
      }
    });
  };

  render() {
    const { loading } = this.state;
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        {loading ? <Spin /> : <Empty />}
      </div>
    );
  }
}

export default PlatformResourcesEntry;
