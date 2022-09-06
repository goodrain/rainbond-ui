import React from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import Result from '../../components/Result';
import styles from './RegisterResult.less';

const actions = (
  <div className={styles.actions}>
    <a href="/">
      <Button size="large"><FormattedMessage id="login.RegisterResult.back"/></Button>
    </a>
  </div>
);

export default ({ location }) => (
  <Result
    className={styles.registerResult}
    type="success"
    title={
      <div className={styles.title}>
        <FormattedMessage id="login.RegisterResult.your"/>{location.state ? location.state.account : 'xxx'} <FormattedMessage id="login.RegisterResult.success"/>
      </div>
    }
    description=""
    actions={actions}
    style={{ marginTop: 172 }}
  />
);
