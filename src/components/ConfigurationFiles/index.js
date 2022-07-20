import { Table, Card, Empty } from 'antd';
import React, { PureComponent, Fragment } from 'react'
import styles from './index.less'

export default class ConfigurationFiles extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const { value } = this.props
    const columns = [
      {
        title: '配置文件名称',
        dataIndex: 'config_name',
        key:'config_name',
        render: (text) => {
          return  <>
                    {text ? text :"-"}
                  </>
        }
      },
      {
        title: '配置文件挂载路径',
        dataIndex: 'config_path',
        key:"config_path",
        render: (text) => {
          return <>
                    {text ? text : "-"}
                 </>
        }
      },
      {
        title: '权限',
        dataIndex: 'mode',
        key:"mode",
        render: (text) =>{
          return <>
                    {text ? text : "-"}
                 </>
        }
      },

    ]
    return (
      <Fragment>
        <Card
          title="配置文件"
          className={styles.cardstyle}
          style={{
            marginBottom: 16,
          }}
          >
              {value && value.length > 0 ? (
                <Table
                pagination={false}
                columns={columns}
                dataSource={value}
              />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
              }
        </Card>
      </Fragment>

    )
  }
}

