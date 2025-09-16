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
    deleteBackups as deleteBackupsApi,
    createManualBackup as createManualBackupApi,
    getClusterParameters,
    updateClusterParameters,
    restoreClusterFromBackup
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
        parameterList: [], // 存储参数列表
        parameterPagination: { // 参数分页信息
            page: 1,
            page_size: 6,
            total: 0,
            keyword: ''
        },
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
        *deleteBackups({ payload, callback, handleError }, { call, put, select }) {
            const response = yield call(deleteBackupsApi, payload, handleError);
            
            // 如果删除成功，立即更新本地状态
            if (response && response.status_code === 200) {
                const currentBackupList = yield select(state => state.kubeblocks.backupList);
                const { backups } = payload;
                
                // 从当前列表中移除被删除的备份
                const updatedBackupList = currentBackupList.filter(backup => 
                    !backups.includes(backup.name)
                );
                
                yield put({
                    type: 'saveBackupList',
                    payload: updatedBackupList
                });
            }
            
            if (callback) {
                callback(response);
            }
        },

        /**
         * 创建手动备份
         */
        *createManualBackup({ payload, callback, handleError }, { call }) {
            const response = yield call(createManualBackupApi, payload, handleError);
            if (callback) {
                callback(response);
            }
        },

        /**
        * 获取 KubeBlocks 集群参数（分页/搜索）
        */
        *fetchParameters({ payload, callback, handleError }, { call, put }) {
            const response = yield call(getClusterParameters, payload, handleError);
            if (response && response.status_code === 200) {
                // 保存参数列表
                yield put({
                    type: 'saveParameterList',
                    payload: response.list || []
                });

                // 保存分页信息，需要将 number 映射为 total
                yield put({
                    type: 'saveParameterPagination',
                    payload: {
                        page: response.page || payload.page || 1,
                        page_size: payload.page_size || 6,
                        // 与非 KubeBlocks 业务保持一致：优先 total，兼容旧字段 number
                        total: (response.total !== undefined ? response.total : response.number) || 0,
                        keyword: payload.keyword || ''
                    }
                });
            }
            if (callback) {
                callback(response);
            }
        },

        /**
         * 批量更新 KubeBlocks 集群参数
         */
        *updateParameters({ payload, callback, handleError }, { call }) {
            const response = yield call(updateClusterParameters, payload, handleError);
            if (callback) {
                callback(response);
            }
        },

        /**
         * 从备份恢复 KubeBlocks 集群
         * 创建新的集群，原集群保持不变
         */
        *restoreFromBackup({ payload, callback, handleError }, { call }) {
            const response = yield call(restoreClusterFromBackup, payload, handleError);
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

        /**
         * 保存参数列表
         */
        saveParameterList(state, { payload }) {
            return {
                ...state,
                parameterList: payload || []
            };
        },

        /**
         * 保存参数分页信息
         */
        saveParameterPagination(state, { payload }) {
            return {
                ...state,
                parameterPagination: {
                    ...state.parameterPagination,
                    ...payload
                }
            };
        },
    }
}; 
