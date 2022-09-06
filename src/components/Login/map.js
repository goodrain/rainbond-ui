import React from 'react';
import { Input, Icon } from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';

const map = {
  UserName: {
    component: Input,
    props: {
      size: 'large',
      prefix: <Icon type="user" className={styles.prefixIcon} />,
      placeholder: 'admin',
    },
    rules: [{
      required: true, message: formatMessage({id:'login.name'}),
    }],
  },
  Password: {
    component: Input,
    props: {
      size: 'large',
      prefix: <Icon type="lock" className={styles.prefixIcon} />,
      type: 'password',
      placeholder: '888888',
    },
    rules: [{
      required: true, message: formatMessage({id:'login.pass'}),
    }],
  },
  Mobile: {
    component: Input,
    props: {
      size: 'large',
      prefix: <Icon type="mobile" className={styles.prefixIcon} />,
      placeholder: formatMessage({id:'login.iphone'}),
    },
    rules: [{
      required: true, message: formatMessage({id:'login.input_iphone'}),
    }, {
      pattern: /^1\d{10}$/, message: formatMessage({id:'login.error'}),
    }],
  },
  Captcha: {
    component: Input,
    props: {
      size: 'large',
      prefix: <Icon type="mail" className={styles.prefixIcon} />,
      placeholder: formatMessage({id:'login.Verification'}),
    },
    rules: [{
      required: true, message: formatMessage({id:'login.input_Verification'}),
    }],
  },
};

export default map;
