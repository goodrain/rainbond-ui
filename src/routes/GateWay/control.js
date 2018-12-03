import React, { Component } from 'react';
import { routerRedux, Link } from 'dva/router';
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import HttpTable from "../../components/HttpTable"
import TcpTable from "../../components/TcpTable"
import { connect } from 'dva';
import userUtil from '../../utils/user';
import globalUtil from '../../utils/global';

@connect(({ user }) => ({ currUser: user.currentUser }))
class Control extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tabKey:"http"
        }
    }
    handleTabChange=(key)=>{
        this.setState({ tabKey: key });
    }
    renderContent=()=>{
        const { currUser } = this.props;
        // 不是系统管理员
    //     if (!userUtil.isSystemAdmin(currUser) && !userUtil.isCompanyAdmin(currUser)) {
    //     this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Exception/403`));
    //     return null;
    //   }
        const {tabKey} = this.state;
        if(tabKey=="http"){
            return <HttpTable/>
        }else if(tabKey=="tcp"){
            return <TcpTable/>
        }
    }
    render() {
        return (
            <PageHeaderLayout
                title="访问控制"
                tabActiveKey={this.state.tabKey}
                breadcrumbList={[{
                    title: "首页",
                    icon: "home"
                }, {
                    title: "应用网关",
                    icon:"folder-open"
                }, {
                    title: "访问控制",
                    icon:"laptop"
                }]}
                tabList={[
                    {
                        key: 'http',
                        tab: 'HTTP',
                    },
                    {
                        key: 'tcp',
                        tab: 'TCP/UDP',
                    },
                ]}
                onTabChange={this.handleTabChange}
            >
                {this.renderContent()}
            </PageHeaderLayout>
        );
    }
}

export default Control;
