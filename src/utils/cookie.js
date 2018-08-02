let Domain = "goodrain.com";
const cookie = {
  get: function getCookie(name) {
    let arr,
      reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
    if ((arr = document.cookie.match(reg))) return unescape(arr[2]);
    return null;
  },
  set(name, value, option = {}) {
    const Days = option.days != void 0 ? option.days : 30;
    const exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    const domain = option.domain ? `;domain=${option.domain}` : "";
    const path = option.path != void 0 ? `;path=${option.path}` : ";path=/";
    const cookie = `${name}=${escape(value)};expires=${exp.toGMTString()}${domain}${path}`;
    document.cookie = cookie;
  },
  remove(name, option = {}) {
    const exp = new Date();
    exp.setTime(exp.getTime() - 1);
    const cval = this.get(name);
    const domain = option.domain !== void 0 ? `;domain=${option.domain}` : `;domain=${Domain}`;
    const path = option.path != void 0 ? `;path=${option.path}` : ";path=/";

    if (cval != null) {
      const v = `${name}=${cval};expires=${exp.toGMTString()}${domain}${path}`;
      document.cookie = v;
    }
  },
  setDomain(str) {
    Domain = str;
  },
};

export default cookie;
