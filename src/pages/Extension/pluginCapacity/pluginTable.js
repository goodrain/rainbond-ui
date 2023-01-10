import { Tabs, Card, Col, Spin, Button, Tooltip, Dropdown, Menu, notification, Empty } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import global from '../../../utils/global';
import AppState from '../../../components/ApplicationState';
import VisterBtn from '../../../components/visitBtnForAlllink';
import styles from './index.less'
const { TabPane } = Tabs;
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            pluginList: [],
            loading: true,
        }
    }
    componentDidMount() {
        this.handlePluginList()
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
                if(err){
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
        if(value.team_name == ''){
            notification.warning({message: formatMessage({id:'notification.warn.not_app'})})
        }else if(value.app_id == '-1'){
            notification.warning({message: formatMessage({id:'notification.warn.not_team'})})
        }else{
            dispatch(routerRedux.push(`/team/${value.team_name}/region/${regionName}/apps/${value.app_id}`))
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
    render() {
        const { pluginList, loading } = this.state
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
                {pluginList.length > 0 && (
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
                                urls
                            } = item
                            return (
                                <div className={styles.boxs}>
                                    <Col span={2} className={styles.icons}>
                                        <div className={styles.imgs}>
                                            {icon ? <img src={icon} alt="" /> : pluginSvg}
                                        </div>
                                    </Col>
                                    <Col span={10}>
                                        <p className={styles.pluginName} onClick={() => this.onJumpApp(item)}>{name}</p>
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
                                                {formatMessage({id:'extensionEnterprise.plugin.btn.manage'})}
                                            </a>
                                        )}
                                        {/* 访问 */}
                                        {urls.length > 0 && this.renderVisitBtn(urls, 'link')}

                                    </Col>
                                </div>
                            )
                        })}
                    </div>
                )}
                {pluginList.length == 0 && !loading && (
                    <div className={styles.content}>
                        <Empty />
                    </div>
                )}
                {loading && (
                    <div className={styles.content}>
                        <Spin />
                    </div>
                )}
                
            </div>
        );
    }
}

export default Index;
