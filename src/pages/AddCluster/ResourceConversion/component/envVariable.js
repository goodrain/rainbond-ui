/* eslint-disable camelcase */
import {
  Card,
  Table,
} from 'antd';

import React, { Fragment, PureComponent } from 'react';

class EditableFormTable extends PureComponent {
  constructor(props) {
    super(props);

  }
  render() {
    const { env_management } =this.props
    const column = [
      {
        title: '变量名',
        dataIndex: 'env_key',
        key: '1',
        width: '30%',
        editable: true,
      },
      {
        title: '变量值',
        dataIndex: 'env_value',
        key: '2',
        width: '30%',
        editable: true,
      },
      {
        title: '说明',
        dataIndex: 'env_explain',
        key: '3',
        width: '25%',
        editable: true,
        render: text=>{
          {text != "" ? text : "无"}
        }
      }
    ];
    
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24
          }}
          title="环境变量"
        >
          <Table
            style={{ width: '100%', overflowX: 'auto' }}
            columns={column}
            dataSource={env_management}
            pagination={true}
          />
        </Card>
      </Fragment>
    );
  }
}


export default EditableFormTable;