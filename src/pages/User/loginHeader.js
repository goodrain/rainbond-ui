import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import styles from './Login.less';

export default class LoginHeader extends PureComponent {
  render() {
    return (
      <div className={styles.loginHeader}>
        <h1><FormattedMessage id="login.loginComponent.title" defaultMessage="登录" /></h1>
        <p>
          <span className={styles.welcome}>
            <svg className={styles.welcomeIcon} viewBox="0 0 1066 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <path d="M879.701333 182.4l-2.346666-2.346667C694.442667-3.370667 397.525333-2.901333 214.144 180.053333s-182.912 480.426667 0 663.338667A467.285333 467.285333 0 0 0 546.218667 981.333333h349.866666a36.138667 36.138667 0 0 0 36.138667-36.138666V778.666667a487.168 487.168 0 0 0 60.501333-121.045334 470.613333 470.613333 0 0 0-113.066666-475.221333z m-373.802666 518.4l28.586666-152.021333H402.688l-29.056 152.021333H296.234667L365.226667 339.114667h77.397333l-26.752 141.226666h132.266667l27.221333-141.226666h77.354667l-68.949334 361.685333h-77.824z m224.170666 0h-77.397333l50.218667-262.698667h77.354666l-50.176 262.698667z m53.461334-306.816a42.24 42.24 0 0 1-32.341334 11.733333 35.669333 35.669333 0 0 1-37.546666-33.792V368.213333a43.946667 43.946667 0 0 1 44.544-44.117333 36.693333 36.693333 0 0 1 38.954666 34.261333v3.754667c0 11.733333-5.162667 23.466667-13.610666 31.914667z" fill="currentColor" />
            </svg>
            {' ~ '}
          </span>
          <FormattedMessage id="login.loginComponent.subtitle" defaultMessage="欢迎回来，请登录您的账户" />
        </p>
      </div>
    );
  }
}
