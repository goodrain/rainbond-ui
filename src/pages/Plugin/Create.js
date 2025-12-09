import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { connect } from 'dva';
import { Card, Icon, Button } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import handleAPIError from '../../utils/error';
import CreatePluginForm from '../../components/CreatePluginForm';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import styles from './Index.less';

@connect()
export default class Index extends PureComponent {
  // 提交创建插件
  handleSubmit = val => {
    const { dispatch } = this.props;
    dispatch({
      type: 'plugin/createPlugin',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        ...val
      },
      callback: data => {
        dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns/${
              data && data.bean.plugin_id
            }`
          )
        );
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };
  render() {
    const { dispatch } = this.props;

    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'teamPlugin.create.title' })}
        content={formatMessage({ id: 'teamPlugin.create.desc' })}
        titleSvg={pageheaderSvg.getSvg('apiSvg', 18)}
        extraContent={
          <Button
            onClick={() => {
              dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`
                )
              );
            }}
            type="default"
          >
            <Icon type="home" />
            {formatMessage({ id: 'global.fetchAccessText.plugin' })}
          </Button>
        }
      >
        <Card>
          <div
            style={{
              width: 500,
              margin: '20px auto'
            }}
          >
            <CreatePluginForm isCreate onSubmit={this.handleSubmit} />
          </div>
        </Card>
      </PageHeaderLayout>
    );
  }
}
