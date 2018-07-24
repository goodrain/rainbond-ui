const util = {
  getBody(response) {
    if (response) {
      return response.data;
    }
  },
  // 获取http status的值
  getHttpStatus(response) {
    if (response) {
      return response.status;
    }
  },
  // 获取业务code
  getCode(response) {
    const body = this.getBody(response);
    if (body) {
      return body.code;
    }
  },
  getMessage(response) {
    if (response) {
      return response.msg_show;
    }
  },
};

export default util;
