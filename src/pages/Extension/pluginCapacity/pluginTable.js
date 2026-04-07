import { Tabs, Col, Spin, Button, Tooltip, Dropdown, Menu, notification, Switch, Modal, Tag, Icon, Input, Alert, Empty } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import moment from 'moment';
import global from '../../../utils/global';
import AppState from '../../../components/ApplicationState';
import { renderPlatformPluginIcon } from '../../../utils/platformPluginIcon';
import styles from './index.less'
import enterpriseStyles from '../../Enterprise/index.less'
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
            activeTab: 'all',
            isAuthorizationCode: false,
            authCode: '',
            installingPlugins: {},
            confirmInstallPlugin: null,
            installModalPhase: 'confirm', // confirm | installing | RUNNING
            installResultBean: null,
            isServiceExpired: false,
            subscribeUntil: null,
            licenseValid: false,
            defaultPluginList: [
                {
                    "plugin_name": "监控中心",
                    "logo": "",
                    "icon": "observation",
                    "description": "提供集群与应用级全方位监控能力，集成指标采集、日志分析、链路追踪可视化，支持Prometheus/Grafana无缝对接",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "企业基础插件",
                    "logo": "",
                    "icon": "basics",
                    "description": "企业级基础能力套件，包含应用备份恢复、多租户权限管理、审计日志、自定义企业品牌等核心功能模块",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "告警中心",
                    "logo": "",
                    "icon": "alert",
                    "description": "实时异常检测与智能告警系统，支持自定义阈值规则、多通道通知（邮件/钉钉/Webhook），保障业务连续性",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "GPU 管理",
                    "logo": "",
                    "icon": "gpu",
                    "description": "GPU资源调度与管理模块，支持AI训练/推理任务加速、显存监控、多卡分配策略，提升计算资源利用率",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "流水线",
                    "logo": "",
                    "icon": "pipeline",
                    "description": "企业级CI/CD流水线引擎，提供自定义流程编排的工具，通过构建，部署，测试，管控等组件化能力，把从开发到交付的各项工作串联起来，从而让企业轻松的实现持续交付。",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "日志中心",
                    "logo": "",
                    "icon": "logs",
                    "description": "统一日志采集与分析平台，支持多集群日志聚合、全文检索、实时过滤与可视化展示，快速定位应用异常与运维问题",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "灾备恢复",
                    "logo": "",
                    "icon": "security",
                    "description": "企业级数据保护与灾备方案，支持应用级备份恢复、跨集群迁移、定时快照策略，保障业务数据安全与连续性",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "计量计费",
                    "logo": "",
                    "icon": "bill",
                    "description": "资源用量精细化计量与成本管理工具，支持按团队、应用、组件维度统计CPU/内存/存储消耗，生成费用报表与趋势分析",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                },
                {
                    "plugin_name": "源码扫描",
                    "logo": "",
                    "icon": "scan",
                    "description": "代码质量与安全扫描引擎，支持多语言源码静态分析、依赖漏洞检测、编码规范审查，助力团队提升代码质量与安全水平",
                    "version": "1.0",
                    "author": "Rainbond 官方",
                    "installed": false,
                    "status": ""
                }
            ],
        }
    }
    componentDidMount() {
        this.handleGetLicense();
        this.handlePluginList()
        this.pollTimer = setInterval(() => this.handlePluginList(), 5000)
    }

    componentWillUnmount() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer)
        }
        this.stopInstallPolling();
    }

    handleGetLicense = () => {
        const { dispatch } = this.props;
        const eid = this.getEid();
        if (!eid) return;
        dispatch({
            type: 'region/getEnterpriseLicense',
            payload: { enterprise_id: eid },
            callback: res => {
                if (res && res.status_code === 200 && res.bean) {
                    const subscribeUntil = res.bean.subscribe_until;
                    const isExpired = subscribeUntil
                        ? moment.unix(subscribeUntil).valueOf() < Date.now()
                        : false;
                    this.setState({
                        subscribeUntil,
                        isServiceExpired: isExpired,
                        licenseValid: !!res.bean.valid,
                    });
                } else {
                    this.setState({ licenseValid: false });
                }
            },
            handleError: error => {
                this.setState({ licenseValid: false });
            }
        });
    }

    handlePluginList = () => {
        const { dispatch, regionName, enterprise, currentUser } = this.props
        const eid = (enterprise && enterprise.enterprise_id)
            || (currentUser && currentUser.enterprise_id)
            || global.getCurrEnterpriseId();
        if (!eid) {
            this.setState({ loading: false });
            notification.warning({ message: '未获取到企业ID，无法加载插件列表' });
            return;
        }
        dispatch({
            type: 'global/getEnterprisePluginList',
            payload: {
                enterprise_id: eid,
                region_name: regionName,
            },
            callback: res => {
                if (res && res.list && res.list.length > 0) {
                    this.setState({
                        pluginList: res.list,
                        loading: false
                    })
                } else {
                    this.setState({
                        pluginList: [],
                        loading: false
                    })
                }
            },
            handleError: () => {
                this.setState({
                    pluginList: [],
                    loading: false
                })
            }
        })
    }

    onJumpApp = (value, tab = 'upgrade') => {
        const { dispatch, regionName } = this.props
        if (!value.team_name) {
            notification.warning({ message: formatMessage({ id: 'notification.warn.not_app' }) })
        } else if (value.app_id === -1) {
            notification.warning({ message: formatMessage({ id: 'notification.warn.not_team' }) })
        } else {
            dispatch(routerRedux.push(`/team/${value.team_name}/region/${regionName}/apps/${value.app_id}/${tab}`))
        }
    }

    renderVisitBtn = (links, type) => {
        if (!links || links.length === 0) {
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
                <Tooltip title={formatMessage({ id: 'tooltip.visit' })} placement="topRight">
                    {type === 'link' ? (
                        <a style={{ fontSize: '14px' }} onClick={e => { e.stopPropagation(); window.open(singleLink); }}>
                            <FormattedMessage id='componentOverview.header.right.visit' />
                        </a>
                    ) : (
                        <Button type='primary' onClick={e => { e.stopPropagation(); window.open(singleLink); }}>
                            <FormattedMessage id='componentOverview.header.right.visit' />
                        </Button>
                    )}
                </Tooltip>
            ) : null;
        }
        return (
            <Tooltip placement="topLeft" arrowPointAtCenter title={formatMessage({ id: 'tooltip.visit' })}>
                <Dropdown
                    overlay={
                        <Menu>
                            {links.map((item, index) => (
                                <Menu.Item key={index}>
                                    <a target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                        href={item && (item.includes('http') || item.includes('https') ? item : `http://${item}`)}>
                                        {item}
                                    </a>
                                </Menu.Item>
                            ))}
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
                plugin_name: val.plugin_id,
                action: val.status === 'Running' ? 'disable' : 'enable'
            },
            callback: () => {
                this.handlePluginList()
                notification.success({ message: formatMessage({ id: 'notification.success.succeeded' }) })
            },
            handleError: () => {
                this.handlePluginList()
                notification.error({ message: formatMessage({ id: 'enterpriseColony.mgt.cluster.editDefeated' }) })
            }
        })
    }

    handleGoAuth = () => {
        window.open('https://www.rainbond.com/enterprise_server');
    }

    handleShowAuthModal = () => {
        this.setState({ isAuthorizationCode: true });
    }

    handleCloseAuthModal = () => {
        this.setState({ isAuthorizationCode: false });
    }

    getEid = () => {
        const { enterprise, currentUser } = this.props;
        return (enterprise && enterprise.enterprise_id)
            || (currentUser && currentUser.enterprise_id)
            || global.getCurrEnterpriseId();
    }

    handleCopyEid = () => {
        const eid = this.getEid();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(eid).then(() => {
                notification.success({ message: formatMessage({ id: 'platformUpgrade.index.authModal.copySuccess' }) });
            });
        } else {
            const input = document.createElement('input');
            input.value = eid;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            notification.success({ message: formatMessage({ id: 'platformUpgrade.index.authModal.copySuccess' }) });
        }
    }

    handleSubmitAuthCode = () => {
        const { authCode } = this.state;
        if (!authCode || !authCode.trim()) {
            notification.warning({ message: '请输入授权码' });
            return;
        }
        this.handleUpdateEnterpriseAuthorization(authCode.trim());
    }

    handleUpdateEnterpriseAuthorization = (code) => {
        const { dispatch } = this.props;
        const eid = this.getEid();
        dispatch({
            type: 'region/uploadEnterpriseLicense',
            payload: {
                enterprise_id: eid,
                authz_code: code
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    notification.success({ message: '授权码更新成功' });
                    this.handleCloseAuthModal();
                    this.handleGetLicense();
                    this.handlePluginList();
                }
            }
        });
    }

    handleUninstall = (plugin) => {
        Modal.confirm({
            title: '确认卸载',
            content: `确定要卸载「${plugin.plugin_name || plugin.plugin_id}」吗？`,
            okText: '确认',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: () => {
                notification.success({ message: '卸载成功' });
                this.handlePluginList();
            }
        });
    }

    handleInstallPlugin = (plugin) => {
        this.setState({
            confirmInstallPlugin: plugin,
            installModalPhase: 'confirm',
            installResultBean: null,
        });
    }

    handleCloseInstallConfirm = () => {
        this.stopInstallPolling();
        this.setState({
            confirmInstallPlugin: null,
            installModalPhase: 'confirm',
            installResultBean: null,
        });
    }

    handleConfirmInstall = () => {
        const { confirmInstallPlugin } = this.state;
        if (confirmInstallPlugin) {
            this.setState({ installModalPhase: 'installing' });
            this.doInstallPlugin(confirmInstallPlugin);
        }
    }

    handleGoManage = () => {
        const { regionName } = this.props;
        const { confirmInstallPlugin, installResultBean } = this.state;
        const bean = installResultBean || {};
        const teamName = bean.team_name || (confirmInstallPlugin && confirmInstallPlugin.team_name);
        const appId = bean.app_id || (confirmInstallPlugin && confirmInstallPlugin.app_id);
        this.handleCloseInstallConfirm();
        if (teamName && appId && appId !== -1) {
            this.props.dispatch(routerRedux.push(
                `/team/${teamName}/region/${regionName}/apps/${appId}/overview`
            ));
        }
    }

    doInstallPlugin = (plugin) => {
        const { dispatch, regionName, enterprise, currentUser } = this.props;
        const eid = (enterprise && enterprise.enterprise_id)
            || (currentUser && currentUser.enterprise_id)
            || global.getCurrEnterpriseId();
        this.setState(prev => ({
            installingPlugins: { ...prev.installingPlugins, [plugin.plugin_id]: true }
        }));
        dispatch({
            type: 'global/installPlugin',
            payload: {
                enterprise_id: eid,
                region_name: regionName,
                plugin_id: plugin.plugin_id,
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    const bean = res.bean || (res.data && res.data.bean) || {};
                    this.setState({
                        installResultBean: bean,
                    });
                    this.startInstallPolling(plugin.plugin_id);
                } else {
                    this.setState(prev => ({
                        installingPlugins: { ...prev.installingPlugins, [plugin.plugin_id]: false },
                        installModalPhase: 'confirm',
                    }));
                }
            },
            handleError: () => {
                this.setState(prev => ({
                    installingPlugins: { ...prev.installingPlugins, [plugin.plugin_id]: false },
                    installModalPhase: 'confirm',
                }));
                notification.error({ message: `${plugin.plugin_name || plugin.plugin_id} 安装失败` });
            }
        });
    }

    startInstallPolling = (pluginId) => {
        this.stopInstallPolling();
        this.installPollTimer = setInterval(() => {
            const { dispatch, regionName, enterprise, currentUser } = this.props;
            const eid = (enterprise && enterprise.enterprise_id)
                || (currentUser && currentUser.enterprise_id)
                || global.getCurrEnterpriseId();
            dispatch({
                type: 'global/getEnterprisePluginList',
                payload: {
                    enterprise_id: eid,
                    region_name: regionName,
                },
                callback: res => {
                    if (res && res.list && res.list.length > 0) {
                        this.setState({ pluginList: res.list });
                        const target = res.list.find(p => p.plugin_id === pluginId);
                        if (target && target.status === 'RUNNING') {
                            this.stopInstallPolling();
                            this.setState(prev => ({
                                installingPlugins: { ...prev.installingPlugins, [pluginId]: false },
                                installModalPhase: 'RUNNING',
                            }));
                        }
                    }
                },
            });
        }, 3000);
    }

    stopInstallPolling = () => {
        if (this.installPollTimer) {
            clearInterval(this.installPollTimer);
            this.installPollTimer = null;
        }
    }

    handleTabChange = (key) => {
        this.setState({ activeTab: key });
    };

    getFilteredPluginList = () => {
        const { pluginList, activeTab } = this.state;
        if (activeTab === 'installed') {
            return pluginList.filter(item => item.installed === true);
        } else if (activeTab === 'upgradable') {
            return pluginList.filter(item => item.can_upgrade === true);
        }
        return pluginList;
    };

    getTabCounts = () => {
        const { pluginList } = this.state;
        return {
            all: pluginList.length,
            installed: pluginList.filter(item => item.installed === true).length,
            upgradable: pluginList.filter(item => item.can_upgrade === true).length
        };
    };

    renderPluginIcon = (item) => {
        return renderPlatformPluginIcon(item, { size: 44, color: global.getPublicColor() });
    }

    renderPluginCard = (item) => {
        const { plugin_id, description, plugin_name, status, installed_version, urls, installed, latest_version } = item;
        const { installingPlugins, isServiceExpired, licenseValid } = this.state;
        const isInstalling = installingPlugins[plugin_id];
        const appLevel = item.app_level || item.appLevel || 'enterprise';
        const isCommercial = appLevel !== 'free';
        const levelText = isCommercial ? '商业' : '免费';
        const levelColor = isCommercial ? 'blue' : 'green';
        return (
            <div className={styles.boxs} key={plugin_id}>
                <Col span={2} className={styles.icons}>
                    <div className={styles.imgs}>{this.renderPluginIcon(item)}</div>
                </Col>
                <Col span={8}>
                    <p className={styles.pluginName}>
                        {installed
                            ? <a onClick={() => this.onJumpApp(item)}>{plugin_name || plugin_id}</a>
                            : <span>{plugin_name || plugin_id}</span>
                        }
                        <Tag color={levelColor} className={styles.commercialTag}>{levelText}</Tag>
                    </p>
                    <p className={styles.pluginDesc}>{description}</p>
                </Col>
                <Col span={3} className={styles.versions}>{installed_version || latest_version || '-'}</Col>
                <Col span={3}>
                    <div className={styles.statusBox}>
                        {installed && status ? <AppState AppStatus={status} /> : <span style={{ color: '#999', fontSize: 12 }}>未安装</span>}
                    </div>
                </Col>
                <Col span={3} className={styles.author}>
                    {item.author ? `@${item.author}` : `@Rainbond 官方`}
                </Col>
                <Col span={5} className={styles.btnBox}>
                    {installed ? (
                        <>
                            {item.upgradeable && (
                                isServiceExpired ? (
                                    <Tooltip title="服务已过期，无法升级插件">
                                        <Button size="small" disabled className={styles.upgradeBtn}>升级</Button>
                                    </Tooltip>
                                ) : (
                                    <Button size="small" className={styles.upgradeBtn} onClick={() => this.onJumpApp(item)}>升级</Button>
                                )
                            )}
                            <Button size="small" type="primary" ghost onClick={() => this.onJumpApp(item, 'overview')}>
                                {formatMessage({ id: 'extensionEnterprise.plugin.btn.manage' })}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* <Button size="small">文档</Button> */}
                            {isServiceExpired ? (
                                <Tooltip title="服务已过期，无法安装插件">
                                    <Button size="small" type="primary" disabled>安装</Button>
                                </Tooltip>
                            ) : isCommercial && !licenseValid ? (
                                <Button size="small" type="primary" onClick={this.handleShowAuthModal}>
                                    安装
                                </Button>
                            ) : (
                                <Button size="small" type="primary" loading={isInstalling} onClick={() => this.handleInstallPlugin(item)}>
                                    {isInstalling ? '安装中' : '安装'}
                                </Button>
                            )}
                        </>
                    )}
                </Col>
            </div>
        );
    }

    renderDefaultPluginCard = (item, index) => {
        return (
            <div className={styles.boxs} key={index}>
                <Col span={2} className={styles.icons}>
                    <div className={styles.imgs}>{this.renderPluginIcon(item)}</div>
                </Col>
                <Col span={8}>
                    <p className={styles.pluginName}>
                        <span>{item.plugin_name}</span>
                        <Tag color="blue" className={styles.commercialTag}>商业</Tag>
                    </p>
                    <p className={styles.pluginDesc}>{item.description}</p>
                </Col>
                <Col span={3} className={styles.versions}>{item.version || '-'}</Col>
                <Col span={3}>
                    <div className={styles.statusBox}>
                        <span style={{ color: '#999', fontSize: 12 }}>未安装</span>
                    </div>
                </Col>
                <Col span={3} className={styles.author}>{item.author ? `@${item.author}` : `@Rainbond 官方`}</Col>
                <Col span={5} className={styles.btnBox}>
                    {/* <Button size="small">文档</Button> */}
                    <Button size="small" type="primary" onClick={this.handleShowAuthModal}>安装</Button>
                </Col>
            </div>
        );
    }

    render() {
        const { pluginList, loading, defaultPluginList, isAuthorizationCode, authCode, confirmInstallPlugin, installModalPhase, isServiceExpired, subscribeUntil } = this.state;
        const eid = this.getEid();
        return (
            <div>
                {isServiceExpired && (
                    <Alert
                        type="warning"
                        showIcon
                        banner
                        className={styles.expiredBanner}
                        message={
                            <span>
                                服务已过期{subscribeUntil ? `（到期时间：${moment.unix(subscribeUntil).format('YYYY-MM-DD')}）` : ''}，无法安装和更新插件，已安装插件不受影响。
                                <a onClick={this.handleShowAuthModal} style={{ marginLeft: 8 }}>更新授权</a>
                            </span>
                        }
                    />
                )}
                {pluginList.length > 0 && !loading && (
                    <div style={{ marginTop: '24px', minHeight: '300px' }}>
                        {pluginList.map(item => this.renderPluginCard(item))}
                    </div>
                )}
                {pluginList.length === 0 && !loading && (
                    <div style={{ marginTop: '24px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty description="暂无可用插件" />
                    </div>
                )}
                {loading && (
                    <div className={styles.content}><Spin /></div>
                )}
                {confirmInstallPlugin && (
                    <Modal
                        visible
                        onCancel={installModalPhase === 'installing' ? undefined : this.handleCloseInstallConfirm}
                        footer={null}
                        closable={installModalPhase !== 'installing'}
                        maskClosable={installModalPhase !== 'installing'}
                        width={480}
                        bodyStyle={{ padding: 0 }}
                        centered
                    >
                        <div className={styles.installConfirmModal}>
                            {installModalPhase === 'confirm' && (
                                <>
                                    <div className={styles.installModalIconWrap}>
                                        <div className={styles.installModalIconCircle}>
                                            {this.renderPluginIcon(confirmInstallPlugin)}
                                        </div>
                                    </div>
                                    <div className={styles.installConfirmTitle}>
                                        确认安装
                                    </div>
                                    <div className={styles.installConfirmSubtitle}>
                                        即将安装「{confirmInstallPlugin.plugin_name || confirmInstallPlugin.plugin_id}」
                                    </div>
                                    <div className={styles.installInfoCard}>
                                        <div className={styles.installInfoRow}>
                                            <span className={styles.installInfoLabel}>版本</span>
                                            <span className={styles.installInfoValue}>{confirmInstallPlugin.latest_version || '-'}</span>
                                        </div>
                                        <div className={styles.installInfoRow}>
                                            <span className={styles.installInfoLabel}>作者</span>
                                            <span className={styles.installInfoValue}>{confirmInstallPlugin.author ? `@${confirmInstallPlugin.author}` : '@Rainbond 官方'}</span>
                                        </div>
                                        <div className={styles.installInfoRow} style={{ alignItems: 'flex-start' }}>
                                            <span className={styles.installInfoLabel}>简介</span>
                                            <span className={styles.installInfoValue}>{confirmInstallPlugin.description || '-'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.installConfirmFooter}>
                                        <Button size="large" style={{ flex: 1 }} onClick={this.handleCloseInstallConfirm}>取消</Button>
                                        <Button size="large" type="primary" style={{ flex: 1 }} onClick={this.handleConfirmInstall}>确认安装</Button>
                                    </div>
                                </>
                            )}
                            {installModalPhase === 'installing' && (
                                <div className={styles.installPhaseInstalling}>
                                    <div className={styles.installModalIconWrap}>
                                        <div className={`${styles.installModalIconCircle} ${styles.installingPulse}`}>
                                            {this.renderPluginIcon(confirmInstallPlugin)}
                                        </div>
                                    </div>
                                    <div className={styles.installingText}>正在安装</div>
                                    <div className={styles.installingSubText}>
                                        「{confirmInstallPlugin.plugin_name || confirmInstallPlugin.plugin_id}」正在安装中，请耐心等待...
                                    </div>
                                    <div className={styles.installingSpinner}>
                                        <Spin />
                                    </div>
                                </div>
                            )}
                            {installModalPhase === 'RUNNING' && (
                                <div className={styles.installPhaseSuccess}>
                                    <div className={styles.installModalIconWrap}>
                                        <div className={styles.successCircle}>
                                            <Icon type="check" className={styles.successCheckIcon} />
                                        </div>
                                    </div>
                                    <div className={styles.successText}>安装成功</div>
                                    <div className={styles.successSubText}>
                                        「{confirmInstallPlugin.plugin_name || confirmInstallPlugin.plugin_id}」已安装完成，可前往管理页面查看
                                    </div>
                                    <div className={styles.installConfirmFooter}>
                                        <Button size="large" style={{ flex: 1 }} onClick={this.handleCloseInstallConfirm}>关闭</Button>
                                        <Button size="large" type="primary" style={{ flex: 1 }} onClick={this.handleGoManage}>管理</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
                {isAuthorizationCode && (
                    <Modal
                        visible
                        onCancel={this.handleCloseAuthModal}
                        footer={null}
                        closable={false}
                        width={520}
                        bodyStyle={{ padding: 0 }}
                        centered
                    >
                        <div className={enterpriseStyles.authModal}>
                            <div className={enterpriseStyles.authModalBody}>
                                <div className={enterpriseStyles.authModalIcon}>
                                    <Icon type="lock" />
                                </div>
                                <div className={enterpriseStyles.authModalTitle}>
                                    {formatMessage({ id: 'platformUpgrade.index.authModal.title' })}
                                </div>
                                <div className={enterpriseStyles.authModalSubtitle}>
                                    {formatMessage({ id: 'platformUpgrade.index.authModal.subtitle' })}
                                </div>
                                <div className={enterpriseStyles.authModalActions}>
                                    <a href="https://www.rainbond.com" target="_blank" rel="noopener noreferrer" className={enterpriseStyles.authModalActionCard}>
                                        <Icon type="global" className={enterpriseStyles.authModalActionIcon} />
                                        <span>{formatMessage({ id: 'platformUpgrade.index.authModal.website' })}</span>
                                        <Icon type="right" className={enterpriseStyles.authModalActionArrow} />
                                    </a>
                                    <a href="https://www.rainbond.com/enterprise_server" target="_blank" rel="noopener noreferrer" className={enterpriseStyles.authModalActionCard}>
                                        <Icon type="solution" className={enterpriseStyles.authModalActionIcon} />
                                        <span>{formatMessage({ id: 'platformUpgrade.index.authModal.getCommercial' })}</span>
                                        <Icon type="right" className={enterpriseStyles.authModalActionArrow} />
                                    </a>
                                </div>
                                <div className={enterpriseStyles.authModalEid}>
                                    <span className={enterpriseStyles.authModalEidLabel}>
                                        {formatMessage({ id: 'platformUpgrade.index.authModal.enterpriseId' })}
                                    </span>
                                    <span className={enterpriseStyles.authModalEidValue}>{eid}</span>
                                    <a onClick={this.handleCopyEid} className={enterpriseStyles.authModalCopyBtn}>
                                        <Icon type="copy" style={{ marginRight: 4 }} />
                                        {formatMessage({ id: 'platformUpgrade.index.authModal.copy' })}
                                    </a>
                                </div>
                                <div className={enterpriseStyles.authModalEidTip}>
                                    {formatMessage({ id: 'platformUpgrade.index.authModal.idTip' })}
                                </div>
                                <div className={enterpriseStyles.authModalCodeSection}>
                                    <div className={enterpriseStyles.authModalCodeLabel}>
                                        {formatMessage({ id: 'platformUpgrade.index.authModal.hasCode' })}
                                    </div>
                                    <div className={enterpriseStyles.authModalCodeInput}>
                                        <Input.TextArea
                                            rows={3}
                                            placeholder={formatMessage({ id: 'platformUpgrade.index.authModal.inputPlaceholder' })}
                                            value={authCode}
                                            onChange={(e) => this.setState({ authCode: e.target.value })}
                                        />
                                    </div>
                                    <Button type="primary" block onClick={this.handleSubmitAuthCode} style={{ marginTop: 12, borderRadius: 6 }}>
                                        {formatMessage({ id: 'platformUpgrade.index.authModal.activate' })}
                                    </Button>
                                </div>
                                <div className={enterpriseStyles.authModalLater}>
                                    <a onClick={this.handleCloseAuthModal}>
                                        {formatMessage({ id: 'platformUpgrade.index.authModal.later' })}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }
}

export default Index;
