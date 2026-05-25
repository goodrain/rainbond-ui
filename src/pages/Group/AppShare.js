import React, { PureComponent } from 'react';
import AppPublishSetting from './components/AppPublishSetting';
import AppSnapshotSetting from './components/AppSnapshotSetting';

export default class AppShare extends PureComponent {
  isSnapshotMode = () => {
    const query = (this.props.location && this.props.location.query) || {};
    return query.mode === 'snapshot';
  };

  getRefreshKey = () => {
    const query = (this.props.location && this.props.location.query) || {};
    if (query.refresh) {
      return query.refresh;
    }
    const search = (this.props.location && this.props.location.search) || '';
    const queryString = search.indexOf('?') === 0 ? search.slice(1) : search;
    if (!queryString) {
      return 'steady';
    }
    const params = new URLSearchParams(queryString);
    return params.get('refresh') || 'steady';
  };

  render() {
    const refreshKey = this.getRefreshKey();
    if (this.isSnapshotMode()) {
      return <AppSnapshotSetting key={`snapshot-${refreshKey}`} {...this.props} />;
    }
    return <AppPublishSetting key={`publish-${refreshKey}`} {...this.props} />;
  }
}
