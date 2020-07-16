import React, { PureComponent } from 'react';
import { Card, Empty } from 'antd';
import Topological from '../../components/Topological';

export default class AppList extends PureComponent {
  render() {
    const { group_id, isTopology } = this.props;
    return (
      <Card style={{ minHeight: 400, padding: 0 }} bordered={false}>
        {isTopology ? (
          <Topological group_id={group_id} />
        ) : (
          <div
            style={{
              height: '500px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Empty />
          </div>
        )}
      </Card>
    );
  }
}
