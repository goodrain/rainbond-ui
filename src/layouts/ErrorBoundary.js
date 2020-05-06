import { notification } from 'antd';
import { connect } from 'dva';
import { PureComponent } from 'react';

@connect(({ user }) => ({
  currentUser: user.currentUser,
}))
export default class ErrorBoundary extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.log('err', error.toString());
    console.log('errorInfo', errorInfo);
    this.saveLog(error);
  }

  saveLog = error => {
    const { dispatch, currentUser } = this.props;
    dispatch({
      type: 'global/saveLog',
      payload: {
        msg: `用户名称：${currentUser && currentUser.user_name} 企业ID ${
          currentUser && currentUser.enterprise_id
        } 地址 ${window.location.href} 错误：${error.toString()}`,
      },
    });
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      notification.destroy()
      notification.info({
        message: '遇到故障,我们会尽快修复、请稍后重试',
      });
    }
    return children;
  }
}
