/**
 * OuterCustomForm 组件的表单校验规则
 */

import { formatMessage } from 'umi-plugin-locale';

// 正则表达式
const regs = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
const rega = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
const rege = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

/**
 * 服务名称校验函数
 * 不允许以数字开头，不允许包含空格，不允许包含标点符号（允许连字符）
 */
export const validateServiceName = (_, value, callback) => {
  if (!value) {
    return callback(new Error(formatMessage({ id: 'placeholder.component_cname' })));
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
 * 创建地址校验函数
 * @param {string} endpointsType - 端点类型
 * @param {Function} handleIsRepeat - 检查重复的函数
 * @returns {Function} 校验函数
 */
export const createAddressValidator = (endpointsType, handleIsRepeat) => {
  return (rule, value, callback) => {
    if (!value) {
      callback(formatMessage({ id: 'placeholder.componentAddress' }));
      return;
    }

    if (typeof value === 'object') {
      value.map(item => {
        if (item == '') {
          callback(formatMessage({ id: 'placeholder.componentAddress' }));
          return null;
        }

        if (
          endpointsType == 'static' &&
          !regs.test(item || '') &&
          !rega.test(item || '') &&
          !rege.test(item || '')
        ) {
          callback(formatMessage({ id: 'placeholder.attrName' }));
        }
        if (handleIsRepeat(value)) {
          callback(formatMessage({ id: 'placeholder.notAttrName' }));
        }
      });
    }

    if (
      value && typeof value === 'object'
        ? value.join().search('127.0.0.1') !== -1 ||
        value.join().search('1.1.1.1') !== -1 ||
        value.join().search('localhost') !== -1
        : value.search('127.0.0.1') !== -1 ||
        value.search('1.1.1.1') !== -1 ||
        value.search('localhost') !== -1
    ) {
      callback(`${formatMessage({ id: 'placeholder.nonsupport' }, { nonsupport: value })}${value == '1.1.1.1' ? formatMessage({ id: 'placeholder.nonsupport.regAddress' }) : formatMessage({ id: 'placeholder.nonsupport.regLoopBack' })}`);
    }
    callback();
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
 * 端点类型校验规则
 */
export const getEndpointsTypeRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.endpoints' })
  }
];

/**
 * Namespace 校验规则（可选）
 */
export const getNamespaceRules = () => [
  {
    required: false,
    message: formatMessage({ id: 'placeholder.nameSpaceMsg' })
  }
];

/**
 * Kubernetes Service 名称校验规则
 */
export const getServiceNameK8sRules = () => [
  {
    required: true,
    message: formatMessage({ id: 'placeholder.serviceName' })
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
