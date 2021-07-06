const cookie = {
  get: function getCookie(name) {
    let arr;
    const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
    if ((arr = document.cookie.match(reg))) return unescape(arr[2]);
    return null;
  },
  set(name, value, option = {}) {
    const Days = option.days != void 0 ? option.days : 30;
    const exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    const domain = option.domain ? `;domain=${option.domain}` : '';
    const path = option.path != void 0 ? `;path=${option.path}` : ';path=/';
    const cookie = `${name}=${escape(
      value
    )};expires=${exp.toGMTString()}${domain}${path}`;
    document.cookie = cookie;
  },
  setCookie(name, value, option = {}) {
    const domain = option.domain ? `;domain=${option.domain}` : '';
    const path = option.path != void 0 ? `;path=${option.path}` : ';path=/';
    const date = new Date();
    date.setTime(date.getTime() - 1 * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${escape(
      value
    )}; expire=${date.toGMTString()};${domain}${path}`;
  },
  setGuide(name, value, option = {}) {
    const Days = 1;
    const exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    const domain = option.domain ? `;domain=${option.domain}` : '';
    const path = option.path != void 0 ? `;path=${option.path}` : ';path=/';
    const cookie = `${name}=${escape(
      value
    )};expires=${exp.toGMTString()}${domain}${path}`;
    document.cookie = cookie;
  },
  remove(name) {
    this.setCookie(name, '');
  }
};

export default cookie;
