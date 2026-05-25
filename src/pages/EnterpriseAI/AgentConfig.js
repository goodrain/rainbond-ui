import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import userUtil from '../../utils/user';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import AgentConfigForm from '../EnterpriseSetting/agentConfig';

@connect(({ user }) => ({
  user: user.currentUser
}))
export default class EnterpriseAIAgentConfig extends PureComponent {
  componentWillMount() {
    const { dispatch, user } = this.props;
    if (!userUtil.isCompanyAdmin(user)) {
      dispatch(routerRedux.push('/'));
    }
  }

  render() {
    return (
      <PageHeaderLayout
        title={<FormattedMessage id="enterpriseAI.agentConfig.PageHeaderLayout.title" />}
        content={<FormattedMessage id="enterpriseAI.agentConfig.PageHeaderLayout.content" />}
        titleSvg={pageheaderSvg.getPageHeaderSvg('agentConfig', 18)}
        isContent={true}
      >
        <AgentConfigForm {...this.props} />
      </PageHeaderLayout>
    );
  }
}
