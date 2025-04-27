/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable eqeqeq */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/sort-comp */
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { Button, Icon } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '../../utils/pageHeaderSvg';
import NewbieGuiding from '../../components/NewbieGuiding';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import cookie from '../../utils/cookie';
import styles from './wizard.less';

@connect(({ enterprise, user, teamControl, global }) => ({
    currentEnterprise: enterprise.currentEnterprise,
    user: user.currentUser,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    rainbondInfo: global.rainbondInfo,
    noviceGuide: global.noviceGuide
}))

export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        const { noviceGuide, rainbondInfo } = props;
        // 检查是否已完成新手引导
        const hasCompletedGuide = noviceGuide && noviceGuide.some(item => item.key === 'wizard' && item.value == 'True');
        // 检查是否显示新手引导
        const shouldShowGuide = rainbondInfo?.is_saas === true && !hasCompletedGuide;

        this.state = {
            guideStep: shouldShowGuide ? 'market' : '',
            rainStoreTab: '',
            language: cookie.get('language') === 'zh-CN' ? true : false,
            scope: 'enterprise',
            teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create')
        };
    }
    componentDidMount() {
        const { teamAppCreatePermission: { isAccess } } = this.state;
        const { noviceGuide, rainbondInfo } = this.props;

        if (isAccess) {
            this.getMarketsTab()
            this.getCloudRecommendApps()
        }

        // 判断是否显示引导
        const hasCompletedGuide = noviceGuide && noviceGuide.some(item => item.key === 'wizard' && item.value == 'True');
        const shouldShowGuide = rainbondInfo?.is_saas === true && !hasCompletedGuide;

        if (shouldShowGuide) {
            // 初始化第一个高亮
            setTimeout(() => {
                const currentTarget = document.querySelector('[data-guide="market"]');
                if (currentTarget) {
                    currentTarget.style.position = 'relative';
                    currentTarget.style.zIndex = '1000';
                    currentTarget.style.backgroundColor = '#fff';
                }
            }, 1000);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { guideStep } = this.state;
        const { noviceGuide, rainbondInfo } = this.props;

        // 检查 noviceGuide 或 rainbondInfo 是否变化
        if (prevProps.noviceGuide !== noviceGuide || prevProps.rainbondInfo !== rainbondInfo) {
            const hasCompletedGuide = noviceGuide && noviceGuide.some(item => item.key === 'wizard' && item.value == 'True');
            const shouldShowGuide = rainbondInfo?.is_saas === true && !hasCompletedGuide;

            if (shouldShowGuide && !guideStep) {
                // 如果应该显示引导但当前没有显示，则显示
                this.setState({ guideStep: 'market' });
            } else if (!shouldShowGuide && guideStep) {
                // 如果不应该显示引导但当前在显示，则关闭
                this.setState({ guideStep: '' });
            }
        }

        if (prevState.guideStep !== guideStep) {
            const prevTarget = document.querySelector(`[data-guide="${prevState.guideStep}"]`);
            if (prevTarget) {
                prevTarget.style.position = '';
                prevTarget.style.zIndex = '';
                prevTarget.style.backgroundColor = '';
            }

            setTimeout(() => {
                const currentTarget = document.querySelector(`[data-guide="${guideStep}"]`);
                if (currentTarget) {
                    currentTarget.style.position = 'relative';
                    currentTarget.style.zIndex = '1000';
                    currentTarget.style.backgroundColor = '#fff';
                }
            }, 100);
        }
    }

    getCloudRecommendApps = v => {
        const { scope } = this.state;
        const { dispatch, currentEnterprise, user } = this.props;
        dispatch({
            type: 'market/fetchAppModels',
            payload: {
                enterprise_id: currentEnterprise.enterprise_id,
                user_id: user.user_id,
                app_name: '',
                scope: scope,
                page_size: 9,
                page: 1,
            },
            callback: data => {
                this.setState({
                    localist: data.list
                })
            }
        });
    };
    getMarketsTab = () => {
        const { dispatch, currentEnterprise } = this.props;
        dispatch({
            type: 'market/fetchMarketsTab',
            payload: {
                enterprise_id: currentEnterprise.enterprise_id
            },
            callback: res => {
                const list = (res && res.list) || [];
                let rainStores = '';
                if (list && list.length > 0) {
                    list.map(item => {
                        if (item.domain == 'rainbond') {
                            return rainStores = item.name
                        }
                    });
                }
                this.setState({
                    rainStoreTab: rainStores
                })
            }
        });
    };
    onClickLinkCreate = (type, link) => {
        const { dispatch, currentEnterprise } = this.props
        const teamName = globalUtil.getCurrTeamName();
        const regionName = globalUtil.getCurrRegionName();
        const group_id = this.props.location.query.group_id || '';
        if (type == 'import') {
            dispatch(
                routerRedux.push( `/team/${teamName}/region/${regionName}/shared/${link}?group_id=${group_id}`)
            );
        } else {
            dispatch(
                routerRedux.push( `/team/${teamName}/region/${regionName}/create/${type}/${link}?group_id=${group_id}`)
            );
        }
    }
    getUserNewbieGuideConfig = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'global/fetchUserNewbieGuideConfig'
        });
    };

    handleGuideStep = (step) => {
        this.setState({ guideStep: step });
        if (step === 'close' || (!step && this.state.guideStep === 'yaml')) {
            const { dispatch } = this.props;
            dispatch({
                type: 'global/putUserNewbieGuideConfig',
                payload: {
                    arr: [{ key: 'wizard', value: true }]
                },
                callback: () => {
                    this.getUserNewbieGuideConfig();
                }
            });
        }
    }

    renderGuide = () => {
        const { guideStep } = this.state;
        const guideInfo = {
            'market': {
                tit: '应用市场安装',
                desc: '内置应用市场提供上百种应用即点即用，种类丰富涵盖AI 应用、博客系统、图床、项目管理、电商系统、开发工具、中间件等等。',
                nextStep: 'image',
                svgPosition: { top: '52%', left: '17%' },
                conPosition: { top: '35%', left: '22%' }
            },
            'image': {
                tit: '容器镜像构建',
                desc: '平台内置镜像加速，输入镜像名称直接构建运行，也可以绑定Docker Registry 、Harbor镜像仓库。',
                prevStep: 'market',
                nextStep: 'code',
                svgPosition: { top: '52%', left: '43%' },
                conPosition: { top: '35%', left: '48%' }
            },
            'code': {
                tit: '源代码构建',
                desc: '支持关联Git仓库自动构建，提交代码就能部署，支持GitHub/GitLab/码云，还能绑定私有仓库，自动识别多种语言，例如：Java、Python、Golang、JS、Node、PHP、Dockerfile等。',
                prevStep: 'image',
                nextStep: 'package',
                svgPosition: { top: '52%', right: '28%' },
                conPosition: { top: '35%', right: '8%' }
            },
            'package': {
                tit: '上传软件包',
                desc: '支持直接上传JAR、WAR、ZIP等二进制软件包，自动配置运行环境。',
                prevStep: 'code',
                nextStep: 'yaml',
                svgPosition: { top: '58%', right: '28%' },
                conPosition: { top: '35%', right: '8%' }
            },
            'yaml': {
                tit: ' YAML 创建',
                desc: '支持使用 Kubernetes 原生 YAML 文件创建应用。',
                prevStep: 'package',
                isSuccess: true,
                svgPosition: { top: '52%', right: '5%' },
                conPosition: { top: '35%', right: '22%' }
            }
        };

        const shouldRender = guideStep && guideInfo[guideStep];
        
        return shouldRender ? (
            <NewbieGuiding
                {...guideInfo[guideStep]}
                totals={5}
                handleClose={() => this.handleGuideStep('close')}
                handlePrev={() => this.handleGuideStep(guideInfo[guideStep].prevStep)}
                handleNext={() => this.handleGuideStep(guideInfo[guideStep].nextStep)}
            />
        ) : null;
    }


    render() {
        const teamCode = globalUtil.fetchSvg('teamCode');
        const teamMarket = globalUtil.fetchSvg('teamMarket');
        const teamImage = globalUtil.fetchSvg('teamImage');
        const teamUpload = globalUtil.fetchSvg('teamUpload');
        const { rainbondInfo } = this.props
        const { rainStoreTab, language, localist, teamAppCreatePermission: { isAccess } } = this.state
        const showDemo = rainbondInfo?.official_demo?.enable
        const showSecurityRestrictions = !rainbondInfo?.security_restrictions?.enable
        if (!isAccess) {
            return roleUtil.noPermission()
        }
    
        return (
            <>
                {this.renderGuide()}
                <PageHeaderLayout
                    title={formatMessage({id:'versionUpdata_6_1.create'})}
                    content={formatMessage({id:'versionUpdata_6_1.create.content'})}
                    titleSvg={pageheaderSvg.getPageHeaderSvg("component", 18)}
                    extraContent={
                        <Button onClick={() => {
                            const { dispatch } = this.props;
                            dispatch(
                                routerRedux.push({
                                    pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`,
                                })
                            );
                        }} type="default">
                            <Icon type="home" />{formatMessage({ id: 'versionUpdata_6_1.home' })}
                        </Button>
                    }
                >
                    <div className={styles.overviewBox}>
                        <div>
                            <div className={styles.topContent} style={{ height: 220 }}>
                                <div className={styles.initIcon}>
                                    <div>
                                        {teamMarket}
                                    </div>
                                </div>
                                <div className={styles.initTitle}>
                                    {formatMessage({ id: 'menu.team.create.market' })}
                                </div>
                                <div className={styles.initDesc}>
                                    <p>
                                        {formatMessage({ id: 'teamAdd.create.market.desc' })}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.bottomContent}>
                                <p data-guide="market" onClick={() => this.onClickLinkCreate('market', rainStoreTab)}>{formatMessage({ id: 'teamAdd.create.market.market' })}</p>
                                <p onClick={() => this.onClickLinkCreate('market', '')}>{formatMessage({ id: 'popover.applicationMarket.local' })}</p>
                                <p onClick={() => this.onClickLinkCreate('import', 'import')}><FormattedMessage id='applicationMarket.localMarket.import' /></p>
                            </div>
                        </div>
                        <div>
                            <div className={styles.topContent} style={{ height: 220 }}>
                                <div className={styles.initIcon}>
                                    <div>
                                        {teamImage}
                                    </div>
                                </div>
                                <div className={styles.initTitle}>
                                    {formatMessage({ id: 'menu.team.create.image' })}
                                </div>
                                <div className={styles.initDesc}>
                                    <p>
                                        {showSecurityRestrictions ? formatMessage({ id: 'teamAdd.create.image.desc' }) : '支持从容器镜像创建应用。'}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.bottomContent}>
                                <p data-guide="image" onClick={() => this.onClickLinkCreate('image', 'custom')}>{formatMessage({ id: 'componentOverview.body.tab.log.container' })}</p>
                                {showDemo && <p onClick={() => this.onClickLinkCreate('image', 'ImageNameDemo')}>{formatMessage({ id: 'teamAdd.create.code.demo' })}</p>}
                            </div>
                        </div>
                        <div>
                            <div className={styles.topContent} style={{ height: 220 }}>
                                <div className={styles.initIcon}>
                                    <div>
                                        {teamCode}
                                    </div>
                                </div>
                                <div className={styles.initTitle}>
                                    {formatMessage({ id: 'menu.team.create.code' })}
                                </div>
                                <div className={styles.initDesc}>
                                    <p>
                                        {formatMessage({ id: 'teamAdd.create.code.desc' })}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.bottomContent}>
                                <p data-guide="code" onClick={() => this.onClickLinkCreate('code', 'custom')}>{formatMessage({ id: 'teamAdd.create.code.customSource' })}</p>
                                <p data-guide="package" onClick={() => this.onClickLinkCreate('code', 'jwar')}>{formatMessage({ id: 'teamAdd.create.code.package' })}</p>
                                {showDemo && <p onClick={() => this.onClickLinkCreate('code', 'demo')}>{formatMessage({ id: 'teamAdd.create.code.demo' })}</p>}
                            </div>
                        </div>
                        <div>
                            <div className={styles.topContent} style={{ height: 220 }}>
                                <div className={styles.initIcon}>
                                    <div>
                                        {teamUpload}
                                    </div>
                                </div>
                                <div className={styles.initTitle}>
                                    {showSecurityRestrictions ? formatMessage({ id: 'menu.team.create.upload' }) : 'Yaml'}
                                </div>
                                <div className={styles.initDesc}>
                                    <p>
                                        {showSecurityRestrictions ? formatMessage({ id: 'teamAdd.create.upload.desc' }) : '支持从 Kubernetes YAML创建组件'}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.bottomContent}>
                                <p data-guide="yaml" onClick={() => this.onClickLinkCreate('yaml', 'yaml')}>{formatMessage({ id: 'teamAdd.create.upload.TeamWizard.yaml' })}</p>
                                {showSecurityRestrictions && <p onClick={() => this.onClickLinkCreate('yaml', 'helm')}>{formatMessage({ id: 'teamAdd.create.upload.TeamWizard.helm' })}</p>}
                                {showSecurityRestrictions && <p onClick={() => this.onClickLinkCreate('yaml', 'importCluster')}>{formatMessage({ id: 'teamAdd.create.upload.uploadFiles.k8s.text' })}</p>}
                            </div>
                        </div>
                    </div>
                </PageHeaderLayout>
            </>
        );
    }
}
