const getDetailMessage = data => data && (data.msg_show || data.msg);

const getErrorCodeMessage = (data = {}, fallbacks = {}) => {
  const detailMessage = getDetailMessage(data);
  switch (data.code) {
    case 10412:
      return detailMessage || fallbacks.notExist;
    default:
      return detailMessage || '';
  }
};

module.exports = {
  getErrorCodeMessage
};
