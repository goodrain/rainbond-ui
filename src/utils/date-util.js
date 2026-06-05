import { Modal } from 'antd';
import { formatMessage } from '@/utils/intl';

function parseDateValue(date) {
  if (date instanceof Date) {
    return new Date(date.getTime());
  }
  if (typeof date === 'string') {
    const normalizedDate = date.replace(/\-/g, '/');
    const parsedDate = new Date(normalizedDate);
    if (parsedDate.toString() !== 'Invalid Date') {
      return parsedDate;
    }
  }
  return new Date(date);
}

const dateUtil = {
  isWebSocketOpen(websocketURL) {
    const protocolStr = document.location.protocol;
    const str = websocketURL.substr(0, websocketURL.indexOf(':'));
    if (protocolStr === 'https:' && str && str === 'ws') {
      Modal.destroyAll();
      Modal.error({
        title: formatMessage({id:'utils.date_util.available'}),
        content: (
          <div>
            {formatMessage({id:'utils.date_util.ws'})}
          </div>
        ),
        onOk() {}
      });
      return null;
    }
    return 'through';
  },
  format(date, format) {
    const dates = parseDateValue(date);
    const map = {
      yyyy() {
        return dates.getFullYear();
      },
      MM() {
        const val = dates.getMonth() + 1;
        return val < 10 ? `0${val}` : val;
      },
      dd() {
        const val = dates.getDate();
        return val < 10 ? `0${val}` : val;
      },
      hh() {
        const val = dates.getHours();
        return val < 10 ? `0${val}` : val;
      },
      mm() {
        const val = dates.getMinutes();
        return val < 10 ? `0${val}` : val;
      },
      ss() {
        const val = dates.getSeconds();
        return val < 10 ? `0${val}` : val;
      }
    };
    for (const k in map) {
      format = format.replace(k, map[k]);
    }
    return format;
  },

  /*
		根据日期返回今天，昨天，前天，或者日期
	*/
  dateToCN(date, format) {
    // 是否是今天
    function isToday(str) {
      const d = parseDateValue(str);
      const todaysDate = new Date();
      if (d.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
        return true;
      }
      return false;
    }

    // 是否昨天
    function isYestday(date) {
      const d = parseDateValue(date);
      const dates = new Date(); // 当前时间
      const today = new Date(
        dates.getFullYear(),
        dates.getMonth(),
        dates.getDate()
      ).getTime(); // 今天凌晨
      const yestday = new Date(today - 24 * 3600 * 1000).getTime();
      return d.getTime() < today && yestday <= d.getTime();
    }
    // 是否是前天
    function isBeforeYestday(date) {
      const d = parseDateValue(date);
      const dates = new Date(); // 当前时间
      const today = new Date(
        dates.getFullYear(),
        dates.getMonth(),
        dates.getDate()
      ).getTime(); // 今天凌晨
      const yestday = new Date(today - 24 * 3600 * 1000).getTime();
      const beforeYestday = new Date(today - 48 * 3600 * 1000).getTime();
      return d.getTime() < yestday && beforeYestday <= d.getTime();
    }

    function getShowData(date) {
      if (isToday(date)) {
        // return '今天';
        return dateUtil.format(date, 'yyyy-MM-dd hh:mm:ss');
      } else if (isYestday(date)) {
        return `${formatMessage({id:'utils.date_util.yesterday'})}`;
      } else if (isBeforeYestday(date)) {
        return `${formatMessage({id:'utils.date_util.before_yesterday'})}`;
      }
      return dateUtil.format(date, format);
    }

    return getShowData(date);
  }
};
export default dateUtil;
