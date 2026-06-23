// 插件体系设置
import { formatMessage } from '@/utils/intl';

const pluginSystem = {
    buildExtraConfigValue(value = {}, knownFields = []) {
        const extraConfig = JSON.parse(JSON.stringify(value || {}));
        knownFields.forEach(field => {
            const path = field.split('.');
            let current = extraConfig;
            path.forEach((key, index) => {
                if (!current || typeof current !== 'object') {
                    return;
                }
                if (index === path.length - 1) {
                    delete current[key];
                    return;
                }
                current = current[key];
            });
        });
        Object.keys(extraConfig).forEach(key => {
            if (
                extraConfig[key] &&
                typeof extraConfig[key] === 'object' &&
                !Array.isArray(extraConfig[key]) &&
                Object.keys(extraConfig[key]).length === 0
            ) {
                delete extraConfig[key];
            }
        });
        return Object.keys(extraConfig).length > 0 ? JSON.stringify(extraConfig, null, 2) : undefined;
    },
    getPluginList() {
        return [
            {
                name: 'limit-req',
                message: formatMessage({ id: 'gatewayplugin.list.limit-req' }),
            },
            {
                name: 'limit-conn',
                message: formatMessage({ id: 'gatewayplugin.list.limit-conn' }),
            },
            {
                name: 'limit-count',
                message: formatMessage({ id: 'gatewayplugin.list.limit-count' }),
            },
            {
                name: 'proxy-rewrite',
                message: formatMessage({ id: 'gatewayplugin.list.proxy-rewrite' }),
            },
            {
                name: 'jwt-auth',
                message: formatMessage({ id: 'gatewayplugin.list.jwt-auth' }),
            },
            {
                name: 'openid-connect',
                message: formatMessage({ id: 'gatewayplugin.list.openid-connect' }),
            },
            {
                name: 'cors',
                message: formatMessage({ id: 'gatewayplugin.cors.title' }),
            },
            {
                name: 'real-ip',
                message: formatMessage({ id: 'gatewayplugin.real-ip.title' }),
            },
            {
                name: 'redirect',
                message: formatMessage({ id: 'gatewayplugin.redirect.title' }),
            },
            {
                name: 'client-control',
                message: formatMessage({ id: 'gatewayplugin.client_control.title' }),
            }
        ]
    },
    getFromOptins(type, value = {}) {
        const plugins = {
            "limit-req": (
                {
                    name: 'limit-req',
                    config: [
                        {
                            name: 'rate',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.rate_label' }),
                            type: 'integer',
                            effective: 'rate > 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.rate' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-req.inputrate' }) }, { pattern: new RegExp(/^[1-9]\d*$/, "g"), message: '请填写大于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-req.inputrate' }),
                            value: value.rate || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'burst',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.burst_label' }),
                            type: 'integer',
                            effective: 'burst >= 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.burst' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-req.inputburst' }) }, { pattern: new RegExp(/^[0-9]\d*$/, "g"), message: '请填写大于等于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-req.inputburst' }),
                            value: value.burst || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'key_type',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.key_type_label' }),
                            type: 'string',
                            effective: '["var", "var_combination"]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.key_type' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-req.inputkey_type' }),
                            FromType: 'select',
                            value: value.key_type || undefined,
                            defaultValue: "var",
                            selectArr: ["var", "var_combination"],
                            rules: [],
                        },
                        {
                            name: 'key',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.key_label' }),
                            type: 'string',
                            effective: '["remote_addr", "server_addr", "http_x_real_ip", "http_x_forwarded_for", "consumer_name"]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.key' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-req.inputkey' }),
                            FromType: 'select',
                            value: value.key || undefined,
                            defaultValue: undefined,
                            selectArr: ["remote_addr", "server_addr", "http_x_real_ip", "http_x_forwarded_for", "consumer_name"],
                            rules: [],
                        },
                        {
                            name: 'rejected_code',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.rejected_code_label' }),
                            type: 'integer',
                            defaultValue: 503,
                            effective: '[200,...,599]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.rejected_code' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-req.inputrejected_code' }),
                            FromType: 'input',
                            value: value.rejected_code || undefined,
                            rules: [],
                        },
                        {
                            name: 'rejected_msg',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.rejected_msg_label' }),
                            type: 'string',
                            effective: formatMessage({ id: 'gatewayplugin.Notempty' }),
                            FromType: 'input',
                            value: value.rejected_msg || undefined,
                            rules: [],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-req.rejected_msg' }),
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.inputrejected_msg' }),
                            defaultValue: undefined
                        },
                        {
                            name: 'nodelay',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.nodelay_label' }),
                            type: 'boolean',
                            effective: formatMessage({ id: 'gatewayplugin.limit-req.null' }),
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.nodelay' }),
                            FromType: 'switch',
                            value: value.nodelay || undefined,
                            rules: [],
                        },
                        {
                            name: 'allow_degradation',
                            label: formatMessage({ id: 'gatewayplugin.limit-req.allow_degradation_label' }),
                            effective: formatMessage({ id: 'gatewayplugin.limit-req.null' }),
                            type: 'boolean',
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.limit-req.allow_degradation' }),
                            FromType: 'switch',
                            value: value.allow_degradation || undefined,
                            rules: [],
                        }
                    ]
                }
            ),
            "limit-conn": (
                {
                    name: 'limit-conn',
                    config: [
                        {
                            name: 'conn',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.conn_label' }),
                            type: 'integer',
                            effective: 'conn > 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.conn' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-conn.inputconn' }) }, { pattern: new RegExp(/^[1-9]\d*$/, "g"), message: '请填写大于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputconn' }),
                            value: value.conn || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'burst',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.burst_label' }),
                            type: 'integer',
                            effective: 'burst >= 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.burst' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-conn.inputburst' }) }, { pattern: new RegExp(/^[0-9]\d*$/, "g"), message: '请填写大于等于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputburst' }),
                            value: value.burst || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'default_conn_delay',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.default_conn_delay_label' }),
                            type: 'integer',
                            effective: 'default_conn_delay > 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.default_conn_delay' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-conn.inputdefault_conn_delay' }) }, { pattern: new RegExp(/^[1-9]\d*$/, "g"), message: '请填写大于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputdefault_conn_delay' }),
                            value: value.default_conn_delay || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'only_use_default_delay',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.only_use_default_delay_label' }),
                            type: 'boolean',
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.only_use_default_delay' }),
                            FromType: 'switch',
                            value: value.only_use_default_delay || undefined,
                            rules: [],
                            defaultValue: false,
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputonly_use_default_delay' })
                        },
                        {
                            name: 'key_type',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.key_type_label' }),
                            type: 'string',
                            effective: '["var", "var_combination"]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.key_type' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputkey_type' }),
                            FromType: 'select',
                            value: value.key_type || undefined,
                            defaultValue: "var",
                            selectArr: ["var", "var_combination"],
                            rules: [],
                        },
                        {
                            name: 'key',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.key_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.key || undefined,
                            rules: [],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.key' }),
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.inputkey' }),
                        },
                        {
                            name: 'rejected_code',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.rejected_code_label' }),
                            type: 'integer',
                            defaultValue: 503,
                            effective: '[200,...,599]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.rejected_code' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputrejected_code' }),
                            FromType: 'input',
                            value: value.rejected_code || undefined,
                            rules: [],
                        },
                        {
                            name: 'rejected_msg',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.rejected_msg_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.rejected_msg || undefined,
                            rules: [],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.inputrejected_msg' }),
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.rejected_msg' }),
                            defaultValue: undefined
                        },
                        {
                            name: 'allow_degradation',
                            label: formatMessage({ id: 'gatewayplugin.limit-conn.allow_degradation_label' }),
                            type: 'boolean',
                            effective: formatMessage({ id: 'gatewayplugin.null' }),
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.allow_degradation' }),
                            FromType: 'switch',
                            value: value.allow_degradation || undefined,
                            rules: [],
                        }
                    ]
                }
            ),
            "limit-count": (
                {
                    name: 'limit-count',
                    config: [
                        {
                            name: 'count',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.count_label' }),
                            type: 'integer',
                            effective: 'count > 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.count' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-count.inputcount' }) }, { pattern: new RegExp(/^[1-9]\d*$/, "g"), message: '请填写大于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputcount' }),
                            value: value.count || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'time_window',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.time_window_label' }),
                            type: 'integer',
                            effective: 'time_window > 0',
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.time_window' }),
                            FromType: 'input',
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.limit-count.inputtime_window' }) }, { pattern: new RegExp(/^[1-9]\d*$/, "g"), message: '请填写大于0的值' }],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputtime_window' }),
                            value: value.time_window || undefined,
                            defaultValue: undefined,
                        },
                        {
                            name: 'key_type',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.key_type_label' }),
                            type: 'string',
                            effective: '["var", "var_combination", "constant"]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.key_type' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputkey_type' }),
                            FromType: 'select',
                            value: value.key_type || undefined,
                            defaultValue: "var",
                            selectArr: ["var", "var_combination", "constant"],
                            rules: [],
                        },
                        {
                            name: 'key',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.key_label' }),
                            type: 'string',
                            effective: formatMessage({ id: 'gatewayplugin.limit-req.null' }),
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.key' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputkey' }),
                            FromType: 'input',
                            value: value.key || undefined,
                            defaultValue: "remote_addr",
                            rules: [],
                        },
                        {
                            name: 'rejected_code',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.rejected_code_label' }),
                            type: 'integer',
                            defaultValue: 503,
                            effective: '[200,...,599]',
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.rejected_code' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputrejected_code' }),
                            FromType: 'input',
                            value: value.rejected_code || undefined,
                            rules: [],
                        },
                        {
                            name: 'rejected_msg',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.rejected_msg_label' }),
                            type: 'string',
                            effective: formatMessage({ id: 'gatewayplugin.limit-req.Notempty' }),
                            FromType: 'input',
                            value: value.rejected_msg || undefined,
                            rules: [],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputrejected_msg' }),
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.rejected_msg' }),
                            defaultValue: undefined
                        },
                        {
                            name: 'policy',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.policy_label' }),
                            type: 'string',
                            effective: '["local"]',
                            defaultValue: "local",
                            FromType: 'select',
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-count.inputpolicy' }),
                            value: value.policy || undefined,
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.policy' }),
                            rules: [],

                        },
                        {
                            name: 'show_limit_quota_header',
                            label: formatMessage({ id: 'gatewayplugin.limit-count.show_limit_quota_header_label' }),
                            type: 'boolean',
                            effective: formatMessage({ id: 'gatewayplugin.limit-req.null' }),
                            defaultValue: true,
                            describe: formatMessage({ id: 'gatewayplugin.limit-count.show_limit_quota_header' }),
                            FromType: 'switch',
                            value: value.show_limit_quota_header || undefined,
                            rules: [],
                        }
                    ]
                }
            ),
            "proxy-rewrite": (
                {
                    name: 'proxy-rewrite',
                    config: [
                        {
                            name: 'uri',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.uri_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.uri' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.proxy-rewrite.uri_input' }),
                            FromType: 'input',
                            value: value.uri || undefined,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'method',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.method_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.method' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.proxy-rewrite.method_select' }),
                            FromType: 'select',
                            value: value.method || undefined,
                            defaultValue: undefined,
                            selectArr: ["GET", "POST", "PUT", "HEAD", "DELETE", "OPTIONS", "MKCOL", "COPY", "MOVE", "PROPFIND", "LOCK", "UNLOCK", "PATCH", "TRACE"],
                            rules: []
                        },
                        {
                            name: 'regex_uri',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.regex_uri_label' }),
                            type: 'array',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.regex_uri' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.proxy-rewrite.regex_uri_input' }),
                            FromType: 'input_arr',
                            value: value.regex_uri || undefined,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'host',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.host_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.host' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.proxy-rewrite.host_input' }),
                            FromType: 'input',
                            value: value.host || undefined,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'headers.add',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.add_label' }),
                            type: 'object',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.add' }),
                            placeholder: '',
                            FromType: 'input_arr',
                            value: value?.headers?.add|| undefined,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'headers.set',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.set_label' }),
                            type: 'object',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.set' }),
                            placeholder: '',
                            FromType: 'input_arr',
                            value: value?.headers?.set|| undefined,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'headers.remove',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.remove_label' }),
                            type: 'array',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.remove' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.proxy-rewrite.headers.remove_input' }),
                            FromType: 'input_arr',
                            value: value?.headers?.remove|| undefined,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'use_real_request_uri_unsafe',
                            label: formatMessage({ id: 'gatewayplugin.proxy-rewrite.use_real_request_uri_unsafe_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.proxy-rewrite.use_real_request_uri_unsafe' }),
                            FromType: 'switch',
                            value: value.use_real_request_uri_unsafe || false,
                            defaultValue: false,
                            rules: []
                        },
                    ]
                }
            ),
            "jwt-auth": (
                {
                    name: 'jwt-auth',
                    config: [
                        {
                            name: 'header',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.header_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.header' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.header_input' }),
                            FromType: 'input',
                            value: value.header,
                            defaultValue: 'authorization',
                            rules: []
                        },
                        {
                            name: 'query',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.query_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.query' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.query_input' }),
                            FromType: 'input',
                            value: value.query,
                            defaultValue: 'jwt',
                            rules: []
                        },
                        {
                            name: 'cookie',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.cookie_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.cookie' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.cookie_input' }),
                            FromType: 'input',
                            value: value.cookie,
                            defaultValue: 'jwt',
                            rules: []
                        },
                        {
                            name: 'hide_credentials',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.hide_credentials_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.hide_credentials' }),
                            FromType: 'switch',
                            value: value.hide_credentials,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'claims_to_verify',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.claims_to_verify_label' }),
                            type: 'array',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.claims_to_verify' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.claims_to_verify_input' }),
                            FromType: 'select',
                            mode: 'multiple',
                            value: value.claims_to_verify,
                            defaultValue: undefined,
                            selectArr: ['exp', 'nbf'],
                            rules: []
                        },
                        {
                            name: 'anonymous_consumer',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.anonymous_consumer_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.anonymous_consumer' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.anonymous_consumer_input' }),
                            FromType: 'input',
                            value: value.anonymous_consumer,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'store_in_ctx',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.store_in_ctx_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.store_in_ctx' }),
                            FromType: 'switch',
                            value: value.store_in_ctx,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'realm',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.realm_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.realm' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.realm_input' }),
                            FromType: 'input',
                            value: value.realm,
                            defaultValue: 'jwt',
                            rules: []
                        },
                        {
                            name: 'key_claim_name',
                            label: formatMessage({ id: 'gatewayplugin.jwt-auth.key_claim_name_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.jwt-auth.key_claim_name' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.jwt-auth.key_claim_name_input' }),
                            FromType: 'input',
                            value: value.key_claim_name,
                            defaultValue: 'key',
                            rules: []
                        },
                        {
                            name: 'extra_config',
                            label: formatMessage({ id: 'gatewayplugin.extra_config_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.extra_config' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.extra_config_input' }),
                            FromType: 'textarea',
                            rows: 4,
                            value: this.buildExtraConfigValue(value, [
                                'header',
                                'query',
                                'cookie',
                                'hide_credentials',
                                'claims_to_verify',
                                'anonymous_consumer',
                                'store_in_ctx',
                                'realm',
                                'key_claim_name'
                            ]),
                            defaultValue: undefined,
                            rules: []
                        }
                    ]
                }
            ),
            "openid-connect": (
                {
                    name: 'openid-connect',
                    config: [
                        {
                            name: 'client_id',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.client_id_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.client_id' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.client_id_input' }),
                            FromType: 'input',
                            value: value.client_id,
                            defaultValue: undefined,
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.openid-connect.client_id_input' }) }]
                        },
                        {
                            name: 'client_secret',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.client_secret_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.client_secret' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.client_secret_input' }),
                            FromType: 'password',
                            value: value.client_secret,
                            defaultValue: undefined,
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.openid-connect.client_secret_input' }) }]
                        },
                        {
                            name: 'discovery',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.discovery_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.discovery' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.discovery_input' }),
                            FromType: 'input',
                            value: value.discovery,
                            defaultValue: undefined,
                            rules: [{ required: true, message: formatMessage({ id: 'gatewayplugin.openid-connect.discovery_input' }) }]
                        },
                        {
                            name: 'scope',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.scope_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.scope' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.scope_input' }),
                            FromType: 'input',
                            value: value.scope,
                            defaultValue: 'openid',
                            rules: []
                        },
                        {
                            name: 'bearer_only',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.bearer_only_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.bearer_only' }),
                            FromType: 'switch',
                            value: value.bearer_only,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'redirect_uri',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.redirect_uri_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.redirect_uri' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.redirect_uri_input' }),
                            FromType: 'input',
                            value: value.redirect_uri,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'realm',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.realm_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.realm' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.realm_input' }),
                            FromType: 'input',
                            value: value.realm,
                            defaultValue: 'apisix',
                            rules: []
                        },
                        {
                            name: 'logout_path',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.logout_path_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.logout_path' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.logout_path_input' }),
                            FromType: 'input',
                            value: value.logout_path,
                            defaultValue: '/logout',
                            rules: []
                        },
                        {
                            name: 'post_logout_redirect_uri',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.post_logout_redirect_uri_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.post_logout_redirect_uri' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.post_logout_redirect_uri_input' }),
                            FromType: 'input',
                            value: value.post_logout_redirect_uri,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'ssl_verify',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.ssl_verify_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.ssl_verify' }),
                            FromType: 'switch',
                            value: value.ssl_verify,
                            defaultValue: true,
                            rules: []
                        },
                        {
                            name: 'timeout',
                            type: 'integer',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.timeout' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.timeout_input' }),
                            FromType: 'input',
                            value: value.timeout,
                            defaultValue: 3,
                            rules: []
                        },
                        {
                            name: 'introspection_endpoint',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.introspection_endpoint_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.introspection_endpoint' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.introspection_endpoint_input' }),
                            FromType: 'input',
                            value: value.introspection_endpoint,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'introspection_endpoint_auth_method',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.introspection_endpoint_auth_method_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.introspection_endpoint_auth_method' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.introspection_endpoint_auth_method_input' }),
                            FromType: 'select',
                            value: value.introspection_endpoint_auth_method,
                            defaultValue: 'client_secret_basic',
                            selectArr: [
                                { value: 'client_secret_basic', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.client_secret_basic' }) },
                                { value: 'client_secret_post', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.client_secret_post' }) },
                                { value: 'private_key_jwt', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.private_key_jwt' }) },
                                { value: 'client_secret_jwt', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.client_secret_jwt' }) }
                            ],
                            rules: []
                        },
                        {
                            name: 'token_endpoint_auth_method',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.token_endpoint_auth_method_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.token_endpoint_auth_method' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.token_endpoint_auth_method_input' }),
                            FromType: 'select',
                            value: value.token_endpoint_auth_method,
                            defaultValue: 'client_secret_basic',
                            selectArr: [
                                { value: 'client_secret_basic', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.client_secret_basic' }) },
                                { value: 'client_secret_post', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.client_secret_post' }) },
                                { value: 'private_key_jwt', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.private_key_jwt' }) },
                                { value: 'client_secret_jwt', label: formatMessage({ id: 'gatewayplugin.openid-connect.auth_method.client_secret_jwt' }) }
                            ],
                            rules: []
                        },
                        {
                            name: 'public_key',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.public_key_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.public_key' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.public_key_input' }),
                            FromType: 'textarea',
                            rows: 3,
                            value: value.public_key,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'use_jwks',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.use_jwks_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.use_jwks' }),
                            FromType: 'switch',
                            value: value.use_jwks,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'use_pkce',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.use_pkce_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.use_pkce' }),
                            FromType: 'switch',
                            value: value.use_pkce,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'token_signing_alg_values_expected',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.token_signing_alg_values_expected_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.token_signing_alg_values_expected' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.token_signing_alg_values_expected_input' }),
                            FromType: 'input',
                            value: value.token_signing_alg_values_expected,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'set_access_token_header',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.set_access_token_header_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.set_access_token_header' }),
                            FromType: 'switch',
                            value: value.set_access_token_header,
                            defaultValue: true,
                            rules: []
                        },
                        {
                            name: 'access_token_in_authorization_header',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.access_token_in_authorization_header_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.access_token_in_authorization_header' }),
                            FromType: 'switch',
                            value: value.access_token_in_authorization_header,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'set_id_token_header',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.set_id_token_header_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.set_id_token_header' }),
                            FromType: 'switch',
                            value: value.set_id_token_header,
                            defaultValue: true,
                            rules: []
                        },
                        {
                            name: 'set_userinfo_header',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.set_userinfo_header_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.set_userinfo_header' }),
                            FromType: 'switch',
                            value: value.set_userinfo_header,
                            defaultValue: true,
                            rules: []
                        },
                        {
                            name: 'set_refresh_token_header',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.set_refresh_token_header_label' }),
                            type: 'boolean',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.set_refresh_token_header' }),
                            FromType: 'switch',
                            value: value.set_refresh_token_header,
                            defaultValue: false,
                            rules: []
                        },
                        {
                            name: 'session.secret',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.session.secret_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.session.secret' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.session.secret_input' }),
                            FromType: 'password',
                            value: value?.session?.secret,
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'unauth_action',
                            label: formatMessage({ id: 'gatewayplugin.openid-connect.unauth_action_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.openid-connect.unauth_action' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.openid-connect.unauth_action_input' }),
                            FromType: 'select',
                            value: value.unauth_action,
                            defaultValue: 'auth',
                            selectArr: ['auth', 'deny', 'pass'],
                            rules: []
                        },
                        {
                            name: 'extra_config',
                            label: formatMessage({ id: 'gatewayplugin.extra_config_label' }),
                            type: 'string',
                            describe: formatMessage({ id: 'gatewayplugin.extra_config' }),
                            placeholder: formatMessage({ id: 'gatewayplugin.extra_config_input' }),
                            FromType: 'textarea',
                            rows: 4,
                            value: this.buildExtraConfigValue(value, [
                                'client_id',
                                'client_secret',
                                'discovery',
                                'scope',
                                'bearer_only',
                                'redirect_uri',
                                'realm',
                                'logout_path',
                                'post_logout_redirect_uri',
                                'ssl_verify',
                                'timeout',
                                'introspection_endpoint',
                                'introspection_endpoint_auth_method',
                                'token_endpoint_auth_method',
                                'public_key',
                                'use_jwks',
                                'use_pkce',
                                'token_signing_alg_values_expected',
                                'set_access_token_header',
                                'access_token_in_authorization_header',
                                'set_id_token_header',
                                'set_userinfo_header',
                                'set_refresh_token_header',
                                'session.secret',
                                'unauth_action'
                            ]),
                            defaultValue: undefined,
                            rules: []
                        }
                    ]
                }
            ),
            "cors": (
                {
                    name: 'cors',
                    config: [
                        {
                            name: 'allow_origins',
                            label: formatMessage({ id: 'gatewayplugin.cors.allow_origins_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.allow_origins || '*',
                            defaultValue: '*',
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_origins' }),
                            rules: []
                        },
                        {
                            name: 'allow_methods',
                            label: formatMessage({ id: 'gatewayplugin.cors.allow_methods_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.allow_methods || '*',
                            defaultValue: '*',
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_methods' }),
                            rules: []
                        },
                        {
                            name: 'allow_headers',
                            label: formatMessage({ id: 'gatewayplugin.cors.allow_headers_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.allow_headers || "*",
                            defaultValue: '*',
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_headers' }),
                            rules: []
                        },
                        {
                            name: 'expose_headers',
                            label: formatMessage({ id: 'gatewayplugin.cors.expose_headers_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.expose_headers || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.cors.expose_headers' }),
                            rules: []
                        },
                        {
                            name: 'max_age',
                            label: formatMessage({ id: 'gatewayplugin.cors.max_age_label' }),
                            type: 'integer',
                            FromType: 'input',
                            value: value.max_age || 5,
                            defaultValue: 5,
                            describe: formatMessage({ id: 'gatewayplugin.cors.max_age' }),
                            rules: []
                        },
                        {
                            name: 'allow_credentials',
                            label: formatMessage({ id: 'gatewayplugin.cors.allow_credentials_label' }),
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.allow_credentials || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_credentials' }),
                            rules: []
                        },
                        {
                            name: 'allow_origins_by_regex',
                            label: formatMessage({ id: 'gatewayplugin.cors.allow_origins_by_regex_label' }),
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.allow_origins_by_regex || undefined,
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_origins_by_regex' }),
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'allow_origins_by_metadata',
                            label: formatMessage({ id: 'gatewayplugin.cors.allow_origins_by_metadata_label' }),
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.allow_origins_by_metadata || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_origins_by_metadata' }),
                            rules: []
                        }
                    ]
                }
            ),
            "real-ip": (
                {
                    name: 'real-ip',
                    config: [
                        {
                            name: 'source',
                            label: formatMessage({ id: 'gatewayplugin.real-ip.source_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.source || 'arg_realip',
                            defaultValue: 'arg_realip',
                            describe: formatMessage({ id: 'gatewayplugin.real-ip.source' }),
                            rules: [{ required: true, message: '请填写源地址' },]
                        },
                        {
                            name: 'trusted_addresses',
                            label: formatMessage({ id: 'gatewayplugin.real-ip.trusted_addresses_label' }),
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.trusted_addresses || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.real-ip.trusted_addresses' }),
                            rules: []
                        },
                        {
                            name: 'recursive',
                            label: formatMessage({ id: 'gatewayplugin.real-ip.recursive_label' }),
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.recursive || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.real-ip.recursive' }),
                            rules: []
                        }
                    ]
                }
            ),
            "redirect": (
                {
                    name: 'redirect',
                    config: [
                        {
                            name: 'http_to_https',
                            label: formatMessage({ id: 'gatewayplugin.redirect.http_to_https_label' }),
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.http_to_https || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.http_to_https' }),
                            rules: []
                        },
                        {
                            name: 'uri',
                            label: formatMessage({ id: 'gatewayplugin.redirect.uri_label' }),
                            type: 'string',
                            FromType: 'input',
                            value: value.uri || '',
                            defaultValue: '',
                            describe: formatMessage({ id: 'gatewayplugin.redirect.uri' }),
                            rules: []
                        },
                        {
                            name: 'regex_uri',
                            label: formatMessage({ id: 'gatewayplugin.redirect.regex_uri_label' }),
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.regex_uri || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.regex_uri' }),
                            rules: []
                        },
                        {
                            name: 'ret_code',
                            label: formatMessage({ id: 'gatewayplugin.redirect.ret_code_label' }),
                            type: 'integer',
                            FromType: 'input',
                            value: value.ret_code || 302,
                            defaultValue: 302,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.ret_code' }),
                            rules: []
                        },
                        {
                            name: 'encode_uri',
                            label: formatMessage({ id: 'gatewayplugin.redirect.encode_uri_label' }),
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.encode_uri || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.encode_uri' }),
                            rules: []
                        },
                        {
                            name: 'append_query_string',
                            label: formatMessage({ id: 'gatewayplugin.redirect.append_query_string_label' }),
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.append_query_string || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.append_query_string' }),
                            rules: []
                        }
                    ]
                }
            ),
            "client-control": (
                {
                    name: 'client-control',
                    config: [
                        {
                            name: 'max_body_size',
                            label: formatMessage({ id: 'gatewayplugin.client_control.max_body_size_label' }),
                            type: 'integer',
                            FromType: 'input',
                            value: value.max_body_size || 0,
                            defaultValue: 0,
                            describe: formatMessage({ id: 'gatewayplugin.client_control.max_body_size' }),
                            rules: []
                        }
                    ]
                }
            )

        }
        return plugins[type] || {};
    }
}


export default pluginSystem;
