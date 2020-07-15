import {
  query as queryUsers,
  queryCurrent,
  login,
  getDetail,
  logout,
  fetchEnterpriseNoTeamUser,
  queryOauthType,
  register,
  gitlabRegister,
  createGitlabProject,
  changePass,
  queryThirdInfo,
  queryThirdCertification,
  queryCertificationThird,
  getTeamByName,
  queryThirdBinding,
  queryThirdLoginBinding,
  addCollectionView,
  queryCollectionViewInfo,
  putCollectionViewInfo,
  deleteCollectionViewInfo,
  fetchAccessToken,
  addAccessToken,
  putAccessToken,
  deleteAccessToke,
} from '../services/user';
import { setAuthority } from '../utils/authority';
import userUtil from '../utils/global';

import cookie from '../utils/cookie';
import { routerRedux } from 'dva/router';

export default {
  namespace: 'user',

  state: {
    list: [],
    currentUser: null,
    notifyCount: 0,
    register: null,
  },

  effects: {
    *fetchAccessToken({ payload, callback }, { call, put }) {
      const data = yield call(fetchAccessToken, payload);
      if (data && callback) {
        callback(data);
      }
    },

    *addAccessToken({ payload, callback }, { call, put }) {
      const data = yield call(addAccessToken, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *putAccessToken({ payload, callback }, { call, put }) {
      const data = yield call(putAccessToken, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *deleteAccessToke({ payload, callback }, { call, put }) {
      const data = yield call(deleteAccessToke, payload);
      if (data && callback) {
        callback(data);
      }
    },
    *getTeamByName({ payload, callback, fail }, { call, put, select }) {
      const response = yield call(getTeamByName, payload);
      if (response) {
        yield put({ type: 'saveOtherTeam', team: response.bean });
        setTimeout(() => {
          callback && callback(response.bean);
        });
      } else {
        fail && fail();
      }
    },
    *changePass({ payload, callback }, { call, put, select }) {
      const response = yield call(changePass, payload);
      if (response) {
        yield put({ type: 'tologout' });
        yield put(routerRedux.push('/user/login'));
        callback && callback();
      }
    },
    *searchEnterpriseNoTeamUser({ payload, callback }, { call, put, select }) {
      const response = yield call(fetchEnterpriseNoTeamUser, payload);
      if (response) {
        callback && callback(response);
      }
    },

    // 第三方认证
    *fetchThirdCertification(
      { payload, callback, handleError },
      { call, put, select }
    ) {
      const response = yield call(
        queryThirdCertification,
        payload,
        handleError
      );
      if (response) {
        callback && callback(response);
      }
    },

    // 新增收藏视图
    *addCollectionView({ payload, callback }, { call }) {
      const response = yield call(addCollectionView, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 收藏视图列表
    *fetchCollectionViewInfo({ payload, callback }, { call }) {
      const response = yield call(queryCollectionViewInfo, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 更新视图列表
    *putCollectionViewInfo({ payload, callback }, { call }) {
      const response = yield call(putCollectionViewInfo, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 删除收藏视图
    *deleteCollectionViewInfo({ payload, callback }, { call }) {
      const response = yield call(deleteCollectionViewInfo, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 第三方认证信息
    *fetchThirdInfo({ payload, callback }, { call, put, select }) {
      const response = yield call(queryThirdInfo, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 第三方认证类型
    *fetchOauthType({ payload, callback }, { call, put, select }) {
      const response = yield call(queryOauthType, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 登录后三方用户与用户绑定接口
    *fetchThirdBinding({ payload, callback }, { call, put, select }) {
      const response = yield call(queryThirdBinding, payload);
      if (response) {
        callback && callback(response);
      }
    },
    // 登录成功三方用户与用户绑定接口
    *fetchThirdLoginBinding(
      { payload, callback, handleError },
      { call, put, select }
    ) {
      const response = yield call(queryThirdLoginBinding, payload, handleError);
      if (response) {
        callback && callback(response);
      }
    },
    // 重新认证
    *fetchCertificationThird({ payload, callback }, { call, put, select }) {
      const response = yield call(queryCertificationThird, payload);
      if (response) {
        callback && callback(response);
      }
    },

    *login({ payload, callback }, { call, put, select }) {
      const response = yield call(login, payload);
      if (response) {
        yield put({ type: 'changeLoginStatus', payload: response });
        cookie.set('token', response.bean.token);
        if (callback) {
          callback();
        }
      }
    },
    *thirdLogin({ payload, callback }, { call, put, select }) {
      const response = yield call(login, payload);

      if (response) {
        callback && callback(response);
        yield put({ type: 'changeLoginStatus', payload: response });
      }
    },

    *logout(_, { put, select }) {
      try {
        // get location pathname
        const urlParams = new URL(window.location.href);
        // const pathname = yield select(state => state.routing.location.pathname);
        // add the parameters in the url
        // urlParams.searchParams.set("redirect", pathname);
        window.history.replaceState(null, 'login', urlParams.href);
      } finally {
        // yield put(routerRedux.push('/user/login')); Login out after permission
        // changes to admin or user The refresh will automatically redirect to the login
        // page
        yield put({ type: 'tologout' });

        yield put({ type: 'saveCurrentUser', payload: null });

        yield put(routerRedux.push('/user/login'));
      }
    },
    *register({ payload, complete }, { call, put, select }) {
      const response = yield call(register, payload);

      if (response) {
        // 非常粗暴的跳转,登陆成功之后权限会变成user或admin,会自动重定向到主页 Login success after permission
        // changes to admin or user The refresh will automatically redirect to the home
        // page yield put(routerRedux.push('/'));
        cookie.set('token', response.bean.token);
        const urlParams = new URL(window.location.href);

        const pathname = yield select(state => {
          return (
            state &&
            state.routing &&
            state.routing.location &&
            state.routing.location.pathname
          );
        });
        // add the parameters in the url
        const redirect = pathname
          ? urlParams.searchParams.get('redirect', pathname)
          : null;
        yield put({ type: 'registerHandle', payload: response.bean, redirect });
        if (
          response._code === 200 &&
          response.bean &&
          response.bean.nick_name
        ) {
          yield put(
            routerRedux.push({
              pathname: '/user/register-result',
              state: {
                account: response.bean.nick_name,
              },
            })
          );
        } else {
          yield put(routerRedux.push('/'));
        }
      }

      complete && complete();
    },
    *thirdRegister({ payload, callback }, { call, put, select }) {
      const response = yield call(register, payload);
      if (response) {
        const urlParams = new URL(window.location.href);
        const pathname = yield select(state => state.routing.location.pathname);
        // add the parameters in the url
        const redirect = urlParams.searchParams.get('redirect', pathname);
        yield put({ type: 'registerHandle', payload: response.bean, redirect });
        callback && callback(response.bean);
      }
    },
    *fetch(_, { call, put }) {
      const response = yield call(queryUsers);
      yield put({ type: 'save', payload: response });
    },
    *fetchCurrent({ callback, handleError }, { call, put }) {
      const response = yield call(getDetail, handleError);
      if (response) {
        yield put({ type: 'saveCurrentUser', payload: response.bean });
      }
      callback && callback(response);
    },
    *gitlabRegister({ payload, callback }, { call, put }) {
      const response = yield call(gitlabRegister, payload);
      if (response) {
        callback && callback(response.bean);
      }
    },
    *createGitlabProject({ payload, callback }, { call, put }) {
      const response = yield call(createGitlabProject, payload);
      if (response) {
        callback && callback(response.bean);
      }
    },
  },

  reducers: {
    registerHandle(state, { payload, redirect }) {
      return {
        ...state,
        register: payload,
        redirect,
      };
    },
    changeLoginStatus(state, { payload }) {
      setAuthority('user');
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
    tologout(state, action) {
      userUtil.removeCookie();
    },
    save(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
    saveCurrentUser(state, action) {
      return {
        ...state,
        currentUser: action.payload,
      };
    },
    saveOtherTeam(state, action) {
      const {currentUser} = state;
      currentUser.teams.push(action.team);
      return {
        ...state,
        currentUser: Object.assign({}, currentUser),
      };
    },
    changeNotifyCount(state, action) {
      return {
        ...state,
        notifyCount: action.payload,
      };
    },
  },
};
