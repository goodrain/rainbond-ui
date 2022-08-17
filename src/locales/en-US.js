//英文入口文件

import globalHeader from './en-US/globalHeader';
import menu from './en-US/menu';
import settings from './en-US/settings';
import sidecar from './en-US/sidecar';
import app from './en-US/app';
import team from './en-US/team';
import component from './en-US/component';

export default {
  'navBar.lang': 'lang',
  'layout.user.link.help': 'help',
  'layout.user.link.privacy': 'privacy',
  'layout.user.link.terms': 'terms',
  'add.success': 'add success',
  'get.success': 'get success',
  'open.success': 'open success',
  ...globalHeader,
  ...menu,
  ...settings,
  ...sidecar,
  ...app,
  ...team,
  ...component,
};