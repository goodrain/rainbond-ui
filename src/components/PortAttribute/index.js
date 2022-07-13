import { Card, Empty } from 'antd';
import React, { PureComponent } from 'react';
import Duankou from "./port"
import styles from './index.less'
class PortAttribute extends PureComponent {
  constructor(props){
      super(props)
  }
render() {
  const {value} = this.props
  return (
      <Card
      title="端口管理"
      className={styles.cardstyle}
      style={{
          marginBottom: 16,
      }}>
            {(value && value.length > 0) ? (
                <>
                 {value.map(item => {
                    return <Duankou
                            key={item.ID}
                            port={item}
                            >
                            </Duankou>
                })}
                </>
            ):(
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
  )
}
}
export default PortAttribute;
