import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';

@connect()
export default class Trs extends PureComponent {
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
    return <div>Trs</div>;
    // return <EnterpriseLayout {...this.props}/>;
  }
}
