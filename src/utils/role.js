import cookie from './cookie';

const actionMaps = {
  admin: '管理员',
  developer: '开发者',
  viewer: '观察者',
  access: '访问者',
  owner: '拥有者',
};

export default {
  // 是否可以删除,
  canDel(role) {
    return !role.is_default;
  },
  actionMap(name) {
    return actionMaps[name] || name;
  },
};
