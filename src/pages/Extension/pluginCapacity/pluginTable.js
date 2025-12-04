import { Tabs, Card, Col, Spin, Button, Tooltip, Dropdown, Menu, notification, Empty, Switch, Modal, Row } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import global from '../../../utils/global';
import AppState from '../../../components/ApplicationState';
import VisterBtn from '../../../components/visitBtnForAlllink';
import styles from './index.less'
const { TabPane } = Tabs;
@connect(({ global, user }) => ({
    enterprise: global.enterprise,
    currentUser: user.currentUser,
}), null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            pluginList: [],
            loading: true,
            isNeedAuthz: false,
            defaultPluginList: [
                {
                    "alias": "可观测中心",
                    "icon": "observation",
                    "description": "提供集群与应用级全方位监控能力，集成指标采集、日志分析、链路追踪可视化，支持Prometheus/Grafana无缝对接",
                    "version": "v1.2",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "企业基础功能",
                    "icon": "basics",
                    "description": "企业级基础能力套件，包含应用备份恢复、多租户权限管理、审计日志、自定义企业品牌等核心功能模块",
                    "version": "v2.0",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "监控报警",
                    "icon": "alert",
                    "description": "实时异常检测与智能告警系统，支持自定义阈值规则、多通道通知（邮件/钉钉/Webhook），保障业务连续性",
                    "version": "v1.03",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "GPU",
                    "icon": "gpu",
                    "description": "GPU资源调度与管理模块，支持AI训练/推理任务加速、显存监控、多卡分配策略，提升计算资源利用率",
                    "version": "v1.1",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "集群巡检",
                    "icon": "scan",
                    "description": "自动化集群健康诊断工具，定期检查节点状态、组件运行、安全漏洞，生成修复建议报告",
                    "version": "v1.7",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "流水线",
                    "icon": "pipeline",
                    "description": "企业级CI/CD流水线引擎，提供自定义流程编排的工具，通过构建，部署，测试，管控等组件化能力，把从开发到交付的各项工作串联起来，从而让企业轻松的实现持续交付。",
                    "version": "v2.0",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "安全增强",
                    "icon": "security",
                    "description": "全方位安全防护方案，包含网络策略管理、镜像漏洞扫描、RBAC权限控制、数据加密传输等核心安全能力",
                    "version": "v1.3",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "网关增强",
                    "icon": "gateway",
                    "description": "高性能API网关扩展模块，支持动态限流、智能路由、WAF防护、证书自动化管理",
                    "version": "v1.4",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "Istio可视化管理",
                    "icon": "istio",
                    "description": "服务网格可视化控制台，提供流量拓扑、灰度发布、故障注入等Istio服务治理能力的图形化管理",
                    "version": "v1.6",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "Spring Cloud可视化管理",
                    "icon": "springCloud",
                    "description": "Spring Cloud微服务全景监控平台，集成配置中心管理、接口性能分析、依赖关系可视化等核心功能",
                    "version": "v1.0",
                    "author": "官方",
                    "status": "not-configured"
                },
                {
                    "alias": "全链路灰度",
                    "icon": "gray",
                    "description": "智能灰度发布系统，支持跨微服务的分批次发布、基于 Header 的匹配规则、全链路灰度以及监控和回滚等功能，保障业务迭代安全。",
                    "version": "v1.0",
                    "author": "官方",
                    "status": "not-configured"
                }
            ],
            isContactModalVisible: false
        }
    }
    componentDidMount() {
        this.handleFetchPluginUrl()
    }

    handleFetchPluginUrl = () => {
        const { dispatch, regionName, enterprise, currentUser } = this.props
        // 优先从全局状态拿企业ID，其次尝试从URL解析
        const eid = (enterprise && enterprise.enterprise_id)
            || (currentUser && currentUser.enterprise_id)
            || global.getCurrEnterpriseId();
        if (!eid) {
            // 无有效企业ID时不请求，避免 /enterprise/undefined
            this.setState({ loading: false });
            notification.warning({ message: '未获取到企业ID，无法加载官方插件列表' });
            return;
        }
        
        dispatch({
            type: 'teamControl/fetchPluginUrl',
            payload: {
                enterprise_id: eid,
                region_name: regionName
            },
            callback: data => {
                if (data && data.bean) {
                    this.setState({
                        isNeedAuthz: data?.bean?.need_authz
                    }, () => {
                        this.handlePluginList()
                    })
                }
            },
            handleError: err => {
                this.setState({
                    isNeedAuthz: false,
                    pluginList: [],
                    loading: false
                })
            }
        })
    }

    handlePluginList = () => {
        const { dispatch, regionName } = this.props
        const eid = global.getCurrEnterpriseId();
        dispatch({
            type: 'global/getPluginList',
            payload: {
                enterprise_id: eid,
                region_name: regionName,
            },
            callback: res => {
                if (res && res.list) {
                    this.setState({
                        pluginList: res.list,
                        loading: false
                    })
                }
            },
            handleError: err => {
                if (err) {
                    this.setState({
                        pluginList: [],
                        loading: false
                    })
                }
            }
        })
    }

    onJumpApp = (value) => {
        const { dispatch, regionName } = this.props
        if (value.team_name == '') {
            notification.warning({ message: formatMessage({ id: 'notification.warn.not_app' }) })
        } else if (value.app_id == '-1') {
            notification.warning({ message: formatMessage({ id: 'notification.warn.not_team' }) })
        } else {
            dispatch(routerRedux.push(`/team/${value.team_name}/region/${regionName}/apps/${value.app_id}/overview`))
        }
    }

    renderVisitBtn = (links, type) => {
        if (links.length === 0) {
            return null;
        }
        if (links.length === 1) {
            let singleLink;
            if (links[0]) {
                singleLink =
                    links[0].includes('http') || links[0].includes('https')
                        ? links[0]
                        : `http://${links[0]}`;
            }
            return singleLink ? (
                <Tooltip
                    title={formatMessage({ id: 'tooltip.visit' })}
                    placement="topRight"
                >
                    {type === 'link' ? (
                        <a
                            style={{ fontSize: '14px' }}
                            onClick={e => {
                                e.stopPropagation();
                                window.open(singleLink);
                            }}
                        >
                            <FormattedMessage id='componentOverview.header.right.visit' />
                        </a>
                    ) : (
                        <Button
                            type='primary'
                            onClick={e => {
                                e.stopPropagation();
                                window.open(singleLink);
                            }}
                        >
                            <FormattedMessage id='componentOverview.header.right.visit' />
                        </Button>
                    )}
                </Tooltip>
            ) : null;
        }
        return (
            <Tooltip
                placement="topLeft"
                arrowPointAtCenter
                title={formatMessage({ id: 'tooltip.visit' })}
            >
                <Dropdown
                    overlay={
                        <Menu>
                            {links.map((item, index) => {
                                return (
                                    <Menu.Item key={index}>
                                        <a
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={e => {
                                                e.stopPropagation();
                                            }}
                                            href={
                                                item &&
                                                (item.includes('http') || item.includes('https')
                                                    ? item
                                                    : `http://${item}`)
                                            }
                                        >
                                            {item}
                                        </a>
                                    </Menu.Item>
                                );
                            })}
                        </Menu>
                    }
                    placement="bottomRight"
                >
                    {type === 'link' ? (
                        <a style={{ fontSize: '14px' }}><FormattedMessage id='componentOverview.header.right.visit' /></a>
                    ) : (
                        <Button type="primary"><FormattedMessage id='componentOverview.header.right.visit' /></Button>
                    )}
                </Dropdown>
            </Tooltip>
        );
    }
    changePluginStatus = (val) => {
        const { dispatch, regionName } = this.props
        dispatch({
            type: 'global/editPluginsStatus',
            payload: {
                region_name: regionName,
                plugin_name: val.name,
                action: val.enable_status == 'true' ? 'disable' : 'enable'
            },
            callback: res => {
                this.handlePluginList()
                notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) })
            },
            handleError: err => {
                this.handlePluginList()
                notification.error({ message: formatMessage({ id: 'enterpriseColony.mgt.cluster.editDefeated' }) })

            }
        })

    }
    handleContactModal = () => {
        this.setState({
            isContactModalVisible: !this.state.isContactModalVisible
        });
    };

    handleEnterpriseAuth = () => {
        window.open('https://www.rainbond.com/enterprise_server');
        this.handleContactModal();
    };
    render() {
        const { pluginList, loading, defaultPluginList, isNeedAuthz } = this.state
        const pluginSvg = (
            <svg
                t="1671589320301"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="5737"
                width="44"
                height="44"
            >
                <path
                    d="M512.45099 1024L64.997835 767.475541 64.383834 255.475541 511.222988 0l447.453156 256.524459 0.614001 512-446.839155 255.475541z m401.454255-745.192425l-402.682257-234.266926L109.154733 277.758657l0.614001 467.433768 402.682256 234.266926 402.068256-233.218008-0.614001-467.433768z"
                    fill="#4e74ae"
                    p-id="5738"
                >
                </path>
                <path
                    d="M491.063292 511.232499h44.770899v356.632189h-44.770899z"
                    fill="#4e74ae"
                    p-id="5739"
                >
                </path>
                <path
                    d="M524.424008 530.599111l-22.38545-38.579724 310.198371-178.213761 22.38545 38.579724-310.198371 178.213761z"
                    fill="#4e74ae"
                    p-id="5740">
                </path>
                <path
                    d="M524.424008 492.019387l-22.38545 38.579724-310.172788-178.213761 22.38545-38.579724 310.172788 178.213761z"
                    fill="#4e74ae"
                    p-id="5741">
                </path>
            </svg>
        )
        return (
            <div>
                {pluginList.length > 0 && !loading && (
                    <div style={{ marginTop: '24px', minHeight: '300px' }}>
                        {pluginList.map((item) => {
                            const {
                                app_id,
                                author,
                                description,
                                icon,
                                name,
                                namespace,
                                status,
                                team_name,
                                version,
                                urls,
                                alias,
                                enable_status
                            } = item
                            return (
                                <div className={styles.boxs}>
                                    <Col span={2} className={styles.icons}>
                                        <div className={styles.imgs}>
                                            {icon ? <img src={icon} alt="" /> : pluginSvg}
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <p className={styles.pluginName} onClick={() => this.onJumpApp(item)}>{alias == '' ? name : alias}</p>
                                        <p className={styles.pluginDesc}>{description}</p>
                                    </Col>
                                    <Col span={3}>
                                        <div className={styles.statusBox}>
                                            <AppState AppStatus={status} />
                                        </div>
                                    </Col>
                                    <Col span={2} className={styles.versions}>
                                        {version ? version : '-'}
                                    </Col>
                                    <Col span={2} className={styles.author}>
                                        {author ? `@${author}` : '-'}
                                    </Col>
                                    <Col span={3} className={styles.btnBox}>
                                        {(app_id == '-1' || team_name == '') ? (
                                            null
                                        ) : (
                                            <a onClick={() => this.onJumpApp(item)} target="_blank" >
                                                {formatMessage({ id: 'extensionEnterprise.plugin.btn.manage' })}
                                            </a>
                                        )}
                                        {/* 访问 */}
                                        {urls.length > 0 && this.renderVisitBtn(urls, 'link')}
                                    </Col>
                                    <Col span={2} className={styles.author}>
                                        <Switch checkedChildren="启用" unCheckedChildren="禁用" checked={enable_status == 'true'} onChange={() => this.changePluginStatus(item)} />
                                    </Col>
                                </div>
                            )
                        })}
                    </div>
                )}
                {pluginList.length == 0 && !isNeedAuthz && !loading && (
                    <div style={{ marginTop: '24px', minHeight: '300px' }}>
                        {defaultPluginList.map((item) => {
                            const {
                                author,
                                description,
                                icon,
                                name,
                                status,
                                version,
                                alias,
                            } = item
                            return (
                                <div className={styles.boxs}>
                                    <Col span={2} className={styles.icons}>
                                        <div className={styles.imgs}>
                                            {global.fetchSvg(icon)}
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <p className={styles.pluginName}>{alias}</p>
                                        <p className={styles.pluginDesc}>{description}</p>
                                    </Col>
                                    <Col span={2}>
                                        <div className={styles.statusBox}>
                                            <AppState AppStatus={status} />
                                        </div>
                                    </Col>
                                    <Col span={2} className={styles.versions}>
                                        {version ? version : '-'}
                                    </Col>
                                    <Col span={2} className={styles.author}>
                                        {author ? `@${author}` : '-'}
                                    </Col>
                                    <Col span={2}>
                                        <a onClick={this.handleContactModal}>安装</a>
                                    </Col>
                                </div>
                            )
                        })}
                    </div>
                )}
                {loading && (
                    <div className={styles.content}>
                        <Spin />
                    </div>
                )}
                <Modal
                    title="企业授权提示"
                    visible={this.state.isContactModalVisible}
                    onCancel={this.handleContactModal}
                    footer={<Button type='primary' onClick={this.handleEnterpriseAuth}>获取企业授权</Button>}
                >
                    <div style={{ padding: '24px 0' }}>
                        <p style={{ 
                                fontSize: '14px',
                                color: '#595959',
                                marginBottom: '8px',
                                lineHeight: '1.8'
                            }}>
                                该功能属于企业级功能，需要获得企业授权后才能使用。
                        </p>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default Index;
