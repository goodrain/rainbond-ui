/* eslint-disable prettier/prettier */
import React from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import EnvironmentVariable from '../../components/EnvironmentVariable';

@connect(null, null, null, { withRef: true })
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
