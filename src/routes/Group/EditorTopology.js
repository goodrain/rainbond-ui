import React, { PureComponent } from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Card } from 'antd';

import GGEditor, { Flow } from 'gg-editor';
const data = {
	nodes: [{
	  type: 'node',
	  size: '70*70',
	  shape: 'flow-circle',
	  color: '#FA8C16',
	  label: '起止节点',
	  x: 55,
	  y: 55,
	  id: 'ea1184e8',
	  index: 0,
	}, {
	  type: 'node',
	  size: '70*70',
	  shape: 'flow-circle',
	  color: '#FA8C16',
	  label: '结束节点',
	  x: 55,
	  y: 255,
	  id: '481fbb1a',
	  index: 2,
	}],
	edges: [{
	  source: 'ea1184e8',
	  sourceAnchor: 2,
	  target: '481fbb1a',
	  targetAnchor: 0,
	  id: '7989ac70',
	  index: 1,
	}],
  };
export default class EditorToplogy extends PureComponent {
	render(){
		const {group_id} = this.props;
		return (
			<Card  style={{minHeight: 400}} bordered={false}>
			修改拓扑图
			<GGEditor>
  <Flow style={{ width: 500, height: 500 }} data={data} />
</GGEditor>
			</Card>
		)
	}
}