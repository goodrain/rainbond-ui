const dateUtil = {
  format(date, format) {
    var date = new Date(date);
    const map = {
      yyyy() {
        return date.getFullYear();
      },
      MM() {
        const val = date.getMonth() + 1;
        return val < 10 ? `0${val}` : val;
      },
      dd() {
        const val = date.getDate();
        return val < 10 ? `0${val}` : val;
      },
      hh() {
        const val = date.getHours();
        return val < 10 ? `0${val}` : val;
      },
      mm() {
        const val = date.getMinutes();
        return val < 10 ? `0${val}` : val;
      },
      ss() {
        const val = date.getSeconds();
        return val < 10 ? `0${val}` : val;
      },
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
    // 是否是昨天
    function isToday(str) {
      const d = new Date(str);
      const todaysDate = new Date();
      if (d.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
        return true;
      }
      return false;
    }

    // 是否昨天
    function isYestday(date) {
      const d = new Date(date);
      var date = new Date(); // 当前时间
      const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); // 今天凌晨
      const yestday = new Date(today - 24 * 3600 * 1000).getTime();
      return d.getTime() < today && yestday <= d.getTime();
    }
    // 是否是前天
    function isBeforeYestday(date) {
      const d = new Date(date);
      var date = new Date(); // 当前时间
      const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); // 今天凌晨
      const yestday = new Date(today - 24 * 3600 * 1000).getTime();
      const beforeYestday = new Date(today - 48 * 3600 * 1000).getTime();
      return d.getTime() < yestday && beforeYestday <= d.getTime();
    }

    function getShowData(date) {
      if (isToday(date)) {
        return '今天';
      } else if (isYestday(date)) {
        return '昨天';
      } else if (isBeforeYestday(date)) {
        return '前天';
      }
      return dateUtil.format(date, format);
    }
    return getShowData(date);
  },
};
export default dateUtil;
