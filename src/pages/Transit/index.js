import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import EnterpriseLayout from '../../layouts/EnterpriseLayout';
import TeamLayout from '../../layouts/TeamLayout';

@connect()
export default class Enterprise extends PureComponent {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    const { dispatch, location } = this.props;
    // dispatch(
    //   routerRedux.replace(
    //     location.pathname.indexOf('team') > -1 ? '/team' : 'enterprise'
    //   )
    // );
  }
  render() {
    const { children } = this.props;
    return <div>{children}</div>;
    // return <EnterpriseLayout {...this.props}/>;
  }
}
