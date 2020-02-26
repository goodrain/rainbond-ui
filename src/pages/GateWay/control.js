import React, { Component } from 'react';
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import HttpTable from "../../components/HttpTable"
import TcpTable from "../../components/TcpTable"
import { connect } from 'dva';
import {
    createEnterprise,
    createTeam
  } from "../../utils/breadcrumb";

@connect(({ user, teamControl, enterprise }) => ({ 
    currUser: user.currentUser,
    currentTeam: teamControl.currentTeam,
    currentRegionName: teamControl.currentRegionName,
    currentEnterprise: enterprise.currentEnterprise
}))
class Control extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tabKey:(props.match&&props.match.params&&props.match.params.types&&props.match.params.types)?props.match.params.types:"http",
            open:(this.props.match&&this.props.match.params&&this.props.match.params.types&&this.props.match.params.types)?this.props.match.params.types:false
        }
    }
    handleTabChange=(key)=>{
        this.setState({ tabKey: key ,open:false});
    }
    renderContent=()=>{
        const {tabKey} = this.state;
        if(tabKey=="http"){
            return <HttpTable open={this.state.open}/>
        }else if(tabKey=="tcp"){
            return <TcpTable/>
        }
    }

    render() {
        let breadcrumbList = [];
        const { currentEnterprise, currentTeam, currentRegionName } = this.props;
        breadcrumbList = createTeam(
            createEnterprise(breadcrumbList, currentEnterprise),
            currentTeam,
            currentRegionName
        );
        breadcrumbList.push({title:"网关管理"})
        return (
            <PageHeaderLayout
                title="访问控制"
                tabActiveKey={this.state.tabKey}
                breadcrumbList={breadcrumbList}
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
