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
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';
import cookie from '../../utils/cookie';
import styles from './wizard.less';

@connect(({ enterprise, user, teamControl, global }) => ({
    currentEnterprise: enterprise.currentEnterprise,
    user: user.currentUser,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    rainbondInfo: global.rainbondInfo,
}))

export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            rainStoreTab: '',
            language: cookie.get('language') === 'zh-CN' ? true : false,
            scope: 'enterprise',
            teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create')
        };
    }
    componentDidMount() {
        const { teamAppCreatePermission: { isAccess } } = this.state;
        if (isAccess) {
            this.getMarketsTab()
            this.getCloudRecommendApps()
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
        const group_id = this.props.location.query.group_id;
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
                                <p onClick={() => this.onClickLinkCreate('market', rainStoreTab)}>{formatMessage({ id: 'teamAdd.create.market.market' })}</p>
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
                                <p onClick={() => this.onClickLinkCreate('image', 'custom')}>{formatMessage({ id: 'componentOverview.body.tab.log.container' })}</p>
                                {/* {showSecurityRestrictions && <p onClick={() => this.onClickLinkCreate('vm', 'VirtualMachine')}>{formatMessage({ id: 'Vm.createVm.vm' })}</p>} */}
                                {showDemo && <p onClick={() => this.onClickLinkCreate('image', 'ImageNameDemo')}>{formatMessage({ id: 'teamAdd.create.code.demo' })}</p>}
                            </div>
                        </div>
                        <div >
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
                                <p onClick={() => this.onClickLinkCreate('code', 'custom')}>{formatMessage({ id: 'teamAdd.create.code.customSource' })}</p>
                                <p onClick={() => this.onClickLinkCreate('code', 'jwar')}>{formatMessage({ id: 'teamAdd.create.code.package' })}</p>
                                {showDemo && <p onClick={() => this.onClickLinkCreate('code', 'demo')}>{formatMessage({ id: 'teamAdd.create.code.demo' })}</p>}
                            </div>
                        </div>
                        <div >
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
                                <p onClick={() => this.onClickLinkCreate('yaml', 'yaml')}>{formatMessage({ id: 'teamAdd.create.upload.TeamWizard.yaml' })}</p>
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
