import { notification } from "antd";
import axios from "axios";
// import { routerRedux } from 'dva/router';
// import store from "../index";
// import store from '@/index'
// const { dispatch } = store;
import { push } from "umi/router";
import globalUtil from "../utils/global";
import cookie from "./cookie";

const codeMessage = {
  200: "服务器成功返回请求的数据",
  201: "新建或修改数据成功。",
  202: "一个请求已经进入后台排队（异步任务）",
  204: "删除数据成功。",
  400: "发出的请求有错误，服务器没有进行新建或修改数据,的操作。",
  401: "用户没有权限（令牌、用户名、密码错误）。",
  403: "用户得到授权，但是访问是被禁止的。",
  404: "发出的请求针对的是不存在的记录，服务器没有进行操作",
  406: "请求的格式不可得。",
  410: "请求的资源被永久删除，且不会再得到的。",
  422: "当创建一个对象时，发生一个验证错误。",
  500: "服务器发生错误，请检查服务器",
  502: "网关错误",
  503: "服务不可用，服务器暂时过载或维护",
  504: "网关超时"
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

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options) {
  const defaultOptions = {
    credentials: "include"
  };
  const newOptions = {
    ...defaultOptions,
    ...options
  };
  // if (newOptions.method === "POST" || newOptions.method === "PUT") {
  newOptions.headers = {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",

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

    // "Authorization": 'GRJWT '+ (cookie.get('token') ||
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImxpY2hhbyIsImV4cCI6MTU
    // x
    // ODY2MzYyNCwiZW1haWwiOiJsaWNAZ29vZHJhaW4uY29tIiwidXNlcl9pZCI6Nn0.N95RuiLn0nA8T
    // w RR0TGh6luHnJ9A_IYJtGxHQdtc2jE'), "Authorization": 'GRJWT '+
    // (cookie.get('token'))
  };

  const token = cookie.get("token");
  const teamName = cookie.get("team_name");
  const regionName = cookie.get("region_name");
  let interfaceRegionName = "";
  if (token && newOptions.passAuthorization) {
    newOptions.headers.Authorization = `GRJWT ${token}`;
  }
  if (
    url &&
    (url.lastIndexOf("/groups") > -1 || url.lastIndexOf("/topological") > -1) &&
    newOptions.params &&
    newOptions.params.region_name
  ) {
    interfaceRegionName = newOptions.params.region_name;
  }
  newOptions.headers.X_REGION_NAME =
    interfaceRegionName || globalUtil.getCurrRegionName() || regionName;
  newOptions.headers.X_TEAM_NAME = globalUtil.getCurrTeamName() || teamName;

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
      type: "global/showLoading"
    });
  return axios(newOptions)
    .then(checkStatus)
    .then(response => {
      showLoading &&
        window.g_app._store.dispatch({
          type: "global/hiddenLoading"
        });

      const res = response.data.data || {};
      res._code = response.status;
      res._condition = response.data.code;
      res.msg_show = response.data.msg_show;
      return res;
    })
    .catch(error => {
      if (showLoading) {
        window.g_app._store.dispatch({
          type: "global/hiddenLoading"
        });
      }

      if (error.response) {
        const { response } = error;
        // 请求已发出，但服务器响应的状态码不在 2xx 范围内

        const { status } = error.response;

        let resData = {};
        try {
          resData = error.response.data;
        } catch (e) {}
        if (resData.code === 10410) {
          window.g_app._store.dispatch({
            type: "global/showPayTip"
          });

          return;
        }

        if (resData.code >= 20001 && resData.code <= 20003) {
          window.g_app._store.dispatch({
            type: "global/showOrders",
            payload: {
              code: resData.code
            }
          });
          return;
        }

        if (resData.code === 10406) {
          window.g_app._store.dispatch({
            type: "global/showMemoryTip",
            payload: {
              message: resData.msg_show
            }
          });

          return;
        }
        if (resData.code === 10409) {
          cookie.setGuide("appStore", "true");
          notification.warning({ message: "与云市连接超时,请检查网络" });
          return;
        }
        if (resData.code === 10408) {
          window.g_app._store.dispatch({
            type: "global/showNoMoneyTip",
            payload: {
              message: resData.msg_show
            }
          });

          return;
        }
        // if (resData.code === 10407) {
        //   cookie.setGuide("appStore", "true");
        //   window.g_app._store.dispatch({
        //     type: "global/showAuthCompany"
        //   });

        //   return;
        // }

        if (resData.code === 10405) {
          window.g_app._store.dispatch({
            type: "global/showNeedLogin"
          });
          return;
        }

        if (resData.code === 10402) {
          const regionName = globalUtil.getCurrRegionName();
          const teamName = globalUtil.getCurrTeamName();
          push(`/team/${teamName}/region/${regionName}/exception/403`);
        }

        if (resData.code === 10400) {
          window.g_app._store.dispatch({
            type: "global/setNouse",
            payload: {
              isNouse: true
            }
          });
          return;
        }
        if (resData.code === 10421) {
          return;
        }

        // 访问资源集群与当前集群不一致
        if (resData.code === 10404) {
          location.href = globalUtil.replaceUrlRegion(
            resData.data.bean.service_region
          );
          return;
        }

        // 访问资源所属团队与当前团队不一致
        if (resData.code === 10403) {
          location.href = globalUtil.replaceUrlTeam(
            resData.data.bean.service_team_name
          );
          return;
        }

        if (newOptions.handleError) {
          newOptions.handleError(response);
          return;
        }

        const msg = resData.msg_show || resData.msg || resData.detail;
        if (msg && newOptions.showMessage === true) {
          if (msg.indexOf("身份认证信息未提供") > -1) {
            push({ type: "global/showNeedLogin" });
            return;
          }

          notification.warning({ message: "警告", description: msg });
        }

        // if (status <= 504 && status >= 500) {
        // push(routerRedux.push('/exception/500'));   return; } if (status >= 404
        // && status < 422) {   push(routerRedux.push('/exception/404')); }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }

      // return error
    });
}
