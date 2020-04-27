import React from 'react';
import { connect } from 'dva';
import { notification } from 'antd';
@connect()
export default class ErrorBoundary extends React.PureComponent {
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
    const { dispatch } = this.props;
    dispatch({
      type: 'global/saveLog',
      payload: {
        msg: error.toString(),
      },
    });
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      notification.info({
        message: '捕获一个错误,马上修复请耐心等待',
      });
    }
    return children;
  }
}
