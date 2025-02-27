//英文入口文件

import globalHeader from './en-US/globalHeader';
import menu from './en-US/menu';
import settings from './en-US/settings';
import sidecar from './en-US/sidecar';
import app from './en-US/app';
import team from './en-US/team';
import enterprise from "./en-US/enterprise"
import common from './en-US/common';
import component from './en-US/component';
import global from './en-US/global';
import error from './en-US/error';
import ApplicationState from "./en-US/ApplicationState"
import utils from './en-US/utils'
import login from './en-US/login'
import versionUpdata from './en-US/versionUpdata'

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
  ...enterprise,
  ...common,
  ...global,
  ...ApplicationState,
  ...error,
  ...utils,
  ...login,
  ...versionUpdata
};
