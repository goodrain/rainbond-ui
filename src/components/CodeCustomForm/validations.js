/**
 * CodeCustomForm 组件的表单校验规则
 */

import { formatMessage } from '@/utils/intl';

/**
 * 服务名称校验函数
 * 不允许以数字开头，不允许包含空格，不允许包含标点符号（允许连字符）
 */
export const validateServiceName = (_, value, callback) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'placeholder.service_cname' })));
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

/**
 * K8s 组件名称校验函数
 * 必须符合 K8s 命名规范：以小写字母开头，只能包含小写字母、数字和连字符
 */
export const validateK8sComponentName = (_, value, callback) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'placeholder.k8s_component_name' })));
  }

  if (value.length > 16) {
    return callback(new Error(formatMessage({ id: 'placeholder.max16' })));
  }

  // K8s 命名规范：必须以小写字母开头，只能包含小写字母、数字和连字符，必须以字母或数字结尾
  const k8sNameRegex = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
  if (!k8sNameRegex.test(value)) {
    return callback(new Error(formatMessage({ id: 'placeholder.nameSpaceReg' })));
  }

  callback();
};

/**
 * Git/SVN URL 校验函数生成器
 * @param {string} serverType - 服务器类型 ('git', 'svn', 'oss')
 * @returns {Function} 校验函数
 */
export const createUrlValidator = (serverType) => {
  return (_, value, callback) => {
    let urlCheck;
    if (serverType === 'svn') {
      urlCheck = /^(ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    } else {
      urlCheck = /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi;
    }

    if (urlCheck.test(value)) {
      callback();
    } else {
      callback(formatMessage({ id: 'componentOverview.body.ChangeBuildSource.Illegal' }));
    }
  };
};

/**
 * 服务名称校验规则
 */
export const getServiceNameRules = () => [
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
 * K8s 组件名称校验规则
 */
export const getK8sComponentNameRules = () => [
  {
    required: true,
    validator: validateK8sComponentName
  }
];

/**
 * Git URL 校验规则
 * @param {Function} urlValidator - URL 校验函数
 * @returns {Array} 校验规则数组
 */
export const getGitUrlRules = (urlValidator) => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.git_url' })
  },
  {
    validator: urlValidator,
    message: formatMessage({ id: 'placeholder.notGit_url' })
  }
];

/**
 * 用户名校验规则（可选）
 */
export const getUsernameRules = () => [
  {
    required: false,
    message: formatMessage({ id: 'placeholder.username_1' })
  }
];

/**
 * 密码校验规则（可选）
 */
export const getPasswordRules = () => [
  {
    required: false,
    message: formatMessage({ id: 'placeholder.password_1' })
  }
];

/**
 * 子目录路径校验规则
 */
export const getSubdirectoriesRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.subdirectories' })
  }
];

/**
 * 代码版本校验规则
 */
export const getCodeVersionRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.code_version' })
  }
];

/**
 * 架构选择校验规则
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
