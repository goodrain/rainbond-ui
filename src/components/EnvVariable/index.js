/* eslint-disable camelcase */
import {
  Card,
  Table,
  Empty
} from 'antd';

import React, { Fragment, PureComponent } from 'react';

class EnvVariable extends PureComponent {
  constructor(props) {
    super(props);

  }
  render() {
    const { value } = this.props
    const column = [
      {
        title: '变量名',
        dataIndex: 'env_key',
        key: '1',
        width: '30%',
        editable: true,
        render: (text) => {
          return <span>
                    {text ? text :"-"}
                </span>
        }
      },
      {
        title: '变量值',
        dataIndex: 'env_value',
        key: '2',
        width: '30%',
        editable: true,
        render: (text) => {
          return <span>
                    {text ? text :"-"}
                </span>
        }
      },
      {
        title: '说明',
        dataIndex: 'env_explain',
        key: '3',
        width: '25%',
        editable: true,
        render: (text) => {
          return <span>
                    {text ? text :"这是用render函数做的空值处理"}
                </span>
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
          {value && value.length > 0 ? (
            <Table
              style={{ width: '100%', overflowX: 'auto' }}
              columns={column}
              dataSource={value}
              pagination={true}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Fragment>
    );
  }
}


export default EnvVariable;