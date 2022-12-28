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
            iframePath: ''
        }

    }

    componentDidMount() {
        const iframePath = JSON.parse(window.sessionStorage.getItem('iframePath'));
        this.setState({
            iframePath
        })
    }
    // shouldComponentUpdate(nextProps, nextState) {
    //     console.log(nextState.iframePath !== this.state.iframePath)
    // }

    render() {
        const { iframePath } = this.state
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
        console.log(iframePath,'iframePath')
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
                    src={iframePath}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    id="myframe"
                    key={iframePath}
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
