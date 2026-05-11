/**
 * ThirdList 组件的表单校验规则
 */

import { formatMessage } from '@/utils/intl';

const COMPONENT_NAME_MAX_LENGTH = 32;
const K8S_COMPONENT_NAME_MAX_LENGTH = 32;
const K8S_APP_NAME_MAX_LENGTH = 16;

/**
 * 服务名称校验函数
 * 不允许以数字开头，不允许包含空格，不允许包含标点符号（允许连字符）
 */
export const validateServiceName = (_, value, callback) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'versionUpdata_6_1.serviceName.placeholder' })));
  }

  // 检查是否以数字开头
  if (/^\d/.test(value)) {
    return callback(new Error('服务名称不能以数字开头'));
  }

  // 检查是否包含空格
  if (/\s/.test(value)) {
    return callback(new Error('服务名称不能包含空格'));
  }

  // 检查是否包含标点符号（中英文标点），允许连字符(-)，不允许下划线(_)
  if (/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~，。！？；：、""''（）【】《》…—·]/.test(value)) {
    return callback(new Error('服务名称不能包含标点符号'));
  }

  callback();
};

const validateK8sName = (value, callback, maxLength, maxMessageId) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'componentOverview.EditName.input_en_name' })));
  }

  if (value.length > maxLength) {
    return callback(new Error(formatMessage({ id: maxMessageId })));
  }

  // K8s 命名规范：必须以小写字母开头，只能包含小写字母、数字和连字符，必须以字母或数字结尾
  const k8sNameRegex = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
  if (!k8sNameRegex.test(value)) {
    return callback(new Error(formatMessage({ id: 'componentOverview.EditName.only' })));
  }

  callback();
};

/**
 * K8s 组件名称校验函数
 * 必须符合 K8s 命名规范：以小写字母开头，只能包含小写字母、数字和连字符
 */
export const validateK8sComponentName = (_, value, callback) => (
  validateK8sName(value, callback, K8S_COMPONENT_NAME_MAX_LENGTH, 'placeholder.max32')
);

/**
 * K8s 应用名称校验函数
 * 保持应用英文名原有 16 位限制
 */
export const validateK8sAppName = (_, value, callback) => (
  validateK8sName(value, callback, K8S_APP_NAME_MAX_LENGTH, 'placeholder.max16')
);

/**
 * 服务名称校验规则
 */
export const getServiceNameRules = () => [
  {
    required: true,
    validator: validateServiceName
  },
  {
    max: COMPONENT_NAME_MAX_LENGTH,
    message: formatMessage({ id: 'placeholder.max32' })
  }
];

/**
 * K8s 组件名称校验规则
 */
export const getK8sComponentNameRules = () => [
  {
    required: true,
    validator: validateK8sComponentName
  }
];

/**
 * 代码版本校验规则
 */
export const getCodeVersionRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'versionUpdata_6_1.codeVersion.placeholder' })
  }
];

/**
 * Webhook 开关校验规则
 */
export const getOpenWebhookRules = () => [
  {
    required: true,
    message: ''
  }
];

/**
 * 架构类型校验规则
 */
export const getArchRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.code_version' })
  }
];

/**
 * 应用名称校验规则（group_name）
 */
export const getGroupNameRules = () => [
  {
    required: true,
    validator: validateServiceName
  },
  {
    max: 24,
    message: formatMessage({ id: 'placeholder.max24' })
  }
];

/**
 * K8s 应用名称校验规则（k8s_app）
 */
export const getK8sAppRules = () => [
  {
    required: true,
    validator: validateK8sAppName
  }
];
