export default [
  {
    path: '/oauth',
    component: '../layouts/OauthLayout',
    routes: [
      //第三方认证
      { path: '/oauth/callback', component: './User/Third'},
    ]
  },
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      //登录
      { path: '/user/login', component: './User/Login' },
      //注册
      { path: '/user/register', component: './User/Register' },
      //注册
      { path: '/user/register-result', component: './User/RegisterResult' },
      //第三方登录
      { path: '/user/third/login', component: './User/ThirdLogin' },
      //第三方注册
      { path: '/user/third/register', component: './User/ThirdRegister' },
    ],
  },
  {
    path: '/exception/trigger',
    component: './Exception/triggerException',
  },
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    // Routes: ['src/pages/Authorized'],
    authority: ['admin', 'user'],
    routes: [
      // dashboard
      // { path: '/', redirect: '/team/:team/region/:region/index', authority: ['admin', 'user'] },

      // {
      //   path: '/InitRainbondInfo',
      //   component: './Index/Index',
      //   name: 'InitRainbondInfo',
      //   // icon: 'dashboard',
      //   authority: ['admin', 'user'],
      //   hideInMenu: true,
      // },


      //总览
      {
        path: '/team/:team/region/:region/index',
        component: './Index/Index',
        name: 'teamOverview',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/source/:type?/:name?',
        component: './Source/Index',
        name: 'Source',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
        // hideInMenu: true,
      },

      {
        path: '/team/:team/region/:region/finance',
        component: './Finance',
        name: 'Finance',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/resources/buy/:regionName',
        component: './Finance/resources',
        name: 'resources',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/message',
        component: './Message/Index',
        name: 'Message',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/allbackup',
        component: './Group/AllBackup',
        name: 'AllBackup',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/team',
        component: './Team',
        name: 'Team',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/groups/upgrade/:groupId/',
        component: './Upgrade',
        name: 'Upgrade',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
        title: "云市应用升级"
      },

      {
        path: '/team/:team/region/:region/groups/backup/:groupId/',
        component: './Group/Backup',
        name: 'Backup',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
        title: "备份管理"
      },


      {
        path: '/team/:team/region/:region/groups/:groupId',
        component: './Group/Index',
        name: 'Group',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/groups/share/one/:groupId/:shareId',
        component: './Group/AppShare',
        name: 'AppShares',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/groups/share/two/:groupId/:shareId',
        component: './Group/AppShareLoading',
        name: 'AppShareLoading',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/groups/share/three/:groupId:ShareId',
        component: './Group/AppShareFinish',
        name: 'AppShareFinish',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/app/:appAlias/:type?',
        component: './App',
        name: 'App',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/code/:type?/:code?',
        component: './Create/code',
        name: 'code',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/outer/:type?/:outer?',
        component: './Create/outer',
        name: 'outer',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/market/:keyword?',
        component: './Create/market',
        name: 'market',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/myplugns/:pluginId?',
        component: './Plugin',
        name: 'Plugin',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/shareplugin/step-one/:pluginId/:shareId',
        component: './Plugin/share-stepone',
        name: 'stepone',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/shareplugin/step-two/:pluginId/:shareId',
        component: './Plugin/share-steptwo',
        name: 'steptwo',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create-plugin',
        component: './Plugin/Create',
        name: 'plugin',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/create-check/:appAlias',
        component: './Create/create-check',
        name: 'check',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/create-compose-check/:groupId/:composeId',
        component: './Create/create-compose-check',
        name: 'compose',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/create/image/:type?/:image?',
        component: './Create/image',
        name: 'imagesss',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },


      {
        path: '/team/:team/region/:region/create/create-setting/:appAlias',
        component: './Create/create-setting',
        name: 'setting',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/create-moreService/:appAlias/:check_uuid',
        component: './Create/create-moreService',
        name: 'moreService',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/guide',
        component: './Guide/index',
        name: 'setting',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/create/create-compose-setting/:groupId/:composeId',
        component: './Create/create-compose-setting',
        name: 'compose',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/result/success',
        component: './Result/Success',
        name: 'Success',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },
      {
        path: '/result/fail',
        component: './Result/Error',
        name: 'Error',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/exception/403',
        component: './Exception/403',
        name: '403',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/exception/404',
        component: './Exception/404',
        name: '404',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/exception/500',
        component: './Exception/500',
        name: '500',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/gateway/control/:types?/:isopen?',
        component: './GateWay/control',
        name: 'control',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },

      {
        path: '/team/:team/region/:region/gateway/license',
        component: './GateWay/license',
        name: 'license',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
      },
      // 监控数据中心
      // {
      //   path: '/monitoring/regions/:regionID',
      //   name: 'monitoring',
      //   // icon: 'monitoringCenter',
      //   component: './MonitoringCenter/index',
      //   hideInMenu: true,
      //   manage: true,
      //   authority: ['admin', 'user'],
      //   routes: [
      //     {
      //       path: '/monitoring/regions/:regionID/cluster/:type/:nodeID',
      //       name: 'cluster',
      //       component: './MonitoringCenter/Cluster',
      //       authority: ['admin', 'user'],
      //     },
      //     {
      //       path: '/monitoring/regions/:regionID/tenants',
      //       name: 'tenants',
      //       component: './MonitoringCenter/Tenant',
      //       authority: ['admin', 'user'],
      //     },
      //     {
      //       path:
      //         '/monitoring/regions/:regionID/tenants/:tenantId/container/:containerId/podId/:podId/:type',
      //       name: 'tenant',
      //       component: './MonitoringCenter/Tenant/component',
      //       authority: ['admin', 'user'],
      //     },
      //   ],
      // },
    ],
  },
];
