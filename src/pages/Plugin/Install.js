import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Card } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import styles from './Index.less';
import CreatePluginForm from '../../components/CreatePluginForm';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import Market from '../Create/market_plugin'

@connect()
export default class Index extends PureComponent {
  handleSubmit = val => {
    this.props.dispatch({
      type: 'plugin/createPlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...val,
      },
      callback: data => {
        this.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${data &&
              data.bean.plugin_id}`
          )
        );
      },
    });
  };
  render() {
    const content = <div className={styles.pageHeaderContent} />;

    const extraContent = <div className={styles.extraImg} />;

    return (
      <PageHeaderLayout
        title={formatMessage({id:'teamPlugin.install.title'})}
        isFooter={true}
        titleSvg={pageheaderSvg.getSvg('apiSvg',18)}
        // content={content}
        // extraContent={extraContent}
      >
        <Market isAddMarket={false}></Market>
      </PageHeaderLayout>
    );
  }
}