import React, { PureComponent } from 'react';
import AppPublishSetting from './components/AppPublishSetting';
import AppSnapshotSetting from './components/AppSnapshotSetting';

export default class AppShare extends PureComponent {
  isSnapshotMode = () => {
    const query = (this.props.location && this.props.location.query) || {};
    return query.mode === 'snapshot';
  };

  render() {
    if (this.isSnapshotMode()) {
      return <AppSnapshotSetting {...this.props} />;
    }
    return <AppPublishSetting {...this.props} />;
  }
}
