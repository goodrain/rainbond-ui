/**
 * 国际化 HOC 包装器
 * 用于为类组件注入 intl 对象
 */
import React from 'react';
import { useIntl } from 'umi';

/**
 * 高阶组件，为类组件注入 intl 对象
 * @param {React.Component} WrappedComponent - 需要包装的组件
 * @returns {React.Component} 包装后的组件
 *
 * @example
 * // 使用方式
 * import { withIntl } from '@/utils/withIntl';
 *
 * @connect(...)
 * class MyComponent extends PureComponent {
 *   render() {
 *     const { intl } = this.props;
 *     return <div>{intl.formatMessage({ id: 'xxx' })}</div>;
 *   }
 * }
 * export default withIntl(MyComponent);
 */
export function withIntl(WrappedComponent) {
  function WithIntlComponent(props) {
    const intl = useIntl();
    return <WrappedComponent {...props} intl={intl} />;
  }

  // 保留原组件的显示名称，便于调试
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithIntlComponent.displayName = `withIntl(${displayName})`;

  return WithIntlComponent;
}

export default withIntl;
