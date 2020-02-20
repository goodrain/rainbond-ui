import globalHeader from './zh-CN/globalHeader';
import menu from './zh-CN/menu';
import sidecar from './zh-CN/sidecar';
import app from './zh-CN/app';
import team from './zh-CN/team';
import component from './zh-CN/component';

export default {
  'navBar.lang': '语言',
  'layout.user.link.help': '帮助',
  'layout.user.link.privacy': '隐私',
  'layout.user.link.terms': '条款',
  ...globalHeader,
  ...menu,
  ...sidecar,
  ...app,
  ...team,
  ...component,
};