
export default {
  namespace: 'rbdPlugin',
  state: {
    // 插件列表
    pluginList: [],
  },

  effects: {
    *fetchPluginList({ payload }, { call, put }) {
      yield put({
        type: 'saveList',
        payload: payload
      });
    },
  },

  reducers: {
    saveList(state, action) {      
      return {
        ...state,
        pluginList: action.payload,
      };
    },
  },
};
