/* eslint-disable camelcase */
import {
  Card,
  Table,
  Empty
} from 'antd';

import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

class EnvVariable extends PureComponent {
  constructor(props) {
    super(props);

  }
  render() {
    const { value } = this.props
    const column = [
      {
        title: formatMessage({id:'enterpriseColony.import.recognition.tabs.env.env_key'}),
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
        title: formatMessage({id:'enterpriseColony.import.recognition.tabs.env.env_value'}),
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
        title: formatMessage({id:'enterpriseColony.import.recognition.tabs.env.env_explain'}),
        dataIndex: 'env_explain',
        key: '3',
        width: '25%',
        editable: true,
        render: (text) => {
          return <span>
                    {text ? text :"-"}
                </span>
        }
      }
    ];

    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 5,
            boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
            overflow:'hidden'
          }}
          title={formatMessage({id:'enterpriseColony.import.recognition.tabs.env'})}
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