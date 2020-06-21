/*
    时间间隔队列, 以一定的时间间隔根据队列中的数据执行某种操作， 避免某种操作太过频繁
*/

import Queue from './queue';

function TimerQueue(option) {
  option = option || {};
  this.queue = new Queue();
  this.timer = null;
  this.isStarted = false;
  this.autoStart = option.autoStart;
  this.batchout = option.batchout || false;
  this.interval = option.interval || 10;
  this.onExecute = option.onExecute;
  this.maxCache = option.maxCache || 10000;
}
TimerQueue.prototype = {
  add(data) {
    if (this.autoStart) {
      if (!this.isStarted) {
        this.start();
      }
    }
    if (this.queue.getCount() > this.maxCache) {
      this.queue.shift();
    }
    this.queue.push(data);
  },
  start() {
    if (this.isStarted) {
      return;
    }
    const self = this;
    this.isStarted = true;
    this.timer = setInterval(() => {
      if (!self.queue.empty()) {
        self.execute();
      } else if (this.autoStart) {
        self.stop();
      }
    }, this.interval);
  },
  stop() {
    this.isStarted = false;
    clearInterval(this.timer);
  },
  brushout() {
    return this.queue.shiftAll();
  },
  execute() {
    if (this.batchout) {
      this.onExecute(this.queue.shiftAll());
    } else {
      this.onExecute(this.queue.shift());
    }
  },
};

export default TimerQueue;
