import React, { Component } from 'react'
import {
    Card,
    Col,
    Empty,
    Icon,
    notification,
    Pagination,
    Row,
    Layout,
    Spin,
    Tooltip,
    Avatar
} from 'antd';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import moment from 'moment';
import GlobalHeader from '../components/GlobalHeader';
import cookie from '../utils/cookie';
import globalUtil from '../utils/global'
import rainbondUtil from '../utils/rainbond';
import teamLogo from '../../public/images/team_logo.png'
import headerStype from '../components/GlobalHeader/index.less';
import Logo from '../../public/logo.png'
import styles from './PersonalSpace.less'

@connect(({ user, global }) => ({
    user: user.currentUser,
    collapsed: global.collapsed,
    currentUser: user.currentUser,
    enterprise: global.enterprise,
    rainbondInfo: global.rainbondInfo,
}))
export default class Space extends Component {

    constructor(props) {
        super(props)
        this.state = {
            userTeamList: [],
            dynamicList: [],
            regionName: '',
            enterpriseInfo: false,
            dynamicLoding: true,
            teamListLoding: true,
            page: 1,
            pageSize: 15,
            language: cookie.get('language') === 'zh-CN' ? true : false,
            throttle: true,
            loadingSwitch: false,
            isNotData: false,
        }

    }

    componentDidMount() {
        this.getEnterpriseList()
        this.getUserTeams()

    }

    // 跳转登录
    handleJumpLogin = () => {
        const { dispatch } = this.props;
        dispatch(routerRedux.push('/user/login'));
    };
    // 获取企业列表
    getEnterpriseList = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'global/fetchEnterpriseList',
            callback: res => {
                if (res && res.status_code === 200) {
                    const ready = !!(res.list && res.list.length > 0);
                    this.setState({
                        enterpriseInfo: res.list[0]
                    },
                        () => {
                            if (!ready) {
                                this.handleJumpLogin();
                            }
                        });
                } else {
                    this.handleJumpLogin();
                }
            },
            handleError: () => {
                this.handleJumpLogin();
            }
        });
    };
    // 数组去重
    unique = (arr) => {
        if (!Array.isArray(arr)) {
            return
        }
        var array = [];
        for (var i = 0; i < arr.length; i++) {
            if (array.indexOf(arr[i]) === -1) {
                array.push(arr[i])
            }
        }
        return array;
    }
    // 获取用户团队
    getUserTeams = () => {
        const {
            dispatch,
            match: {
                params: { eid }
            }
        } = this.props;
        dispatch({
            type: 'global/fetchMyTeams',
            payload: {
                enterprise_id: eid,
                page: 1,
                page_size: 999
            },
            callback: res => {
                if (res && res.status_code === 200) {
                    const arr = [];
                    res.list.map((item, index) => {
                        item.region_list.map(v => {
                            arr.push(v.region_name)
                        })
                    });
                    const region_names = JSON.stringify(this.unique(arr))
                    this.getUserTeamsDynamic(region_names)
                    this.setState({
                        userTeamList: res.list,
                        teamListLoding: false,
                        regionName: region_names
                    });
                } else {
                    this.handleCloseTeamLoading()
                }
            },
        });
    };
    // 获取团队动态
    getUserTeamsDynamic = (region_names, number) => {
        const {
            dispatch,
            match: {
                params: { eid }
            }
        } = this.props;
        const { teamId, page, pageSize } = this.state
        if (number) {
            dispatch({
                type: 'global/fetchMyTeamsDynamic',
                payload: {
                    enterprise_id: eid,
                    page: page + 1,
                    page_size: pageSize,
                    region_names
                },
                callback: res => {
                    if (res && res.status_code === 200) {
                        if (res.list.length > 0) {
                            this.setState({
                                dynamicList: [...this.state.dynamicList, ...res.list],
                                dynamicLoding: false,
                                throttle: !this.state.throttle,
                                page: page + 1,
                                loadingSwitch: false,
                                isNotData: false,
                            });
                        } else {
                            this.setState({
                                throttle: false,
                                loadingSwitch: false,
                                isNotData: true,
                            })
                        }
                    } else {
                        this.handleCloseLoading()
                    }
                }
            });
        } else {
            dispatch({
                type: 'global/fetchMyTeamsDynamic',
                payload: {
                    enterprise_id: eid,
                    page: page,
                    page_size: pageSize,
                    region_names
                },
                callback: res => {
                    if (res && res.status_code === 200) {
                        this.setState({
                            dynamicList: res.list,
                            dynamicLoding: false,
                        });
                    } else {
                        this.handleCloseLoading()
                    }
                }
            });
        }
    };
    // 动态跳转
    onJumpDynamic = (key, team, region, group, component) => {
        const { dispatch } = this.props;
        if (key == 'component') {
            if (component) {
                dispatch(routerRedux.push(`/team/${team}/region/${region}/components/${component}/overview`));
            } else {
                notification.warning({ message: formatMessage({ id: 'notification.warn.not_component' }) });
            }
        } else if (key == 'team') {
            if (group != '-1') {
                dispatch(routerRedux.push(`/team/${team}/region/${region}/index`));
            } else {
                notification.warning({ message: formatMessage({ id: 'notification.warn.not_team' }) });
            }
        } else {
            this.fetchAppDetail(group, team, region)
        }
    }
    // 跳转团队
    onJumpTeam = (team_name, region) => {
        const { dispatch } = this.props;
        dispatch(routerRedux.push(`/team/${team_name}/region/${region}/index`));
    };
    // 动态操作人信息
    showUserName = UserName => {
        if (UserName === 'system') {
            return <FormattedMessage id='componentOverview.body.tab.overview.handle.system' />;
        }
        if (UserName) {
            return `@${UserName}`;
        }
        return '';
    };


    //收藏
    handleMenuCollapse = collapsed => {
        const { dispatch } = this.props;
        dispatch({
            type: 'global/changeLayoutCollapsed',
            payload: collapsed
        });
    };
    // loding
    handleCloseLoading = () => {
        const { dynamicLoding } = this.state
        this.setState({
            dynamicLoding: false
        })
    }
    handleCloseTeamLoading = () => {
        const { teamListLoding } = this.state
        this.setState({
            teamListLoding: false
        })
    }
    onJumpPersonal = () => {
        const {
            match: {
                params: { eid }
            },
            dispatch,
        } = this.props
        dispatch(routerRedux.replace(`/enterprise/${eid}/personal`))
    }
    scroll = (event) => {
        const { regionName, pageSize, throttle } = this.state
        if (event.target.scrollTop + event.target.clientHeight + 20 > event.target.scrollHeight) {
            if (throttle) {
                this.setState({
                    throttle: !this.state.throttle,
                    loadingSwitch: true,
                }, () => {
                    this.getUserTeamsDynamic(regionName, 15)
                })
            }
        }
    }
    // 获取应用信息
    fetchAppDetail = (appID, team, region) => {
        const { dispatch } = this.props;
        if (!appID) {
            return false;
        }
        dispatch({
            type: 'application/fetchGroupDetail',
            payload: {
                team_name: team,
                region_name: region,
                group_id: appID
            },
            callback: res => {
                dispatch(routerRedux.push(`/team/${team}/region/${region}/apps/${appID}`));
            },
            handleError: res => {
                notification.warning({ message: formatMessage({ id: 'notification.warn.not_app' }) });
            }
        });
    }
    render() {
        const { userTeamList, dynamicList, enterpriseInfo, dynamicLoding, teamListLoding, loadingSwitch, isNotData } = this.state
        const {
            match: {
                params: { eid }
            },
            enterprise,
            user,
            collapsed,
            currentUser,
            rainbondInfo,
        } = this.props
        const colorList = ['#6d60e7', '#55b563', '#ebaa44', '#e86f2c', '#00a2ae'];
        const fetchLogo = rainbondInfo.disable_logo
            ? rainbondInfo.logo.value
            : rainbondUtil.fetchLogo(rainbondInfo, enterprise) || Logo;
        const customHeaderImg = () => {
            return (
                <div className={headerStype.enterprise} onClick={this.onJumpPersonal}>
                    <img src={fetchLogo} alt="" />
                </div>
            );
        }
        const customHeader = () => {
            return (
                <Link
                    style={{ color: '#fff', fontSize: '16px', fontWeight: 'bolder' }}
                    to={`/enterprise/${eid}/personal`}
                >
                    {formatMessage({ id: 'enterpriseTeamManagement.other.personal' })}
                </Link>
            )
        }
        return (
            <div style={{ height: "100%" }}>
                <GlobalHeader
                    eid={eid}
                    is_space={true}
                    onCollapse={this.handleMenuCollapse}
                    collapsed={collapsed}
                    currentUser={currentUser}
                    customHeader={customHeader}
                    customHeaderImg={customHeaderImg}
                />
                <iframe
                    src='https://large-screen.goodrain.com/app'
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    id="myframe"
                    key={1}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    scrolling="auto"
                    frameBorder="no"
                    border="0"
                    marginWidth="0"
                    marginHeight="0"
                />
            </div >
        )
    }
}
