/**
 * HelmCmdForm 组件的表单校验规则
 */

import { formatMessage } from '@/utils/intl';


/**
 * 应用名称校验函数
 * 不允许以数字开头，不允许包含空格，不允许包含标点符号（允许连字符）
 */
export const validateAppName = (_, value, callback) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'popover.newApp.appName.placeholder' })));
  }

  // 检查是否以数字开头
  if (/^\d/.test(value)) {
    return callback(new Error('应用名称不能以数字开头'));
  }

  // 检查是否包含空格
  if (/\s/.test(value)) {
    return callback(new Error('应用名称不能包含空格'));
  }

  // 检查是否包含标点符号（中英文标点），允许连字符(-)，不允许下划线(_)
  if (/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~，。！？；：、""''（）【】《》…—·]/.test(value)) {
    return callback(new Error('应用名称不能包含标点符号'));
  }

  callback();
};

/**
 * K8s 应用名称校验函数
 * 必须符合 K8s 命名规范：以小写字母开头，只能包含小写字母、数字和连字符
 */
export const validateK8sAppName = (_, value, callback) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'popover.newApp.appEngName.placeholder' })));
  }

  if (value.length > 32) {
    return callback(new Error(formatMessage({ id: 'placeholder.max32' })));
  }

  // K8s 命名规范：必须以小写字母开头，只能包含小写字母、数字和连字符，必须以字母或数字结尾
  const k8sNameRegex = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
  if (!k8sNameRegex.test(value)) {
    return callback(new Error(formatMessage({ id: 'placeholder.nameSpaceReg' })));
  }

  callback();
};

/**
 * 应用名称校验规则（group_name）
 */
export const getGroupNameRules = () => [
  {
    required: true,
    validator: validateAppName
  },
  {
    max: 24,
    message: formatMessage({ id: 'placeholder.max24' })
  }
];

/**
 * K8s 应用名称校验规则（k8s_app）
 */
export const getK8sAppNameRules = () => [
  {
    required: true,
    validator: validateK8sAppName
  }
];

/**
 * 镜像来源校验规则
 */
export const getImageSourceRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.code_version' })
  }
];

/**
 * Helm 命令校验规则
 */
export const getHelmCmdRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.helmCmdMsg' })
  }
];
