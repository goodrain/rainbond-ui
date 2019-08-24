const global = {
  getCurrTeamName() {
    const reg = /team\/([^\/]+)/;
    const hash = location.hash || "";
    const match = hash.match(reg);
    if (match) {
      return match[1];
    }
    return "";
  },
  getCurrRegionName() {
    const reg = /region\/([^\/]+)/;
    const hash = location.hash || "";
    const match = hash.match(reg);
    if (match) {
      return match[1];
    }
    return "";
  },
  fetchStateColor(status) {
    const statusColorMap = {
      RUNNING: "#00D777", //运行中 绿色
      running: "#00D777", //运行中 绿色
      starting: "#F69D4A", //开启中
      Starting: "#F69D4A", //开启中
      checking: "F69D4A", //检测中
      SCHEDULING: "#F69D4A", //检测中
      stoping: "#20124A", //关闭中 紫色
      Stoping: "#20124A", //关闭中 紫色
      unusual: "#CD0200", //异常 纯红
      ABNORMAL: "#CD0200", //异常 纯红
      closed: "#000021", //已关闭 黑色
      Closed: "#000021", //已关闭 黑色
      undeploy: "#708090", //未部署 石板灰
      Undeploy: "#708090", //未部署 石板灰
      Unknow: "#CD0200", //未知深粉色
      unknow: "#CD0200", //未知/深粉色
      Creating: "#778899", //部署中 浅石板灰
      creating: "#778899", //部署中 浅石板灰
      Third_party: "#5BB2FA",
      Internet: "#5BB2FA", //蓝色
      TheInternet: "#5BB2FA", //蓝色
      Abnormal: "#CD0200", //不正常,纯红
      abnormal: "#CD0200", //不正常,纯红
      Build_failure: "#CD0200", //构建失败 纯红
      build_failure: "#CD0200", //构建失败 纯红
      Upgrade: "#00FF4A", //升级中
      upgrade: "#00FF4A", //升级中
      expired: "#CD0200", //过期 猩红
      Expired: "#CD0200", //猩红

      INITIATING: "#F69D4A",
      TEMINATING: "#20124A", //关闭中 紫色
      tEMINATING: "#20124A", //关闭中 紫色
      Some_abnormal: "#FF0000", //一些不正常 纯红
      Building: "#007710" //构建  纯蓝
    };
    return statusColorMap[status] || statusColorMap.unknow;
  },

  fetchStateBJColor(status) {
    const statusColorMap = {
      running:
        "linear-gradient(to right, #00D777 0, #00D777 10px, #fff 10px, #fff 100%) no-repeat", //运行中 绿色
      starting:
        "linear-gradient(to right, #F69D4A 0, #F69D4A 10px, #fff 10px, #fff 100%) no-repeat", //开启中
      checking:
        "linear-gradient(to right, #F69D4A 0, #F69D4A 10px, #fff 10px, #fff 100%) no-repeat", //检测中
      stoping:
        "linear-gradient(to right, #20124A 0, #20124A 10px, #fff 10px, #fff 100%) no-repeat", //关闭中 紫色
      unusual:
        "linear-gradient(to right, #CD0200 0, #CD0200 10px, #fff 10px, #fff 100%) no-repeat", //异常
      closed:
        "linear-gradient(to right, #000021 0, #000021 10px, #fff 10px, #fff 100%) no-repeat", //已关闭
      undeploy:
        "linear-gradient(to right, #708090 0, #708090 10px, #fff 10px, #fff 100%) no-repeat", //未部署 石板灰
      unKnow:
        "linear-gradient(to right, #CD0200 0, #CD0200 10px, #fff 10px, #fff 100%) no-repeat", //未知
      upgrade:
        "linear-gradient(to right, #00FF4A 0, #00FF4A 10px, #fff 10px, #fff 100%) no-repeat", //升级中
      creating:
        "linear-gradient(to right, #778899 0, #778899 10px, #fff 10px, #fff 100%) no-repeat", //部署中
      expired:
        "linear-gradient(to right, #CD0200 0, #CD0200 10px, #fff 10px, #fff 100%) no-repeat" //过期
    };
    return statusColorMap[status] || statusColorMap.unKnow;
  },

  fetchStateText(state) {
    const statusColorMap = {
      RUNNING: "运行中",
      running: "运行中",
      starting: "开启中",
      checking: "检测中",
      stoping: "关闭中",
      unusual: "运行异常",
      closed: "已关闭",
      undeploy: "未部署",
      unKnow: "未知",
      ABNORMAL: "异常",
      TEMINATING: "关闭中",
      INITIATING: "初始化中",
      SCHEDULING: "调度中",
      TheInternet: "未知",
      upgrade: "升级中",
      creating: "部署中",
      expired: "过期"
    };
    return statusColorMap[state] || statusColorMap.TheInternet;
  },
  fetchStateOptTypeText(state) {
    const statusOptType = {
      "": "-",
      "build-service": "构建服务",
      "build": "构建服务",
      "upgrade": "滚动升级服务",
      "start-service": "启动服务",
      "start": "启动服务",
      "stop-service": "停止服务",
      "stop": "停止服务",
      "restart-service": "重启服务",
      "restart": "重启服务",
      "vertical-service": "垂直扩展服务",
      "vertical": "垂直扩展服务",
      "horizontal-service": "水平扩展服务",
      "horizontal": "水平扩展服务",
      "set-language": "设置服务语言",
      "delete-service": "删除服务",
      "upgrade-service": "升级服务",
      "delete-buildversion": "删除构建版本",
      "share-service": "分享服务",
      "add-service-dependency": "添加服务依赖",
      "delete-service-dependency": "删除服务依赖",
      "add-service-env": "添加服务环境变量",
      "update-service-env": "更新服务环境变量",
      "delete-service-env": "删除服务环境变量",
      "add-service-port": "添加服务端口",
      "update-service-port-old": "更新服务端口",
      "update-service-port": "更新服务端口",
      "delete-service-port": "删除服务端口",
      "handle-service-outerport": "修改服务对外端口",
      "handle-service-innerport": "修改服务对内端口",
      "change-service-lbport": "修改服务LB端口",
      "rollback-service": "回滚",
      "add-service-volume": "添加服务持久化存储",
      "update-service-volume": "更新服务持久化存储",
      "delete-service-volume": "删除服务持久化存储",
      "add-service-depvolume": "添加服务依赖存储",
      "delete-service-depvolume": "删除服务依赖存储",
      "add-service-probe": "添加服务探针",
      "update-service-probe": "更新服务探针",
      "delete-service-probe": "删除服务探针",
      "add-service-label": "添加服务标签",
      "update-service-label": "更新服务标签",
      "delete-service-label": "删除服务标签",
      "add-thirdpart-service": "添加第三方服务",
      "update-thirdpart-service": "更新第三方服务",
      "delete-thirdpart-service": "删除第三方服务",
      "update-service-gateway-rule": "更新服务网关规则",
      "app-restore-envs": "重新加载应用环境变量",
      "app-restore-ports": "重新加载应用端口",
      "app-restore-volumes": "重新加载应用存储",
      "app-restore-probe": "重新加载应用探针",
      "app-restore-deps": "重新加载应用依赖",
      "app-restore-depvols": "重新加载应用依赖存储",
      "app-restore-plugins": "重新加载应用插件"
    };
    return statusOptType[state] || state;
  },
  replaceUrlTeam(team) {
    let href = location.href;
    const reg = /team\/([^/]+)/;
    href = href.replace(reg, (string, g1) =>
      string.replace(new RegExp(g1), team)
    );
    return href;
  },
  replaceUrlRegion(region) {
    let href = location.href;
    const reg = /region\/([^/]+)/;
    href = href.replace(reg, (string, g1) =>
      string.replace(new RegExp(g1), region)
    );
    return href;
  },
  replaceUrlTeamAndTegion(team, region) {
    let href = location.href;
    const reg = /team\/([^/]+)\/region\/([^/]+)/;
    href = href.replace(reg, (string, g1, g2) =>
      string.replace(new RegExp(g1), team).replace(new RegExp(g2), region)
    );
    return href;
  }
};

export default global;
