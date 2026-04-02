const HELM_CHART_PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const HELM_CHART_WHITESPACE_PATTERN = /\s/;

const VALIDATION_MESSAGE_CONFIG = {
  contains_whitespace: {
    id: 'resourceCenter.helm.validation.chartAddressSpaces',
    defaultMessage: 'Chart 地址中不能包含空格，请删除后再继续',
  },
  includes_protocol: {
    id: 'resourceCenter.helm.validation.chartAddressProtocol',
    defaultMessage: '协议请在左侧选择，右侧地址不要重复填写 https://、http:// 或 oci://',
  },
};

function normalizeChartProtocol(chartProtocol) {
  return chartProtocol || 'https://';
}

function getHelmChartUrlValidation(chartProtocol, chartAddress) {
  const rawAddress = typeof chartAddress === 'string' ? chartAddress : '';
  const trimmedAddress = rawAddress.trim();

  if (!trimmedAddress) {
    return {
      chartUrl: '',
      errorCode: '',
      hasValue: false,
    };
  }

  if (HELM_CHART_WHITESPACE_PATTERN.test(rawAddress)) {
    return {
      chartUrl: '',
      errorCode: 'contains_whitespace',
      hasValue: true,
    };
  }

  if (HELM_CHART_PROTOCOL_PATTERN.test(trimmedAddress)) {
    return {
      chartUrl: '',
      errorCode: 'includes_protocol',
      hasValue: true,
    };
  }

  return {
    chartUrl: `${normalizeChartProtocol(chartProtocol)}${trimmedAddress}`,
    errorCode: '',
    hasValue: true,
  };
}

function getHelmChartUrlValidationMessage(errorCode, formatter) {
  const config = VALIDATION_MESSAGE_CONFIG[errorCode];
  if (!config) {
    return '';
  }
  if (typeof formatter === 'function') {
    return formatter(config);
  }
  return config.defaultMessage;
}

module.exports = {
  getHelmChartUrlValidation,
  getHelmChartUrlValidationMessage,
};
