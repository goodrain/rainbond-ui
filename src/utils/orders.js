import moment from 'moment';

const format = 'YYYY-MM-DD';
export default {
  fetchHowManyDays(endTimes) {
    if (endTimes) {
      const startTime = moment.utc().format(format);
      const endTime = moment.utc(endTimes).format(format);
      const momentNumber = moment.utc(endTime).diff(moment.utc(startTime), 'months');
      const momentTime = moment.utc()
        .add(momentNumber, 'months')
        .format(format);
      const dayNumber = moment.utc(endTime).diff(moment.utc(momentTime), 'days');
      return dayNumber;
    }
  },
  fetchHowManyMonths(endTimes) {
    if (endTimes) {
      const startTime = moment.utc().format(format);
      const endTime = moment.utc(endTimes).format(format);
      const momentNumber = moment.utc(endTime).diff(moment.utc(startTime), 'months');
      return momentNumber >= 12 ? 12 : momentNumber;
    }
  },

  fetchOrderCost(isDiscount, monthNumber, price, capacity) {
    const discount = isDiscount ? 1 : monthNumber === 12 ? 0.75 : 1;
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
