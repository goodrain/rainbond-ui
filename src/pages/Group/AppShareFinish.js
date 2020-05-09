import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Card } from 'antd';
import Topological from '../../components/Topological'


export default class AppList extends PureComponent {
	render(){
		const {group_id} = this.props;
		return (
			<Card  style={{minHeight: 400}} bordered={false}>
				<Topological group_id={group_id} />
			</Card>

		)
	}
}
