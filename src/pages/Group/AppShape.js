import React, { PureComponent } from 'react';
import { Card } from 'antd';
import Topological from '../../components/Topological'


export default class AppList extends PureComponent {
	render(){
		const {group_id} = this.props;
		return (
			<Card  style={{minHeight: 400,padding:0}} bordered={false}>
				<Topological group_id={group_id} />
			</Card>
			
		)
	}
}