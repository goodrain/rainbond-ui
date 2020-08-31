/*
   监控数据格式转换工具
*/
import moment from "moment";

const monitorDataUtil = {
  // 转g2 格式
  queryTog2(data = {}, t) {
    if (data.result && data.result.length && data.result[0].value) {
      if (t) {
        return t(data.result[0].value[1]);
      }

      return data.result[0].value[1];
    }
    return 0;
  },
  queryRangeTog2(data = {}) {
    let res = [];
    if (data.result && data.result.length && data.result[0].values) {
      res = data.result[0].values.map(value => ({
        x: moment(new Date(value[0] * 1000))
          .locale("zh-cn")
          .format("HH:mm:ss"),
        y: Number(value[1]),
        y1: Number(value[1]),
        y2: Number(value[1])
      }));
    }
    return res;
  },
  queryRangeTog2F(data = {}, cid) {
    let res = [];
    if (data.result && data.result.length && data.result[0].values) {
      res = data.result[0].values.map(value => ({
        cid,
        time: Number(value[0] * 1000),
        value: Math.round(Number(value[1]))
      }));
      // if (round) {
      //   res = data.result[0].values.map(value => ({
      //     x: Number(value[0] * 1000),
      //     y: Math.round(Number(value[1])),
      //   }));
      // } else {
      //   res = data.result[0].values.map(value => ({
      //     cid: '响应时间',
      //     time: Number(value[0] * 1000),
      //     value: Math.round(Number(value[1])),
      //   }));
      // }
    }
    return res;
  }
};

export default monitorDataUtil;
