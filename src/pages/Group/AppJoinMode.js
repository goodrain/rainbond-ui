import React, { PureComponent } from 'react';
import { Card } from 'antd';
import Topological from '../../components/Topological/JoinMode'

export default class AppList extends PureComponent {
	render(){
		const {group_id,iframeHeight} = this.props;
		return (
            <div style={{height: iframeHeight, background:'#fff'}}  bordered={false}>
				<Topological iframeHeight={iframeHeight} group_id={group_id} />
            </div>
		)
	}
}