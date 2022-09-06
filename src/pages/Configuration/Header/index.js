/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
/* eslint react/no-array-index-key: 0 */

export default class Configuration extends PureComponent {
  render() {
    const { breadcrumbList, children } = this.props;
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'appConfiguration.title'})}
        content={formatMessage({id: 'appConfiguration.desc'})}
      >
        {children}
      </PageHeaderLayout>
    );
  }
}
