import React, { Component } from 'react'
import { Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { workspaceLanding } from '../utils/teamApplications';
import styles from './Auto.less'
@connect(({ user }) => ({
  currUser: user.currentUser,
}))
export default class Auto extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
    this.getLoginRole( this.props.currUser)
  }
  componentDidUpdate(previous) {
    if (previous.currUser !== this.props.currUser) this.getLoginRole(this.props.currUser);
  }
  getLoginRole = (currUser) => {
    const { dispatch } = this.props;
    const path = workspaceLanding(currUser);
    if (path) dispatch(routerRedux.replace(path));
  }
  render() {
    return (
      <div className={styles.loading_box}>
        <Spin size="large" />
      </div>
    )
  }
}
