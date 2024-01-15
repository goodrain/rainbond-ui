import { Table, Card, Empty } from 'antd';
import React, { PureComponent, Fragment } from 'react'
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from './index.less'

export default class ConfigurationFiles extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    const { value } = this.props
    const columns = [
      {
        title: formatMessage({id:'enterpriseColony.import.recognition.tabs.configFiles.config_name'}),
        dataIndex: 'config_name',
        key:'config_name',
        render: (text) => {
          return  <>
                    {text ? text :"-"}
                  </>
        }
      },
      {
        title: formatMessage({id:'enterpriseColony.import.recognition.tabs.configFiles.config_path'}),
        dataIndex: 'config_path',
        key:"config_path",
        render: (text) => {
          return <>
                    {text ? text : "-"}
                 </>
        }
      },
      {
        title: formatMessage({id:'enterpriseColony.import.recognition.tabs.configFiles.mode'}),
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
          title={formatMessage({id:'enterpriseColony.import.recognition.tabs.configFiles'})}
          className={styles.cardstyle}
          style={{
            marginBottom: 16,
            borderRadius: 5,
            boxShadow:'rgb(36 46 66 / 16%) 2px 4px 10px 0px',
          }}
          >
              {value && value.length > 0 ? (
                <Table
                pagination={false}
                rowKey={(record,index) => index}
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

