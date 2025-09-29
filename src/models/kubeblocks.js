import {
    fetchKubeBlocksDatabaseTypes,
    createDatabaseCluster,
    fetchStorageClasses,
    fetchBackupRepos,
    getComponentKubeBlocksInfo,
    getClusterDetail,
    scaleCluster as scaleClusterApi,
    updateBackupConfig as updateBackupConfigApi,
    getBackupList,
    deleteBackups as deleteBackupsApi
} from '../services/kubeblocks';

export default {
    namespace: 'kubeblocks',
    state: {
        databaseTypes: [], // 存储数据库类型及版本
        storageClasses: [], // 存储 StorageClass 列表
        backupRepos: [], // 存储 BackupRepo 列表
        backupList: [], // 存储备份列表
        createLoading: false, // 创建数据库集群的加载状态
        componentInfo: null, // 组件 KubeBlocks 信息
        clusterDetail: null, // 集群详情信息
    },
    effects: {
        *fetchKubeBlocksDatabaseTypes({ payload, callback, handleError }, { call, put }) {
            const response = yield call(fetchKubeBlocksDatabaseTypes, payload, handleError);
            if (response && response.status_code === 200 && Array.isArray(response.list)) {
                yield put({
                    type: 'saveDatabaseTypes',
                    payload: response.list
                });
            }
            if (callback) {
                callback(response);
            }
        },

        *createDatabaseCluster({ payload, callback, handleError }, { call, put }) {
            yield put({
                type: 'setCreateLoading',
                payload: true
            });

            const response = yield call(createDatabaseCluster, payload, handleError);

            yield put({
                type: 'setCreateLoading',
                payload: false
            });

            if (callback) {
                callback(response);
            }
        },

        *fetchStorageClasses({ payload, callback, handleError }, { call, put }) {
            const response = yield call(fetchStorageClasses, payload, handleError);
            if (response && response.status_code === 200 && Array.isArray(response.list)) {
                yield put({
                    type: 'saveStorageClasses',
                    payload: response.list
                });
            }
            if (callback) {
                callback(response);
            }
        },

        *fetchBackupRepos({ payload, callback, handleError }, { call, put }) {
            const response = yield call(fetchBackupRepos, payload, handleError);
            if (response && response.status_code === 200 && Array.isArray(response.list)) {
                yield put({
                    type: 'saveBackupRepos',
                    payload: response.list
                });
            }
            if (callback) {
                callback(response);
            }
        },

        *getComponentKubeBlocksInfo({ payload, callback, handleError }, { call, put }) {
            const response = yield call(getComponentKubeBlocksInfo, payload, handleError);
            if (response && response.status_code === 200) {
                // 保存组件 KubeBlocks 信息
                yield put({
                    type: 'saveComponentInfo',
                    payload: response.bean || null
                });
            }
            if (callback) {
                callback(response);
            }
        },

        *getClusterDetail({ payload, callback, handleError }, { call, put }) {
            const response = yield call(getClusterDetail, payload, handleError);
            if (response && response.status_code === 200) {
                // 保存集群详情信息
                yield put({
                    type: 'saveClusterDetail',
                    payload: response.bean || null
                });
            }
            if (callback) {
                callback(response);
            }
        },

        /**
         * 伸缩 KubeBlocks 集群
         * @param {Object} payload - { team_name, region_name, service_id, body }
         */
        *scaleCluster({ payload, callback, handleError }, { call, put }) {
            const response = yield call(scaleClusterApi, payload, handleError);
            if (callback) callback(response);
        },

        /**
         * 更新 KubeBlocks 集群备份配置
         * @param {Object} payload - { team_name, region_name, service_id, body }
         */
        *updateBackupConfig({ payload, callback, handleError }, { call, put }) {
            const response = yield call(updateBackupConfigApi, payload, handleError);
            if (callback) callback(response);
        },

        /**
         * 获取 KubeBlocks 集群备份列表
         */
        *fetchBackupList({ payload, callback, handleError }, { call, put }) {
            const response = yield call(getBackupList, payload, handleError);
            if (response && response.status_code === 200 && Array.isArray(response.list)) {
                yield put({
                    type: 'saveBackupList',
                    payload: response.list
                });
            }
            if (callback) {
                callback(response);
            }
        },

        /**
         * 删除 KubeBlocks 集群备份
         */
        *deleteBackups({ payload, callback, handleError }, { call }) {
            const response = yield call(deleteBackupsApi, payload, handleError);
            if (callback) {
                callback(response);
            }
        },
    },
    reducers: {
        saveDatabaseTypes(state, { payload }) {
            return {
                ...state,
                databaseTypes: payload || []
            };
        },

        saveStorageClasses(state, { payload }) {
            // 兼容字符串数组
            const normalized = Array.isArray(payload)
                ? payload.map(item => (typeof item === 'string' ? { name: item } : item))
                : [];
            return {
                ...state,
                storageClasses: normalized
            };
        },

        saveBackupRepos(state, { payload }) {
            // 兼容字符串数组
            const normalized = Array.isArray(payload)
                ? payload.map(item => (typeof item === 'string' ? { name: item } : item))
                : [];
            return {
                ...state,
                backupRepos: normalized
            };
        },

        saveBackupList(state, { payload }) {
            return {
                ...state,
                backupList: payload || []
            };
        },

        setCreateLoading(state, { payload }) {
            return {
                ...state,
                createLoading: payload
            };
        },

        /**
         * 保存组件 KubeBlocks 信息
         * @param {Object} state - 当前状态
         * @param {Object} action - 包含 payload 的 action
         * @param {Object} action.payload - 组件 KubeBlocks 信息，包含 isKubeBlocksComponent 和 databaseType
         */
        saveComponentInfo(state, { payload }) {
            return {
                ...state,
                componentInfo: payload
            };
        },

        /**
         * 保存集群详情信息
         * @param {Object} state - 当前状态
         * @param {Object} action - 包含 payload 的 action
         * @param {Object} action.payload - 集群详情信息，包含 basic、resource、backup 等字段
         */
        saveClusterDetail(state, { payload }) {
            return {
                ...state,
                clusterDetail: payload
            };
        },
    }
}; 