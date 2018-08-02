import React from "react";
import PromiseRender from "./PromiseRender";
import { CURRENT } from ".";
import userUtil from "../../utils/user";

function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === "object" || typeof obj === "function") &&
    typeof obj.then === "function"
  );
}

/**
 * 通用权限检查方法
 * Common check permissions method
 * @param { 权限判定 Permission judgment type string |array | Promise | Function } authority
 * @param { 你的权限 Your permission description  type:string} currentAuthority
 * @param { 通过的组件 Passing components } target
 * @param { 未通过的组件 no pass components } Exception
 */
const checkPermissions = (authority, currentAuthority, target, Exception, logined) => {
  // 没有判定权限.默认查看所有 Retirement authority, return target;
  const isLogin = userUtil.isLogin();
  if (isLogin !== logined) {
    return Exception;
  }
  return target;
};

export { checkPermissions };

const check = (authority, target, Exception, logined) =>
  checkPermissions(authority, CURRENT, target, Exception, logined);

export default check;
