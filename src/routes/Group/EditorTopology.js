import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card,  } from 'antd';

import GGEditor  from 'gg-editor';
import EditorData from './EditorData'


@connect()
class EditorToplogy extends PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <Card style={{ minHeight: 400 }} bordered={false}>
        <GGEditor>
          <EditorData  {...this.props}/>
        </GGEditor>
      </Card>
    )
  }
}

export default EditorToplogy;
