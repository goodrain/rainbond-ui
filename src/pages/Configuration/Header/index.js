/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
/* eslint react/no-array-index-key: 0 */

export default class Configuration extends PureComponent {
  render() {
    const { breadcrumbList, children } = this.props;
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title="应用配置组管理"
        content="配置组是通过环境变量注入到当前应用指定的组件运行环境中"
      >
        {children}
      </PageHeaderLayout>
    );
  }
}
