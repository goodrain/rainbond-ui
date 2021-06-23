import { Modal } from 'antd';

const dateUtil = {
  isWebSocketOpen(websocketURL) {
    const protocolStr = document.location.protocol;
    const str = websocketURL.substr(0, websocketURL.indexOf(':'));
    if (protocolStr === 'https:' && str && str === 'ws') {
      Modal.destroyAll();
      Modal.error({
        title: '消息通道不可用',
        content: (
          <div>
            <p>消息通道为ws，请切换为http协议访问本系统</p>
          </div>
        ),
        onOk() {}
      });
      return null;
    }
    return 'through';
  },
  format(date, format) {
    let dates = new Date(date.replace(/\-/g, '/'));
    if (dates == 'Invalid Date') {
      dates = new Date(date);
    }
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
      let d = new Date(str.replace(/\-/g, '/'));
      if (d == 'Invalid Date') {
        d = new Date(str);
      }
      const todaysDate = new Date();
      if (d.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
        return true;
      }
      return false;
    }

    // 是否昨天
    function isYestday(date) {
      let d = new Date(date.replace(/\-/g, '/'));
      if (d == 'Invalid Date') {
        d = new Date(date);
      }
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
      let d = new Date(date.replace(/\-/g, '/'));
      if (d == 'Invalid Date') {
        d = new Date(date);
      }
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
        return '昨天';
      } else if (isBeforeYestday(date)) {
        return '前天';
      }
      return dateUtil.format(date, format);
    }

    return getShowData(date);
  }
};
export default dateUtil;
