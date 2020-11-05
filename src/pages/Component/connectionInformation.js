/* eslint-disable prettier/prettier */
import React from 'react';
import { connect } from 'dva';
import EnvironmentVariable from '../../components/EnvironmentVariable';

@connect()
export default class Index extends React.Component {
  render() {
    const { appAlias } = this.props;
    return (
      <EnvironmentVariable
        title="组件连接信息"
        type="Outer"
        appAlias={appAlias}
      />
    );
  }
}
