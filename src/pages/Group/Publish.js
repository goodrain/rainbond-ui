import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';

@connect()
export default class AppPublishRedirect extends PureComponent {
  componentDidMount() {
    this.redirectToVersionPage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      this.redirectToVersionPage();
    }
  }

  redirectToVersionPage = () => {
    const { dispatch, match } = this.props;
    const { teamName, regionName, appID } = match.params;
    dispatch(
      routerRedux.replace(
        `/team/${teamName}/region/${regionName}/apps/${appID}/version`
      )
    );
  };

  render() {
    return null;
  }
}
