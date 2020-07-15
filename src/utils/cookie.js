let Domain = "goodrain.com";
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
    const domain = option.domain ? `;domain=${option.domain}` : "";
    const path = option.path != void 0 ? `;path=${option.path}` : ";path=/";
    const cookie = `${name}=${escape(
      value
    )};expires=${exp.toGMTString()}${domain}${path}`;
    document.cookie = cookie;
  },
  setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = `expires=${  d.toUTCString()}`;
    document.cookie = `${cname  }=${  cvalue  }; ${  expires}`;
  },
  setGuide(name, value, option = {}) {
    const Days = 1;
    const exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    const domain = option.domain ? `;domain=${option.domain}` : "";
    const path = option.path != void 0 ? `;path=${option.path}` : ";path=/";
    const cookie = `${name}=${escape(
      value
    )};expires=${exp.toGMTString()}${domain}${path}`;
    document.cookie = cookie;
  },
  remove(name) {
    this.setCookie(name, "", -1);
  },
  setDomain(str) {
    Domain = str;
  }
};

export default cookie;
