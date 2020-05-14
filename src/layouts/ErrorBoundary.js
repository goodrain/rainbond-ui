import { notification } from 'antd';
import { connect } from 'dva';
import { PureComponent } from 'react';
import Loading from '@/components/Loading';

@connect(({ user }) => ({
  currentUser: user.currentUser,
}))
export default class ErrorBoundary extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.log('err', error.toString());
    console.log('errorInfo', errorInfo);
    if (
      process &&
      process.env &&
      process.env.NODE_ENV &&
      process.env.NODE_ENV === 'development'
    ) {
      return null;
    }
    return this.saveLog(error);
  }

  saveLog = error => {
    const { dispatch, currentUser } = this.props;
    dispatch({
      type: 'global/saveLog',
      payload: {
        username: currentUser && currentUser.user_name,
        enterprise_id: currentUser && currentUser.enterprise_id,
        address: window.location.href,
        msg: `错误：${error.toString()}`,
      },
    });
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      notification.destroy();
      notification.info({
        message: 'UI遇到故障已记录,我们会尽快修复请稍后重试',
      });
      return <Loading />;
    }
    return children;
  }
}
