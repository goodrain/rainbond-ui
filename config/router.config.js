export default [
  {
    path: '/oauth',
    component: '../layouts/OauthLayout',
    routes: [
      // 第三方认证
      { path: '/oauth/callback', component: './User/Third' },
    ],
  },
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      // 登录
      { path: '/user/login', component: './User/Login' },
      // 注册
      { path: '/user/register', component: './User/Register' },
      // 注册
      { path: '/user/register-result', component: './User/RegisterResult' },
      // 第三方登录
      { path: '/user/third/login', component: './User/ThirdLogin' },
      // 第三方注册
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
    component: './Transit',
    // component: './Transit',
    // Routes: ['src/pages/Authorized'],
    authority: ['admin', 'user'],
    routes: [
      {
        path: '/',
        redirect: '/enterprise',
        authority: ['admin', 'user'],
      },
      {
        path: '/Transit',
        redirect: '/enterprise',
        authority: ['admin', 'user'],
      },
      // 企业总览
      {
        path: '/enterprise',
        component: '../layouts/EnterpriseLayout',
        name: 'EnterpriseBasicLayout',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
        routes: [
          // {
          //   path: '/enterprise',
          //   redirect: '/enterprise/:eid/index',
          //   authority: ['admin', 'user'],
          // },
          {
            path: '/enterprise/:eid/index',
            component: './Enterprise',
            name: 'enterpriseOverview',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
          // 企业团队

          {
            path: '/enterprise/:eid/teams',
            component: './EnterpriseTeams',
            name: 'EnterpriseTeams',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
          // 企业设置
          {
            path: '/enterprise/:eid/setting',
            component: './EnterpriseSetting',
            name: 'EnterpriseSetting',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
          // 分享
          {
            path: '/enterprise/:eid/shareds',
            component: './EnterpriseShared',
            name: 'EnterpriseShared',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          // 企业设置
          {
            path: '/enterprise/:eid/setting1',
            component: './EnterpriseSetting/index1.js',
            name: 'EnterpriseSetting1',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },
        ],
      },
      {
        path: '/team',
        component: '../layouts/TeamLayout',
        name: 'EnterpriseBasicLayout',
        // icon: 'dashboard',
        authority: ['admin', 'user'],
        routes: [
          // 总览
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
            title: '云市应用升级',
          },

          {
            path: '/team/:team/region/:region/groups/backup/:groupId/',
            component: './Group/Backup',
            name: 'Backup',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
            title: '备份管理',
          },

          {
            path: '/team/:team/region/:region/groups/:groupId',
            // component: './Group/Index',
            component: './Group/Index',
            name: 'Groups',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:team/region/:region/groups/share/one/:groupId/:shareId',
            component: './Group/AppShare',
            name: 'AppShares',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:team/region/:region/groups/share/two/:groupId/:shareId',
            component: './Group/AppShareLoading',
            name: 'AppShareLoading',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:team/region/:region/groups/share/three/:groupId:ShareId',
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
            path:
              '/team/:team/region/:region/shareplugin/step-one/:pluginId/:shareId',
            component: './Plugin/share-stepone',
            name: 'stepone',
            // icon: 'dashboard',
            authority: ['admin', 'user'],
          },

          {
            path:
              '/team/:team/region/:region/shareplugin/step-two/:pluginId/:shareId',
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
            path:
              '/team/:team/region/:region/create/create-compose-check/:groupId/:composeId',
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
            path:
              '/team/:team/region/:region/create/create-moreService/:appAlias/:check_uuid',
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
            path:
              '/team/:team/region/:region/create/create-compose-setting/:groupId/:composeId',
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
        ],
      },
    ],
  },
];
