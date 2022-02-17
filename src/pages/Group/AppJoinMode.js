import React, { PureComponent } from 'react';
import { Card } from 'antd';
import Topological from '../../components/Topological/JoinMode'

export default class AppList extends PureComponent {
	render(){
		const {group_id} = this.props;
		return (
            <div style={{minHeight: 700, background:'#fff'}} bordered={false}>
				<Topological group_id={group_id} />
            </div>
		)
	}
}