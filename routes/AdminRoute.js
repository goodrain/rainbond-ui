import { connect } from 'dva';
import React, { Component } from 'react'
import Exception from '../src/components/Exception'
import apiconfig from '../config/api.config'

@connect(({ user }) => ({
  currentUser: user.currentUser
}))
export default class PrivateRoute extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { route } = this.props;
    const { currentUser } = this.props;
    return (
      <>
        {
          currentUser?.is_enterprise_admin
            ?
            this.props.children
            :
            <Exception actions type={404} />
        }
      </>
    )
  }
}

