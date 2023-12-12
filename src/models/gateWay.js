import {
    queryHttpData,
    queryAppHttpData,
    fetchEnvs,
    editParameter,
    getParameter,
    fetchAllLicense,
    addLicense,
    deleteLicense,
    queryDetail,
    editLicense,
    addHttpStrategy,
    deleteHttp,
    queryDetail_http,
    editHttpStrategy,
    queryTcpData,
    queryAppTcpData,
    deleteTcp,
    querydomain_port,
    queryDetail_tcp,
    addTcp,
    editTcp,
    query_app_status,
    startApp,
    getBatchGateWay,
    getGateWay,
    getGateWayApiList,
    queryDetailGateWayApi,
    deleteGateWayApi,
    addDetailGateWayApi,
    editDetailGateWayApi,
    getLimitingStrategy,
    addLimitingStrategy,
    deleteLimitingStrategy,
    editLimitingStrategy,
    getApiGatewayList,
    addApiGateway,
    editApiGateway,
    deleteApiGateway,
    getApiGatewayService,
    addApiGatewayService,
    editApiGatewayService,
    deleteApiGatewayService,
    getQpsRate,
} from '../services/gateWay';

export default {
    namespace: 'gateWay',

    state: {

    },

    effects: {
        *queryHttpData({ callback, payload }, { call }) {
            const response = yield call(queryHttpData, payload);
            if (response && callback) {
                callback(response)
            }
        },
        *queryAppHttpData({ callback, payload }, { call }) {
            const response = yield call(queryAppHttpData, payload);
            if (response && callback) {
                callback(response)
            }
        },
        *fetchEnvs({ callback, payload }, { call }) {
            const response = yield call(fetchEnvs, payload);
            if (response && callback) {
                callback(response)
            }
        },
        
        *getParameter({ callback, payload }, { call }) {
            const response = yield call(getParameter, payload);
            if (response && callback) {
                callback(response)
            }
        },
        *editParameter({ callback, payload }, { call }) {
            const response = yield call(editParameter, payload);
            if (response && callback) {
                callback(response)
            }
        },
        *fetchAllLicense({ callback, payload }, { call }) {
            const response = yield call(fetchAllLicense, payload);
            if (callback) {
                callback(response)
            }
        },
        *addLicense({ callback, payload }, { call }) {
            const response = yield call(addLicense, payload);
            if (callback) {
                callback(response)
            }
        },
        *editLicense({ callback, payload }, { call }) {
            const response = yield call(editLicense, payload);
            if (callback) {
                callback(response)
            }
        },
        *deleteLicense({ callback, payload }, { call }) {
            const response = yield call(deleteLicense, payload);
            if (callback) {
                callback(response)
            }
        },
        *queryDetail({ callback, payload }, { call }) {
            const response = yield call(queryDetail, payload);
            if (callback) {
                callback(response)
            }
        },
        *addHttpStrategy({ callback, payload }, { call }) {
            const rule_extensions = [];
            if (payload.values.rule_extensions_http && payload.values.rule_extensions_http.includes('httptohttps')) {
                rule_extensions.push({
                    key: 'httptohttps',
                    value: "true"
                })
            }
            if (payload.values.rule_extensions_round) {
                rule_extensions.push({
                    key: 'lb-type',
                    value: payload.values.rule_extensions_round
                })
            }
            payload.rule_extensions = rule_extensions;
            const response = yield call(addHttpStrategy, payload);
            if (callback) {
                callback(response)
            }
        },
        *editHttpStrategy({ callback, payload }, { call }) {
            const rule_extensions = [];
            if (payload.values.rule_extensions_http && payload.values.rule_extensions_http.includes('httptohttps')) {
                rule_extensions.push({
                    key: 'httptohttps',
                    value: "true"
                })
            }
            if (payload.values.rule_extensions_round) {
                rule_extensions.push({
                    key: 'lb-type',
                    value: payload.values.rule_extensions_round
                })
            }
            payload.rule_extensions = rule_extensions;
            const response = yield call(editHttpStrategy, payload);
            if (callback) {
                callback(response)
            }
        },
        *deleteHttp({ callback, payload }, { call }) {
            const response = yield call(deleteHttp, payload);
            if (callback) {
                callback(response)
            }
        },
        *queryDetail_http({ callback, payload }, { call }) {
            const response = yield call(queryDetail_http, payload);
            if (callback) {
                callback(response)
            }
        },
        *queryTcpData({ callback, payload }, { call }) {
            const response = yield call(queryTcpData, payload);
            if (response && callback) {
                callback(response)
            }
        },
        *queryAppTcpData({ callback, payload }, { call }) {
            const response = yield call(queryAppTcpData, payload);
            if (response && callback) {
                callback(response)
            }
        },
        *deleteTcp({ callback, payload }, { call }) {
            const response = yield call(deleteTcp, payload);
            if (callback) {
                callback(response)
            }
        },
        *querydomain_port({ callback, payload }, { call }) {
            const response = yield call(querydomain_port, payload);
            if (callback) {
                callback(response)
            }
        },
        *queryDetail_tcp({ callback, payload }, { call }) {
            const response = yield call(queryDetail_tcp, payload);
            if (callback) {
                callback(response)
            }
        },
        *addTcp({ callback, payload }, { call }) {
            const rule_extensions = [];
            if (payload.values.rule_extensions) {
                rule_extensions.push({
                    key: 'lb-type',
                    value: payload.values.rule_extensions
                })
            }
            payload.rule_extensions = rule_extensions;
            const response = yield call(addTcp, payload);
            if (callback) {
                callback(response)
            }
        },
        *editTcp({ callback, payload }, { call }) {
            const rule_extensions = [];
            if (payload.values.rule_extensions) {
                rule_extensions.push({
                    key: 'lb-type',
                    value: payload.values.rule_extensions
                })
            }
            payload.rule_extensions = rule_extensions;
            const response = yield call(editTcp, payload);
            if (callback) {
                callback(response)
            }
        },
        *query_app_status({ callback, payload }, { call }) {
            const response = yield call(query_app_status, payload);
            if (callback) {
                callback(response)
            }
        },
        *startApp({ callback, payload }, { call }) {
            const response = yield call(startApp, payload);
            if (callback) {
                callback(response)
            }
        },
        *getBatchGateWay({ payload, callback, handleError }, { call }) {
            const response = yield call(getBatchGateWay, payload, handleError);
            if (response && callback) {
              callback(response);
            }
        },
        *getGateWay({ payload, callback, handleError }, { call }) {
            const response = yield call(getGateWay, payload, handleError);
            if (response && callback) {
              callback(response);
            }
        },
        *getGateWayApiList({ payload, callback, handleError }, { call }) {
            const response = yield call(getGateWayApiList, payload, handleError);
            if (response && callback) {
              callback(response);
            }
        },
        *queryDetailGateWayApi({ callback, payload }, { call }) {
            const response = yield call(queryDetailGateWayApi, payload);
            if (callback) {
                callback(response)
            }
        },
        *deleteGateWayApi({ callback, payload, handleError }, { call }) {
            const response = yield call(deleteGateWayApi, payload, handleError );
            if (callback) {
                callback(response)
            }
        },
        *addDetailGateWayApi({ callback, payload , handleError}, { call }) {
            const response = yield call(addDetailGateWayApi, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *editDetailGateWayApi({ callback, payload, handleError }, { call }) {
            const response = yield call(editDetailGateWayApi, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *addLimitingStrategy({ callback, payload, handleError }, { call }) {
            const response = yield call(addLimitingStrategy, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *deleteLimitingStrategy({ callback, payload, handleError }, { call }) {
            const response = yield call(deleteLimitingStrategy, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *editLimitingStrategy({ callback, payload, handleError }, { call }) {
            const response = yield call(editLimitingStrategy, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *getLimitingStrategy({ callback, payload, handleError }, { call }) {
            const response = yield call(getLimitingStrategy, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *getApiGatewayList({ callback, payload, handleError }, { call }) {
            const response = yield call(getApiGatewayList, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *addApiGateway({ callback, payload, handleError }, { call }) {
            const response = yield call(addApiGateway, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *editApiGateway({ callback, payload, handleError }, { call }) {
            const response = yield call(editApiGateway, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *deleteApiGateway({ callback, payload, handleError }, { call }) {
            const response = yield call(deleteApiGateway, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *getApiGatewayService({ callback, payload, handleError }, { call }) {
            const response = yield call(getApiGatewayService, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *addApiGatewayService({ callback, payload, handleError }, { call }) {
            const response = yield call(addApiGatewayService, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *editApiGatewayService({ callback, payload, handleError }, { call }) {
            const response = yield call(editApiGatewayService, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *deleteApiGatewayService({ callback, payload, handleError }, { call }) {
            const response = yield call(deleteApiGatewayService, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
        *getQpsRate({ callback, payload, handleError }, { call }) {
            const response = yield call(getQpsRate, payload, handleError);
            if (callback) {
                callback(response)
            }
        },
    },

    reducers: {

    },
};
