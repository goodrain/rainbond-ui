import React, { PureComponent, Fragment } from "react";
import { connect } from 'dva';

@connect()
export default class SelectTeam extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currentTeam: {}
    };
  }
  componentDidMount() {
      const {teamName} = this.props;
  }
  render() {
      const { className } = this.props;
      return <div className={className}>TODO Select Region</div>
  }
}
