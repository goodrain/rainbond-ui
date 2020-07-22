/* eslint-disable no-nested-ternary */
import moment from 'moment';

const format = 'YYYY-MM-DD';

export default {
  fetchHowManyDays(endTimes) {
    if (endTimes) {
      const startTime = moment()
        .add(1, 'days')
        .startOf('day')
        .locale('zh-cn')
        .format(format);

      const endTime = moment(endTimes)
        .add(1, 'days')
        .startOf('day')
        .locale('zh-cn')
        .format(format);
      const momentNumber = moment(endTime).diff(moment(startTime), 'months');
      const momentTime = moment()
        .add(1, 'days')
        .startOf('day')
        .add(momentNumber, 'months')
        .locale('zh-cn')
        .format(format);

      const dayNumber = moment(endTime)
        .locale('zh-cn')
        .diff(moment(momentTime), 'days');
      return dayNumber;
    }
  },
  fetchHowManyMonths(endTimes) {
    if (endTimes) {
      const startTime = moment()
        .locale('zh-cn')
        .format(format);
      const endTime = moment(endTimes)
        .locale('zh-cn')
        .format(format);

      const momentNumber = moment(endTime)
        .locale('zh-cn')
        .diff(moment(startTime), 'months');

      return momentNumber >= 12 ? 12 : momentNumber;
    }
  },

  fetchOrderCost(isDiscount, monthNumber, price, capacity, discountMoney) {
    const discount = isDiscount ? 1 : monthNumber === 12 ? discountMoney : 1;
    const totalPrice =
      (monthNumber * price * capacity * discount).toFixed(2) / 1;
    return totalPrice;
  },
  handlUnit(num) {
    return num && (num / 1024).toFixed(2) / 1;
  },
  handlUnitMemory(num) {
    if (num) {
      return parseInt(num / 1024);
    }
    return 30;
  },
};
