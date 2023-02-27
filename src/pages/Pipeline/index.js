import React, { Component } from 'react';
import { Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import CustomFooter from "../../layouts/CustomFooter";
import globalUtil from '@/utils/global'

@connect(({ user }) => ({
    user: user.currentUser,
}))
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            token: '',
            pipelineArr: []
        }
    }
    componentDidMount() {
        this.fetchInfo()
        this.loadOverview()
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
            this.props.dispatch(routerRedux.push(`/team/${team_name}/region/${region_name}/components/${service_alias}/overview`))
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
    fetchInfo = () => {
        const { dispatch } = this.props;
        const team_id = window.sessionStorage.getItem("team_id") || false
        const pipelineArr = JSON.parse(window.sessionStorage.getItem("Pipeline")) || []
        let url = '';
        pipelineArr && pipelineArr.map(item => {
            if (item.name == 'pipeline')
                url = item.urls[0]
        })
        dispatch({
            type: 'teamControl/fetchToken',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                tokenNode: 'pipeline'
            },
            callback: res => {
                if (res && res.status_code == 200) {
                    this.setState({
                        token: res.bean.access_key || false,
                        team_id: team_id,
                        pipelineUrl: url
                    })
                }
            }
        })
    }
    render() {
        const { team_id, token, pipelineUrl, team_name } = this.state
        return (
            <>
                {team_id ? (
                    <div style={{ height: 'calc( 100vh - 122px )' }}>
                        <iframe
                            src={`${pipelineUrl}/app-service?token=${token}&teamId=${team_id}&teamName=${team_name}`}
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

                <CustomFooter />
            </>
        );
    }
}

export default Index;
