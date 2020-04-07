import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import {
  Button,
  Row,
  Col,
  Card,
  Slider,
  Alert,
  InputNumber,
  notification,
  Spin,
} from 'antd';
import styles from '../../index.less';
import ordersUtil from '../../../../utils/orders';
import moment from 'moment';

@connect(({ order }) => ({
  enterpriseServiceInfo: order.enterpriseServiceInfo,
}))
export default class ServiceOverview extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      submitLoading: false,
      visible: true,
      cycleVisible: true,
      info: null,
      selected: 1,
      price: 49,
      capacity: 30,
      yearsPay: (49 * 30 * 12).toFixed(2) / 1,
      discount: (49 * 30 * 12 * 0.75).toFixed(2) / 1,
      monthNumber: 1,
      monthPay: (1 * 49 * 30).toFixed(2) / 1,
      originalMonthPay: (1 * 49 * 30).toFixed(2) / 1,
      extended: 0,
      noDiscountExtended:0,
      months: '',
      computingYears: '',
      computingMonth: '',
      computingNewOrder: '',
    };
  }
  componentWillMount() {
    this.fetchEnterpriseService();
  }
  componentDidMount() {}
  fetchEnterpriseService = () => {
    const { enterpriseServiceInfo } = this.props;
    if (!enterpriseServiceInfo) {
      return null;
    }
    this.setState(
      {
        loading: false,
        info: enterpriseServiceInfo,
        capacity: ordersUtil.handlUnitMemory(
          enterpriseServiceInfo.memory_limit
        ),
      },
      () => {
        this.calculatePrice();
      }
    );
  };

  handleClose = visibles => {
    this.setState({ [visibles]: false });
  };

  selected = selected => {
    this.setState(
      {
        selected,
      },
      () => {
        this.calculatePrice();
      }
    );
  };

  // 计算价格
  calculatePrice = () => {
    const { monthNumber, price, capacity, info, selected } = this.state;
    const timeDelay = selected === 3;
    const isRenewal = info && info.type === 'vip';
    const memory_limit = ordersUtil.handlUnitMemory(info && info.memory_limit);
    const billing = capacity - memory_limit <= 0;
    const expired_time = info && info.expired_time;
    const MonthNum = isRenewal && ordersUtil.fetchHowManyMonths(expired_time);
    const DayNum = isRenewal
      ? MonthNum && MonthNum === 12
        ? 0
        : ordersUtil.fetchHowManyDays(expired_time)
      : ordersUtil.fetchHowManyDays(expired_time);

    const newCapacity = capacity - memory_limit;
    const supplementarys = this.calculateDifference(
      price,
      MonthNum,
      DayNum,
      newCapacity
    );
    const noDiscountSupplementarys = this.calculateDifference(
      price,
      MonthNum,
      DayNum,
      newCapacity,
      true
    );
    const Filling =
      isRenewal &&
      `¥${price}/GB/月 x ${newCapacity}GB容量 x ${MonthNum}月 ${
        MonthNum >= 12 ? 'x 7.5优惠' : ''
      } ${
        DayNum !== 0
          ? `+ ( (¥${price}/GB/月 x ${newCapacity}GB容量 x ${DayNum}天 / 30 ) )`
          : ''
      } `;

    this.fetchmonths(selected, monthNumber, expired_time);
    this.calculateExtended(
      timeDelay,
      isRenewal,
      billing,
      supplementarys,
      Filling,
      noDiscountSupplementarys
    );

    this.calculateYearsPay(
      12,
      price,
      capacity,
      isRenewal,
      newCapacity,
      supplementarys,
      Filling,
      noDiscountSupplementarys
    );
    this.calculateMonthPay(
      monthNumber,
      price,
      capacity,
      isRenewal,
      newCapacity,
      supplementarys,
      Filling,
      noDiscountSupplementarys
    );
  };
  // 计算年付
  calculateYearsPay = (
    monthNumber,
    price,
    capacity,
    isRenewal,
    newCapacity,
    supplementarys,
    Filling,
    noDiscountSupplementarys
  ) => {
    let yearsPay = 0;
    let discount = 0;
    let computingYears = `( ${price}/GB/月 x ${capacity}GB容量 x ${monthNumber}月 x 7.5优惠 )`;
    yearsPay = ordersUtil.fetchOrderCost(true, monthNumber, price, capacity);
    discount = ordersUtil.fetchOrderCost(false, monthNumber, price, capacity);

    if (isRenewal) {
      computingYears = `${
        newCapacity !== 0 ? `延长费用 ( ${Filling} ) +` : ''
      } ${newCapacity !== 0 ? `不延长费用` : ''} ${computingYears}`;
      yearsPay = noDiscountSupplementarys + yearsPay;
      discount = supplementarys + discount;
    }
    this.setState({
      computingYears,
      yearsPay,
      discount,
    });
  };

  // 计算月付
  calculateMonthPay = (
    monthNumber,
    price,
    capacity,
    isRenewal,
    newCapacity,
    supplementarys,
    Filling,
    noDiscountSupplementarys
  ) => {
    let originalMonthPay = 0;
    let monthPay = 0;
    let computingMonth = `( ${price}/GB/月 x ${capacity}GB容量 x ${
      monthNumber >= 12 ? `${monthNumber}月 x 7.5优惠 )` : `${monthNumber}月 )`
    }`;

    monthPay = ordersUtil.fetchOrderCost(false, monthNumber, price, capacity);
    originalMonthPay = ordersUtil.fetchOrderCost(
      true,
      monthNumber,
      price,
      capacity
    );

    if (isRenewal) {
      computingMonth = `${
        newCapacity !== 0 ? `延长费用 ( ${Filling} ) +` : ''
      } ${newCapacity !== 0 ? `不延长费用` : ''} ${computingMonth}`;
      monthPay = supplementarys + monthPay;
      originalMonthPay = noDiscountSupplementarys + originalMonthPay;
    }

    this.setState({
      computingMonth,
      monthPay,
      originalMonthPay,
    });
  };

  // 不延长
  calculateExtended = (
    timeDelay,
    isRenewal,
    billing,
    supplementarys,
    Filling,
    noDiscountSupplementarys
  ) => {
    if (timeDelay && isRenewal) {
      this.setState({
        extended: billing ? 0 : supplementarys,
        noDiscountExtended: billing ? 0 : noDiscountSupplementarys,
        computingNewOrder: billing ? '' : Filling,
      });
    }
  };

  calculateDifference = (price, MonthNum, DayNum, newCapacity, NoDiscount) => {
    const discount = NoDiscount ? 1 : MonthNum > 11 ? 0.75 : 1;
    const MonthMoney = price * MonthNum * newCapacity * discount;
    const DayMoney = (DayNum / 30) * price * newCapacity;
    const TotalPrice = (MonthMoney + DayMoney).toFixed(2) / 1;
    return TotalPrice;
  };

  durationChecked = () => {
    return (
      <div className={styles.durationChecked}>
        <svg
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
          height="1em"
          width="1em"
          viewBox="0 0 18 18"
          className={styles.cukIconCheck}
          style={{ verticalAlign: 'middle' }}
        >
          <g>
            <path
              d="m16.03125 3.33984375h-1.2287109c-.1722657 0-.3357422.07910156-.441211.21445312l-7.24746091 9.18105473-3.47519531-4.40332035c-.10722657-.13535156-.26894532-.21445313-.44121094-.21445313h-1.22871094c-.11777344 0-.1828125.13535157-.11074219.22675782l4.81464844 6.09960936c.225.2847656.65742187.2847656.88417969 0l8.58515626-10.87910155c.0720703-.08964844.0070312-.225-.1107422-.225z"
              fillRule="evenodd"
            />
          </g>
        </svg>
      </div>
    );
  };

  toThousands = num => {
    return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
  };

  onChangeMonthNumber = monthNumber => {
    this.setState(
      {
        monthNumber: monthNumber < 1 ? 1 : monthNumber,
      },
      () => {
        this.calculatePrice();
      }
    );
  };

  submitOrders = () => {
    const {
      monthNumber,
      capacity,
      yearsPay,
      selected,
      extended,
      noDiscountExtended,
      discount,
      monthPay,
      originalMonthPay,
    } = this.state;
    this.setState({
      submitLoading: true,
    });
    const { dispatch, eid } = this.props;
    const totalPrice =
      selected === 1 ? discount : selected === 2 ? monthPay : extended;
    const month = selected === 1 ? 12 : selected === 2 ? monthNumber : 0;
    const originalPrice =
      selected === 1 ? yearsPay : selected === 2 ? originalMonthPay : noDiscountExtended;
    dispatch({
      type: 'order/createOrder',
      payload: {
        enterprise_id: eid,
        final_price: totalPrice,
        memory: capacity,
        months: month,
        original_price: originalPrice,
      },
      callback: res => {
        if (res && res._code === 200 && res.bean) {
          dispatch(
            routerRedux.push(
              `/enterprise/${eid}/orders/orderManagement/orderDetails/${res.bean.order_id}`
            )
          );
        }
      },
      handleError: res => {
        this.setState({
          submitLoading: false,
        });
        if (res && res.data && res.data.code) {
          switch (res.data.code) {
            case 6000:
              return notification.warning({
                message: '请求的价格, 和实际计算出来的价格不一致',
              });
            case 6002:
              return notification.warning({ message: '参数 months 不正确' });
            case 6003:
              return notification.warning({ message: '参数 memory 不正确' });
            case 6005:
              return notification.warning({
                message: '内存不能小于已使用内存',
              });
            case 6006:
              return notification.warning({ message: '还有未支付的订单' });
          }
        }
      },
    });
  };

  setObj = minCapacity => {
    const obj = {};
    const totalNumber = minCapacity + 200;
    for (let i = 0; i <= totalNumber; i++) {
      const interval = i * 5;
      obj[`${interval}`] =
        interval !== 0 && interval % 50 === 0 ? `${interval}GB` : '';
    }
    return obj;
  };

  fetchmonths = (selected, monthNumber, expired_time) => {
    let moments = '';
    const date = new Date(); // 获取当前日期
    if (selected === 1) {
      moments = moment
        .utc(date.setMonth(date.getMonth() + 12))
        .format('YYYY年MM月DD日');
    } else if (selected === 2) {
      moments = moment
        .utc(date.setMonth(date.getMonth() + monthNumber))
        .format('YYYY年MM月DD日');
    } else {
      moments = moment.utc(expired_time).format('YYYY年MM月DD日');
    }

    this.setState({
      moments,
    });
  };

  render() {
    const {
      info,
      loading,
      selected,
      visible,
      cycleVisible,
      price,
      capacity,
      yearsPay,
      discount,
      monthNumber,
      monthPay,
      extended,
      moments,
      submitLoading,
      computingYears,
      computingMonth,
      computingNewOrder,
    } = this.state;

    const free = info && info.type === 'free';
    const minCapacity = ordersUtil.handlUnitMemory(info && info.memory_limit);
    const usedMemory = ordersUtil.handlUnitMemory(info && info.used_memory);
    const minSlider =usedMemory > minCapacity?usedMemory:minCapacity
    const marks = this.setObj(minSlider);
    const totalCalculate =
      selected === 1 ? discount : selected === 2 ? monthPay : extended;
    const totalPrice = this.toThousands(totalCalculate);
    const computing =
      selected === 1
        ? computingYears
        : selected === 2
        ? computingMonth
        : computingNewOrder;

    return (
      <div className={styles.serviceBox}>
        {loading ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              margin: 'auto',
              paddingTop: 50,
              textAlign: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <Card
              loading={loading}
              bordered={false}
              style={{ marginBottom: '30px', background: '#f3f5f9' }}
              bodyStyle={{ padding: '35px 55px 10px 72px' }}
            >
              <Row className={styles.serviceDetailsBox}>
                <div className={styles.serviceDetailsL}>
                  <h6>RAINBOND CLOUD 付费版</h6>
                  <ul>
                    <li>接入集群数量无限制</li>
                    <li>团队、用户数量无限制</li>
                    <li>共享库应用模版数量，版本数量无限制</li>
                    <li>SLA保证、7x24小时在线服务</li>
                  </ul>
                  {/* <a href="">查看更多付费版特权</a> */}
                </div>
                <div className={styles.serviceDetailsR}>
                  <div>
                    <span>¥{price} </span>
                    <span>/GB/月</span>
                  </div>
                  <div>按照平台调度的应用内存总数计费</div>
                </div>
              </Row>
            </Card>
            <div className={styles.capacityBox}>
              <span>容量选择</span>
              <span>（购买后可叠加订单扩大容量）</span>
            </div>
            {visible && (
              <Alert
                message={
                  free
                    ? `最小购买量应该大于当前资源使用量${usedMemory} GB 并且大于30GB`
                    : `当前已购买容量 ${minCapacity} GB，你可以增加购买更多容量，扩大容量付款即立即生效`
                }
                type="info"
                showIcon
                closable
                afterClose={() => {
                  this.handleClose('visible');
                }}
              />
            )}

            <Slider
              className={styles.zslSlider}
              tooltipVisible
              style={{ margin: '70px 0 50px 0 ' }}
              marks={marks}
              step={null}
              onAfterChange={value => {
                const values = value >= minCapacity ? value : minCapacity;
                this.setState({ capacity: values }, () => {
                  this.calculatePrice();
                });
              }}
              onChange={value => {
                this.setState({ capacity: value });
              }}
              value={capacity}
              min={minSlider}
              max={minSlider + 200}
            />

            <div className={styles.capacityBox}>
              <span>{free ? '时长选择' : '延长周期选择'}</span>
            </div>
            {!free && cycleVisible && info && (
              <Alert
                message={`当前服务到期时间为 ${moment
                  .utc(info.expired_time)
                  .format('YYYY年MM月DD日')}`}
                type="info"
                showIcon
                closable
                afterClose={() => {
                  this.handleClose('cycleVisible');
                }}
                style={{ marginBottom: '20px' }}
              />
            )}
            <Row gutter={24} style={{ marginBottom: '30px' }}>
              <Col
                span={8}
                onClick={() => {
                  this.selected(1);
                }}
              >
                <div
                  className={`${styles.orders} ${selected === 1 &&
                    styles.checked}`}
                >
                  <div>
                    <span>1</span>
                    <span>年</span>
                  </div>
                  <div>
                    <div>
                      <span>¥&nbsp;{this.toThousands(discount)}</span>
                      <s>¥&nbsp;{this.toThousands(yearsPay)}</s>
                    </div>
                    <div>立享7.5优惠</div>
                  </div>
                  <div className={styles.tagVertical}>荐</div>
                  {selected === 1 && this.durationChecked()}
                </div>
              </Col>
              <Col
                span={8}
                onClick={() => {
                  this.selected(2);
                }}
              >
                <div
                  className={`${styles.orders} ${selected === 2 &&
                    styles.checked}`}
                >
                  <div>
                    <span>
                      <InputNumber
                        className={styles.showInput}
                        size="small"
                        min={1}
                        max={12}
                        value={monthNumber}
                        style={{ width: '50px', marginRight: '5px' }}
                        onChange={this.onChangeMonthNumber}
                      />
                    </span>
                    <span>月</span>
                  </div>
                  <div>
                    <div>
                      <span>¥&nbsp;{this.toThousands(monthPay)}</span>
                    </div>
                  </div>
                  {selected === 2 && this.durationChecked()}
                </div>
              </Col>
              {!free && (
                <Col
                  span={8}
                  onClick={() => {
                    this.selected(3);
                  }}
                >
                  <div
                    className={`${styles.orders} ${selected === 3 &&
                      styles.checked}`}
                  >
                    <div style={{ width: '0px' }} />
                    <div style={{ width: '100%', paddingLeft: '0' }}>
                      不延长
                    </div>
                    {selected === 3 && this.durationChecked()}
                  </div>
                </Col>
              )}
            </Row>
            <Card
              className={styles.amount}
              bodyStyle={{ padding: '20px 0 15px 24px' }}
            >
              <div>
                <span>应付总额：</span>
                <span>¥&nbsp;{totalPrice}</span>
                <span>&nbsp;{computing}&nbsp;</span>
              </div>
              <div>
                总共可管理 {capacity} GB 调度内存的应用到 {moments}
              </div>
            </Card>
            <Button
              type="primary"
              disabled={!totalCalculate || totalCalculate === 0}
              loading={submitLoading}
              onClick={this.submitOrders}
            >
              提交订单
            </Button>
          </div>
        )}
      </div>
    );
  }
}
