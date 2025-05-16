import React, { PureComponent } from 'react';
import { Card } from 'antd';
import Topological from '../../components/Topological'


export default class AppList extends PureComponent {
	render(){
		const {group_id,iframeHeight,apps} = this.props;
		return (
			<div  style={{height: iframeHeight}} bordered={false}>
				<Topological iframeHeight={iframeHeight} group_id={group_id} apps={apps}/>
			</div>
			
		)
	}
}