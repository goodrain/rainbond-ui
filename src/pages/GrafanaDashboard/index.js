/* eslint-disable jsx-a11y/iframe-has-title */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import rainbondUtil from '../../utils/rainbond';
import userUtil from '../../utils/user';

@connect(({ user, loading, global }) => ({
  user: user.currentUser,
  loading: loading.models.list,
  enterprise: global.enterprise
}))
export default class EnterpriseClusters extends PureComponent {
  constructor(props) {
    super(props);
    const { user } = this.props;
    const adminer = userUtil.isCompanyAdmin(user);
    this.state = {
      adminer
    };
  }
  componentWillMount() {
    const { adminer } = this.state;
    const { dispatch } = this.props;
    if (!adminer) {
      dispatch(routerRedux.push(`/`));
    }
  }

  render() {
    const {
      match: {
        params: { monitoringKey }
      },
      enterprise
    } = this.props;

    const monitoringObj = rainbondUtil.fetchMonitoring(enterprise);
    return monitoringObj.home_url ? (
      <iframe
        id="ifrm"
        src={`${monitoringObj.home_url}${monitoringObj[monitoringKey]}`}
        style={{
          width: '100%',
          height: 'calc(100vh - 150px)'
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        scrolling="auto"
        frameBorder="no"
        border="0"
        marginWidth="0"
        marginHeight="0"
      />
    ) : (
      <div />
    );
  }
}
