import { Card, Empty } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
      title={formatMessage({id:'enterpriseColony.import.recognition.tabs.port'})}
      className={styles.cardstyle}
      style={{
          marginBottom: 16,
          borderRadius: 5,
          boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
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
