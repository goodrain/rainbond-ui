/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
/* eslint-disable no-void */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
import { notification, Modal } from 'antd';
import axios from 'axios';
import globalUtil from '../utils/global';
import cookie from './cookie';
import handleAPIError from './error';
import { updateRenewedTokenFromResponse } from './token';
import { formatMessage } from '@/utils/intl';
import { history, getDvaApp } from 'umi';
import {
  captureRequestError,
  finishSlowRequestTracking,
  startSlowRequestTracking
} from '../sentry';
import { captureErrorViewed } from '../posthog';
import { trackSlowRequestLifecycle } from './requestSlowTelemetry';
import { renderPreflightContent } from './marketInstallPreflight';


const codeMessage = {
  200: `${formatMessage({id:'utils.request.back_data'})}`,
  201: `${formatMessage({id:'utils.request.add'})}`,
  202: `${formatMessage({id:'utils.request.request'})}`,
  204: `${formatMessage({id:'utils.request.delete'})}`,
  400: `${formatMessage({id:'utils.request.error'})}`,
  401: `${formatMessage({id:'utils.request.No_permission'})}`,
  403: `${formatMessage({id:'utils.request.authorization'})}`,
  404: `${formatMessage({id:'utils.request.record'})}`,
  406: `${formatMessage({id:'utils.request.format'})}`,
  410: `${formatMessage({id:'utils.request.Permanently_delete'})}`,
  422: `${formatMessage({id:'utils.request.Validation_error'})}`,
  500: `${formatMessage({id:'utils.request.server_error'})}`,
  502: `${formatMessage({id:'utils.request.Bad_Gateway'})}`,
  503: `${formatMessage({id:'utils.request.unavailable'})}`,
  504: `${formatMessage({id:'utils.request.timeout'})}`
};

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  if (response.config?.showMessage !== false) {
    notification.warning({
      message:  formatMessage({id:'utils.request.warning_url'},{url:response.url}),
      description: errortext
    });
  }

  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;

  throw error;
}

export function getRequestFailureMetadata(error, responseData) {
  const response = error && error.response;
  const data = responseData || (response && response.data) || {};
  const httpStatus = response && Number(response.status) ? Number(response.status) : 0;
  const businessCode = data && data.code;
  if (businessCode !== undefined && businessCode !== null && (typeof businessCode === 'number' || /^\d+$/.test(String(businessCode)) || /^[A-Z][A-Z0-9_]*$/.test(String(businessCode)))) {
    return {
      error_code: `business_${businessCode}`,
      error_category: 'business_failure',
      http_status: httpStatus
    };
  }
  if (httpStatus >= 400 && httpStatus < 500) {
    return { error_code: `http_${httpStatus}`, error_category: 'http_4xx', http_status: httpStatus };
  }
  if (httpStatus >= 500) {
    return { error_code: `http_${httpStatus}`, error_category: 'http_5xx', http_status: httpStatus };
  }
  if (error && (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || ''))) {
    return { error_code: 'timeout', error_category: 'timeout', http_status: 0 };
  }
  return { error_code: 'network_error', error_category: 'network_error', http_status: 0 };
}

export function getRequestFailureResult(error, responseData, options = {}, handleErrorResult) {
  const metadata = getRequestFailureMetadata(error, responseData);
  if (error && typeof error === 'object') {
    error.requestTelemetry = metadata;
  }
  if (!options.returnErrorMetadata) {
    return handleErrorResult;
  }
  return {
    __rainbondRequestFailure: true,
    ...metadata
  };
}

function handleStoreDispatch(type, payload = {}) {
  const app = getDvaApp();
  if (app && app._store) {
    app._store.dispatch({
      type,
      payload
    });
  }
}

/**
 * 处理特殊业务错误码（需要特殊UI交互的错误）
 * @returns {boolean} 是否是特殊错误码（已处理）
 */
function handleSpecialErrorCode(code, resData, options, error, TEAM_NAME, REGION_NAME, url) {
  switch (code) {
    case 10400:
      // 用户未激活
      handleStoreDispatch('global/setNouse', { isNouse: true });
      return true;

    case 10403:
      // 访问资源所属团队与当前团队不一致
      if (resData.data?.bean?.service_team_name) {
        location.href = globalUtil.replaceUrlTeam(resData.data.bean.service_team_name);
      }
      return true;

    case 10404:
      // 访问资源集群与当前集群不一致
      if (resData.data?.bean?.service_region) {
        location.href = globalUtil.replaceUrlRegion(resData.data.bean.service_region);
      }
      return true;

    case 10405:
      // 需要登录
      handleStoreDispatch('global/showNeedLogin');
      if (options.handleError) {
        options.handleError(error);
      }
      return true;

    case 10406:
    case 10413:
    case 20800:
      // 10406: 集群资源不足
      // 10413: 租户资源不足
      // 20800: 组件构建失败
      const AppID = globalUtil.getAppID();
      if (TEAM_NAME && REGION_NAME && AppID) {
        history.push(`/team/${TEAM_NAME}/region/${REGION_NAME}/apps/${AppID}/overview`);
      }
      handleStoreDispatch('global/showMemoryTip', { message: code });
      return true;

    case 10407:
      // 需要企业认证
      cookie.setGuide('appStore', 'true');
      if (resData.data?.bean?.name) {
        handleStoreDispatch('global/showAuthCompany', {
          market_name: resData.data.bean.name
        });
      }
      return true;

    case 10408:
      // 余额不足
      handleStoreDispatch('global/showNoMoneyTip', {
        message: resData.msg_show
      });
      return true;

    case 10409:
      // 应用市场连接超时
      cookie.setGuide('appStore', 'true');
      notification.warning({
        message: formatMessage({id:'utils.request.connection_timedout'})
      });
      return true;

    case 10410:
      // 显示付费提示
      handleStoreDispatch('global/showPayTip');
      return true;

    case 10411:
    case 10421:
      // 集群请求错误，静默处理
      if (options.handleError) {
        options.handleError(error);
      }
      if (options.noModels) {
        return false; // 让外层处理 Promise.reject
      }
      return true;

    case 10412:
      // 应用市场安装前检测阻断
      const preflightBean = resData.data?.bean || {};
      const safePreflightBean = {
        ...preflightBean,
        summary: preflightBean.summary || resData.msg_show ||
          '当前环境不满足应用安装条件'
      };
      Modal.error({
        title: '暂不能安装',
        content: renderPreflightContent(safePreflightBean, 'install'),
        okText: '我知道了'
      });
      if (options.handleError) {
        options.handleError(error);
      }
      return true;

    case 20001:
    case 20002:
    case 20003:
      // 服务成熟度相关错误
      if (options.handleError) {
        options.handleError(error);
      }
      return true;

    default:
      return false;
  }
}

function handleData(response) {
  let res = {};
  if (response) {
    res = (response.data && response.data.data) || {};
    res._code = response.status;
    res.response_data = response.data || {};
    res.status_code = response.status;
    res._condition = response.data && response.data.code;
    res.business_code = response.data && response.data.code;
    res.msg_show = response.data && response.data.msg_show;
  }
  return res;
}
/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options) {
  const defaultOptions = {
    credentials: 'include'
  };
  const newOptions = {
    ...defaultOptions,
    ...options
  };
  // if (newOptions.method === "POST" || newOptions.method === "PUT") {
  newOptions.headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',

    ...newOptions.headers
  };
  newOptions.body = JSON.stringify(newOptions.body);
  // }

  if (newOptions.passAuthorization === void 0) {
    newOptions.passAuthorization = true;
  }

  const headers = newOptions.headers || {};

  newOptions.headers = {
    ...headers
  };

  const token = cookie.get('token');
  const teamName = cookie.get('team_name');
  const regionName = cookie.get('region_name');
  const currRegionName = globalUtil.getCurrRegionName();
  const currTeamName = globalUtil.getCurrTeamName();
  const Authorization = newOptions.isToken && options.headers.Authorization

  let interfaceRegionName = '';
  let interfaceTeamName = '';
  if (token && newOptions.passAuthorization && !newOptions.isToken) {
    newOptions.headers.Authorization = `GRJWT ${token}`;
  } else {
    newOptions.headers.Authorization = Authorization;
  }

  if (
    url &&
    (url.lastIndexOf('/groups') > -1 || url.lastIndexOf('/topological') > -1) &&
    newOptions.params &&
    newOptions.params.region_name
  ) {
    interfaceRegionName = newOptions.params.region_name;
  }
  if (
    newOptions.data &&
    newOptions.data.region_name &&
    newOptions.data.team_name
  ) {
    interfaceRegionName = newOptions.data.region_name;
    interfaceTeamName = newOptions.data.team_name;
  }
  const REGION_NAME = interfaceRegionName || currRegionName || regionName;
  const TEAM_NAME = interfaceTeamName || currTeamName || teamName;
  newOptions.headers.X_REGION_NAME = REGION_NAME;
  newOptions.headers.X_TEAM_NAME = TEAM_NAME;

  newOptions.url = url;
  // newOptions.withCredentials = true;
  axios.defaults.withCredentials = true;
  // if (newOptions.params) {
  //   newOptions.params._ = Date.now();
  // }

  newOptions.showMessage =
    newOptions.showMessage === void 0 ? true : newOptions.showMessage;
  const showLoading =
    newOptions.showLoading === void 0 ? true : newOptions.showLoading;

  if (showLoading) {
    handleStoreDispatch('global/showLoading');
  }
  const slowRequestContext = startSlowRequestTracking(newOptions);
  return trackSlowRequestLifecycle(axios(newOptions), {
    context: slowRequestContext,
    finish: finishSlowRequestTracking,
    checkStatus,
    isCancel: error => axios.isCancel(error)
  })
    .then(response => {
      updateRenewedTokenFromResponse(response);
      if (showLoading) {
        handleStoreDispatch('global/hiddenLoading');
      }
      return handleData(response);
    })
    .catch(error => {
      captureRequestError(error, newOptions);
      const failureMetadata = getRequestFailureMetadata(error);
      captureErrorViewed(failureMetadata.error_category, {
        error_code: failureMetadata.error_code,
        http_status: failureMetadata.http_status,
        stage: 'request'
      });
      if (showLoading) {
        handleStoreDispatch('global/hiddenLoading');
      }

      if (error.response) {
        const { response } = error;
        // 请求已发出，但服务器响应的状态码不在 2xx 范围

        let resData = {};
        try {
          resData = error.response.data || {};
        } catch (e) {
          // ignore parse error
        }
        const { code = '' } = resData;
        const failureResult = getRequestFailureResult(error, resData, newOptions);

        // 处理特殊业务错误码（需要特殊处理的错误）
        const isSpecialCode = handleSpecialErrorCode(code, resData, newOptions, error, TEAM_NAME, REGION_NAME, url);

        if (isSpecialCode) {
          return failureResult;
        }
        if (!isSpecialCode) {
          // 调用自定义错误处理
          if (newOptions.handleError) {
            return getRequestFailureResult(error, resData, newOptions, newOptions.handleError(error));
          }

          // 使用统一错误处理
          handleAPIError(error);

          // 如果需要返回 Promise.reject
          if (newOptions.noModels) {
            return Promise.reject(error);
          }
          return failureResult;
        }
      } else {
        const failureResult = getRequestFailureResult(error, {}, newOptions);
        // 网络错误或请求配置错误
        if (newOptions.handleError) {
          return getRequestFailureResult(error, {}, newOptions, newOptions.handleError(error));
        }
        if (newOptions.noModels) {
          return Promise.reject(error);
        }
        // 默认提示
        notification.error({
          message: formatMessage({id:'utils.request.warning'}),
          description: formatMessage({id:'utils.request.server_error'})
        });
        return failureResult;
      }
    });
}
