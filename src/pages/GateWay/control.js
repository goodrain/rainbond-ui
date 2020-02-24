import React, { Component } from 'react';
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import HttpTable from "../../components/HttpTable"
import TcpTable from "../../components/TcpTable"
import { connect } from 'dva';

@connect(({ user }) => ({ currUser: user.currentUser }))
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
