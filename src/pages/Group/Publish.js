import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';

@connect()
export default class AppPublishRedirect extends PureComponent {
  componentDidMount() {
    this.redirectToDeliveryPage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      this.redirectToDeliveryPage();
    }
  }

  redirectToDeliveryPage = () => {
    const { dispatch, match } = this.props;
    const { teamName, regionName, appID } = match.params;
    dispatch(
      routerRedux.replace(
        `/team/${teamName}/region/${regionName}/apps/${appID}/delivery`
      )
    );
  };

  render() {
    return null;
  }
}
