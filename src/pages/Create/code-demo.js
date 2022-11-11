import { Card, Form } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import CodeDemoForm from '../../components/CodeDemoForm';
import TopUpHints from '../../components/TopUpHints';
import globalUtil from '../../utils/global';
import styles from './Index.less';

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  groups: global.groups,
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  fetchGroup = () => {
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
      },
    });
  };
  handleSubmit = value => {
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'createApp/createAppByCode',
      payload: {
        team_name: teamName,
        code_from: 'gitlab_demo',
        ...value,
      },
      callback: data => {
        const appAlias = data && data.bean.service_alias;
        this.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`
          )
        );
      },
    });
  };
  render() {
    const code = decodeURIComponent(this.props.match.params.code || '');
    return (
      <Card
      style={{ 
        boxShadow: 'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
      }}
      >
        <TopUpHints />
        <div
          className={styles.formWrap}
          style={{
            width:
              this.props.handleType && this.props.handleType === 'Service'
                ? 'auto'
                : '600px',
          }}
        >
          <CodeDemoForm
            data={{ git_url: code || '' }}
            onSubmit={this.handleSubmit}
          />
        </div>
      </Card>
    );
  }
}
