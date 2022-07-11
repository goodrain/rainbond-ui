import { Table, Card } from 'antd';
import React, { PureComponent, Fragment } from 'react'
import styles from './index.less'

export default class peizhi extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const { volumes } = this.props
    const columns = [
      {
        title: '配置文件名称',
        dataIndex: 'volume_name',
        key:'volume_name'
      },
      {
        title: '配置文件挂载路径',
        dataIndex: 'volume_path',
        key:"volume_path"
      },
      {
        title: '权限',
        dataIndex: 'mode',
        key:"mode",
        render:(text,val,index)=>{
          console.log(text,val,index);
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
          }}>
          <Table
            pagination={false}
            columns={columns}
            dataSource={volumes}
          />
        </Card>
      </Fragment>

    )
  }
}

