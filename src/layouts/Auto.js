import React, { Component } from 'react'
import { Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import cookie from '@/utils/cookie';
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
  getLoginRole = (currUser) => {
    const { dispatch } = this.props;
    const { teams } = currUser
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0]
      const { team_region_name } = region[0]
      if (team_name && team_region_name) {
        dispatch(routerRedux.push(`/team/${team_name}/region/${team_region_name}/index`))
      } else {
        cookie.remove()
        dispatch(routerRedux.push(`/user/login`))
      }
    } else {
      if (currUser?.is_enterprise_admin) {
        dispatch(routerRedux.push(`/enterprise/${currUser?.enterprise_id}/index`))
      } else {
        cookie.remove()
        dispatch(routerRedux.push(`/user/login`))
      }
    }
  }
  render() {
    return (
      <div className={styles.loading_box}>
        <Spin size="large" />
      </div>
    )
  }
}
