/* eslint-disable prettier/prettier */
import React from 'react';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import EnvironmentVariable from '../../components/EnvironmentVariable';

@connect()
export default class Index extends React.Component {
  render() {
    const { appAlias } = this.props;
    return (
      <EnvironmentVariable
        title={<FormattedMessage id='componentOverview.body.ConnectionInformation.title'/>}
        type="Outer"
        appAlias={appAlias}
      />
    );
  }
}
