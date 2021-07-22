/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
/* eslint-disable no-void */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
import { notification } from 'antd';
import axios from 'axios';
// import { routerRedux } from 'dva/router';
// import store from "../index";
// import store from '@/index'
// const { dispatch } = store;
import { push } from 'umi/router';
import globalUtil from '../utils/global';
import cookie from './cookie';

const codeMessage = {
  200: '服务器成功返回请求的数据',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据,的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护',
  504: '网关超时'
};

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  notification.warning({
    message: `警告 : ${response.url}`,
    description: errortext
  });

  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;

  throw error;
}

function handleStoreDispatch(type, payload = {}) {
  window.g_app._store.dispatch({
    type,
    payload
  });
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

  let interfaceRegionName = '';
  let interfaceTeamName = '';
  if (token && newOptions.passAuthorization) {
    newOptions.headers.Authorization = `GRJWT ${token}`;
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

  showLoading &&
    window.g_app._store.dispatch({
      type: 'global/showLoading'
    });
  return axios(newOptions)
    .then(checkStatus)
    .then(response => {
      showLoading &&
        window.g_app._store.dispatch({
          type: 'global/hiddenLoading'
        });
      return handleData(response);
    })
    .catch(error => {
      if (showLoading) {
        handleStoreDispatch('global/hiddenLoading');
      }

      if (error.response) {
        const { response } = error;
        // 请求已发出，但服务器响应的状态码不在 2xx 范围

        let resData = {};
        try {
          resData = error.response.data;
        } catch (e) {
          console.log(e);
        }
        const { code = '' } = resData;
        let isNext = false;
        switch (code) {
          case 10403:
            // 访问资源所属团队与当前团队不一致
            location.href = globalUtil.replaceUrlTeam(
              resData.data.bean.service_team_name
            );
            break;
          case 10404:
            // 访问资源集群与当前集群不一致
            location.href = globalUtil.replaceUrlRegion(
              resData.data.bean.service_region
            );
            break;
          case 10400:
            handleStoreDispatch('global/setNouse', {
              isNouse: true
            });
            break;
          case 10402:
            push(
              `/team/${currTeamName}/region/${currRegionName}/exception/403`
            );
            break;
          case 10405:
            handleStoreDispatch('global/showNeedLogin');
            if (newOptions.handleError) {
              newOptions.handleError(error);
            }
            break;
          case 10407:
            cookie.setGuide('appStore', 'true');
            handleStoreDispatch('global/showAuthCompany', {
              market_name: resData.data.bean.name
            });
            break;
          case 10408:
            handleStoreDispatch('global/showNoMoneyTip', {
              message: resData.msg_show
            });
            break;
          case 10409:
            cookie.setGuide('appStore', 'true');
            notification.warning({ message: '与云市连接超时,请检查网络' });
            break;
          case 10410:
            handleStoreDispatch('global/showPayTip');
            break;
          default:
            isNext = true;
            break;
        }
        if (isNext) {
          // Service maturity
          if (code >= 20001 && code <= 20003) {
            handleStoreDispatch('global/showOrders', {
              code
            });
            return;
          }
          // 10406: Cluster resource shortage
          // 10413: Insufficient tenant resources
          // 20800: Component build failed
          if (code === 10406 || code === 10413 || code === 20800) {
            const AppID = globalUtil.getAppID(url);
            if (TEAM_NAME && REGION_NAME && AppID) {
              push(
                `/team/${TEAM_NAME}/region/${REGION_NAME}/components/${AppID}/overview`
              );
            }
            const tipMap = {
              10406: '集群资源不足,请联系企业管理员增加资源',
              10413: '团队使用内存已超过限额，请联系企业管理员增加限额',
              20800: '构建失败,请重新构建'
            };
            handleStoreDispatch('global/showMemoryTip', {
              message: tipMap[code]
            });
            return;
          }
          // cluster request error, ignore it
          if (code === 10421 || code === 10411) {
            if (newOptions.noModels) {
              return Promise.reject(error);
            }
            return;
          }
          if (newOptions.handleError) {
            newOptions.handleError(response);
            return;
          }
          const msg = resData.msg_show || resData.msg || resData.detail;
          if (msg && newOptions.showMessage === true) {
            if (msg.indexOf('身份认证信息未提供') > -1) {
              push({ type: 'global/showNeedLogin' });
              return;
            }
            notification.warning({ message: '警告', description: msg });
          }
          if (newOptions.noModels) {
            return Promise.reject(error);
          }
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        if (newOptions.handleError) {
          return newOptions.handleError(error);
        }
        if (newOptions.noModels) {
          return Promise.reject(error);
        }
      }
    });
}
