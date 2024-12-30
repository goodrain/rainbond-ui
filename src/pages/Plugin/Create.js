import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { connect } from 'dva';
import { Card, Icon, Button } from 'antd';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '../../utils/global';
import styles from './Index.less';
import CreatePluginForm from '../../components/CreatePluginForm';
import pageheaderSvg from '@/utils/pageHeaderSvg';

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

    return (
      <PageHeaderLayout
        title={formatMessage({ id: 'teamPlugin.create.title' })}
        content="创建一个属于您的插件，创建好的插件可以在组件中使用。"
        titleSvg={pageheaderSvg.getSvg('apiSvg', 18)}
        extraContent={
          <Button onClick={() => {
            const { dispatch } = this.props;
            dispatch(
              routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/myplugns`)
            );
          }} type="default">
              <Icon type="home" />插件管理
          </Button>
        }
      >
        <Card>
          <div
            style={{
              width: 500,
              margin: '20px auto',
            }}
          >
            <CreatePluginForm isCreate onSubmit={this.handleSubmit} />
          </div>
        </Card>
      </PageHeaderLayout>
    );
  }
}
