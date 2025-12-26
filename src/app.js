import React from 'react';
import { LocaleProvider } from 'antd';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import enUS from 'antd/lib/locale-provider/en_US';
import moment from 'moment';
import 'moment/locale/zh-cn';

// antd 语言包映射
const antdLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// moment 语言映射
const momentLocales = {
  'zh-CN': 'zh-cn',
  'en-US': 'en',
};

// 获取当前语言
function getLocale() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('umi_locale') || 'zh-CN';
  }
  return 'zh-CN';
}

// 运行时配置：用 LocaleProvider 包裹根组件
export function rootContainer(container) {
  const locale = getLocale();
  const antdLocale = antdLocales[locale] || zhCN;

  // 设置 moment 语言
  moment.locale(momentLocales[locale] || 'zh-cn');

  return React.createElement(LocaleProvider, { locale: antdLocale }, container);
}
