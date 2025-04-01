// 插件体系设置
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

const pluginSystem = {
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
            }
        ]
    },
    getFromOptins(type, value) {
        const plugins = {
            "limit-req": (
                {
                    name: 'limit-req',
                    config: [
                        {
                            name: 'rate',
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
                            type: 'string',
                            FromType: 'input',
                            value: value.key || undefined,
                            rules: [],
                            placeholder: formatMessage({ id: 'gatewayplugin.limit-conn.key' }),
                            describe: formatMessage({ id: 'gatewayplugin.limit-conn.inputkey' }),
                        },
                        {
                            name: 'rejected_code',
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
            "cors": (
                {
                    name: 'cors',
                    config: [
                        {
                            name: 'allow_origins',
                            type: 'string',
                            FromType: 'input',
                            value: value.allow_origins || '*',
                            defaultValue: '*',
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_origins' }),
                            rules: []
                        },
                        {
                            name: 'allow_methods',
                            type: 'string',
                            FromType: 'input',
                            value: value.allow_methods || '*',
                            defaultValue: '*',
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_methods' }),
                            rules: []
                        },
                        {
                            name: 'allow_headers',
                            type: 'string',
                            FromType: 'input',
                            value: value.allow_headers || "*",
                            defaultValue: '*',
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_headers' }),
                            rules: []
                        },
                        {
                            name: 'expose_headers',
                            type: 'string',
                            FromType: 'input',
                            value: value.expose_headers || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.cors.expose_headers' }),
                            rules: []
                        },
                        {
                            name: 'max_age',
                            type: 'integer',
                            FromType: 'input',
                            value: value.max_age || 5,
                            defaultValue: 5,
                            describe: formatMessage({ id: 'gatewayplugin.cors.max_age' }),
                            rules: []
                        },
                        {
                            name: 'allow_credentials',
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.allow_credentials || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_credentials' }),
                            rules: []
                        },
                        {
                            name: 'allow_origins_by_regex',
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.allow_origins_by_regex || undefined,
                            describe: formatMessage({ id: 'gatewayplugin.cors.allow_origins_by_regex' }),
                            defaultValue: undefined,
                            rules: []
                        },
                        {
                            name: 'allow_origins_by_metadata',
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
                            type: 'string',
                            FromType: 'input',
                            value: value.source || 'arg_realip',
                            defaultValue: 'arg_realip',
                            describe: formatMessage({ id: 'gatewayplugin.real-ip.source' }),
                            rules: [{ required: true, message: '请填写源地址' },]
                        },
                        {
                            name: 'trusted_addresses',
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.trusted_addresses || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.real-ip.trusted_addresses' }),
                            rules: []
                        },
                        {
                            name: 'recursive',
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
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.http_to_https || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.http_to_https' }),
                            rules: []
                        },
                        {
                            name: 'uri',
                            type: 'string',
                            FromType: 'input',
                            value: value.uri || '',
                            defaultValue: '',
                            describe: formatMessage({ id: 'gatewayplugin.redirect.uri' }),
                            rules: []
                        },
                        {
                            name: 'regex_uri',
                            type: 'array',
                            FromType: 'input_arr',
                            value: value.regex_uri || undefined,
                            defaultValue: undefined,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.regex_uri' }),
                            rules: []
                        },
                        {
                            name: 'ret_code',
                            type: 'integer',
                            FromType: 'input',
                            value: value.ret_code || 302,
                            defaultValue: 302,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.ret_code' }),
                            rules: []
                        },
                        {
                            name: 'encode_uri',
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.encode_uri || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.encode_uri' }),
                            rules: []
                        },
                        {
                            name: 'append_query_string',
                            type: 'boolean',
                            FromType: 'switch',
                            value: value.append_query_string || false,
                            defaultValue: false,
                            describe: formatMessage({ id: 'gatewayplugin.redirect.append_query_string' }),
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