/**
 * AddOrEditImageRegistry 组件的表单校验规则
 */

import { formatMessage } from 'umi-plugin-locale';

/**
 * 不能输入汉字的校验函数（同时检查空字符串）
 */
export const validateNoChinese = (_, value, callback) => {
  const noChinese = /^[^\u4e00-\u9fa5]+$/g;
  const noEmpty = /^\s*$/g;

  if (value && !noChinese.test(value)) {
    callback(formatMessage({ id: 'placeholder.reg_Chinese' }));
  } else if (value && noEmpty.test(value)) {
    callback(formatMessage({ id: 'placeholder.regEmpty' }));
  } else {
    callback();
  }
};

/**
 * 创建 secret_id 校验函数
 * @param {Array} imageList - 已存在的镜像仓库列表
 * @returns {Function} 校验函数
 */
export const createSecretValidator = (imageList) => {
  return (_, value, callback) => {
    // 只允许输入小写字母
    const lowercaseOnly = /^[a-z]+$/g;

    if (imageList && imageList.some(item => item.secret_id === value)) {
      callback(formatMessage({ id: 'placeholder.warehouse_exist' }));
    } else if (value && !lowercaseOnly.test(value)) {
      callback(formatMessage({ id: 'placeholder.lowercase' }));
    } else {
      callback();
    }
  };
};

/**
 * 仓库类型校验规则
 */
export const getHubTypeRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.warehouse_name' })
  }
];

/**
 * 仓库名称校验规则（secret_id）
 * @param {Array} imageList - 已存在的镜像仓库列表
 */
export const getSecretIdRules = (imageList) => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.warehouse_name' })
  },
  {
    validator: createSecretValidator(imageList)
  },
  {
    max: 32,
    message: formatMessage({ id: 'placeholder.max32' })
  }
];

/**
 * 仓库地址校验规则（domain）
 */
export const getDomainRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.git_url_domain' })
  },
  {
    max: 255,
    message: formatMessage({ id: 'placeholder.max255' })
  },
  {
    pattern: /^(http:\/\/|https:\/\/)/,
    message: formatMessage({ id: 'placeholder.warehouse_address.Ban' })
  }
];

/**
 * 用户名校验规则
 */
export const getUsernameRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.userName' })
  },
  {
    max: 255,
    message: formatMessage({ id: 'placeholder.max255' })
  }
];

/**
 * 密码校验规则
 */
export const getPasswordRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.password_1' })
  },
  {
    max: 255,
    message: formatMessage({ id: 'placeholder.max255' })
  }
];
