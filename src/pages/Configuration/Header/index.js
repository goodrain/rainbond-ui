/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '@/layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import { routerRedux } from 'dva/router';
import { Button } from 'antd';
import globalUtil from '../../../utils/global';

/* eslint react/no-array-index-key: 0 */

@connect()
export default class Configuration extends PureComponent {
  render() {
    const { breadcrumbList, children } = this.props;
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'appConfiguration.title'})}
        content={formatMessage({id: 'appConfiguration.desc'})}
        titleSvg={pageheaderSvg.getPageHeaderSvg('setting',18)}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview`)
            );
          }} icon="home">
            {formatMessage({ id: 'menu.app.dashboard' })}
          </Button>
        }
      >
        {children}
      </PageHeaderLayout>
    );
  }
}
