import React, { Component } from 'react';
import { connect } from 'dva';
import { Card, Popover, Badge, Table, Alert } from 'antd';
import { formatMessage } from 'umi-plugin-locale';
import global from '@/utils/global';
import styles from './index.less';

@connect(null, null, null, { withRef: true })

class PriceCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalPrice: 0,
      cpuPrice: 0,
      memoryPrice: 0,
      unit: '¥',
      cpuUsePrice: 0,
      memoryUsePrice: 0,
    };
  }

  componentDidMount() {
    // 模拟请求获取单价
    this.fetchPrices();
  }

  fetchPrices = () => {
    // 假设从API获取数据
    const { dispatch, cpu_use, memory_use, section, min_node, max_node } = this.props;
    dispatch({
      type: 'global/getPricingConfig',
      payload: {
        region_name: global.getCurrRegionName() || ''
      },
      callback: (res) => {
        if (res.status_code == 200) {
          let totalPrice
          const cpuUsePrice = Number(res.response_data.cpu_price_per_core) * (cpu_use / 1000) * 24
          const memoryUsePrice = Number(res.response_data.memory_price_per_gb) * (memory_use / 1024) * 24
          totalPrice = (cpuUsePrice + memoryUsePrice).toFixed(2);
          if (section) {
            totalPrice = `${totalPrice * min_node.toFixed(2)} ~ ¥${totalPrice * max_node.toFixed(2)}`
          }
          this.setState({
            cpuPrice: res.response_data?.cpu_price_per_core,
            memoryPrice: (res.response_data?.memory_price_per_gb / 1000000),
            cpuUsePrice: (cpuUsePrice / 1000000).toFixed(2),
            memoryUsePrice: (memoryUsePrice / 1000000).toFixed(2),
            totalPrice: (totalPrice / 1000000).toFixed(2)
          });
        }
      }
    });

  };

  render() {
    const { type = 'card' } = this.props;
    const { totalPrice, cpuPrice, memoryPrice, unit, cpuUsePrice, memoryUsePrice } = this.state;
    console.log(this.props, 'props')
    const priceDetail = (
      <div className={styles.priceDetail}>
        <Table
          columns={[
            {
              title: '类型',
              dataIndex: 'item',
              key: 'item',
            },
            {
              title: '价格',
              dataIndex: 'price',
              key: 'price',
            },
          ]}
          dataSource={[
            {
              key: '1',
              item: <Badge color='green' text={formatMessage({ id: 'price.memory' })} />,
              price: `¥${memoryUsePrice}`,
            },
            {
              key: '2',
              item: <Badge color='cyan' text={formatMessage({ id: 'price.cpu' })} />,
              price: `¥${cpuUsePrice}`,
            },
          ]}
          pagination={false}
        />
      </div>
    );

    if (type === 'title') {
      return (
        <div className={styles.priceTitle}>
          <Popover title="详细信息" content={priceDetail} placement="bottom">
            <span>{formatMessage({ id: 'price.total' })}:</span>
            <span className={styles.amount}>{unit}{totalPrice}</span>
          </Popover>
        </div>

      );
    }
    if (type === 'Alert') {
      return (
        <Alert
          message="注意"
          description={
            <>
              <p>{`存储空间按实际使用量计费，单价为¥${memoryPrice}/GB/小时。`}</p>
              <p>{`计算公式：单价 * 实际使用量 * 24小时 = 实际费用`}</p>
            </>
          }
          type="info"
          showIcon
        />
      );
    }


    return (
      <Card
        title={
          <div className={styles.cardTitle}>
            <span>{formatMessage({ id: 'price.total' })} :</span>
            <span className={styles.amount}>{unit}{totalPrice}</span>
          </div>
        }
        className={styles.priceCard}
      >
        {priceDetail}
      </Card>
    );
  }
}

export default PriceCard; 