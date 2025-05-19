import React, { Component } from 'react';
import { Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import globalUtil from '@/utils/global'

@connect(({ user, teamControl, global }) => ({
    user: user.currentUser,
    teamControl: teamControl.currentTeam,
    teamOverview : global.teamOverview
}))
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            token: null,
            domianUrl: null,
            pipelineArr: []
        }
    }
    componentDidMount() {
        this.fetchPluginInfo()
        this.fetchInfo() 
        window.addEventListener("message", this.receiveMessage, false);
    }
    componentWillUnmount() {
        window.removeEventListener("message", this.receiveMessage)
    }
    //监听postmessage
    receiveMessage = (event) => {
        if (event !== undefined && 
            event.data && 
            event.data.flag == "GOTO_DEPLOY_DETAIL") 
            {
            const {region_name, team_name, service_alias } = event.data
            this.props.dispatch(routerRedux.push(`/team/${team_name}/region/${region_name}/apps/${globalUtil.getAppID()}/overview?type=components&componentID=${service_alias}&tab=overview`))
        }
    };
    // 获取团队下的基本信息
    loadOverview = () => {
        const { dispatch } = this.props;
        dispatch({
        type: 'index/fetchOverview',
        payload: {
            team_name: globalUtil.getCurrTeamName(),
            region_name: globalUtil.getCurrRegionName()
        },
        callback: res => {
            if(res && res.bean){
            this.setState({
                team_name:res.bean.team_alias
            })
            }
        }
        });
    };
    fetchPluginInfo = () => {
        const {
            dispatch,
            match: {
                params: { teamName, regionName }
            },
            user
        } = this.props
        dispatch({
            type: 'teamControl/fetchPluginUrl',
            payload: {
                enterprise_id: user.enterprise_id,
                region_name: regionName
            },
            callback: res => {
                res.list.map((item) => {
                    if (item.name == 'pipeline') {
                        this.setState({
                            domianUrl: item.urls[0]
                        })
                    }
                })
            }
        })
    }
    fetchInfo = () => {
        const { dispatch } = this.props;
        dispatch({
            type: 'teamControl/fetchToken',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                tokenNode: 'pipeline'
            },
            callback: res => {
                if (res && res.status_code == 200) {
                    this.setState({
                        token: res.bean.access_key || false
                    })
                }
            }
        })
    }
    render() {
        const { token, domianUrl } = this.state
        const { teamControl, teamOverview } = this.props
        const teamId = teamOverview && teamOverview.team_id || false
        const teamAlias = teamControl.team_alias || false

        return (
            <div style={{ margin:'0px' }}>
                {(token && teamId && domianUrl && teamAlias)  ? (
                    <div style={{ height: '100vh' }}>
                        <iframe
                            src={`${domianUrl}/app-service?token=${token}&teamId=${teamId}&teamName=${teamAlias}`}
                            style={{
                                width: '100%',
                                height: '100%'
                            }}
                            id="myframe"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            scrolling="auto"
                            frameBorder="no"
                            border="0"
                            marginWidth="0"
                            marginHeight="0"
                        />
                    </div>
                ) : (
                    <div style={{ height: ' 70vh ', display: 'flex', alignItems: 'center', justifyContent: "center" }}>
                        <Spin size="large" />
                    </div>
                )}

            </div>
        );
    }
}

export default Index;
