import { connect } from 'dva';
import { Button } from 'antd';
import { PureComponent } from 'react';
import  Result  from '../components/Result/index';

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
      <Result
        status="warning"
        title="UI遇到障碍，我们已经记录信息，请重试"
        extra={[
          <Button type="primary" key="console" onClick={()=>{
            window.location = window.location.href
          }}>
            刷新重试
          </Button>
        ]}
      />
    }
    return children;
  }
}
