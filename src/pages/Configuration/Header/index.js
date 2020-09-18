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
        content="配置组通过环境变量，文件挂载等方式注入到指定到组件运行环境中"
      >
        {children}
      </PageHeaderLayout>
    );
  }
}
