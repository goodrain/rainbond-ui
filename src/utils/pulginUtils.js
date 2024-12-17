
// 定义插件所在视图，支持平台、团队、应用和组件四个范围。对应取值为Platform、Team、Application、Component
export default {
  // 对企业级、团队级、应用级的插件列表进行筛选归类
  segregatePluginsByHierarchy(list, type) {
    const arr = (list || []).filter(item => item?.plugin_views?.includes(type) && item.name != 'rainbond-enterprise-base' && item.enable_status === 'true' ).map(item => item);
    return arr
  },
  // 判断当前企业是否安装企业插件
  isInstallEnterprisePlugin(list) {
    return (list || []).some(element => element.name === 'rainbond-enterprise-base');
  },
  // 判断当前路由的视图位置
  getCurrentViewPosition(urlPath) {
    const url = new URL(urlPath);
    const path = url.hash.substring(1);
    const enterpriseRegex = /^\/enterprise\/[\w-]+/;
    const teamRegionRegex = /^\/team\/[\w-]+\/region\/[\w-]+/;
    const teamAppRegex = /^\/team\/[\w-]+\/region\/[\w-]+\/apps/;
    if (enterpriseRegex.test(path)) {
      return 'Platform';
    } else if (teamRegionRegex.test(path) && !teamAppRegex.test(path)) {
      return 'Team';
    } else if (teamAppRegex.test(path) && teamRegionRegex.test(path)) {
      return 'Application';
    } else {
      return 'Component';
    }
  },
  // 判断输出位置
  isCurrentPluginMultiView(urlPath, viewArr) {
    const ViewPosition = this.getCurrentViewPosition(urlPath);

    // 当viewArr长度为1时，直接输出'root'
    if (viewArr.length === 1) {
      return 'root';
    }

    // 当viewArr长度为2时，执行进一步的判断逻辑
    else if (viewArr.length === 2) {
      const [firstView, secondView] = viewArr;
      // 如果viewArr包含Platform，则Platform输出root，其他输出OtherPages
      if (viewArr.includes('Platform')) {
        return ViewPosition === 'Platform' ? 'root' : 'OtherPages';
      }
      // 如果viewArr没有Platform，判断Team、Application和Component的优先级
      const priority = ['Team', 'Application', 'Component'];
      // 获取firstView和secondView的优先级索引
      const firstPriority = priority.indexOf(firstView);
      const secondPriority = priority.indexOf(secondView);
      // 根据优先级进行判断，优先级较高的视图输出'root'，另一个视图输出'OtherPages'
      if (firstPriority < secondPriority) {
        return ViewPosition === firstView ? 'root' : 'OtherPages';
      } else {
        return ViewPosition === secondView ? 'root' : 'OtherPages';
      }
    }

    // 默认输出'OtherPages'，处理其他情况
    return 'OtherPages';
  },

  // 判断渲染的key
  determineRenderKey(key) {
    switch (key) {
      case 'Operation':
        return 'OperationLogPage'
        break;
      case 'login':
        return 'EntryLogPage'
        break;
      case 'Permission':
        return 'PermissionPage'
        break;
      case 'Customization':
        return 'CustomizationPage'
        break;
      case 'AppBackUp':
        return 'AppBackUpPage'
        break;
      case 'PackageUpload':
        return 'PackageUploadPage'
        break;
      default:
        return key
        break;
    }
  }
}
