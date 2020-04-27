import React from 'react';

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
    console.log('err', error);
    console.log('errorInfo', errorInfo);
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;
    if (hasError) {
      console.log('进来', hasError);

      // 你可以自定义降级后的 UI 并渲染
      return <h1>Something went wrong.</h1>;
    }
    console.log('hasError', hasError);

    return children;
  }
}
