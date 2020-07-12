/*
    队列结构
*/

function Queue() {
  this.datas = [];
}
Queue.prototype = {
  constructor: Queue,
  push(data) {
    if (data !== void 0) {
      this.datas.push(data);
    }
  },
  shift() {
    return this.datas.shift();
  },
  shiftAll() {
    const { datas } = this;
    this.datas = [];
    return datas;
  },
  getCount() {
    return this.datas.length;
  },
  empty() {
    return this.datas.length === 0;
  },
};

export default Queue;
