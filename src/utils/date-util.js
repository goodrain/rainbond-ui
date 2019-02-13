const dateUtil = {
  format(date, format) {
    var dates = new Date(date.replace(/\-/g, "/"));
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
    // 是否是今天
    function isToday(str) {
      var d = new Date(str.replace(/\-/g, "/"));
      var todaysDate =  new Date();
      if (d.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)) {
        return true;
      }
      return false;
    }

    // 是否昨天
    function isYestday(date) {
      const d = new Date(date.replace(/\-/g, "/"));
      var dates = new Date(); // 当前时间
      const today = new Date(dates.getFullYear(), dates.getMonth(), dates.getDate()).getTime(); // 今天凌晨
      const yestday = new Date(today - 24 * 3600 * 1000).getTime();
      return d.getTime() < today && yestday <= d.getTime();
    }
    // 是否是前天
    function isBeforeYestday(date) {
      const d = new Date(date.replace(/\-/g, "/"));
      var dates = new Date(); // 当前时间
      const today = new Date(dates.getFullYear(), dates.getMonth(), dates.getDate()).getTime(); // 今天凌晨
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
