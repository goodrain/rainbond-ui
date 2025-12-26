/**
 * 国际化兼容层
 * 用于非组件环境（如 Utils 文件）中使用 formatMessage
 *
 * 注意：在模块加载时 umi 的 locale 系统可能还未初始化
 * 所以需要直接读取 locale 文件来提供同步的 formatMessage
 */
import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';

// 语言包映射
const localeMessages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/**
 * 获取当前语言
 */
export function getLocale() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('umi_locale') || 'zh-CN';
  }
  return 'zh-CN';
}

/**
 * 设置语言（刷新页面）
 */
export function setLocale(lang, reload = true) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('umi_locale', lang);
    if (reload) {
      window.location.reload();
    }
  }
}

/**
 * 获取所有支持的语言
 */
export function getAllLocales() {
  return Object.keys(localeMessages);
}

/**
 * 格式化消息
 * @param {object} descriptor - { id: string, defaultMessage?: string }
 * @param {object} values - 插值变量
 */
export function formatMessage(descriptor, values) {
  const { id, defaultMessage } = descriptor || {};
  const locale = getLocale();
  const messages = localeMessages[locale] || localeMessages['zh-CN'];
  let message = messages[id] || defaultMessage || id || '';

  // 处理插值 {name} -> values.name
  if (values && typeof message === 'string') {
    Object.keys(values).forEach(key => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), values[key]);
    });
  }

  return message;
}
