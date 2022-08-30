// 中文入口文件

import globalHeader from './zh-CN/globalHeader';
import menu from './zh-CN/menu';
import settings from './zh-CN/settings';
import sidecar from './zh-CN/sidecar';
import app from './zh-CN/app';
import team from './zh-CN/team';
import component from './zh-CN/component';
import enterprise from './zh-CN/enterprise';
import error from './zh-CN/error';
import common from './zh-CN/common';
import global from './zh-CN/global';
import ApplicationState from'./zh-CN/ApplicationState';
import utils from './zh-CN/utils'
export default {
  'navBar.lang': '语言',
  'layout.user.link.help': '帮助',
  'layout.user.link.privacy': '隐私',
  'layout.user.link.terms': '条款',
  'add.success': '添加成功',
  'get.success': '获取成功',
  'open.success': '开通成功',
  ...globalHeader,
  ...menu,
  ...settings,
  ...sidecar,
  ...app,
  ...team,
  ...component,
  ...enterprise,
  ...error,
  ...common,
  ...global,
  ...ApplicationState,
  ...utils
};
