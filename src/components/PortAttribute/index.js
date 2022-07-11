import { Card } from 'antd';
import React, { PureComponent } from 'react';
import Duankou from "./port"
import styles from './index.less'
class indexPort extends PureComponent {
  constructor(props){
      super(props)
  }
render() {
  const {app} = this.props
  return (
      <Card
      title="端口管理"
      className={styles.cardstyle}
      style={{
          marginBottom: 16,
      }}>
      {
          app.map(item => {
              return <Duankou
                  key={item.ID}
                  port={item}
              ></Duankou>
          })}
          </Card>
  )
}
}
export default indexPort;
