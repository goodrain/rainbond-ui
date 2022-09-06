import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
const map = {
  announcement: formatMessage({id:'utils.message.announcement'}),
  news: formatMessage({id:'utils.message.news'}),
  warn: formatMessage({id:'utils.message.warn'}),
};
const util = {
  getTypecn: type => map[type] || '',
};

export default util;
